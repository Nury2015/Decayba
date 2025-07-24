import { productos } from "../../../services/productos.js";
import { mostrarToast } from "../utils/toast.js";

export let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

export function agregarAlCarrito(nombre, precio, img, cantidad = 1) {
  const producto = productos.find((p) => p.nombre === nombre);
  if (!producto) return mostrarToast("Producto no encontrado", "error");

  const existente = carrito.find((item) => item.nombre === nombre);
  if (existente) {
    const nuevaCantidad = existente.cantidad + cantidad;
    if (nuevaCantidad > producto.stock)
      return mostrarToast(`Solo hay ${producto.stock} disponibles`, "warning");

    existente.cantidad = nuevaCantidad;
  } else {
    if (cantidad > producto.stock)
      return mostrarToast(`Solo hay ${producto.stock} disponibles`, "warning");

    carrito.push({ nombre, precio, cantidad, img });
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarCarritoVisual();
  mostrarToast(`"${nombre}" agregado al carrito 🛒`, "success");
}

export function actualizarCarritoVisual() {
  const contador = document.querySelector(".navbar-shopping-cart div");
  const total = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  contador.textContent = total;

  renderCart2();
}

function renderCart2() {
  const cart = JSON.parse(localStorage.getItem("carrito")) || [];
  const cartContent = document.getElementById("cart-content");
  const productDetail = document.getElementById("product-detail");


  if(cart.length === 0){
    cartContent.innerHTML = "";
    productDetail.style.display = "none";
  }
  cart.forEach((item, index) => {
    const div = document.createElement("div");

    // Limpia el contenido existente antes de agregar
    if (cartContent.firstChild) {
      cartContent.innerHTML = "";
    }

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
            <img src="../../assets/icon/icon_close.png" alt="Eliminar" data-index="${index}" class="btn-remove">
          `;
    // Agrega el nuevo contenido
    cartContent.appendChild(div);

    document.querySelectorAll(".input-cantidad").forEach((input) => {
      input.addEventListener("change", (e) => {
        const idx = Number(e.target.dataset.index);
        const nuevaCantidad = Number(e.target.value);
        if (nuevaCantidad < 1) return; // prevenir valores inválidos
        cart[idx].cantidad = nuevaCantidad;
        localStorage.setItem("carrito", JSON.stringify(cart));
        renderCart2(); // vuelve a pintar todo
      });
    });
  });
}

function obtenerListaDeProductos() {
  // Selecciona TODAS las tarjetas dentro de .card-container
  return Array.from(
    document.querySelectorAll(".card-container .product-card")
  ).map((card) => {
    // Imagen principal (la primera dentro del <a>)
    const img = card.querySelector("a img")?.src || "";

    // Nombre (primer <p> dentro de .informacion-producto)
    const nombre = card
      .querySelector(".informacion-producto p:nth-child(1)")
      .textContent.trim();

    // Precio (segundo <p> → quitamos símbolos y puntos)
    const precioTexto = card.querySelector(
      ".informacion-producto p:nth-child(2)"
    ).textContent;
    const precio = Number(precioTexto.replace(/[^0-9]/g, ""));

    return { img, nombre, precio };
  });
}

document.getElementById("ver-carrito").addEventListener("click", function (e) {
  console.log("Botón de carrito clickeado");
  e.preventDefault(); // Detiene el comportamiento por defecto del enlace

  const productDetail = document.getElementById("product-detail");
  console.log("Elemento del carrito encontrado:", productDetail);

  if (!productDetail) {
    console.error('No se encontró el elemento con ID "product-detail"');
    return;
  }

  if(carrito.length === 0){
    productDetail.style.display = "none";
    window.location.href = "./../cart/carrito.html";
    return;
  }

  // Alternar la visibilidad del carrito
  if (productDetail.style.display === "block") {
    productDetail.style.display = "none";
    console.log("Carrito oculto");
  } else {
    const productos = obtenerListaDeProductos();
    localStorage.setItem("productosDisponibles", JSON.stringify(productos));

    productDetail.style.display = "block";
    console.log("Carrito mostrado");
    renderCart2();
  }
});

// Delegación de eventos para eliminar productos
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-remove')) {
    e.preventDefault();
    const idx = Number(e.target.dataset.index);
    carrito.splice(idx, 1);
    localStorage.setItem("carrito", JSON.stringify(carrito));
    actualizarCarritoVisual();
    renderCart2();
  }
});


