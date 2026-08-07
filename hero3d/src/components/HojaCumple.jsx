import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import { tx } from '../textures.js'

/**
 * HojaCumple.jsx
 * --------------
 * Contenido animado EXTRA de la hoja "Mi primer cumpleaños" (pages/37.webp):
 * la foto que "aterriza" en el marco impreso y los 3 campos de texto
 * (FECHA, LUGAR, descripcion) que se escriben con efecto typewriter.
 *
 * Se renderiza como `children` de la <Pagina> de esa hoja (ver Agenda.jsx),
 * asi que vive DENTRO del mismo grupo-bisagra: hereda gratis la rotacion de
 * apertura/cierre, sin logica propia para eso.
 *
 * Este componente NO sabe nada de scroll/GSAP. Solo expone, via
 * `registerApi`, las piezas que useScrollAnimation.js necesita animar:
 *   - fotoGroupRef: el grupo que GSAP mueve/rota para el "vuelo" de la foto
 *   - setFecha/setLugar/setDescripcion: reciben un progreso 0..1 y redibujan
 *     el substring correspondiente (efecto typewriter atado al scroll)
 */

// Texto fijo del typewriter (generico/invitado, facil de cambiar despues)
const FECHA_TEXT = '15 de marzo'
const LUGAR_TEXT = 'En casa, con toda la familia'
const DESCRIPCION_TEXT =
  'Su primera fiesta: gorrito de cumpleaños, globos celestes y una vela ' +
  'que sopló (casi) sin ayuda. Movió la cola toda la tarde.'

// Mapea una caja en fracciones de la imagen 37.webp (u1..u2, v1..v2, en
// 0..1, "v" medido desde ARRIBA de la imagen) al espacio local de la hoja:
// el mismo sistema que ya usa PageArt (plano width*0.96 x height*0.96,
// centrado en x=width/2, y=0). Cajas medidas a ojo sobre la imagen -son un
// primer ajuste, se puede afinar mirando el resultado en el navegador,
// mismo criterio que ya usa el archivo con CENTER_TRIM_X en Agenda.jsx.
function frac(u1, v1, u2, v2, width, height) {
  const cu = (u1 + u2) / 2
  const cv = (v1 + v2) / 2
  return {
    x: width / 2 + (cu - 0.5) * width * 0.96,
    y: (0.5 - cv) * height * 0.96,
    w: (u2 - u1) * width * 0.96,
    h: (v2 - v1) * height * 0.96
  }
}

// El recuadro "FOTO" completo (icono de polaroid incluido)
const BOX_FOTO = [0.1, 0.261, 0.87, 0.6]
// Los valores de FECHA/LUGAR arrancan despues de la etiqueta impresa
// ("FECHA:" / "LUGAR"), no tapan la palabra
const BOX_FECHA = [0.26, 0.15, 0.87, 0.186]
const BOX_LUGAR = [0.24, 0.211, 0.87, 0.239]
// Recuadro de renglones punteados para la descripcion
const BOX_DESC = [0.12, 0.675, 0.85, 0.86]

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

// Un "campo" de texto = un canvas 2D redibujado a mano + su CanvasTexture.
// Se usa en vez de <Html> o <Text> (troika) para que el texto sea geometria
// 3D real: la oculta correctamente el z-buffer cuando otra hoja pasa por
// delante (las hojas estan a solo 0.013 unidades una de otra, <Html occlude>
// no es confiable a esa escala) y no agrega dependencias nuevas.
function useTypewriterField({ text, boxW, boxH, wrap = false, fontRatio, color = '#22303f' }) {
  const lastLenRef = useRef(-1)

  const { canvas, ctx, texture, fontSizePx } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = Math.max(1, Math.round(1024 * (boxH / boxW)))
    const ctx = canvas.getContext('2d')
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    const ratio = fontRatio ?? (wrap ? 0.15 : 0.5)
    return { canvas, ctx, texture, fontSizePx: canvas.height * ratio }
    // el canvas se crea una sola vez; boxW/boxH no cambian en runtime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function draw(shown) {
    const { width, height } = canvas
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = color
    ctx.font = `600 ${fontSizePx}px Poppins, sans-serif`
    if (!wrap) {
      ctx.textBaseline = 'middle'
      ctx.fillText(shown, 4, height / 2)
    } else {
      ctx.textBaseline = 'top'
      const lineHeight = fontSizePx * 1.3
      wrapText(ctx, shown, width - 8).forEach((line, i) => ctx.fillText(line, 4, 2 + i * lineHeight))
    }
    texture.needsUpdate = true
  }

  function setProgress(p) {
    const len = Math.round(THREE.MathUtils.clamp(p, 0, 1) * text.length)
    if (len === lastLenRef.current) return
    lastLenRef.current = len
    draw(text.slice(0, len))
  }

  return { texture, setProgress }
}

