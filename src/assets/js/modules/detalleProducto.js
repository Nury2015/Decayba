export function verDetalleProducto(producto) {
    producto.imagenes = Array.isArray(producto.imgs)
      ? producto.imgs
      : producto.imgs.split(",");
    localStorage.setItem("productoSeleccionado", JSON.stringify(producto));
     const ruta = window.location.pathname;
    const rutaFinal = (ruta.includes("index.html") || ruta === "/" || ruta.includes("Decayba")) ? 
          "./src/pages/product/detalleprod.html" : "../../pages/product/detalleprod.html";
    window.location.href = rutaFinal;
    
  }
  