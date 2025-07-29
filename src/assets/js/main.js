import { renderCart } from "./modules/renderCart.js";
import { actualizarCarritoVisual } from "./modules/carrito.js";
import { verDetalleProducto } from "./modules/detalleProducto.js";


document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  actualizarCarritoVisual();
});

window.verDetalleProducto = verDetalleProducto;


