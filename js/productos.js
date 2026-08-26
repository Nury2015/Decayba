const CATEGORY_ORDER = ["album-generico", "album-personalizado", "cuaderno", "agenda", "viajero", "juguetes", "aseo"];

const CATEGORY_LABELS = {
    "album-generico": "Álbum Genérico",
    "album-personalizado": "Álbum Personalizado",
    "cuaderno": "Cuadernos",
    "agenda": "Agendas de Agradecimiento",
    "viajero": "Álbum Viajero",
    "juguetes": "Juguetes",
    "aseo": "Aseo"
};

document.addEventListener("DOMContentLoaded", () => {
    const grid = document.querySelector("#catalog-grid");
    if (!grid) return;

    const categoria = new URLSearchParams(window.location.search).get("categoria");
    const title = document.querySelector("#catalog-title");
    const subtitle = document.querySelector("#catalog-subtitle");

    function productCard(id) {
        const p = PRODUCTS[id];
        const videoTag = p.video
            ? `<video src="${p.video}" poster="${p.cover}" muted loop playsinline preload="metadata"></video>
               <span class="play-icon"><i class="fa-solid fa-play"></i></span>`
            : "";

        const soldOutBadge = p.soldOut ? `<span class="sold-out-badge">Agotado</span>` : "";
        const cartBtn = p.soldOut
            ? `<button class="add-cart-btn" disabled>Agotado</button>`
            : `<button class="add-cart-btn" data-id="${id}">Agregar al carrito</button>`;

        return `
            <article class="product${p.soldOut ? " is-sold-out" : ""}" data-id="${id}" data-href="producto.html?id=${id}">

                <div class="product-media" data-href="producto.html?id=${id}">

                    <img src="${p.cover}" alt="${p.name}" loading="lazy" decoding="async">

                    ${videoTag}

                    ${soldOutBadge}

                    <button class="fav-btn" data-id="${id}" aria-label="Favorito"><i class="fa-regular fa-heart"></i></button>

                </div>

                <a href="producto.html?id=${id}" class="product-title">
                    <h3>${p.name}</h3>
                </a>

                <span>${money(p.price)}</span>

                ${cartBtn}

            </article>`;
    }

    // Un solo producto queda centrado (mitad de ancho), varios se acomodan de a 4 por renglón
    function gridFor(ids) {
        if (ids.length === 0) {
            return `<p class="category-empty">Próximamente</p>`;
        }

        const modifier = ids.length === 1 ? "grid-single" : "grid-4";
        return `<div class="products-grid ${modifier}">${ids.map(productCard).join("")}</div>`;
    }

    if (categoria) {

        // Vista filtrada por una sola categoría (enlaces desde el inicio)
        const ids = Object.keys(PRODUCTS).filter(id => PRODUCTS[id].category === categoria);

        if (title) title.textContent = CATEGORY_LABELS[categoria] || "Productos";
        if (subtitle) subtitle.textContent = `Descubre nuestra colección de ${(CATEGORY_LABELS[categoria] || "").toLowerCase()}`;

        grid.innerHTML = gridFor(ids);

    } else {

        // Vista general: todas las categorías, una sección por cada una
        grid.innerHTML = CATEGORY_ORDER.map(cat => {
            const ids = Object.keys(PRODUCTS).filter(id => PRODUCTS[id].category === cat);

            return `
                <div class="category-block" id="cat-${cat}">

                    <h2 class="category-title">${CATEGORY_LABELS[cat]}</h2>

                    ${gridFor(ids)}

                </div>`;
        }).join("");

    }

    updateBadges();

    // Reproducir video al pasar el mouse (igual que en el home)
    grid.querySelectorAll(".product-media").forEach(media => {
        const video = media.querySelector("video");
        if (!video) return;

        media.addEventListener("mouseenter", () => video.play());
        media.addEventListener("mouseleave", () => {
            video.pause();
            video.currentTime = 0;
        });
    });
});
