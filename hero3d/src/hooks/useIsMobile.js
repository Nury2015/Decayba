import { useEffect, useState } from 'react'

const QUERY = '(max-width: 768px)'

/**
 * useIsMobile.js
 * --------------
 * Detecta si estamos en una pantalla chica para bajar la calidad del
 * render (sombras mas livianas, menos pixel ratio) en vez de excluir
 * mobile por completo. Reacciona a cambios (girar el telefono, resize)
 * via matchMedia, que es mas barato que escuchar "resize" a mano.
 */
export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches
  )

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const onChange = (e) => setIsMobile(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
}
