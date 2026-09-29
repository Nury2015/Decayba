/*
 * La regla del título y la descripción para Google, en un solo sitio.
 *
 * La usan build-productos.js (que las escribe en cada página) y revisar.js
 * (que comprueba que ninguna página quedó con el nombre viejo). Cuando esto
 * vivía en los dos archivos, cambiar la regla en uno dejaba al otro dando
 * falsas alarmas.
 */

// Lo que la clienta escribe en Google es "album" y "mascotas", así que el
// título lo tiene que decir. Pero NO todo el catálogo es de mascotas: la
// agenda de agradecimiento, el álbum viajero y el cuaderno no lo son, y
// pegarles el gancho sería anunciar lo que el producto no es.
const CATEGORIAS_MASCOTA = new Set([
    'album-personalizado', 'album-generico', 'juguetes', 'aseo'
]);

// Varios productos ya lo dicen en el nombre ("Peluche para Perro") y
// repetirlo suena mal, así que el gancho solo entra cuando falta.
const YA_LO_DICE = /mascota|perro|cachorr|canin/i;

const CIUDAD = 'Popayán';
const COLA_SEO = `Envío gratis a toda Colombia. Decayba, ${CIUDAD}.`;

function esDeMascota(p) {
    return CATEGORIAS_MASCOTA.has(p.category) && !YA_LO_DICE.test(p.name);
}

function tituloSeo(p) {
    return `${p.name}${esDeMascota(p) ? ' para Mascotas' : ''} | Decayba`;
}

// Google corta la descripción cerca de los 160 caracteres. La cola lleva la
// ciudad y el envío, que es lo que la clienta quiere confirmar antes de
// entrar, así que se recorta la del producto para que la cola siempre quepa.
function recortar(texto, max) {
    if (texto.length <= max) return texto;
    const corte = texto.slice(0, max);
    return corte.slice(0, corte.lastIndexOf(' ')).replace(/[\s,;:.—-]+$/, '') + '…';
}

function descripcionSeo(p) {
    return `${recortar(p.description, 158 - COLA_SEO.length)} ${COLA_SEO}`;
}

// El texto alternativo de una foto: lo que lee Google Imágenes para saber
// qué hay en ella, y lo que oye quien navega con lector de pantalla. Antes
// era solo el nombre del producto, que no dice "mascota" por ningún lado.
// Si el archivo se llama portada o contraportada, también se dice: es
// gratis y le da a Google una foto más concreta que indexar.
function altSeo(p, src) {
    let cara = '';
    if (src && /contraportada/i.test(src)) cara = ', contraportada';
    else if (src && /portada/i.test(src)) cara = ', portada';
    return `${p.name}${esDeMascota(p) ? ' para mascota' : ''}${cara}`;
}

// Este archivo lo usan los dos lados: node (build-productos.js y
// revisar.js) y el navegador, que lo carga como <script> para armar los
// textos alt. En el navegador no existe "module", por eso se comprueba.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CIUDAD, COLA_SEO, esDeMascota, tituloSeo, descripcionSeo, altSeo, recortar };
}
