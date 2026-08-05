import { forwardRef } from 'react'
import { RoundedBox, useTexture } from '@react-three/drei'

/**
 * Portada.jsx
 * -----------
 * La tapa (portada o contraportada) de la agenda.
 *
 * Truco del pivote: en Three.js un mesh rota alrededor de su propio
 * centro. Pero una tapa de libro debe girar alrededor del LOMO (su borde
 * izquierdo), no de su centro. La solucion estandar:
 *
 *   <group ref={ref}>                 <- este es el "eje bisagra", en x=0
 *     <RoundedBox position-x={width/2} .../>  <- la tapa se dibuja
 *   </group>                             desplazada medio ancho a la derecha
 *
 * Asi, cuando en el paso 2 animemos `ref.current.rotation.y`, la tapa
 * gira sobre el borde izquierdo (el lomo) tal como una tapa real.
 *
 * forwardRef: Agenda.jsx necesita este ref para pasarselo al hook de
 * scroll, por eso el componente lo reenvia en vez de crearlo el mismo.
 *
 * coverImage: si se pasa una ruta (ej. "/textures/pastor-blue.webp"),
 * se dibuja un PLANO delgado pegado justo encima de la cara frontal de
 * la caja, con la imagen como textura. Por que un plano aparte y no la
 * imagen directamente sobre la RoundedBox: una caja con textura mapea
 * la MISMA imagen en sus 6 caras (se ve estirada/rara en los cantos
 * finitos). Un plano extra solo en la cara visible = foto nitida, sin
 * distorsion, y el carton de la caja se ve igual en los bordes/canto.
 */
const Portada = forwardRef(function Portada(
  {
    width = 1.6,
    height = 2.1,
    thickness = 0.05,
    color = '#1f2430',
    rotationY = 0,
    coverImage = null
  },
  ref
) {
  return (
    <group ref={ref} rotation-y={rotationY}>
      <RoundedBox
        args={[width, height, thickness]}
        radius={0.02}
        smoothness={4}
        position={[width / 2, 0, thickness / 2]}
        castShadow
        receiveShadow
      >
        {/* Carton laminado: rugosidad alta (no brilla como plastico),
           metalness en 0 (es un material organico, no metal) */}
        <meshStandardMaterial color={color} roughness={0.75} metalness={0.05} />
      </RoundedBox>

      {coverImage && (
        <CoverArt width={width} height={height} z={thickness + 0.001} image={coverImage} />
      )}
    </group>
  )
})

/**
 * CoverArt: el "plano-etiqueta" con la foto real del producto. Va a un
 * hijo separado para poder llamar useTexture() de forma condicional sin
 * romper las reglas de hooks (el hook siempre se llama en el mismo
 * componente, nunca dentro de un if).
 */
function CoverArt({ width, height, z, image }) {
  const texture = useTexture(image)
  return (
    <mesh position={[width / 2, 0, z]} receiveShadow>
      <planeGeometry args={[width * 0.97, height * 0.97]} />
      <meshStandardMaterial map={texture} roughness={0.55} metalness={0} />
    </mesh>
  )
}

export default Portada
