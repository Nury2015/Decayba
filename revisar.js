/*
 * Revisa la tienda antes de subir cambios:
 *
 *     node revisar.js
 *
 * Busca los errores que no se ven hasta que un cliente se topa con ellos:
 * fotos que no existen, enlaces rotos, precios que no coinciden, páginas de
 * producto desactualizadas, y el menú o el pie de página distintos entre una
 * página y otra (el header y el pie están copiados en cada archivo, así fue
 * como el link de Instagram quedó malo en los cinco a la vez).
 *
 * Si algo sale con ✗, arréglalo antes de subir.
 */

const fs = require('fs');
const vm = require('vm');

const PAGINAS = ['index.html', 'productos.html', 'producto.html', 'nosotros.html', 'terminos.html'];

let problemas = 0;
const fallo = (...a) => { console.log('  ✗', ...a); problemas++; };
const titulo = (t) => console.log('\n' + t);

// --- Catálogo ---
const sb = {};
vm.runInNewContext(
    fs.readFileSync('js/products.js', 'utf8') + ';this.P=PRODUCTS;this.U=productUrl;this.V=productVideos;',
    sb
);
const { P, U, V } = sb;

// --- 1. Que exista cada foto y cada video del catálogo ---
titulo('Archivos del catálogo');
for (const [id, p] of Object.entries(P)) {
    for (const x of [p.cover, ...(p.gallery || [])])
        if (!fs.existsSync(x)) fallo(id, '-> no existe', x);
    for (const v of V(p))
        if (!fs.existsSync(v.src)) fallo(id, '-> no existe', v.src);
}
console.log(`  ${Object.keys(P).length} productos revisados`);

// --- 2. Una página por producto, al día ---
titulo('Páginas de producto');
let desactualizadas = 0;
for (const [id, p] of Object.entries(P)) {
    const f = U(id);
    if (!fs.existsSync(f)) { fallo('falta', f, '- corre: node build-productos.js'); continue; }
    const s = fs.readFileSync(f, 'utf8');
    // El nombre guardado en la vista previa tiene que ser el nombre de hoy
    if (!s.includes(`content="${p.name.replace(/&/g, '&amp;')} | Decayba"`)) {
        fallo(f, 'quedó con otro nombre - corre: node build-productos.js');
        desactualizadas++;
    }
    if (!fs.existsSync(`img/og/${id}.jpg`)) fallo('falta la imagen de vista previa img/og/' + id + '.jpg');
}
if (!desactualizadas) console.log(`  ${Object.keys(P).length} páginas al día`);

// --- 3. Rutas rotas dentro de los HTML ---
titulo('Enlaces y archivos de las páginas');
const todos = [...PAGINAS, ...Object.keys(P).map(U)].filter(f => fs.existsSync(f));
let rotas = 0;
for (const f of todos) {
    const s = fs.readFileSync(f, 'utf8');
    for (const m of s.matchAll(/(?:src|href|poster)="(?!http|#|mailto|tel|data:)([^"?]+\.(?:css|js|webp|png|jpg|jpeg|mp4|html|xml|ico))/g))
        if (!fs.existsSync(m[1])) { fallo(f, '->', m[1]); rotas++; }
    if (/(?:href|data-href)="producto\.html\?id=/.test(s))
        fallo(f, 'usa el formato viejo producto.html?id=...');
}
if (!rotas) console.log(`  ${todos.length} páginas sin rutas rotas`);

