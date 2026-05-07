export async function cargarMenuHamburguesa() {
  const contenedor = document.getElementById('contenedor-hamburguesa');
  if (!contenedor) return;

  const BASE = window.location.pathname.startsWith('/Decayba') ? '/Decayba' : '';

  const response = await fetch(`${BASE}/src/components/menuMobile.html`, { cache: 'reload' });
  const raw = await response.text();
  contenedor.innerHTML = raw.replaceAll('/Decayba/', `${BASE}/`);

  requestAnimationFrame(async () => {
    const { activarMenuHamburguesa } = await import(`${BASE}/src/assets/js/modules/mobile.js`);
    activarMenuHamburguesa();
  });
}
