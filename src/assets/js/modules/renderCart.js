import { productos } from "../../../services/productos.js";
import { agregarAlCarrito } from "./carrito.js";
import { volarAlCarrito } from "./animaciones.js";

const BASE = window.location.pathname.startsWith('/Decayba') ? '/Decayba' : '';

function resolveAsset(path) {
  if (!path) return '';
  if (path.startsWith('/Decayba/')) return BASE + path.slice('/Decayba'.length);
  if (path.startsWith('./src/')) return BASE + '/src/' + path.slice('./src/'.length);
  return path;
}

function buildCard(item) {
  const div = document.createElement("div");
  const rutaFinal = resolveAsset(item.imagen);
  const rutaCarritoImg = `${BASE}/src/assets/icon/bt_add_to_cart.svg`;
  div.classList.add("product-card");

  const stockNum =
    typeof item.stock === "number"
      ? item.stock
      : Object.values(item.stock).reduce((a, b) => a + b, 0);

  // Usamos data-nombre + data-imagen como clave compuesta (evita el JSON en onclick)
  div.innerHTML = `
    <a class="ver-producto"
       data-nombre="${item.nombre}"
       data-imagen="${item.imagen}"
       style="cursor:pointer;display:block;">
      <img src="${rutaFinal}" alt="${item.nombre}">
    </a>
    <div class="informacion-producto">
      <div class="card-infor">
        <p>${item.nombre}</p>
        <p>${item.valor}</p>
        ${stockNum > 0
          ? `<div class="acciones-producto">
              <input type="number" min="1" max="${stockNum}" value="1" data-id="${item.nombre}" class="input-cantidad">
            </div>`
          : `<span style="color:red;font-weight:bold;">Agotado</span>`
        }
      </div>
      <figure>
        <a href="#" class="agregar-al-carrito"
          data-nombre="${item.nombre}"
          data-precio="${item.valor.replace(/\D/g, '')}"
          data-img="${rutaFinal}">
          <img src="${rutaCarritoImg}" alt="carrito de compra">
        </a>
      </figure>
    </div>
  `;
  return div;
}

function attachEvents(container) {
  // Clic en imagen del producto → navegar al detalle
  container.querySelectorAll(".ver-producto").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const nombre = link.dataset.nombre;
      const imagen = link.dataset.imagen;
      // Buscar el producto original en el array (clave compuesta nombre+imagen)
      const producto = productos.find(
        (p) => p.nombre === nombre && p.imagen === imagen
      );
      if (producto && typeof window.verDetalleProducto === "function") {
        window.verDetalleProducto(producto);
      }
    });
  });

  // Clic en botón agregar al carrito
  container.querySelectorAll(".agregar-al-carrito").forEach((boton) => {
    boton.addEventListener("click", (e) => {
      e.preventDefault();
      const nombre = boton.dataset.nombre;
      const precio = parseInt(boton.dataset.precio);
      const img = boton.dataset.img;
      const cantidadInput = container.querySelector(`input[data-id="${nombre}"]`);
      const cantidad = cantidadInput ? parseInt(cantidadInput.value) : 1;
      volarAlCarrito(boton.querySelector("img"));
      agregarAlCarrito(nombre, precio, img, cantidad);
    });
  });
}

// Render all products, or filtered by categoria
export function renderCart(categoria = null) {
  const container = document.getElementById("card-container");
  if (!container) return;
  const lista = categoria ? productos.filter((p) => p.categoria === categoria) : productos;
  lista.forEach((item) => container.appendChild(buildCard(item)));
  attachEvents(container);
}

// Render same-categoria suggestions, excluding the current product
export function renderSuggestions(excludeName, categoria) {
  const container = document.getElementById("card-container");
  if (!container) return;
  const lista = productos.filter(
    (p) => p.nombre !== excludeName && (!categoria || p.categoria === categoria)
  );
  lista.forEach((item) => container.appendChild(buildCard(item)));
  attachEvents(container);
}