export default function HojaCumple({ width, height, thickness, registerApi }) {
  const fotoGroupRef = useRef(null)
  const fotoTexture = useTexture(tx('fotocumple.jpeg'))

  const foto = useMemo(() => frac(...BOX_FOTO, width, height), [width, height])
  const fecha = useMemo(() => frac(...BOX_FECHA, width, height), [width, height])
  const lugar = useMemo(() => frac(...BOX_LUGAR, width, height), [width, height])
  const desc = useMemo(() => frac(...BOX_DESC, width, height), [width, height])

  // "Contain" de la foto dentro de su marco (no "cover"): la foto es
  // retrato, el marco es apaisado. Se prefirio ver la foto COMPLETA -sin
  // recortar arriba/abajo, para no perder el globo del numero "1" ni el
  // resto de la escena- aunque eso deje franjas vacias a los costados.
  // Por eso, a diferencia de un "cover" (que recortaria con repeat/offset
  // de la textura), acá se achica el PLANO mismo mantiene la proporcion
  // real de la imagen y queda centrado dentro del marco.
  const [fotoSize, setFotoSize] = useState({ w: foto.w, h: foto.h })
  useEffect(() => {
    const img = fotoTexture.image
    if (!img) return
    const imgRatio = img.width / img.height
    const boxRatio = foto.w / foto.h
    setFotoSize(imgRatio > boxRatio ? { w: foto.w, h: foto.w / imgRatio } : { w: foto.h * imgRatio, h: foto.h })
  }, [fotoTexture, foto])

  const fechaField = useTypewriterField({ text: FECHA_TEXT, boxW: fecha.w, boxH: fecha.h })
  const lugarField = useTypewriterField({ text: LUGAR_TEXT, boxW: lugar.w, boxH: lugar.h })
  const descField = useTypewriterField({ text: DESCRIPCION_TEXT, boxW: desc.w, boxH: desc.h, wrap: true })

  // Expone hacia useScrollAnimation.js (ver Agenda.jsx) lo que necesita
  // animar. Efecto de hijo -> corre antes que el de Agenda/useScrollAnimation
  // en el mismo commit, asi que cuando ese hook arma la timeline ya tiene la
  // api disponible.
  useEffect(() => {
    registerApi?.({
      fotoGroupRef,
      setFecha: fechaField.setProgress,
      setLugar: lugarField.setProgress,
      setDescripcion: descField.setProgress
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerApi])

  return (
    <>
      {/* Foto: GSAP mueve/rota este grupo desde "fuera de cuadro" hasta
          (0,0,0) -las mallas de adentro ya estan en su posicion final
          dentro del marco, ver foto.x/foto.y. */}
      <group ref={fotoGroupRef}>
        {/* Borde blanco tipo polaroid, un poco mas grande que la foto */}
        <mesh position={[foto.x, foto.y, thickness + 0.0016]}>
          <planeGeometry args={[fotoSize.w * 1.12, fotoSize.h * 1.14]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} metalness={0} />
        </mesh>
        <mesh position={[foto.x, foto.y, thickness + 0.0022]}>
          <planeGeometry args={[fotoSize.w, fotoSize.h]} />
          <meshStandardMaterial map={fotoTexture} roughness={0.7} metalness={0} />
        </mesh>
      </group>

      <mesh position={[fecha.x, fecha.y, thickness + 0.0012]}>
        <planeGeometry args={[fecha.w, fecha.h]} />
        <meshBasicMaterial map={fechaField.texture} transparent />
      </mesh>

      <mesh position={[lugar.x, lugar.y, thickness + 0.0012]}>
        <planeGeometry args={[lugar.w, lugar.h]} />
        <meshBasicMaterial map={lugarField.texture} transparent />
      </mesh>

      <mesh position={[desc.x, desc.y, thickness + 0.0012]}>
        <planeGeometry args={[desc.w, desc.h]} />
        <meshBasicMaterial map={descField.texture} transparent />
      </mesh>
    </>
  )
}
