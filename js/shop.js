const WHATSAPP_NUMBER = "573154380079";

const money = (n) => "$" + n.toLocaleString("es-CO");

// CARRITO Y FAVORITOS (localStorage)
function getCart() {
    return JSON.parse(localStorage.getItem("decayba_cart") || "[]");
}
function saveCart(cart) {
    localStorage.setItem("decayba_cart", JSON.stringify(cart));
    updateBadges();
}
function addToCart(id) {
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if (item) item.qty += 1;
    else cart.push({ id, qty: 1 });
    saveCart(cart);
}
function setQty(id, qty) {
    let cart = getCart();
    if (qty <= 0) cart = cart.filter(i => i.id !== id);
    else {
        const item = cart.find(i => i.id === id);
        if (item) item.qty = qty;
    }
    saveCart(cart);
    renderCart();
}

function getFavorites() {
    return JSON.parse(localStorage.getItem("decayba_favorites") || "[]");
}
function saveFavorites(favs) {
    localStorage.setItem("decayba_favorites", JSON.stringify(favs));
    updateBadges();
}
function toggleFavorite(id) {
    let favs = getFavorites();
    const active = favs.includes(id);
    favs = active ? favs.filter(f => f !== id) : [...favs, id];
    saveFavorites(favs);
    return !active;
}

function updateBadges() {
    const cartCount = getCart().reduce((sum, i) => sum + i.qty, 0);
    const favCount = getFavorites().length;

    document.querySelectorAll(".cart-badge").forEach(b => {
        b.textContent = cartCount;
        b.classList.toggle("show", cartCount > 0);
    });
    document.querySelectorAll(".fav-badge").forEach(b => {
        b.textContent = favCount;
        b.classList.toggle("show", favCount > 0);
    });

    document.querySelectorAll(".fav-btn").forEach(btn => {
        const active = getFavorites().includes(btn.dataset.id);
        btn.classList.toggle("active", active);
        const icon = btn.querySelector("i");
        if (icon) icon.className = active ? "fa-solid fa-heart" : "fa-regular fa-heart";
    });
}

// PANEL DE CARRITO
function renderCart() {
    const wrap = document.querySelector("#cart-items");
    if (!wrap) return;

    const cart = getCart();
    if (cart.length === 0) {
        wrap.innerHTML = "<p class='empty-msg'>Tu carrito está vacío.</p>";
    } else {
        wrap.innerHTML = cart.map(item => {
            const p = PRODUCTS[item.id];
            if (!p) return "";
            return `
                <div class="cart-item">
                    <img src="${p.cover}" alt="${p.name}">
                    <div class="cart-item-info">
                        <h4>${p.name}</h4>
                        <span>${money(p.price)}</span>
                        <div class="qty-control">
                            <button class="qty-btn" data-id="${item.id}" data-delta="-1">-</button>
                            <span>${item.qty}</span>
                            <button class="qty-btn" data-id="${item.id}" data-delta="1">+</button>
                        </div>
                    </div>
                    <button class="remove-btn" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
                </div>`;
        }).join("");
    }

    const total = cart.reduce((sum, i) => sum + (PRODUCTS[i.id]?.price || 0) * i.qty, 0);
    const totalEl = document.querySelector("#cart-total");
    if (totalEl) totalEl.textContent = money(total);

    const waLink = document.querySelector("#cart-whatsapp");
    if (waLink) {
        if (cart.length === 0) {
            waLink.classList.add("disabled");
        } else {
            waLink.classList.remove("disabled");
            const lines = cart.map(i => `- ${PRODUCTS[i.id]?.name} x${i.qty} (${money((PRODUCTS[i.id]?.price || 0) * i.qty)})`);
            const text = `Hola Decayba, quiero pedir:\n${lines.join("\n")}\n\nTotal: ${money(total)}`;
            waLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
        }
    }
}

// PANEL DE FAVORITOS
function renderFavorites() {
    const wrap = document.querySelector("#fav-items");
    if (!wrap) return;

    const favs = getFavorites();
    if (favs.length === 0) {
        wrap.innerHTML = "<p class='empty-msg'>Aún no tienes favoritos.</p>";
        return;
    }

    wrap.innerHTML = favs.map(id => {
        const p = PRODUCTS[id];
        if (!p) return "";
        return `
            <a class="fav-item" href="producto.html?id=${id}">
                <img src="${p.cover}" alt="${p.name}">
                <div class="cart-item-info">
                    <h4>${p.name}</h4>
                    <span>${money(p.price)}</span>
                </div>
            </a>`;
    }).join("");
}

function openDrawer(panel, backdrop) {
    panel?.classList.add("active");
    backdrop?.classList.add("active");
}
function closeDrawers() {
    document.querySelectorAll(".side-drawer, .drawer-backdrop").forEach(el => el.classList.remove("active"));
}

document.addEventListener("DOMContentLoaded", () => {
    updateBadges();
    renderCart();
    renderFavorites();

    const cartDrawer = document.querySelector("#cart-drawer");
    const favDrawer = document.querySelector("#fav-drawer");
    const backdrop = document.querySelector(".drawer-backdrop");

    document.querySelector(".icon-cart")?.addEventListener("click", () => {
        renderCart();
        openDrawer(cartDrawer, backdrop);
    });
    document.querySelector(".icon-fav")?.addEventListener("click", () => {
        renderFavorites();
        openDrawer(favDrawer, backdrop);
    });
    document.querySelectorAll(".drawer-close").forEach(btn => btn.addEventListener("click", closeDrawers));
    backdrop?.addEventListener("click", closeDrawers);

    // Delegados en document: funcionan tambien con tarjetas creadas por JS (ej. productos.html)

    // Click en tarjeta de producto -> ir al detalle (salvo el botón de favorito)
    document.addEventListener("click", (e) => {
        const media = e.target.closest(".product-media[data-href]");
        if (media && !e.target.closest(".fav-btn")) {
            window.location.href = media.dataset.href;
        }
    });

    // Agregar al carrito
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".add-cart-btn");
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        addToCart(btn.dataset.id);
        const original = "Agregar al carrito";
        btn.textContent = "Agregado ✓";
        setTimeout(() => btn.textContent = original, 1200);
    });

    // Favoritos
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".fav-btn");
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(btn.dataset.id);
    });

    // Carrito: +/- y quitar
    document.querySelector("#cart-items")?.addEventListener("click", (e) => {
        const qtyBtn = e.target.closest(".qty-btn");
        const removeBtn = e.target.closest(".remove-btn");
        if (qtyBtn) {
            const cart = getCart();
            const item = cart.find(i => i.id === qtyBtn.dataset.id);
            const delta = parseInt(qtyBtn.dataset.delta, 10);
            setQty(qtyBtn.dataset.id, (item?.qty || 0) + delta);
        }
        if (removeBtn) setQty(removeBtn.dataset.id, 0);
    });
});
