import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
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

// Indice de ORDEN DE APERTURA (no el indice fisico dentro del array de
// Agenda.jsx) de la hoja "Mi primer cumpleanos" (pages/37.webp). Ver la
// nota grande en Agenda.jsx: PAGE_CONTENT.indexOf('37') === 12. Todo lo que
// sigue (fases nuevas del cumpleanos + cierre) se cuelga a partir de este
// numero.
const CUMPLE_INDEX = 12

// --- Fases nuevas: foto -> typewriter -> camara se aleja -> ultimas hojas
//     -> cierre. Valores de partida, pensados para ajustarse a ojo mirando
//     el resultado (mismo criterio que ya usa este archivo con OPEN_ANGLE
//     / Agenda.jsx con CENTER_TRIM_X).
//
// IMPORTANTE: a diferencia de una hoja comun, la hoja de cumpleanos NO
// rota apenas "le toca el turno". Se queda plana (rotation.y=0, de frente
// a camara) durante TODA la escena -foto, typewriter, camara alejandose-
// y recien rota (junto con 38 y 39) cuando la escena termina. Se
// comprobo mirando el resultado real que apenas una hoja empieza a rotar
// -aunque sea un poco- la siguiente (que estaba escondida atras) ya
// queda a la vista; si la hoja de cumpleanos rotara en su turno "normal"
// como cualquier otra, la hoja 38 se asomaria por detras casi de
// inmediato, ANTES de que termine de jugar toda la escena. ---
const CUMPLE_START = PAGES_START + CUMPLE_INDEX * PAGE_STAGGER // se vuelve la hoja "activa" (queda plana, de frente)

const PHOTO_FLYIN_START = CUMPLE_START + 0.15 // un respiro despues de que la hoja queda de frente
const PHOTO_FLYIN_DURATION = 0.7

const TYPEWRITER_START = PHOTO_FLYIN_START + PHOTO_FLYIN_DURATION - 0.15
const FECHA_DURATION = 0.35
const LUGAR_START = TYPEWRITER_START + 0.25
const LUGAR_DURATION = 0.35
const DESC_START = LUGAR_START + 0.28
const DESC_DURATION = 0.55

const CAMERA_PULLBACK_START = DESC_START + DESC_DURATION - 0.1
const CAMERA_PULLBACK_DURATION = 0.9
const CAMERA_PULLBACK_Z = 5.6

// La hoja de cumpleanos RECIEN rota aca, junto con 38 y 39 (stagger de
// 3 hojas en total, la de cumpleanos primera) -no antes-.
const PAGES_AFTER_CUMPLE_START = CAMERA_PULLBACK_START + CAMERA_PULLBACK_DURATION - 0.2

const CLOSE_DURATION = 1.1
// CERO a proposito (no 0.28 como al abrir, ni siquiera un valor chico):
// mientras se cierran, la tapa y TODAS las hojas deben compartir
// exactamente el mismo angulo en todo momento. La tapa es la de mayor Z
// (la mas cercana a camara) y un poco mas ancha que las hojas -si estan
// sincronizadas, la tapa las tapa por completo durante TODO el cierre,
// no solo al final-. Con cualquier stagger (incluso chico), tapa y hojas
// quedan en angulos apenas distintos en cada instante intermedio, y esa
// diferencia alcanza para que un borde de una hoja se asome por detras de
// la tapa -bug real, reportado como "se ven las hojas y la portada al
// mismo tiempo"-.
const CLOSE_STAGGER = 0

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
 *   1.7 → ...   las hojas pasan una por una (stagger), cada una un
 *               poco despues que la anterior, HASTA la hoja de
 *               cumpleanos (CUMPLE_INDEX), que se queda plana en vez
 *               de seguir rotando
 *   ...         foto entra flotando y aterriza en el marco -> typewriter
 *               (fecha, lugar, descripcion) -> la camara se aleja ->
 *               RECIEN AHI la hoja de cumpleanos rota (junto con las
 *               2 que quedan) -> la agenda se cierra, TODAS las hojas
 *               juntas (no en cascada, ver CLOSE_STAGGER), mostrando la
 *               portada personalizada
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
 * @param {React.RefObject} [refs.hojaCumpleApiRef] ref a la api que
 *   expone HojaCumple.jsx: { fotoGroupRef, setFecha, setLugar,
 *   setDescripcion }.
 */
