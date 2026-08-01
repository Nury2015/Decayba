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
}

function toggleMenu() {
    const isOpen = nav?.classList.toggle('active');
    backdrop?.classList.toggle('active', isOpen);
    menuBtn?.classList.toggle('fa-bars', !isOpen);
    menuBtn?.classList.toggle('fa-xmark', isOpen);
}

menuBtn?.addEventListener('click', toggleMenu);
backdrop?.addEventListener('click', closeMenu);
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

// BOTÓN VOLVER ARRIBA
const topBtn = document.querySelector('#top');

function toggleTopButton() {
    topBtn?.classList.toggle('active', window.scrollY > 400);
}

toggleTopButton();
window.addEventListener('scroll', toggleTopButton);
topBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

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

// COLECCIÓN: video de "cómo pasar las vacunas"
const vacunasBtn = document.querySelector('#btn-vacunas-video');
const collectionVideo = document.querySelector('#collection-video');

vacunasBtn?.addEventListener('click', () => {
    if (!collectionVideo) return;
    collectionVideo.src = vacunasBtn.dataset.video;
    collectionVideo.poster = vacunasBtn.dataset.poster;
    collectionVideo.load();
    collectionVideo.play();
});

// VIDEO DE PRODUCTO: reproducir al pasar el mouse
document.querySelectorAll('.product-media').forEach(media => {
    const video = media.querySelector('video');
    if (!video) return;

    media.addEventListener('mouseenter', () => video.play());
    media.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
    });
});
