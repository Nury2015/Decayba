// The mobile menu is embedded inside the nav component (headerglobal.html).
// This module just activates the hamburger toggle after the nav is in the DOM.
export async function cargarMenuHamburguesa() {
  const BASE = window.location.pathname.startsWith('/Decayba') ? '/Decayba' : '';
  const { activarMenuHamburguesa } = await import(`${BASE}/src/assets/js/modules/mobile.js`);
  activarMenuHamburguesa();
}
