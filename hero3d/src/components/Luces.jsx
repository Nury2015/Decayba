import { ContactShadows } from '@react-three/drei'

/**
 * Luces.jsx
 * ---------
 * Rig de 3 puntos simplificado + sombra de contacto:
 *
 * - key light (direccional, castShadow): la luz principal, simula luz de
 *   ventana entrando desde arriba-derecha. Es la que dibuja las sombras
 *   de la portada sobre las hojas cuando se empiece a abrir.
 * - fill light (ambiental muy tenue): evita que el lado no iluminado
 *   quede negro puro (look "premium", no de render generico).
 * - hemisphereLight: luz ambiental con dos colores (cielo/piso) en vez de
 *   uno solo. Da una degradacion mas natural que ambientLight a secas,
 *   sin depender de descargar un mapa de entorno (HDR) externo — mejor
 *   para que el build no dependa de una CDN al momento de renderizar.
 * - ContactShadows (Drei): una sombra de "mesa" pintada bajo la agenda,
 *   mucho mas barata que una sombra real proyectada sobre un plano, y
 *   con look mas suave.
 *
 * isMobile: el shadow map (la textura donde se "pinta" la sombra de la
 * luz direccional) y el ContactShadows son de lo mas caro de la escena.
 * En mobile los bajamos de resolucion — se nota menos de lo que uno
 * pensaria (las sombras son suaves de por si) y ahorra bastante.
 */
export default function Luces({ isMobile = false }) {
  const shadowMapSize = isMobile ? 512 : 1024

  return (
    <>
      <ambientLight intensity={0.35} />

      <directionalLight
        position={[3, 4, 2]}
        intensity={1.6}
        castShadow
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-near={0.5}
        shadow-camera-far={15}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-bias={-0.0005}
      />

      {/* Luz de relleno fria y suave desde el lado opuesto */}
      <directionalLight position={[-4, 2, -2]} intensity={0.3} color="#cfe0ff" />

      {/* Cielo calido / piso mas oscuro: da volumen sin costar una carga de red */}
      <hemisphereLight args={['#fff6e8', '#2a2620', 0.5]} />

      <ContactShadows
        position={[0, -1.05, 0]}
        opacity={0.45}
        scale={8}
        blur={2.6}
        far={2}
        resolution={isMobile ? 256 : 512}
        frames={isMobile ? 1 : Infinity} // en mobile la calcula una vez y no la vuelve a redibujar cada frame
      />
    </>
  )
}
