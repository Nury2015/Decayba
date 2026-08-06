import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Angulo de apertura: SOLO hasta ~100 grados (no 180/plano). Motivo real,
// no solo estetico: al girar una tapa/hoja alrededor del lomo, su ancho
// proyectado en X es width*cos(angulo). En 0 grados = todo el ancho hacia
// un lado; en 90 grados = CERO ancho extra (la hoja queda "de canto",
// apuntando hacia atras en Z); pasando los 90 vuelve a crecer, ahora hacia
// el otro lado. Si abrimos casi a 180 (plano), el libro termina midiendo
// el DOBLE de ancho que cerrado, y al acercar la camara ese ancho extra
// se sale del cuadro. Frenando en ~100 grados evitamos ese problema por
// completo (el ancho horizontal se mantiene ~constante) y ademas se ve
// mas como un libro "propped up" siendo leido, no aplastado en la mesa.
const OPEN_ANGLE = -Math.PI * 0.56

// Tiempos de la timeline, en las mismas "unidades" relativas que usa GSAP
// mas abajo (ver nota grande debajo). Sacados a constantes porque
// onCaptionChange necesita los mismos numeros para saber que hoja esta
// "al frente" en cada momento del scroll.
const PORTADA_START = 0.8
const PORTADA_DURATION = 0.9
const PAGES_START = 1.7
const PAGE_STAGGER = 0.28
const PAGE_DURATION = 0.55
const CAMERA1_DURATION = 1

/**
 * useScrollAnimation.js
 * ----------------------
 * Recibe los refs de la agenda (armados en Agenda.jsx) y construye UNA
 * sola timeline de GSAP atada a ScrollTrigger con scrub:true. "scrub"
 * significa que la timeline no se reproduce sola: su progreso queda
 * enganchado 1 a 1 con la posicion del scroll (adelantas -> avanza,
 * retrocedes -> retrocede). No usamos React state para nada de la parte
 * 3D: GSAP muta camera.position / mesh.rotation directamente sobre los
 * objetos de Three.js en cada frame, asi que no hay re-renders de React
 * de por medio para eso (si para el caption, ver onCaptionChange abajo).
 *
 * Fases de la timeline (todas en "unidades" relativas — con scrub, lo
 * que importa es la proporcion entre ellas, no los segundos reales):
 *
 *   0.0 → 1.0   la camara se acerca (dolly) y el libro termina de
 *               enderezarse hacia la camara ("gira ligeramente")
 *   0.8 → 1.7   la portada se abre (empieza un poco antes de que
 *               termine la fase anterior, para que no se sienta
 *               robotico/paso a paso)
 *   1.7 → fin   las hojas pasan una por una (stagger), cada una un
 *               poco despues que la anterior
 *
 * @param {Object} refs
 * @param {React.RefObject} refs.groupRef    grupo completo del libro
 * @param {React.RefObject} refs.portadaRef  grupo-bisagra de la tapa
 * @param {React.RefObject[]} refs.paginaRefs arreglo de grupos-bisagra,
 *   uno por hoja, en orden (la [0] es la primera que se pasa)
 * @param {(index: number) => void} [refs.onCaptionChange] opcional: se
 *   llama cada vez que cambia la hoja "activa" segun el scroll. -1 =
 *   portada (todavia cerrada o abriendose), 0..N-1 = indice dentro de
 *   paginaRefs (mismo orden en el que se pasan, o sea el mismo orden
 *   que PAGE_CONTENT en Agenda.jsx), N = cierre (ya paso la ultima hoja).
 */
