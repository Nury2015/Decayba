import Escena from './components/Escena.jsx'
import './styles.css'

/**
 * Estructura del hero 3D:
 *
 * .hero3d-stage   -> position: sticky, top:0, ocupa el viewport. El <Canvas>
 *                    vive aca y NUNCA se mueve con el scroll.
 * .hero3d-scroll  -> un div alto (varias veces el alto de pantalla) que le
 *                    da a ScrollTrigger "distancia" para medir el progreso
 *                    del scroll y traducirlo en animacion (camara, tapa,
 *                    hojas). Por ahora esta vacio: el ScrollTrigger se
 *                    conecta en el proximo paso (useScrollAnimation).
 *
 * Cuando esto se incruste en index.html, .hero3d-scroll se reemplaza por
 * el alto real que le queramos dar a la seccion hero dentro del sitio.
 */
export default function App() {
  return (
    <div className="hero3d-root">
      <div className="hero3d-stage">
        <Escena />
      </div>
      <div className="hero3d-scroll" aria-hidden="true" />
    </div>
  )
}
