export function verDetalleProducto(producto) {
  const BASE = window.location.pathname.startsWith('/Decayba') ? '/Decayba' : '';
  producto.imagenes = Array.isArray(producto.imgs)
    ? producto.imgs
    : producto.imgs.split(",");
  localStorage.setItem("productoSeleccionado", JSON.stringify(producto));
  window.location.href = `${BASE}/src/pages/product/detalleprod.html`;
}
