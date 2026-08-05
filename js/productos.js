const CATEGORY_LABELS = {
    agenda: "Agendas",
    album: "Álbumes",
    cuaderno: "Cuadernos",
    viajero: "Álbum Viajero"
};

document.addEventListener("DOMContentLoaded", () => {
    const grid = document.querySelector("#catalog-grid");
    if (!grid) return;

    const categoria = new URLSearchParams(window.location.search).get("categoria");
    const ids = categoria
        ? Object.keys(PRODUCTS).filter(id => PRODUCTS[id].category === categoria)
        : Object.keys(PRODUCTS);

    const title = document.querySelector("#catalog-title");
    const subtitle = document.querySelector("#catalog-subtitle");
    if (categoria && CATEGORY_LABELS[categoria]) {
        if (title) title.textContent = CATEGORY_LABELS[categoria];
        if (subtitle) subtitle.textContent = `Descubre nuestra colección de ${CATEGORY_LABELS[categoria].toLowerCase()}`;
    }

    grid.innerHTML = ids.map(id => {
        const p = PRODUCTS[id];
        const videoTag = p.video
            ? `<video src="${p.video}" poster="${p.cover}" muted loop playsinline preload="metadata"></video>
               <span class="play-icon"><i class="fa-solid fa-play"></i></span>`
            : "";

        return `
            <article class="product" data-id="${id}">

                <div class="product-media" data-href="producto.html?id=${id}">

                    <img src="${p.cover}" alt="${p.name}" loading="lazy" decoding="async">

                    ${videoTag}

                    <button class="fav-btn" data-id="${id}" aria-label="Favorito"><i class="fa-regular fa-heart"></i></button>

                </div>

                <a href="producto.html?id=${id}" class="product-title">
                    <h3>${p.name}</h3>
                </a>

                <span>${money(p.price)}</span>

                <button class="add-cart-btn" data-id="${id}">Agregar al carrito</button>

            </article>`;
    }).join("");

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
