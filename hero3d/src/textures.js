/**
 * textures.js
 * -----------
 * Arma rutas a /public/textures usando import.meta.env.BASE_URL en vez
 * de escribir "/textures/..." a mano. La diferencia importa aca porque
 * este proyecto no vive solo: se compila y se incrusta dentro del sitio
 * principal (ver vite.config.js -> base: '/hero3d/dist/'). Si hardcodeamos
 * "/textures/x.webp" (absoluto desde la RAIZ DEL DOMINIO), en el sitio
 * real buscaria decayba.com/textures/x.webp, que no existe — el archivo
 * real queda en decayba.com/hero3d/dist/textures/x.webp. BASE_URL ya
 * sabe cual de los dos casos aplica (dev local vs. incrustado).
 */
export const tx = (path) => `${import.meta.env.BASE_URL}textures/${path}`
