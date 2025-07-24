export function mostrarToast(mensaje, tipo = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = mensaje;
    toast.className = `toast show ${tipo}`;
  
    setTimeout(() => {
      toast.className = "toast";
    }, 3000);
  }