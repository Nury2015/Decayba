import { renderCart } from "./modules/renderCart.js";
import { actualizarCarritoVisual } from "./modules/carrito.js";

document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  actualizarCarritoVisual();
});