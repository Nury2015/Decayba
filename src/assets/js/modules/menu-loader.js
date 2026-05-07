// src/assets/js/menu-loader.js
export async function cargarMenuHamburguesa() {
  const contenedor = document.getElementById('contenedor-hamburguesa');
  if (!contenedor) return; // No hacer nada si no existe el contenedor

  // Cargar HTML del menú
  const response = await fetch('../../components/menuMobile.html');
  const html = await response.text();
  contenedor.innerHTML = html;

 // Esperar un frame para que el DOM se actualice
  requestAnimationFrame(async () => {
    const { activarMenuHamburguesa } = await import('./mobile.js');
    activarMenuHamburguesa();
  });
}