// --- 4. Precios y nombres escritos a mano en el inicio ---
titulo('Tarjetas escritas a mano en index.html');
const idx = fs.readFileSync('index.html', 'utf8');
let tarjetas = 0;
for (const m of idx.matchAll(/<article class="product"[^>]*data-id="([^"]+)"[\s\S]*?<h3>([^<]+)<\/h3>[\s\S]*?<span>\s*\$([\d.]+)\s*<\/span>/g)) {
    const [, id, nombre, precio] = m;
    tarjetas++;
    if (!P[id]) { fallo('producto que no existe:', id); continue; }
    if (P[id].name.trim() !== nombre.trim()) fallo(id, 'nombre: index dice', `"${nombre.trim()}"`, 'y products.js dice', `"${P[id].name}"`);
    if (P[id].price !== parseInt(precio.replace(/\./g, ''), 10)) fallo(id, 'precio: index dice', precio, 'y products.js dice', P[id].price);
}
console.log(`  ${tarjetas} tarjetas revisadas`);

// --- 5. Menú y pie iguales en todas las páginas ---
// Están copiados archivo por archivo, así que se desincronizan sin avisar.
titulo('Menú y pie de página iguales en todas');

const sacar = (s, re) => [...s.matchAll(re)].map(m => m[1]);
const referencia = {};

for (const f of PAGINAS) {
    if (!fs.existsSync(f)) continue;
    const s = fs.readFileSync(f, 'utf8');
    const esInicio = f === 'index.html';

    const datos = {
        // los enlaces del menú, normalizados: desde el inicio son "#x" y
        // desde las demás "index.html#x", pero apuntan al mismo lado
        menu: sacar(s, /<li><a href="([^"]+)">/g)
            .map(h => h.replace(/^index\.html/, '').replace(/^(?=#)/, ''))
            .filter(h => !h.startsWith('productos.html#cat-')),
        redes: sacar(s, /href="(https:\/\/(?:www\.)?(?:instagram|facebook|tiktok)\.com[^"]*)"/g),
        whatsapp: sacar(s, /href="(https:\/\/wa\.me\/\d+)/g),
        categorias: sacar(s, /href="(productos\.html#cat-[^"]+)"/g),
    };

    for (const [clave, valor] of Object.entries(datos)) {
        const firma = JSON.stringify([...new Set(valor)].sort());
        if (!referencia[clave]) { referencia[clave] = { firma, archivo: f }; continue; }
        if (referencia[clave].firma !== firma) {
            fallo(`"${clave}" no coincide entre ${referencia[clave].archivo} y ${f}`);
            console.log('      ', referencia[clave].archivo + ':', referencia[clave].firma);
            console.log('      ', f + ':', firma);
        }
    }

    // Botón flotante de WhatsApp con mensaje escrito
    const flotante = s.match(/<a href="(https:\/\/wa\.me\/[^"]+)" class="whatsapp-float"/);
    if (!flotante) fallo(f, 'sin botón flotante de WhatsApp');
    else if (!flotante[1].includes('?text=')) fallo(f, 'el botón flotante abre un chat vacío');

    // Accesibilidad de los íconos del encabezado
    if (s.includes('<div class="icon-wrap')) fallo(f, 'los íconos del encabezado son <div>: no sirven con teclado');
    if (!esInicio && !s.includes('rel="canonical"') && !s.includes('content="noindex"')) {
        // informativo, no es error
    }
}
if (!problemas) console.log('  el menú, las redes y el WhatsApp coinciden en las 5 páginas');

// --- 6. Sitemap ---
titulo('Sitemap');
const sm = fs.readFileSync('sitemap.xml', 'utf8');
const locs = sacar(sm, /<loc>https:\/\/decayba\.com\/([^<]*)<\/loc>/g);
for (const l of locs)
    if (l !== '' && !fs.existsSync(l)) fallo('el sitemap apunta a algo que no existe:', l);
const faltan = Object.keys(P).map(U).filter(f => !locs.includes(f));
if (faltan.length) fallo(faltan.length, 'productos sin entrada en el sitemap - corre: node build-productos.js');
else console.log(`  ${locs.length} direcciones, todas válidas`);

// --- Resumen ---
console.log('\n' + '-'.repeat(50));
if (problemas) {
    console.log(`${problemas} cosa(s) por arreglar antes de subir.`);
    process.exit(1);
}
console.log('Todo en orden. Puedes subir.');