export default function useScrollAnimation({ groupRef, portadaRef, paginaRefs, onCaptionChange }) {
  const camera = useThree((state) => state.camera)

  useEffect(() => {
    if (!groupRef.current || !portadaRef.current || !camera) return

    // Duracion total de la timeline en las unidades relativas de arriba
    // (el mayor de los 4 tramos que se arman mas abajo). Se calcula ANTES
    // de construir la timeline para que onUpdate (que se dispara en cada
    // scroll, no en este mismo tick) siempre tenga el numero correcto —
    // sin depender de que tl.duration() ya este resuelto para ese momento.
    const N = paginaRefs.length
    // Momento en que la ULTIMA hoja termina de abrirse (no solo de
    // empezar): a partir de aca ya no hay mas hojas pasando, es el
    // momento de mostrar el caption de cierre (ver Captions.jsx, indice
    // N = CAPTIONS[N + 1], el ultimo del arreglo).
    const lastPageEnd = PAGES_START + (N - 1) * PAGE_STAGGER + PAGE_DURATION
    const total = Math.max(CAMERA1_DURATION, PORTADA_START + PORTADA_DURATION, lastPageEnd, PAGES_START + N * PAGE_STAGGER)

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          // ANTES: trigger: '.hero3d-scroll'. Bug real: '.hero3d-scroll' es
          // el espaciador de 500vh que viene DESPUES de '.hero3d-stage'
          // (100vh) dentro de '.hero3d-root'. Como '.hero3d-stage' es
          // sticky (no pinneado por ScrollTrigger), el libro ya se ve fijo
          // en pantalla desde que '.hero3d-root' toca el techo — pero el
          // 'top top' de '.hero3d-scroll' recien se cumple 100vh (1
          // pantalla completa) DESPUES de eso. Resultado: quedaba una
          // pantalla entera de scroll "muerto" con el libro quieto antes
          // de que la animacion arrancara. Usando '.hero3d-root' (el
          // contenedor de las dos, 600vh en total) el progreso 0 coincide
          // exactamente con el momento en que el libro empieza a fijarse.
          trigger: '.hero3d-root',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1, // suaviza el enganche con el scroll (1s de "amortiguacion")
          onUpdate: onCaptionChange
            ? (self) => {
                const t = self.progress * total
                if (t < PAGES_START) {
                  onCaptionChange(-1) // portada (cerrada o abriendose)
                  return
                }
                if (t >= lastPageEnd) {
                  onCaptionChange(N) // cierre: ya paso la ultima hoja
                  return
                }
                const i = Math.min(N - 1, Math.floor((t - PAGES_START) / PAGE_STAGGER))
                onCaptionChange(i)
              }
            : undefined
        }
      })

      // --- Fase 1: acercamiento de camara (sutil) ---
      // Nota: el libro YA arranca con un angulo de 3/4 fijo (ver Agenda.jsx).
      // Probamos animar tambien ese angulo durante el scroll, pero un libro
      // girado + camara acercandose hace que el borde lejano se salga del
      // cuadro (efecto "se va para la izquierda"). Mas simple y mas
      // confiable: el angulo del libro queda fijo, solo se mueve la camara.
      // y = 0.2 (no mas abajo): el libro esta centrado en y=0.2 (ver
      // Agenda.jsx, position={[0, 0.2, 0]}). Si la camara baja de ahi
      // mientras se acerca, el encuadre deja de estar centrado en el
      // libro y la parte de ARRIBA se corta (necesita mas angulo vertical
      // justo cuando queda menos margen por estar mas cerca).
      // z:4.8 (no 4.4): menos zoom total, deja mas margen arriba/abajo.
      tl.to(camera.position, { z: 4.8, y: 0.2, duration: 1, ease: 'power1.inOut' }, 0)

      // --- Fase 2: se abre la portada ---
      tl.to(
        portadaRef.current.rotation,
        { y: OPEN_ANGLE, duration: PORTADA_DURATION, ease: 'power2.inOut' },
        PORTADA_START
      )

      // --- Fase 3: las hojas pasan una a una ---
      // Cada hoja es un target distinto (su propio Euler .rotation), pero
      // todas comparten la propiedad "y" -> stagger las va escalonando.
      const paginaRotations = paginaRefs.map((r) => r.current?.rotation).filter(Boolean)
      tl.to(
        paginaRotations,
        {
          y: OPEN_ANGLE,
          duration: PAGE_DURATION,
          ease: 'power2.inOut',
          stagger: PAGE_STAGGER
        },
        PAGES_START
      )

      // Camara sigue acercandose un poco mas mientras pasan las hojas,
      // para que el final se sienta como un "acercamiento" continuo.
      // z:4.4 (no 4.0): mismo criterio que arriba, mas margen vertical.
      tl.to(
        camera.position,
        { z: 4.4, duration: paginaRotations.length * PAGE_STAGGER, ease: 'none' },
        PAGES_START
      )
    })

    return () => ctx.revert() // limpia el timeline y el ScrollTrigger al desmontar
  }, [camera, groupRef, portadaRef, paginaRefs, onCaptionChange])
}
