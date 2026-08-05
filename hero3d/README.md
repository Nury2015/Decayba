# Decayba · Hero 3D

Proyecto Vite + React Three Fiber aislado del sitio principal. Se
desarrolla y previsualiza aca; cuando este listo se compila (`npm run
build`) y el bundle resultante se incrusta en la seccion `.hero` del
`index.html` del sitio real (un nivel arriba).

## Desarrollo

```bash
cd hero3d
npm install
npm run dev
```

## Estado

- [x] Paso 1 — escena base: camara, luces, agenda cerrada armada con
      geometrias propias (sin modelos descargados).
- [ ] Paso 2 — useScrollAnimation.js: GSAP ScrollTrigger controlando
      camara + apertura de portada + paso de hojas.
- [ ] Paso 3 — contenido por hoja (texturas: vacunas, fotos, recuerdos,
      cumpleanos, datos de la mascota).
- [ ] Paso 4 — build de produccion + incrustacion en el `index.html`
      principal.

## Estructura

```
src/
  main.jsx              punto de entrada
  App.jsx                layout: canvas sticky + alto de scroll
  components/
    Escena.jsx            <Canvas>, camara, agrupa luces + agenda
    Luces.jsx              rig de iluminacion + sombra de contacto
    Agenda.jsx              ensambla tapas + hojas + lomo espiral
    Portada.jsx              una tapa (pivote en el lomo)
    Pagina.jsx               una hoja (mismo pivote, reutilizable)
  hooks/
    useScrollAnimation.js  GSAP ScrollTrigger (paso 2)
```
