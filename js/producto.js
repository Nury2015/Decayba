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
            : `<img src="${item.src}" alt="${product.name}" decoding="async">`;

        thumbsEl.querySelectorAll(".pd-thumb").forEach((t, i) => t.classList.toggle("active", i === currentIndex));
    }

    thumbsEl.innerHTML = mediaItems.map((item, i) => `
        <div class="pd-thumb ${item.type === "video" ? "is-video" : ""} ${i === 0 ? "active" : ""}" data-index="${i}">
            <img src="${item.type === "video" ? product.cover : item.src}" alt="" loading="lazy" decoding="async">
        </div>
    `).join("");

    showMedia(0);

    thumbsEl.querySelectorAll(".pd-thumb").forEach(thumb => {
        thumb.addEventListener("click", () => showMedia(+thumb.dataset.index));
    });

    document.querySelector("#pd-prev").addEventListener("click", () => showMedia(currentIndex - 1));
    document.querySelector("#pd-next").addEventListener("click", () => showMedia(currentIndex + 1));

    // ZOOM: al hacer clic en la imagen principal, se abre en grande
    const lightbox = document.querySelector("#pd-lightbox");
    const lightboxImg = document.querySelector("#pd-lightbox-img");

    function openLightbox(src) {
        lightboxImg.src = src;
        lightbox.classList.add("active");
    }
    function closeLightbox() {
        lightbox.classList.remove("active");
    }

    // busca la siguiente imagen en esa dirección, saltando videos
    function nextImageIndex(from, dir) {
        let i = from;
        for (let n = 0; n < mediaItems.length; n++) {
            i = (i + dir + mediaItems.length) % mediaItems.length;
            if (mediaItems[i].type === "image") return i;
        }
        return from;
    }

    function showLightboxAt(index) {
        showMedia(index);
        openLightbox(mediaItems[currentIndex].src);
    }

    mainEl.addEventListener("click", (e) => {
        if (e.target.tagName === "IMG") openLightbox(e.target.src);
    });

    lightbox.addEventListener("click", (e) => {
        if (e.target !== lightboxImg) closeLightbox();
    });
    document.querySelector("#pd-lightbox-close").addEventListener("click", closeLightbox);

    document.querySelector("#pd-lightbox-prev").addEventListener("click", (e) => {
        e.stopPropagation();
        showLightboxAt(nextImageIndex(currentIndex, -1));
    });
    document.querySelector("#pd-lightbox-next").addEventListener("click", (e) => {
        e.stopPropagation();
        showLightboxAt(nextImageIndex(currentIndex, 1));
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeLightbox();
        if (!lightbox.classList.contains("active")) return;
        if (e.key === "ArrowLeft") showLightboxAt(nextImageIndex(currentIndex, -1));
        if (e.key === "ArrowRight") showLightboxAt(nextImageIndex(currentIndex, 1));
    });

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

    // SUGERENCIAS: primero misma categoría, luego relleno con el resto
    const relatedGrid = document.querySelector("#related-grid");
    if (relatedGrid) {
        const otherIds = Object.keys(PRODUCTS).filter(pid => pid !== id);
        const sameCategory = otherIds.filter(pid => PRODUCTS[pid].category === product.category);
        const rest = otherIds.filter(pid => PRODUCTS[pid].category !== product.category);
        const relatedIds = [...sameCategory, ...rest].slice(0, 4);

        relatedGrid.innerHTML = relatedIds.map(pid => {
            const p = PRODUCTS[pid];
            const videoTag = p.video
                ? `<video src="${p.video}" poster="${p.cover}" muted loop playsinline preload="metadata"></video>
                   <span class="play-icon"><i class="fa-solid fa-play"></i></span>`
                : "";

            return `
                <article class="product" data-id="${pid}">

                    <div class="product-media" data-href="producto.html?id=${pid}">

                        <img src="${p.cover}" alt="${p.name}">

                        ${videoTag}

                        <button class="fav-btn" data-id="${pid}" aria-label="Favorito"><i class="fa-regular fa-heart"></i></button>

                    </div>

                    <a href="producto.html?id=${pid}" class="product-title">
                        <h3>${p.name}</h3>
                    </a>

                    <span>${money(p.price)}</span>

                    <button class="add-cart-btn" data-id="${pid}">Agregar al carrito</button>

                </article>`;
        }).join("");

        updateBadges();

        relatedGrid.querySelectorAll(".product-media").forEach(media => {
            const video = media.querySelector("video");
            if (!video) return;

            media.addEventListener("mouseenter", () => video.play());
            media.addEventListener("mouseleave", () => {
                video.pause();
                video.currentTime = 0;
            });
        });
    }
});
