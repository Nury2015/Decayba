const WHATSAPP_NUMBER = "573154380079";

const money = (n) => "$" + n.toLocaleString("es-CO");

// Tope de cantidad por producto en el carrito: usa el "stock" del producto
// si está definido (ej. el pulpo con stock:1), y si no, un tope general
// para evitar pedidos absurdos (ej. 30 unidades de algo que no hay).
const DEFAULT_MAX_QTY = 5;
const maxQtyFor = (id) => PRODUCTS[id]?.stock ?? DEFAULT_MAX_QTY;

// CARRITO Y FAVORITOS (localStorage)
// Lee una lista guardada descartando lo que ya no existe en el catalogo:
// un producto retirado seguia contando en el globito del carrito aunque no
// apareciera en la lista. Si el dato esta corrupto, se empieza de cero.
function readStored(key) {
    try {
        const raw = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(raw) ? raw : [];
    } catch {
        return [];
    }
}

function getCart() {
    return readStored("decayba_cart").filter(i => i && PRODUCTS[i.id]);
}
function saveCart(cart) {
    localStorage.setItem("decayba_cart", JSON.stringify(cart));
    updateBadges(true);
}
// "note" es el dato de personalizacion (por ahora, el nombre de la
// mascota). Viaja con el producto hasta el mensaje de WhatsApp, para no
// tener que preguntarlo despues en el chat.
function addToCart(id, note = "") {
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    const max = maxQtyFor(id);
    if (item) {
        if (item.qty < max) item.qty += 1;
        if (note) item.note = note;
    } else {
        cart.push(note ? { id, qty: 1, note } : { id, qty: 1 });
    }
    saveCart(cart);
}
function setQty(id, qty) {
    let cart = getCart();
    qty = Math.min(qty, maxQtyFor(id));
    if (qty <= 0) cart = cart.filter(i => i.id !== id);
    else {
        const item = cart.find(i => i.id === id);
        if (item) item.qty = qty;
    }
    saveCart(cart);
    renderCart();
}

function getFavorites() {
    return readStored("decayba_favorites").filter(id => PRODUCTS[id]);
}
function saveFavorites(favs) {
    localStorage.setItem("decayba_favorites", JSON.stringify(favs));
    updateBadges(true);
}
function toggleFavorite(id) {
    let favs = getFavorites();
    const active = favs.includes(id);
    favs = active ? favs.filter(f => f !== id) : [...favs, id];
    saveFavorites(favs);
    return !active;
}

function bump(el) {
    if (!el) return;
    el.classList.remove("bump");
    void el.offsetWidth; // reinicia la animación aunque se dispare seguido
    el.classList.add("bump");
}

