import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import Luces from './Luces.jsx'
import Agenda from './Agenda.jsx'
import useIsMobile from '../hooks/useIsMobile.js'

/**
 * Escena.jsx
 * ----------
 * Contenedor de Three.js puro. No sabe nada de scroll ni de GSAP: solo
 * arma la camara, la iluminacion y coloca la <Agenda/> en el centro.
 *
 * - shadows: activa el shadow map de Three.js (sombras suaves via PCFSoft,
 *   configurado abajo en gl).
 * - camera: arranca alejada y centrada; el hook de scroll anima
 *   camera.position para el acercamiento.
 * - isMobile: en vez de sacar el 3D de mobile, bajamos la calidad (menos
 *   pixel ratio = menos pixeles reales que dibujar, resolucion de sombra
 *   mas chica). El dpr es el ajuste que mas rinde: en un telefono con
 *   pantalla retina, dpr=2 significa dibujar 4x mas pixeles que dpr=1
 *   por el mismo espacio en pantalla.
 */
export default function Escena() {
  const isMobile = useIsMobile()

  return (
    <Canvas
      shadows
      dpr={isMobile ? [1, 1.5] : [1, 2]}
      gl={{ antialias: !isMobile }}
      onCreated={({ gl }) => {
        gl.shadowMap.type = 2 // THREE.PCFSoftShadowMap (sombras suaves)
      }}
    >
      {/* y baja (cerca del centro vertical del libro): si la camara queda
          muy arriba y nunca se inclina hacia abajo, al hacer zoom el
          libro "se hunde" cada vez mas abajo del cuadro y se corta. */}
      <PerspectiveCamera makeDefault position={[0, 0.15, 6]} fov={35} near={0.1} far={50} />

      <Luces isMobile={isMobile} />

      {/* Suspense: las texturas (useTexture) cargan de forma asincronica.
          Sin este limite, React no sabe que mostrar mientras espera y el
          render puede quedar en blanco. fallback={null} = mientras carga,
          simplemente no se ve nada ahi (son archivos locales, no una red
          externa, cargan rapido). */}
      <Suspense fallback={null}>
        <Agenda />
      </Suspense>
    </Canvas>
  )
}
