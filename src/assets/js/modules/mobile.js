export function activarMenuHamburguesa() {
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobile-menu");

  if (!hamburger || !mobileMenu) return;

  function abrir() {
    hamburger.classList.add("active");
    mobileMenu.classList.add("active");
    hamburger.setAttribute("aria-expanded", "true");
    mobileMenu.setAttribute("aria-hidden", "false");
  }

  function cerrar() {
    hamburger.classList.remove("active");
    mobileMenu.classList.remove("active");
    hamburger.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
  }

  hamburger.addEventListener("click", (e) => {
    e.stopPropagation();
    hamburger.classList.contains("active") ? cerrar() : abrir();
  });

  // Close when clicking a link inside the menu
  mobileMenu.addEventListener("click", (e) => {
    if (e.target.tagName === "A") cerrar();
  });

  // Close when clicking anywhere outside
  document.addEventListener("click", (e) => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
      cerrar();
    }
  });
}
