// asideCarrito.js
import { carrito, actualizarCarritoVisual } from "../../assets/js/modules/carrito";

export function inicializarAsideCarrito() {
  const productDetail = document.getElementById("product-detail");
  const cartContent = document.getElementById("cart-content");

  if (!productDetail || !cartContent) return;

  renderAside();

  // Delegación para eliminar producto
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-remove')) {
      e.preventDefault();
      const idx = Number(e.target.dataset.index);
      carrito.splice(idx, 1);
      localStorage.setItem("carrito", JSON.stringify(carrito));
      actualizarCarritoVisual();
      renderAside();
    }
  });

  // Evento de ver carrito
  const btnVerCarrito = document.getElementById("ver-carrito");
  if (btnVerCarrito) {
    btnVerCarrito.addEventListener("click", function (e) {
      e.preventDefault();
      if (carrito.length === 0) {
        productDetail.style.display = "none";
        window.location.href = "./../cart/carrito.html";
        return;
      }

      if (productDetail.style.display === "block") {
        productDetail.style.display = "none";
      } else {
        productDetail.style.display = "block";
        renderAside();
      }
    });
  }
}

function renderAside() {
  const cart = JSON.parse(localStorage.getItem("carrito")) || [];
  const cartContent = document.getElementById("cart-content");
  const productDetail = document.getElementById("product-detail");

  if (!cartContent || !productDetail) return;

  cartContent.innerHTML = "";
  if (cart.length === 0) {
    productDetail.style.display = "none";
    return;
  }

  const ruta = window.location.pathname;
  const rutaFinal = (ruta.includes("index.html") || ruta === "/" || ruta.includes("Decayba")) ? 
    item.imagen : item.imagen.replace("./src", "../..");

  cart.forEach((item, index) => {
    console.log(item.img)
    console.log("oeo")
    const div = document.createElement("div");
    div.classList.add("shopping-cart");
    div.innerHTML = `
      <figure>
        <img src="${item.img}" alt="${item.nombre}">
      </figure>
      <div>
        <p><strong>${item.nombre}</strong></p>
        <p>Precio: $${item.precio.toLocaleString()}</p>
        <label>
          <input type="number" min="1" value="${item.cantidad}" data-index="${index}" class="input-cantidad">
        </label>
      </div>
      <img src="../../icon/icon_close.png" alt="Eliminar" data-index="${index}" class="btn-remove">
    `;
    cartContent.appendChild(div);
  });

  document.querySelectorAll(".input-cantidad").forEach((input) => {
    input.addEventListener("change", (e) => {
      const idx = Number(e.target.dataset.index);
      const nuevaCantidad = Number(e.target.value);
      if (nuevaCantidad < 1) return;
      cart[idx].cantidad = nuevaCantidad;
      localStorage.setItem("carrito", JSON.stringify(cart));
      renderAside();
    });
  });
}
