import { renderCart } from "/Decayba/src/assets/js/modules/renderCart.js";
import { actualizarCarritoVisual } from "/Decayba/src/assets/js/modules/carrito.js";
import { verDetalleProducto } from "/Decayba/src/assets/js/modules/detalleProducto.js";

console.log(7, "main ñero")
document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  actualizarCarritoVisual();
});

window.verDetalleProducto = verDetalleProducto;


