export function volarAlCarrito(imgOrigen) {
    const carritoIcono = document.querySelector(".navbar-shopping-cart img");
    const imgRect = imgOrigen.getBoundingClientRect();
    const carritoRect = carritoIcono.getBoundingClientRect();
  
    const imgClone = imgOrigen.cloneNode(true);
    imgClone.classList.add("fly-img");
    document.body.appendChild(imgClone);
    imgClone.style.top = imgRect.top + "px";
    imgClone.style.left = imgRect.left + "px";
    imgClone.offsetWidth;
  
    imgClone.style.transform = `translate(${carritoRect.left - imgRect.left}px, ${carritoRect.top - imgRect.top}px)`;
    imgClone.style.opacity = 0;
  
    setTimeout(() => imgClone.remove(), 700);
  }
  