function updateBadges(animate = false) {
    const cartCount = getCart().reduce((sum, i) => sum + i.qty, 0);
    const favCount = getFavorites().length;

    document.querySelectorAll(".cart-badge").forEach(b => {
        b.textContent = cartCount;
        b.classList.toggle("show", cartCount > 0);
        if (animate) bump(b);
    });
    document.querySelectorAll(".fav-badge").forEach(b => {
        b.textContent = favCount;
        b.classList.toggle("show", favCount > 0);
        if (animate) bump(b);
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
            const max = maxQtyFor(item.id);
            const atMax = item.qty >= max;
            const maxNote = p.stock !== undefined ? "Última unidad disponible" : "Cantidad máxima por pedido";
            return `
                <div class="cart-item">
                    <img src="${p.cover}" alt="${p.name}">
                    <div class="cart-item-info">
                        <h4>${p.name}</h4>
                        <span>${money(p.price)}</span>
                        ${item.note ? `<small class="cart-item-note">Para: ${item.note}</small>` : ""}
                        <div class="qty-control">
                            <button class="qty-btn" data-id="${item.id}" data-delta="-1">-</button>
                            <span>${item.qty}</span>
                            <button class="qty-btn" data-id="${item.id}" data-delta="1" ${atMax ? "disabled" : ""}>+</button>
                        </div>
                        ${atMax ? `<small class="qty-max-note">${maxNote}</small>` : ""}
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
            const lines = cart.map(i => {
                const p = PRODUCTS[i.id];
                const imgUrl = p?.cover ? new URL(p.cover, window.location.href).href : "";
                const nota = i.note ? `\n  Nombre: ${i.note}` : "";
                return `- ${p?.name} x${i.qty} (${money((p?.price || 0) * i.qty)})${nota}\n${imgUrl}`;
            });
            const text = `Hola Decayba, quiero pedir:\n${lines.join("\n\n")}\n\nTotal: ${money(total)}`;
            waLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
        }
    }
}

// Fila compacta de producto: la comparten favoritos y el buscador.
// Marca los agotados, que antes salian igual que los disponibles.
function miniRow(id) {
    const p = PRODUCTS[id];
    if (!p) return "";
    const estado = p.soldOut
        ? `<span class="mini-sold-out">Agotado</span>`
        : `<span>${money(p.price)}</span>`;
    return `
            <a class="fav-item${p.soldOut ? " is-sold-out" : ""}" href="${productUrl(id)}">
                <img src="${p.cover}" alt="${p.name}">
                <div class="cart-item-info">
                    <h4>${p.name}</h4>
                    ${estado}
                </div>
            </a>`;
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

    wrap.innerHTML = favs.map(miniRow).join("");
}

function openDrawer(panel, backdrop) {
    panel?.classList.add("active");
    backdrop?.classList.add("active");
}
function closeDrawers() {
    document.querySelectorAll(".side-drawer, .drawer-backdrop").forEach(el => el.classList.remove("active"));
}

// BUSCADOR
const DIACRITICS_RE = new RegExp("[̀-ͯ]", "g");
const normalize = (s) => (s || "").toString().normalize("NFD").replace(DIACRITICS_RE, "").toLowerCase();

function renderSearchResults(query) {
    const wrap = document.querySelector("#search-results");
    if (!wrap) return;

    const q = normalize(query.trim());

    if (!q) {
        wrap.innerHTML = "<p class='empty-msg'>Escribe para buscar productos.</p>";
        return;
    }

    const matches = Object.keys(PRODUCTS).filter(id => {
        const p = PRODUCTS[id];
        return normalize(p.name).includes(q) || normalize(p.description).includes(q);
    });

    if (matches.length === 0) {
        wrap.innerHTML = "<p class='empty-msg'>No encontramos productos para tu búsqueda.</p>";
        return;
    }

    wrap.innerHTML = matches.map(miniRow).join("");
}

document.addEventListener("DOMContentLoaded", () => {
    updateBadges();
    renderCart();
    renderFavorites();

    const cartDrawer = document.querySelector("#cart-drawer");
    const favDrawer = document.querySelector("#fav-drawer");
    const searchDrawer = document.querySelector("#search-drawer");
    const searchInput = document.querySelector("#search-input");
    const backdrop = document.querySelector(".drawer-backdrop");

    document.querySelector(".icon-cart")?.addEventListener("click", () => {
        renderCart();
        openDrawer(cartDrawer, backdrop);
    });
    document.querySelector(".icon-fav")?.addEventListener("click", () => {
        renderFavorites();
        openDrawer(favDrawer, backdrop);
    });
    document.querySelector(".icon-search")?.addEventListener("click", () => {
        renderSearchResults(searchInput ? searchInput.value : "");
        openDrawer(searchDrawer, backdrop);
        searchInput?.focus();
    });
    searchInput?.addEventListener("input", () => renderSearchResults(searchInput.value));
    document.querySelectorAll(".drawer-close").forEach(btn => btn.addEventListener("click", closeDrawers));
    backdrop?.addEventListener("click", closeDrawers);

    // Delegados en document: funcionan tambien con tarjetas creadas por JS (ej. productos.html)

    // Click en cualquier parte de la tarjeta -> ir al detalle
    // (salvo botones/links propios, que ya manejan su propia navegación)
    document.addEventListener("click", (e) => {
        if (e.target.closest(".fav-btn, .add-cart-btn, a")) return;
        const card = e.target.closest("[data-href]");
        if (card) window.location.href = card.dataset.href;
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
        btn.classList.add("added");
        setTimeout(() => {
            btn.textContent = original;
            btn.classList.remove("added");
        }, 1200);
    });

    // Favoritos
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".fav-btn");
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(btn.dataset.id);
        btn.classList.remove("pop");
        void btn.offsetWidth;
        btn.classList.add("pop");
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
