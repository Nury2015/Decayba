import { forwardRef } from 'react'
import { RoundedBox, useTexture } from '@react-three/drei'

/**
 * Pagina.jsx
 * ----------
 * Una hoja individual dentro de la agenda. Mismo truco de pivote que
 * Portada.jsx (grupo en el borde/lomo, mesh desplazado medio ancho).
 *
 * Se usa muchas veces dentro de Agenda.jsx (una por hoja), por eso todo
 * lo que varia entre hojas es una prop:
 *   - zOffset: en que lugar de la pila esta esta hoja
 *   - image: ruta a la imagen de contenido de ESTA hoja (vacunas, datos,
 *     stickers, etc.), pegada como plano sobre la cara frontal — mismo
 *     truco que coverImage en Portada.jsx. Si no se pasa, la hoja queda
 *     en blanco (papel liso).
 *
 * Por que solo una cara tiene imagen: en un libro real, cada hoja tiene
 * un frente y un dorso. Aca solo modelamos el frente con contenido (la
 * "hoja de la derecha" al abrir) y el dorso queda el papel liso (la
 * "hoja de la izquierda" del siguiente salto de pagina) — asi lo pidio
 * el diseño: contenido solo del lado derecho.
 */
const Pagina = forwardRef(function Pagina(
  {
    width = 1.55,
    height = 2.05,
    thickness = 0.01,
    zOffset = 0,
    color = '#fdfaf4',
    rotationY = 0,
    image = null
  },
  ref
) {
  return (
    <group ref={ref} position-z={zOffset} rotation-y={rotationY}>
      <RoundedBox
        args={[width, height, thickness]}
        radius={0.008}
        smoothness={2}
        position={[width / 2, 0, thickness / 2]}
        castShadow
        receiveShadow
      >
        {/* Papel: rugosidad muy alta, cero metalness, mate por completo */}
        <meshStandardMaterial color={color} roughness={0.95} metalness={0} />
      </RoundedBox>

      {image && <PageArt width={width} height={height} z={thickness + 0.0005} image={image} />}
    </group>
  )
})

function PageArt({ width, height, z, image }) {
  const texture = useTexture(image)
  return (
    <mesh position={[width / 2, 0, z]} receiveShadow>
      <planeGeometry args={[width * 0.96, height * 0.96]} />
      <meshStandardMaterial map={texture} roughness={0.85} metalness={0} />
    </mesh>
  )
}

export default Pagina
