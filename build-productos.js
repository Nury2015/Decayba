/*
 * Genera una página HTML por producto: producto-<id>.html
 *
 * ¿Para qué? producto.html carga el producto con JavaScript (?id=...), pero
 * WhatsApp y Facebook NO ejecutan JavaScript cuando alguien comparte el link:
 * leen el HTML tal cual llega. Por eso, al compartir cualquier producto, la
 * vista previa salía siempre igual ("Producto | Decayba" con el banner del
 * inicio) en vez de la foto y el nombre de ese producto.
 *
 * Estas páginas son copias de producto.html con las etiquetas de vista previa
 * ya escritas, más una imagen de 1200x630 para la miniatura.
 *
 * CUÁNDO VOLVER A CORRERLO: cada vez que agregues, quites o le cambies el
 * nombre, el precio o la portada a un producto en js/products.js.
 *
 *     node build-productos.js
 *
 * Las páginas viejas (producto.html?id=...) siguen funcionando, así que los
 * links que ya compartiste no se rompen.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const SITIO = 'https://decayba.com';
const CREMA = '#faf6ee';
const OG_DIR = path.join('img', 'og');

// --- Cargar el catálogo ---
const sandbox = {};
vm.runInNewContext(
    fs.readFileSync('js/products.js', 'utf8') + ';this.PRODUCTS=PRODUCTS;',
    sandbox
);
const PRODUCTS = sandbox.PRODUCTS;

const plantilla = fs.readFileSync('producto.html', 'utf8');

const escapar = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const pesos = (n) => '$' + n.toLocaleString('es-CO');

// --- Imagen de vista previa: 1200x630, la portada completa sobre el crema ---
// WhatsApp recorta a formato apaisado, así que la portada se encaja entera en
// vez de dejar que la corte. Va en JPG porque WebP no siempre se ve en la
// vista previa de WhatsApp.
function generarImagenOg(id, cover) {
    fs.mkdirSync(OG_DIR, { recursive: true });
    const salida = path.join(OG_DIR, id + '.jpg');

    try {
        execFileSync('ffmpeg', [
            '-v', 'error', '-y',
            '-i', cover,
            '-vf', `scale=1200:630:force_original_aspect_ratio=decrease,pad=1200:630:(ow-iw)/2:(oh-ih)/2:color=${CREMA}`,
            '-q:v', '3',
            salida
        ], { stdio: 'pipe' });
        return salida.replace(/\\/g, '/');
    } catch (e) {
        console.log('  ! no se pudo generar la imagen de', id, '- se usa el banner');
        return null;
    }
}

// --- Generar las páginas ---
const generadas = [];
let conImagen = 0;

for (const [id, p] of Object.entries(PRODUCTS)) {
    const archivo = `producto-${id}.html`;
    const url = `${SITIO}/${archivo}`;

    const ogRelativa = generarImagenOg(id, p.cover);
    if (ogRelativa) conImagen++;
    const imagen = `${SITIO}/${ogRelativa || 'img/hero-banner.webp'}`;

    const titulo = `${p.name} | Decayba`;
    // La descripción de vista previa arranca con el precio: es lo primero que
    // quiere saber quien recibe el link por WhatsApp.
    const desc = `${pesos(p.price)} — ${p.description}`.slice(0, 200);

    let html = plantilla;

    // Marcar de qué producto es, para que producto.js no dependa del ?id=
    html = html.replace('<html lang="es">', `<html lang="es" data-product="${id}">`);

    // producto.html lleva noindex (solo es respaldo de los links viejos);
    // estas páginas sí se deben indexar.
    html = html.replace(/\s*<!-- Esta pagina solo existe[\s\S]*?-->\s*<meta name="robots" content="noindex">/, '');

    html = html.replace(
        /<title>[\s\S]*?<\/title>/,
        `<title>${escapar(titulo)}</title>`
    );
    html = html.replace(
        /<meta name="description" content="[^"]*">/,
        `<meta name="description" content="${escapar(desc)}">`
    );
    html = html.replace(
        /<!-- Nota: estas etiquetas[\s\S]*?-->\s*/,
        '<!-- Generado por build-productos.js. No editar a mano: se reescribe. -->\n    '
    );
    html = html.replace(
        /<meta property="og:type" content="[^"]*">/,
        `<meta property="og:type" content="product">`
    );
    html = html.replace(
        /<meta property="og:title" content="[^"]*">/,
        `<meta property="og:title" content="${escapar(titulo)}">`
    );
    html = html.replace(
        /<meta property="og:description" content="[^"]*">/,
        `<meta property="og:description" content="${escapar(desc)}">`
    );
    html = html.replace(
        /<meta property="og:image" content="[^"]*">/,
        `<meta property="og:image" content="${imagen}">\n    <meta property="og:image:width" content="1200">\n    <meta property="og:image:height" content="630">`
    );
    html = html.replace(
        /<meta property="og:url" content="[^"]*">/,
        `<meta property="og:url" content="${url}">`
    );
    html = html.replace(
        /<meta name="twitter:title" content="[^"]*">/,
        `<meta name="twitter:title" content="${escapar(titulo)}">`
    );
    html = html.replace(
        /<meta name="twitter:description" content="[^"]*">/,
        `<meta name="twitter:description" content="${escapar(desc)}">`
    );
    html = html.replace(
        /<meta name="twitter:image" content="[^"]*">/,
        `<meta name="twitter:image" content="${imagen}">`
    );

    // Una sola dirección buena para cada producto, para que Google no vea
    // producto.html?id=X y producto-X.html como dos páginas repetidas.
    html = html.replace('</head>', `    <link rel="canonical" href="${url}">\n\n</head>`);

    fs.writeFileSync(archivo, html);
    generadas.push({ id, archivo, url, name: p.name });
}

// --- Sitemap ---
const fijas = [
    { loc: `${SITIO}/`, freq: 'weekly', pri: '1.0' },
    { loc: `${SITIO}/productos.html`, freq: 'weekly', pri: '0.9' },
    { loc: `${SITIO}/nosotros.html`, freq: 'monthly', pri: '0.5' },
    { loc: `${SITIO}/terminos.html`, freq: 'yearly', pri: '0.3' },
];

const filas = [
    ...fijas.map(u => `    <url><loc>${u.loc}</loc><changefreq>${u.freq}</changefreq><priority>${u.pri}</priority></url>`),
    ...generadas.map(g => `    <url><loc>${g.url}</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`),
];

fs.writeFileSync('sitemap.xml',
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    filas.join('\n') + '\n' +
    '</urlset>\n'
);

console.log(`\n${generadas.length} páginas de producto generadas`);
console.log(`${conImagen} imágenes de vista previa en ${OG_DIR}/`);
console.log(`sitemap.xml actualizado con ${filas.length} direcciones`);
