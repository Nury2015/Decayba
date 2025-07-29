import { productos } from "../../../services/productos.js";
import { mostrarToast } from "../utils/toast.js";

export let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// ----------------- FUNCIONES PRINCIPALES -----------------

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

// ----------------- RENDER DEL CARRITO -----------------

function renderCart2() {
  const cartContent = document.getElementById("cart-content");
  const productDetail = document.getElementById("product-detail");

  cartContent.innerHTML = ""; // 🔸 Limpiar el contenedor

  if (carrito.length === 0) {
    productDetail.style.display = "none";
    return;
  }

  carrito.forEach((item, index) => {
    const div = document.createElement("div");
    div.classList.add("shopping-cart");
    div.innerHTML = `
      <figure>
        <img src="${item.img}" alt="${item.nombre}">
      </figure>
      <div class="productos">
        <p><strong>${item.nombre}</strong></p>
        <p>Precio: $${item.precio.toLocaleString()}</p>
        <label class="cantidad">
          <input type="number" min="1" value="${item.cantidad}" data-index="${index}" class="input-cantidad">
        </label>
      </div>
      <img src="../../assets/icon/icon_close.png" alt="Eliminar" data-index="${index}" class="btn-remove">
    `;
    cartContent.appendChild(div);
  });

  // 🔸 Eventos para cambiar la cantidad
  document.querySelectorAll(".input-cantidad").forEach((input) => {
    input.addEventListener("change", (e) => {
      const idx = Number(e.target.dataset.index);
      const nuevaCantidad = Number(e.target.value);

      if (nuevaCantidad < 1) return;

      // Validar stock desde el catálogo
      const productoOriginal = productos.find(p => p.nombre === carrito[idx].nombre);
      if (!productoOriginal) return mostrarToast("Producto no encontrado", "error");

      if (nuevaCantidad > productoOriginal.stock) {
        mostrarToast(`Solo hay ${productoOriginal.stock} disponibles`, "warning");
        e.target.value = carrito[idx].cantidad; // volver al valor anterior
        return;
      }

      carrito[idx].cantidad = nuevaCantidad;
      localStorage.setItem("carrito", JSON.stringify(carrito));
      actualizarCarritoVisual();
      renderCart2(); // volver a pintar
    });
  });
}


// ----------------- CAPTURAR PRODUCTOS DEL HTML -----------------

function obtenerListaDeProductos() {
  return Array.from(document.querySelectorAll(".card-container .product-card")).map((card) => {
    const img = card.querySelector("a img")?.src || "";
    const nombre = card.querySelector(".informacion-producto p:nth-child(1)")?.textContent.trim();
    const precioTexto = card.querySelector(".informacion-producto p:nth-child(2)")?.textContent || "";
    const precio = Number(precioTexto.replace(/[^0-9]/g, ""));

    return { img, nombre, precio };
  });
}

// ----------------- EVENTO BOTÓN CARRITO -----------------

document.getElementById("ver-carrito").addEventListener("click", function (e) {
  e.preventDefault();

  const productDetail = document.getElementById("product-detail");
  if (!productDetail) {
    console.error('No se encontró el elemento con ID "product-detail"');
    return;
  }

  if (carrito.length === 0) {
    productDetail.style.display = "none";
    window.location.href = "./../cart/carrito.html";
    return;
  }

  if (productDetail.style.display === "block") {
    productDetail.style.display = "none";
  } else {
    const productos = obtenerListaDeProductos();
    localStorage.setItem("productosDisponibles", JSON.stringify(productos));

    productDetail.style.display = "block";
    renderCart2();
  }
});

// ----------------- EVENTO ELIMINAR PRODUCTO -----------------

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
