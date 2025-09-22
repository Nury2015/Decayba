import { renderCart } from "/Decayba/src/assets/js/modules/renderCart.js";
import { actualizarCarritoVisual } from "/Decayba/src/assets/js/modules/carrito.js";
import { verDetalleProducto } from "/Decayba/src/js/assets/modules/detalleProducto.js";


document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  actualizarCarritoVisual();
});

window.verDetalleProducto = verDetalleProducto;


