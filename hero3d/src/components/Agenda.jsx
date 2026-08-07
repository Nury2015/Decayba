import { useMemo, useRef, createRef } from 'react'
import Portada from './Portada.jsx'
import Pagina from './Pagina.jsx'
import HojaCumple from './HojaCumple.jsx'
import useScrollAnimation from '../hooks/useScrollAnimation.js'
import { tx } from '../textures.js'

// Contenido de cada hoja, en el ORDEN EN QUE SE VEN al hacer scroll
// (primero la de stickers, despues los numeros de menor a mayor).
const PAGE_CONTENT = [
  'stiker',
  '4',
  '5',
  '7',
  '9',
  '10',
  '16',
  '17',
  '32',
  '33',
  '35',
  '36',
  '37',
  '38',
  '39'
]

const PAGE_COUNT = PAGE_CONTENT.length
const PAGE_THICKNESS = 0.012
const PAGE_GAP = 0.001 // pequeno espacio de aire entre hojas, como papel real apilado

// Hoja "Mi primer cumpleanos" (pages/37.webp): lleva contenido animado
// extra (HojaCumple.jsx - foto + typewriter), ver useScrollAnimation.js
// para el detalle de las fases. Dos indices distintos a proposito:
//  - CUMPLE_PHYSICAL_INDEX: posicion dentro de este array "paginas" (se
//    llena al reves, ver el useMemo de abajo) -> se usa para inyectar el
//    JSX de HojaCumple en la hoja correcta.
//  - El indice de ORDEN DE APERTURA (0..PAGE_COUNT-1) es distinto y lo
//    calcula useScrollAnimation.js a partir de PAGE_CONTENT directamente.
const CUMPLE_PHYSICAL_INDEX = PAGE_COUNT - 1 - PAGE_CONTENT.indexOf('37')

const WIDTH = 1.6
const HEIGHT = 2.1
const COVER_THICKNESS = 0.05

// Cuanto ocupa en Z toda la pila de hojas (se necesita para saber donde
// empieza la portada frontal, encima de todo)
const PAGES_DEPTH = PAGE_COUNT * (PAGE_THICKNESS + PAGE_GAP)

// Ajuste fino horizontal: cuando la tapa/hojas se abren, su "masa visual"
// se corre un poco hacia la izquierda (el lado hacia el que giran). Este
// numero compensa ese corrimiento re-centrando todo el libro un poco a
// la derecha. Si despues de probar todavia se ve corrido, subir este
// valor de a 0.05 hasta que quede centrado.
const CENTER_TRIM_X = 0.18

/**
 * Agenda.jsx
 * ----------
 * Ensambla el cuaderno completo apilando todo a lo largo del eje Z
 * (la "profundidad" del libro cerrado, la direccion en la que mira la
 * camara):
 *
 *   z=0                        contraportada (fija, no se anima)
 *   z=COVER_THICKNESS          empieza la pila de <Pagina/>
 *   z=COVER_THICKNESS+PAGES_DEPTH   empieza la <Portada/> frontal
 *
 * Cada tapa/hoja es su propio "grupo bisagra" (ver Portada.jsx y
 * Pagina.jsx): la rotacion siempre pivotea sobre x=0 (el lomo), sin
 * importar en que z este colocada. Por eso alcanza con envolver cada
 * una en un <group position-z={...}> para ubicarla en la pila.
 *
 * Dos grupos anidados a proposito:
 *
 *   <group ref={groupRef}>              <- SOLO rota. Vive en el origen
 *                                          del mundo (x=0), que es mas o
 *                                          menos donde mira la camara.
 *     <group position-x={-WIDTH/2}>     <- SOLO posiciona: corre todo el
 *                                          libro para que el LOMO (no el
 *                                          centro de las tapas) quede en
 *                                          x=0 *de este grupo interno*.
 *       ...tapas y hojas...
 *     </group>
 *   </group>
 *
 * Por que separarlos: si rotaramos el grupo que ADEMAS tiene el offset
 * de posicion, el libro giraria alrededor del lomo (que esta corrido
 * del centro de la pantalla) y se veria "barrer" hacia un costado en
 * vez de girar en el lugar. Rotando el grupo de AFUERA (sin offset)
 * conseguimos que gire sobre si mismo, centrado en pantalla.
 *
 * Paso 2 (este): se crean refs a groupRef/portadaRef/paginaRefs y se
 * los pasa a useScrollAnimation(), que es quien realmente mueve las
 * rotaciones segun el scroll. Este componente no sabe nada de GSAP.
 *
 * Orden de apertura: las paginas estan apiladas de atras (z chico,
 * indice 0) hacia adelante (z grande, indice ultimo, pegado a la
 * portada). Al abrir un libro real, la PRIMERA hoja que se pasa es la
 * que esta pegada a la tapa (la de mayor z) — por eso el orden que le
 * pasamos al hook para el stagger va invertido (ultima a primera).
 */
