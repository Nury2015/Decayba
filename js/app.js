// HEADER: sombra al hacer scroll
const header = document.querySelector('header');

function toggleHeaderShadow() {
    if (!header) return;
    header.classList.toggle('active', window.scrollY > 50);
}

toggleHeaderShadow();
window.addEventListener('scroll', toggleHeaderShadow);

// MENÚ MÓVIL
const menuBtn = document.querySelector('.menu');
const nav = document.querySelector('nav');
const backdrop = document.querySelector('.menu-backdrop');

function closeMenu() {
    nav?.classList.remove('active');
    backdrop?.classList.remove('active');
    menuBtn?.classList.replace('fa-xmark', 'fa-bars');
    document.querySelectorAll('.has-submenu.open').forEach(el => el.classList.remove('open'));
}

function toggleMenu() {
    const isOpen = nav?.classList.toggle('active');
    backdrop?.classList.toggle('active', isOpen);
    menuBtn?.classList.toggle('fa-bars', !isOpen);
    menuBtn?.classList.toggle('fa-xmark', isOpen);
}

menuBtn?.addEventListener('click', toggleMenu);
backdrop?.addEventListener('click', closeMenu);
document.querySelector('#nav-close')?.addEventListener('click', closeMenu);
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

// SUBMENÚ "CATEGORÍAS" (dropdown en desktop, acordeón en mobile)
document.querySelectorAll('.has-submenu > .submenu-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const parent = toggle.closest('.has-submenu');
        const isOpen = parent.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen);
    });
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.has-submenu')) {
        document.querySelectorAll('.has-submenu.open').forEach(el => el.classList.remove('open'));
    }
});

// BOTÓN VOLVER ARRIBA
const topBtn = document.querySelector('#top');

function toggleTopButton() {
    topBtn?.classList.toggle('active', window.scrollY > 400);
}

toggleTopButton();
window.addEventListener('scroll', toggleTopButton);
topBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// Tarjeta de producto del home, igual a las que estan escritas a mano
// en index.html. Se arma desde PRODUCTS para que el nombre y el precio
// nunca queden desfasados.
function productCardHtml(id) {
    const p = PRODUCTS[id];
    if (!p) return '';

    const cardVideo = productVideos(p)[0]?.src;

    const videoTag = cardVideo
        ? `<video src="${cardVideo}" poster="${p.cover}" muted loop playsinline preload="metadata"></video>
               <span class="play-icon"><i class="fa-solid fa-play"></i></span>`
        : '';

    return `
            <article class="product" data-id="${id}" data-href="producto.html?id=${id}">

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
}

// Reproducir el video al pasar el mouse. Hay que volver a llamarla cada vez
// que se agregan tarjetas nuevas: los listeners no se heredan y antes las
// tarjetas de "Ver más productos" se quedaban sin video.
function wireHoverVideos(root = document) {
    root.querySelectorAll('.product-media').forEach(media => {
        const video = media.querySelector('video');
        if (!video || media.dataset.hoverReady) return;
        media.dataset.hoverReady = '1';

        media.addEventListener('mouseenter', () => video.play().catch(() => { }));
        media.addEventListener('mouseleave', () => {
            video.pause();
            video.currentTime = 0;
        });
    });
}

// "PARA REGALAR" en home: productos que ya existen, agrupados como ideas
// de regalo. Los ids salen del data-ids de la seccion en index.html.
const giftGrid = document.querySelector('#gift-grid');

if (giftGrid) {
    const ids = (giftGrid.dataset.ids || '').split(',').map(s => s.trim()).filter(id => PRODUCTS[id]);

    if (ids.length) {
        giftGrid.innerHTML = ids.map(productCardHtml).join('');
        wireHoverVideos(giftGrid);
    } else {
        // Sin productos validos la seccion quedaria vacia con solo el titulo
        giftGrid.closest('section')?.remove();
    }
}

// "VER MÁS PRODUCTOS" en home: agrega más tarjetas sin salir de la página
const loadMoreBtn = document.querySelector('#load-more-products');

loadMoreBtn?.addEventListener('click', () => {
    const grid = document.querySelector('#productos .products-grid');
    const ids = (loadMoreBtn.dataset.ids || '').split(',').filter(Boolean);

    grid?.insertAdjacentHTML('beforeend', ids.map(productCardHtml).join(''));
    wireHoverVideos(grid);
    updateBadges();
    loadMoreBtn.remove();
});

// PREGUNTAS FRECUENTES (acordeón)
document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.faq-item').classList.toggle('open');
    });
});

// ZOOM en las capturas de testimonios
const tmLightbox = document.querySelector('#tm-lightbox');

if (tmLightbox) {
    const tmLightboxImg = document.querySelector('#tm-lightbox-img');
    const tmShots = Array.from(document.querySelectorAll('.testimonial-shot img'));
    let tmIndex = 0;

    function openTmLightbox(index) {
        tmIndex = (index + tmShots.length) % tmShots.length;
        tmLightboxImg.src = tmShots[tmIndex].src;
        tmLightboxImg.alt = tmShots[tmIndex].alt;
        tmLightbox.classList.add('active');
    }
    function closeTmLightbox() {
        tmLightbox.classList.remove('active');
    }

    tmShots.forEach((img, i) => {
        img.closest('.testimonial-shot').style.cursor = 'zoom-in';
        img.closest('.testimonial-shot').addEventListener('click', () => openTmLightbox(i));
    });

    tmLightbox.addEventListener('click', (e) => {
        if (e.target !== tmLightboxImg) closeTmLightbox();
    });
    document.querySelector('#tm-lightbox-close')?.addEventListener('click', closeTmLightbox);
    document.querySelector('#tm-lightbox-prev')?.addEventListener('click', (e) => {
        e.stopPropagation();
        openTmLightbox(tmIndex - 1);
    });
    document.querySelector('#tm-lightbox-next')?.addEventListener('click', (e) => {
        e.stopPropagation();
        openTmLightbox(tmIndex + 1);
    });
    document.addEventListener('keydown', (e) => {
        if (!tmLightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeTmLightbox();
        if (e.key === 'ArrowLeft') openTmLightbox(tmIndex - 1);
        if (e.key === 'ArrowRight') openTmLightbox(tmIndex + 1);
    });
}

// ANIMACIÓN DE APARICIÓN AL HACER SCROLL
const fadeEls = document.querySelectorAll('.fade');

const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
            fadeObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

fadeEls.forEach(el => fadeObserver.observe(el));

// VIDEO DE PRODUCTO: reproducir al pasar el mouse
wireHoverVideos();
