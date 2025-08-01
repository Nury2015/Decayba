import { productos } from "../../../services/productos.js";
import { agregarAlCarrito } from "./carrito.js";
import { volarAlCarrito } from "./animaciones.js";

export function renderCart() {
  const cartContent = document.getElementById("card-container");

  productos.forEach((item) => {
    const div = document.createElement("div");
    const ruta = window.location.pathname;
    const rutaFinal = (ruta.includes("index.html") || ruta === "/") ? 
          item.imagen : item.imagen.replace("./src", "../..");
    const rutaCarritoImg =  (ruta.includes("index.html") || ruta === "/") ? 
          "./src/assets/icon/bt_add_to_cart.svg" : "../../assets/icon/bt_add_to_cart.svg";
    
    div.classList.add("product-card");
    div.innerHTML = `
      <a onclick='verDetalleProducto(${JSON.stringify(item)})'>
        <img src="${rutaFinal}" alt="${item.nombre}">
      </a>
      <div class="informacion-producto">
        <div>
          <p>${item.nombre}</p>
          <p>${item.valor}</p>
          ${item.stock > 0
            ? `<div class="acciones-producto">
                <input type="number" min="1" max="${item.stock}" value="1" data-id="${item.nombre}" class="input-cantidad">
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
    cartContent.appendChild(div);
  });

  document.querySelectorAll('.agregar-al-carrito').forEach(boton => {
    boton.addEventListener('click', e => {
      e.preventDefault();
      const nombre = boton.dataset.nombre;
      const precio = parseInt(boton.dataset.precio);
      const img = boton.dataset.img;
      const cantidad = parseInt(document.querySelector(`input[data-id="${nombre}"]`).value);

      const imgElement = boton.querySelector("img");
      volarAlCarrito(imgElement);
      agregarAlCarrito(nombre, precio, img, cantidad);
    });
  });
}
