import { renderCart } from "/Decayba/src/js/modules/renderCart.js";
import { actualizarCarritoVisual } from "/Decayba/src/js/modules/carrito.js";
import { verDetalleProducto } from "/Decayba/src/js/modules/detalleProducto.js";


document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  actualizarCarritoVisual();
});

window.verDetalleProducto = verDetalleProducto;


