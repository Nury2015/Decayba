export function activarMenuHamburguesa() {
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.querySelector(".mobile-menu");

  if (!hamburger || !mobileMenu) {
    console.error('No se encontró el menú hamburguesa');
    return;
  }

  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    mobileMenu.classList.toggle("active");
  });
}

console.log(5, "mobile")