export default function Agenda({ onCaptionChange }) {
  const groupRef = useRef(null)
  const portadaRef = useRef(null)
  // api que expone HojaCumple.jsx (fotoGroupRef + setFecha/setLugar/
  // setDescripcion) para que useScrollAnimation.js pueda animarla
  const hojaCumpleApiRef = useRef({})

  const paginas = useMemo(
    () =>
      Array.from({ length: PAGE_COUNT }, (_, i) => ({
        id: i,
        zOffset: COVER_THICKNESS + i * (PAGE_THICKNESS + PAGE_GAP),
        // indice 0 = la mas profunda de la pila = la ULTIMA que se ve al
        // abrir -> por eso se lee PAGE_CONTENT "al reves" aca
        image: tx(`pages/${PAGE_CONTENT[PAGE_COUNT - 1 - i]}.webp`)
      })),
    []
  )

  // un ref por hoja, en el mismo orden que "paginas" (0 = mas cerca de
  // la contraportada, ultimo = mas cerca de la portada)
  const paginaRefs = useMemo(() => paginas.map(() => createRef()), [paginas])

  // orden de apertura invertido (ver nota mas abajo), memoizado para no
  // recrear el array -y con eso, disparar de nuevo el efecto del hook-
  // en cada render
  const paginaRefsOpenOrder = useMemo(() => [...paginaRefs].reverse(), [paginaRefs])

  // aritos del lomo espiral, distribuidos a lo largo de todo el alto del libro
  const anillos = useMemo(() => Array.from({ length: 16 }, (_, i) => i), [])
  const bookDepth = COVER_THICKNESS * 2 + PAGES_DEPTH

  useScrollAnimation({
    groupRef,
    portadaRef,
    // invertido: la hoja pegada a la portada (ultimo indice) es la
    // primera en pasar
    paginaRefs: paginaRefsOpenOrder,
    onCaptionChange,
    hojaCumpleApiRef
  })

  return (
    // rotation-x en 0 (antes 0.05): ese tilt, combinado con el giro de
    // ~100 grados de la tapa/hojas al abrirse, inclinaba el eje de la
    // bisagra fuera de la vertical y sumaba recorte arriba justo
    // mientras se abrian. Con 0 el lomo queda perfectamente vertical.
    <group ref={groupRef} position={[0, 0.2, 0]} rotation={[0, -0.18, 0]}>
      <group position={[-WIDTH / 2 + CENTER_TRIM_X, 0, 0]}>
        {/* Contraportada: identica a la portada pero fija, no se anima */}
        <Portada
          width={WIDTH}
          height={HEIGHT}
          thickness={COVER_THICKNESS}
          color="#f7f3ea"
          rotationY={0}
        />

        {/* Bloque de hojas, cada una en su z correspondiente dentro de la pila */}
        {paginas.map((p, i) => (
          <Pagina
            key={p.id}
            ref={paginaRefs[i]}
            width={WIDTH - 0.03}
            height={HEIGHT - 0.03}
            thickness={PAGE_THICKNESS}
            zOffset={p.zOffset}
            rotationY={0}
            image={p.image}
          >
            {i === CUMPLE_PHYSICAL_INDEX && (
              <HojaCumple
                width={WIDTH - 0.03}
                height={HEIGHT - 0.03}
                thickness={PAGE_THICKNESS}
                registerApi={(api) => {
                  hojaCumpleApiRef.current = api
                }}
              />
            )}
          </Pagina>
        ))}

        {/* Lomo espiral: pequenos aritos a lo largo del borde izquierdo (x=0),
            centrados en la profundidad total del libro */}
        <group position={[0, 0, bookDepth / 2]}>
          {anillos.map((i) => {
            const t = i / (anillos.length - 1)
            const y = -HEIGHT / 2 + 0.12 + t * (HEIGHT - 0.24)
            return (
              <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                {/* mas segmentos = wire suave, no facetado */}
                <torusGeometry args={[0.045, 0.012, 12, 28]} />
                {/* Sin mapa de entorno (ver Luces.jsx), un metalness alto se
                    ve plano/falso porque no tiene nada que reflejar. Un
                    plastico-metalico mate (metalness bajo, roughness medio)
                    se ve creible con solo luces directas. */}
                <meshStandardMaterial color="#b7bcc2" roughness={0.55} metalness={0.25} />
              </mesh>
            )
          })}
        </group>

        {/* Portada frontal: cerrada por ahora, apoyada encima de toda la pila.
            coverImage = personalizable: el cliente elige su propia foto y
            texto (ver Portadarecuerdo.png), no una foto de producto fija. */}
        <group position-z={COVER_THICKNESS + PAGES_DEPTH}>
          <Portada
            ref={portadaRef}
            width={WIDTH}
            height={HEIGHT}
            thickness={COVER_THICKNESS}
            color="#f7f3ea"
            rotationY={0}
            coverImage={tx('portadarecuerdo.png')}
          />
        </group>
      </group>
    </group>
  )
}
