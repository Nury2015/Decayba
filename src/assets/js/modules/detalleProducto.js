export function verDetalleProducto(producto) {
    producto.imagenes = Array.isArray(producto.imgs)
      ? producto.imgs
      : producto.imgs.split(",");
    localStorage.setItem("productoSeleccionado", JSON.stringify(producto));
    const rutaFinal = "/Decayba/src/pages/product/detalleprod.html" 
    window.location.href = rutaFinal;
    
  }
  