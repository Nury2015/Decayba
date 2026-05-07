# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DECAYBA is a static HTML/CSS/JavaScript e-commerce store for pet supplies (and other items) based in Colombia. There is no build system, bundler, or package manager — everything is vanilla browser code.

## Running Locally

Use the **VS Code Live Server** extension. The server must be started from the **parent directory** of this repo (i.e., the folder that contains `decayba/`) so that the absolute path prefix `/Decayba/` resolves correctly. Live Server port is configured in `.vscode/settings.json` (currently has merge conflicts — resolve to a single port, e.g. `5501`).

Opening `index.html` directly in a browser will not work: ES module imports and `fetch()` calls for HTML components both require an HTTP server.

## Path Prefix Convention

All absolute asset and module paths use the prefix `/Decayba/` (e.g., `/Decayba/src/assets/img/...`). This matches the GitHub Pages deployment URL structure (`username.github.io/Decayba/`). When editing paths, always use this prefix for absolute references in inner pages and modules.

## Architecture

**Data layer** — `src/services/productos.js` is the single source of truth for the product catalog: a static exported array of product objects. Each product has `nombre`, `valor` (price string like `"$35.000"`), `descripcion`, `stock` (number or object for color variants), `categoria`, `imagen` (primary image), and `imgs` (array of gallery images). Adding a product means pushing to this array. The array is also saved to `localStorage.productosDisponibles` on load.

**Cart** — persisted entirely in `localStorage` under the key `"carrito"` as a JSON array of `{nombre, precio, cantidad, img}`. The live cart state lives in the exported `carrito` array in `src/assets/js/modules/carrito.js`. Key exports:
- `agregarAlCarrito(nombre, precio, img, cantidad)` — adds/increments and validates against stock
- `actualizarCarritoVisual()` — updates the cart count badge in the header
- `renderCart2()` — renders the aside cart panel (homepage/detail page)

**Product rendering** — `src/assets/js/modules/renderCart.js` renders the product grid (`#card-container`) from the `productos` array. It attaches add-to-cart click handlers and triggers the fly-to-cart animation.

**Product detail** — clicking a product calls `verDetalleProducto(producto)` (defined in `src/assets/js/modules/detalleProducto.js`), which serializes the product to `localStorage.productoSeleccionado` and navigates to `src/pages/product/detalleprod.html`. That page reads the product back from localStorage on load.

**Header loading** — headers are HTML fragments fetched at runtime via `fetch()`:
- `src/components/header.html` — used on the homepage (`index.html`)
- `src/components/headerglobal.html` — used on inner pages (product detail, cart, category pages)

Each page's inline `<script type="module">` orchestrates initialization: load header → load mobile menu → import and run JS modules in order.

**Checkout** — no payment integration. The cart page generates a WhatsApp message with order details and opens `https://api.whatsapp.com/send?phone=573154380079&text=...`.

## Known Issues

There are unresolved **git merge conflicts** in:
- `src/services/productos.js` (stray `console.log()` in conflict markers at the top)
- `src/assets/js/modules/carrito.js` (in `actualizarCarritoVisual` — HEAD version removes debug `console.log` calls)
- `.vscode/settings.json` (duplicate Live Server port definitions)

Resolve these by accepting the HEAD version in all three files and removing the conflict markers.

## Adding or Modifying Products

Edit the `productos` array in `src/services/productos.js`. Stock can be:
- A number (`stock: 5`) for simple availability
- An object keyed by color/variant (`stock: { naranja: 0, rojo: 2 }`) for variant products

Category values in use: `"mascotas"`, `"viajes"`.
