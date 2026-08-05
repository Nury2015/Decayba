import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: '/hero3d/dist/' -> el sitio principal (index.html, un nivel
// arriba) va a cargar el JS/CSS de este build DESDE esa ruta relativa
// al dominio (decayba.com/hero3d/dist/...). Usamos esa misma base para
// que import.meta.env.BASE_URL (con el que armamos las rutas a las
// texturas en /public/textures) apunte al lugar correcto sin importar
// si estamos en dev o ya incrustado en el sitio real.
export default defineConfig({
  plugins: [react()],
  base: '/hero3d/dist/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Nombres de archivo FIJOS (sin hash de contenido). El sitio
        // principal referencia estos archivos por nombre en su
        // <script>/<link>; si el nombre cambiara en cada build habria
        // que actualizar index.html cada vez que se recompila esto.
        entryFileNames: 'assets/hero3d.js',
        chunkFileNames: 'assets/hero3d-[name].js',
        assetFileNames: 'assets/hero3d[extname]'
      }
    }
  }
})
