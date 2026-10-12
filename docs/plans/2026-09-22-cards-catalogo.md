# Rediseño de cards del catálogo — Plan de implementación

> **For agentic workers:** Implement directly in the current `Matias` branch. No automated tests or validation pass should be created or run, per explicit user instruction.

**Goal:** Rediseñar las cards del catálogo público con jerarquía e-commerce, colores GRG, círculos de color, resumen/modal de cuotas y CTA de WhatsApp con plan seleccionado.

**Architecture:** Mantener la API y el flujo de filtros existentes. Consolidar el CSS duplicado de las cards, renderizar el markup desde `catalogo.js`, y agregar un modal estático accesible en la vista para que JavaScript solo gestione datos, selección y eventos.

**Tech Stack:** ASP.NET Core existente, HTML, CSS custom, JavaScript vanilla, Bootstrap Icons ya cargado.

**Assumptions:** El API actual expone `productoID`, `categoria`, `nombre`, `estado`, `precioARS`, `precioUSD`, `disponible`, `imagenUrl`, `colores` y `cuotas`; no expone especificaciones reales ni un indicador `sinInteres`, por lo que no se inventan.

## Archivos

- Modify: `wwwroot/js/catalogo.js` — render de card, normalización visual, selección de cuotas, modal, WhatsApp y delegación de eventos.
- Modify: `wwwroot/css/catalogo.css` — tokens GRG, un único bloque de cards, estados, swatches, modal y responsive.
- Modify: `wwwroot/views/Catalogo/catalogo.html` — estructura semántica del modal de planes.

## Tareas

### Task 1: Consolidar el sistema visual de cards

**Files:**
- Modify: `wwwroot/css/catalogo.css`

- [ ] Reemplazar los dos bloques contradictorios de cards por un único bloque con tokens naranja GRG, grid máximo de 1400px, 4 columnas desktop, 3 tablet y 1 mobile.
- [ ] Mantener la card como flex-column con cuerpo flexible, imagen 4:3 con margen interior y placeholder genérico.
- [ ] Agregar estilos para especificaciones, círculos de color, expansión, botón `Ver planes`, financiación, CTA WhatsApp, estado no disponible y modal.
- [ ] Conservar accesibilidad de focus, touch targets y `prefers-reduced-motion`.

### Task 2: Refactorizar el markup y el estado de las cards

**Files:**
- Modify: `wwwroot/js/catalogo.js`

- [ ] Introducir `planesSeleccionados` indexado por ID real del producto y helpers para IDs, cuotas, colores, especificaciones, moneda y mensajes.
- [ ] Cambiar el fallback de imagen por un placeholder genérico y mantener `object-fit: cover`.
- [ ] Renderizar nombre completo, categoría en mayúsculas, estado semántico, especificaciones solo con datos presentes, máximo cuatro swatches, precios y resumen de primera cuota.
- [ ] Renderizar `Ver planes` solo cuando existan cuotas y construir el CTA WhatsApp desde el estado actual.

### Task 3: Agregar interacción de colores, cuotas y WhatsApp

**Files:**
- Modify: `wwwroot/js/catalogo.js`

- [ ] Usar delegación de eventos desde el grid para expansión de colores y apertura del modal, sin listeners duplicados tras cada render.
- [ ] Poblar el modal con todas las cuotas reales, permitir una sola selección y reflejarla en el enlace WhatsApp de la card.
- [ ] Implementar cierre por X, Escape y backdrop, foco inicial y retorno del foco al elemento que abrió el modal.

### Task 4: Integrar el modal semántico en la vista

**Files:**
- Modify: `wwwroot/views/Catalogo/catalogo.html`

- [ ] Agregar el contenedor modal oculto con `role="dialog"`, `aria-modal`, título, lista de planes, botón de cierre y región de estado.

## Verificación

No ejecutar tests, linters, builds, validaciones automáticas ni auditorías adicionales; el usuario solicitó implementación directa sin tests ni validaciones.
