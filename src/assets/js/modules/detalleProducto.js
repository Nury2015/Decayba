export function verDetalleProducto(producto) {
    producto.imagenes = Array.isArray(producto.imgs)
      ? producto.imgs
      : producto.imgs.split(",");
    localStorage.setItem("productoSeleccionado", JSON.stringify(producto));
    window.location.href = "./src/pages/product/detalleprod.html";
  }
  