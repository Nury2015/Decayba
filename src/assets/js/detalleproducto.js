import { productos } from "/Decayba/src/services/productos.js";

const cartContent = document.getElementById("card-container");
   
function renderCart() {
  productos.forEach((item, index) => {
    const div = document.createElement("div");
    div.classList.add("product-card");

    div.innerHTML = `
      <a onclick="verDetalleProducto({
        nombre: '${item.nombre}',
        precio: '${item.valor}',
        descripcion: '${item.descripcion}',
        imagen: '${item.imagen}',
        imagenes: '${item.imgs}'
      })">
        <img src="${item.imagen}" alt="${item.nombre}">
      </a>
      <div class="informacion-producto">
        <div>
          <p>${item.nombre}</p>
          <p>${item.valor}</p>
          ${item.stock > 0
          
              ? `
          <div class="acciones-producto">
            <input type="number" min="1" max="${item.stock}" value="1" data-id="${item.nombre}" class="input-cantidad">
          </div>`
              : `<span style="color:red;font-weight:bold;">Agotado</span>`
          }
        </div>
        <figure>
          <a href="#" class="agregar-al-carrito"
            data-nombre="${item.nombre}"
            data-precio="${item.valor.replace(/\D/g, '')}"
            data-img="${item.imagen}">
            <img src="icons/bt_add_to_cart.svg" alt="carrito de compra">
          </a>
        </figure>
      </div>
    `;

    cartContent.appendChild(div);
    
  }); 
}