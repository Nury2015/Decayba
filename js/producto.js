document.addEventListener("DOMContentLoaded", () => {
    const id = new URLSearchParams(location.search).get("id");
    const product = PRODUCTS[id];
    const container = document.querySelector(".product-detail .container");

    if (!product) {
        container.innerHTML = "<p>Producto no encontrado. <a href='index.html'>Volver al inicio</a></p>";
        return;
    }

    document.title = `${product.name} | Decayba`;
    document.querySelector("#pd-name").textContent = product.name;
    document.querySelector("#pd-price").textContent = money(product.price);
    document.querySelector("#pd-description").textContent = product.description;
    document.querySelector("#pd-details").innerHTML = product.details.map(d => `<li>${d}</li>`).join("");

    const mediaItems = [
        ...product.gallery.map(src => ({ type: "image", src })),
        ...(product.video ? [{ type: "video", src: product.video }] : [])
    ];

    const mainEl = document.querySelector("#pd-main");
    const thumbsEl = document.querySelector("#pd-thumbs");
    let currentIndex = 0;

    function showMedia(index) {
        currentIndex = (index + mediaItems.length) % mediaItems.length;
        const item = mediaItems[currentIndex];

        mainEl.innerHTML = item.type === "video"
            ? `<video src="${item.src}" poster="${product.cover}" controls playsinline preload="metadata"></video>`
            : `<img src="${item.src}" alt="${product.name}">`;

        thumbsEl.querySelectorAll(".pd-thumb").forEach((t, i) => t.classList.toggle("active", i === currentIndex));
    }

    thumbsEl.innerHTML = mediaItems.map((item, i) => `
        <div class="pd-thumb ${item.type === "video" ? "is-video" : ""} ${i === 0 ? "active" : ""}" data-index="${i}">
            <img src="${item.type === "video" ? product.cover : item.src}" alt="">
        </div>
    `).join("");

    showMedia(0);

    thumbsEl.querySelectorAll(".pd-thumb").forEach(thumb => {
        thumb.addEventListener("click", () => showMedia(+thumb.dataset.index));
    });

    document.querySelector("#pd-prev").addEventListener("click", () => showMedia(currentIndex - 1));
    document.querySelector("#pd-next").addEventListener("click", () => showMedia(currentIndex + 1));

    const addBtn = document.querySelector("#pd-add-btn");
    addBtn.addEventListener("click", () => {
        addToCart(id);
        addBtn.textContent = "Agregado ✓";
        setTimeout(() => addBtn.textContent = "Agregar al carrito", 1200);
    });

    const favBtn = document.querySelector("#pd-fav-btn");
    function refreshFavBtn() {
        const active = getFavorites().includes(id);
        favBtn.classList.toggle("active", active);
        favBtn.querySelector("i").className = active ? "fa-solid fa-heart" : "fa-regular fa-heart";
    }
    refreshFavBtn();
    favBtn.addEventListener("click", () => {
        toggleFavorite(id);
        refreshFavBtn();
    });
});
