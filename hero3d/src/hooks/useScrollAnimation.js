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

/**
 * useScrollAnimation.js
 * ----------------------
 * Recibe los refs de la agenda (armados en Agenda.jsx) y construye UNA
 * sola timeline de GSAP atada a ScrollTrigger con scrub:true. "scrub"
 * significa que la timeline no se reproduce sola: su progreso queda
 * enganchado 1 a 1 con la posicion del scroll (adelantas -> avanza,
 * retrocedes -> retrocede). No usamos React state para nada de esto:
 * GSAP muta camera.position / mesh.rotation directamente sobre los
 * objetos de Three.js en cada frame, asi que no hay re-renders de React
 * de por medio (ver la nota larga que dejamos en este archivo antes).
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
 */
export default function useScrollAnimation({ groupRef, portadaRef, paginaRefs }) {
  const camera = useThree((state) => state.camera)

  useEffect(() => {
    if (!groupRef.current || !portadaRef.current || !camera) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.hero3d-scroll',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1 // suaviza el enganche con el scroll (1s de "amortiguacion")
        }
      })

      // --- Fase 1: acercamiento de camara (sutil) ---
      // Nota: el libro YA arranca con un angulo de 3/4 fijo (ver Agenda.jsx).
      // Probamos animar tambien ese angulo durante el scroll, pero un libro
      // girado + camara acercandose hace que el borde lejano se salga del
      // cuadro (efecto "se va para la izquierda"). Mas simple y mas
      // confiable: el angulo del libro queda fijo, solo se mueve la camara.
      // y casi no se mueve (se queda cerca del centro vertical del libro):
      // ver nota en Escena.jsx sobre por que la camara arranca baja.
      tl.to(camera.position, { z: 4.4, y: 0.1, duration: 1, ease: 'power1.inOut' }, 0)

      // --- Fase 2: se abre la portada ---
      tl.to(
        portadaRef.current.rotation,
        { y: OPEN_ANGLE, duration: 0.9, ease: 'power2.inOut' },
        0.8
      )

      // --- Fase 3: las hojas pasan una a una ---
      // Cada hoja es un target distinto (su propio Euler .rotation), pero
      // todas comparten la propiedad "y" -> stagger las va escalonando.
      const paginaRotations = paginaRefs.map((r) => r.current?.rotation).filter(Boolean)
      tl.to(
        paginaRotations,
        {
          y: OPEN_ANGLE,
          duration: 0.55,
          ease: 'power2.inOut',
          stagger: 0.28
        },
        1.7
      )

      // Camara sigue acercandose un poco mas mientras pasan las hojas,
      // para que el final se sienta como un "acercamiento" continuo
      tl.to(camera.position, { z: 3.8, duration: paginaRotations.length * 0.28, ease: 'none' }, 1.7)
    })

    return () => ctx.revert() // limpia el timeline y el ScrollTrigger al desmontar
  }, [camera, groupRef, portadaRef, paginaRefs])
}
