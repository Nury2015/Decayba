import { useState } from 'react'
import Escena from './components/Escena.jsx'
import Captions from './components/Captions.jsx'
import './styles.css'

/**
 * Estructura del hero 3D:
 *
 * .hero3d-stage   -> position: sticky, top:0, ocupa el viewport. El <Canvas>
 *                    vive aca y NUNCA se mueve con el scroll. El caption
 *                    (HTML, no 3D) va superpuesto encima, dentro del mismo
 *                    contenedor sticky, para que tambien quede fijo.
 * .hero3d-scroll  -> un div alto (varias veces el alto de pantalla) que le
 *                    da a ScrollTrigger "distancia" para medir el progreso
 *                    del scroll y traducirlo en animacion (camara, tapa,
 *                    hojas).
 *
 * captionIndex vive ACA (fuera del <Canvas>) porque el texto es HTML: se
 * actualiza desde adentro del arbol de R3F (Agenda -> useScrollAnimation)
 * via el prop onCaptionChange, pero se pinta afuera.
 */
export default function App() {
  const [captionIndex, setCaptionIndex] = useState(-1)

  return (
    <div className="hero3d-root">
      <div className="hero3d-stage">
        <Escena onCaptionChange={setCaptionIndex} />
        <Captions index={captionIndex} />
      </div>
      <div className="hero3d-scroll" aria-hidden="true" />
    </div>
  )
}
