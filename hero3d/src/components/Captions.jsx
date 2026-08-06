/**
 * Captions.jsx
 * ------------
 * Texto HTML (no 3D) que va cambiando segun que hoja esta "al frente"
 * durante el scroll. Vive AFUERA del <Canvas> (ver App.jsx) porque el
 * texto real (nitido, seleccionable, con la tipografia del sitio) no
 * conviene dibujarlo como textura dentro de Three.js.
 *
 * El indice viene de useScrollAnimation (ver onCaptionChange): -1 =
 * portada, 0..14 = mismo orden que PAGE_CONTENT en Agenda.jsx, 15 =
 * cierre (ya paso la ultima hoja). Por eso CAPTIONS[0] es la portada,
 * CAPTIONS[i + 1] es la hoja "i", y CAPTIONS[16] (el ultimo) es el cierre.
 */
const CAPTIONS = [
  'Portada personalizable: tu foto y el texto que elijas',
  'Stickers para recortar y pegar en cada hoja',
  'Sus datos y los tuyos, con espacio para su foto',
  'Espacio para sus huellitas',
  'Directorio de veterinarios de confianza',
  'Cartilla de vacunación completa',
  'Control de desparasitación',
  'Registro de alimentación por edad',
  '20 hojas para anotar cada consulta al veterinario',
  'Recuerdos sugeridos: su primer día en casa',
  'Su primera salida al parque',
  'Su primer juguete favorito',
  'Su primera Navidad',
  'Su primer cumpleaños',
  'Su primer mejor amigo',
  'Y muchas hojas más para que escriban sus propios recuerdos',
  '¡Qué esperas para tener la tuya!'
]

export default function Captions({ index }) {
  const text = CAPTIONS[index + 1] ?? CAPTIONS[0]

  return (
    <div className="hero3d-caption" aria-live="polite">
      {/* key=text: al cambiar el texto, React desmonta/monta el <p>, lo
          que reinicia la animacion CSS de fade-in (ver styles.css) */}
      <p key={text}>{text}</p>
    </div>
  )
}