export default function useScrollAnimation({
  groupRef,
  portadaRef,
  paginaRefs,
  onCaptionChange,
  hojaCumpleApiRef
}) {
  const camera = useThree((state) => state.camera)

  useEffect(() => {
    if (!groupRef.current || !portadaRef.current || !camera) return

    const N = paginaRefs.length
    const cumpleIndex = Math.min(CUMPLE_INDEX, N - 1)

    // Grupo de hojas que rotan JUNTAS despues de la escena del cumpleanos:
    // la propia hoja de cumpleanos (primera del grupo) + las que queden
    // (38, 39). "afterGroupSize" cuenta cuantas son en total.
    const afterGroup = paginaRefs.slice(cumpleIndex)
    const afterGroupSize = afterGroup.length
    const lastAfterOnset = PAGES_AFTER_CUMPLE_START + (afterGroupSize - 1) * PAGE_STAGGER
    const afterGroupEnd = lastAfterOnset + PAGE_DURATION
    const CLOSE_START = afterGroupEnd + 0.2

    // Duracion total de la timeline en las unidades relativas de arriba.
    // Se calcula ANTES de construir la timeline para que onUpdate (que se
    // dispara en cada scroll, no en este mismo tick) siempre tenga el
    // numero correcto.
    const total = Math.max(CAMERA1_DURATION, PORTADA_START + PORTADA_DURATION, CLOSE_START + CLOSE_DURATION)

    // Breakpoints para onCaptionChange: no se puede usar un simple
    // "Math.floor" como antes porque la ventana de la hoja de cumpleanos
    // (foto + typewriter + camara alejandose) es mucho mas larga que la
    // de una hoja comun. Igual que con las demas hojas, el caption de la
    // hoja k+1 arranca cuando la hoja k (la que tiene delante, tapandola)
    // empieza a rotar -no cuando termina-, que es el momento en que deja
    // de ocluirla.
    const breakpoints = []
    for (let k = 0; k < cumpleIndex; k++) {
      breakpoints.push({ t: PAGES_START + k * PAGE_STAGGER, value: k })
    }
    breakpoints.push({ t: CUMPLE_START, value: cumpleIndex })
    for (let j = 1; j < afterGroupSize; j++) {
      breakpoints.push({ t: PAGES_AFTER_CUMPLE_START + j * PAGE_STAGGER, value: cumpleIndex + j })
    }
    breakpoints.push({ t: CLOSE_START, value: N })

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          // ANTES: trigger: '.hero3d-scroll'. Bug real: '.hero3d-scroll' es
          // el espaciador que viene DESPUES de '.hero3d-stage' (100vh)
          // dentro de '.hero3d-root'. Como '.hero3d-stage' es sticky (no
          // pinneado por ScrollTrigger), el libro ya se ve fijo en
          // pantalla desde que '.hero3d-root' toca el techo — pero el
          // 'top top' de '.hero3d-scroll' recien se cumple 100vh (1
          // pantalla completa) DESPUES de eso. Resultado: quedaba una
          // pantalla entera de scroll "muerto" con el libro quieto antes
          // de que la animacion arrancara. Usando '.hero3d-root' (el
          // contenedor de las dos) el progreso 0 coincide exactamente con
          // el momento en que el libro empieza a fijarse.
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
                let current = N // cierre: ya paso la ultima hoja
                for (const bp of breakpoints) {
                  if (t >= bp.t) current = bp.value
                  else break
                }
                onCaptionChange(current)
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

      // --- Fase 3: las hojas pasan una a una, HASTA la del cumpleanos ---
      // (esta se queda plana -no rota aca-, ver nota grande arriba de las
      // constantes)
      const paginaRotationsAntes = paginaRefs.slice(0, cumpleIndex).map((r) => r.current?.rotation).filter(Boolean)
      tl.to(
        paginaRotationsAntes,
        { y: OPEN_ANGLE, duration: PAGE_DURATION, ease: 'power2.inOut', stagger: PAGE_STAGGER },
        PAGES_START
      )

      // Camara sigue acercandose un poco mas mientras pasan las hojas,
      // para que se sienta como un "acercamiento" continuo.
      // z:4.4 (no 4.0): mismo criterio que arriba, mas margen vertical.
      tl.to(camera.position, { z: 4.4, duration: N * PAGE_STAGGER, ease: 'none' }, PAGES_START)

      const hojaCumpleApi = hojaCumpleApiRef?.current
      const cumpleHinge = paginaRefs[cumpleIndex]?.current

      // --- Foto: entra flotando desde arriba-derecha de la pantalla y
      //     aterriza en el marco ---
      if (hojaCumpleApi?.fotoGroupRef?.current && cumpleHinge) {
        const fotoGroup = hojaCumpleApi.fotoGroupRef.current

        // Punto de partida en espacio MUNDO (arriba a la derecha respecto
        // de la camara), convertido al espacio LOCAL del grupo-bisagra de
        // la hoja. En este momento de la timeline la hoja todavia esta
        // PLANA (rotation.y=0, ver nota grande arriba), asi que no hace
        // falta ningun truco: se usa la transformacion real/actual.
        cumpleHinge.updateWorldMatrix(true, false)
        const origin = cumpleHinge.getWorldPosition(new THREE.Vector3())
        const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
        const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion)
        const worldStart = origin.clone().addScaledVector(camRight, 2.1).addScaledVector(camUp, 1.6)
        const localStart = cumpleHinge.worldToLocal(worldStart.clone())

        // Solo X/Y: la "z" que da worldToLocal no sirve aca -de movernos
        // con ella, la foto pasa por profundidades MENORES que la propia
        // hoja durante gran parte del vuelo y queda tapada por el papel
        // (bug real, se vio en pantalla: "la foto entra atras de la
        // agenda"). Los mesh de adentro (ver HojaCumple.jsx) ya tienen su
        // propio offset de Z fijo, siempre por delante del papel; el
        // grupo que animamos aca no necesita tocar Z en ningun momento.
        tl.fromTo(
          fotoGroup.position,
          { x: localStart.x, y: localStart.y },
          { x: 0, y: 0, duration: PHOTO_FLYIN_DURATION, ease: 'power2.out' },
          PHOTO_FLYIN_START
        )
        tl.fromTo(
          fotoGroup.rotation,
          { x: 0.32, y: -0.55, z: 0.22 },
          { x: 0, y: 0, z: 0, duration: PHOTO_FLYIN_DURATION, ease: 'power2.out' },
          PHOTO_FLYIN_START
        )
      }

      // --- Typewriter: fecha -> lugar -> descripcion ---
      // ease:'none' a proposito: la escritura debe sentirse mecanica
      // dentro de su ventana, no acelerada/frenada como el resto.
      if (hojaCumpleApi?.setFecha) {
        const fechaProxy = { p: 0 }
        tl.to(
          fechaProxy,
          { p: 1, duration: FECHA_DURATION, ease: 'none', onUpdate: () => hojaCumpleApi.setFecha(fechaProxy.p) },
          TYPEWRITER_START
        )
      }
      if (hojaCumpleApi?.setLugar) {
        const lugarProxy = { p: 0 }
        tl.to(
          lugarProxy,
          { p: 1, duration: LUGAR_DURATION, ease: 'none', onUpdate: () => hojaCumpleApi.setLugar(lugarProxy.p) },
          LUGAR_START
        )
      }
      if (hojaCumpleApi?.setDescripcion) {
        const descProxy = { p: 0 }
        tl.to(
          descProxy,
          { p: 1, duration: DESC_DURATION, ease: 'none', onUpdate: () => hojaCumpleApi.setDescripcion(descProxy.p) },
          DESC_START
        )
      }

      // --- La camara se aleja ---
      tl.to(
        camera.position,
        { z: CAMERA_PULLBACK_Z, duration: CAMERA_PULLBACK_DURATION, ease: 'power1.inOut' },
        CAMERA_PULLBACK_START
      )

      // --- RECIEN ACA rota la hoja de cumpleanos, junto con las que
      //     queden (38, 39): mismo mecanismo de siempre (stagger), solo
      //     que arranca mucho mas tarde y el primer elemento del grupo es
      //     la propia hoja de cumpleanos ---
      const afterRotations = afterGroup.map((r) => r.current?.rotation).filter(Boolean)
      if (afterRotations.length) {
        tl.to(
          afterRotations,
          { y: OPEN_ANGLE, duration: PAGE_DURATION, ease: 'power2.inOut', stagger: PAGE_STAGGER },
          PAGES_AFTER_CUMPLE_START
        )
      }

      // --- Cierre: la tapa y TODAS las hojas vuelven a rotation.y=0,
      //     mostrando la portada personalizada. CLOSE_STAGGER chico (ver
      //     nota arriba de la constante): se ve como UN cierre en
      //     conjunto, no como un abanico de hojas superpuestas. ---
      tl.to(portadaRef.current.rotation, { y: 0, duration: CLOSE_DURATION, ease: 'power2.inOut' }, CLOSE_START)
      const todasLasRotaciones = paginaRefs.map((r) => r.current?.rotation).filter(Boolean)
      tl.to(
        todasLasRotaciones,
        { y: 0, duration: CLOSE_DURATION, ease: 'power2.inOut', stagger: CLOSE_STAGGER },
        CLOSE_START
      )
    })

    return () => ctx.revert() // limpia el timeline y el ScrollTrigger al desmontar
  }, [camera, groupRef, portadaRef, paginaRefs, onCaptionChange, hojaCumpleApiRef])
}
