# Rediseño de cards del catálogo — Diseño

## Objetivo

Actualizar exclusivamente las cards de productos del catálogo público para que funcionen como una ficha de e-commerce tecnológico moderna, manteniendo la arquitectura ASP.NET + JavaScript actual y los datos reales entregados por `GET /api/productos`.

## Dirección visual

- Estilo: e-commerce tecnológico luminoso, limpio y espacioso, con una retícula estable y jerarquía tipo Swiss modernism.
- Tipografía: Plus Jakarta Sans, ya utilizada por el catálogo.
- Acento GRG: `#e55425` para categoría, precio ARS, financiación, focus e interacciones.
- Semánticos: verde existente para WhatsApp, verde suave para Sellado y azul neutro para Seminuevo.
- Superficies: card blanca, fondo neutro, bordes finos, radio aproximado de 18px y sombras de baja intensidad.
- Movimiento: elevación sutil de la card, transiciones de 150–250ms y respeto de `prefers-reduced-motion`.

## Alternativas consideradas

1. **Refactor localizado en los archivos actuales (elegida).** Consolidar los estilos duplicados de cards en `wwwroot/css/catalogo.css`, refactorizar `crearCardProducto()` y sus auxiliares en `wwwroot/js/catalogo.js`, y agregar el modal semántico en `wwwroot/views/Catalogo/catalogo.html`. Minimiza el blast radius y conserva los filtros, estados de carga y API existentes.
2. **Crear un componente o partial separado para la card.** Haría más modular el markup, pero la vista actual no tiene un sistema de componentes y agregaría coordinación innecesaria para una sola sección dinámica.
3. **Extender primero el backend con especificaciones.** No corresponde al alcance actual: el modelo y el DTO no tienen especificaciones reales, y el handoff indica no crear campos ni migraciones para imitar la referencia.

## Arquitectura y flujo

1. `catalogo.js` seguirá obteniendo y filtrando productos desde la API.
2. `crearCardProducto(producto)` generará una card con imagen 4:3, categoría, nombre completo, especificaciones solo si existen, estado, círculos de colores, precios, resumen de cuotas y CTA.
3. Una función centralizada mapeará nombres de colores comunes y comerciales a valores CSS seguros, con fallback neutro y `title`/`aria-label` por círculo.
4. La selección de cuotas se guardará en `planesSeleccionados`, un `Map` indexado por el ID real del producto. Se conservará aunque el catálogo se vuelva a renderizar por filtros.
5. Los botones `Ver planes`, expansión de colores y WhatsApp usarán delegación de eventos desde el grid o listeners únicos sobre el modal; no se registrarán listeners por cada render.
6. El modal mostrará todas las cuotas reales, una sola selección por producto, cierre por X, Escape y backdrop, y devolverá el foco al elemento que lo abrió.
7. El enlace de WhatsApp se construirá con el nombre, precio y, si existe, el plan seleccionado; siempre usará `https://wa.me/?text=...` sin inventar un número.

## Contrato visual y responsive

- Grid centrado con máximo de 1400px: 4 cards en desktop, 3 en tablet y 1 en mobile cuando no haya ancho suficiente para dos.
- La imagen tendrá margen interior, fondo gris claro, `aspect-ratio: 4 / 3`, `object-fit: cover` y `object-position: center`.
- El placeholder será genérico y consistente, sin iconos por categoría.
- El cuerpo será flex-column; financiación y CTA usarán `margin-top: auto`/altura de fila para alinear el cierre de las cards.
- Los nombres nunca se truncarán con ellipsis.
- Se mostrarán hasta cuatro círculos de color; los restantes aparecerán como `+N colores` y podrán expandirse con hover/focus en desktop y tap en touch.
- El modal será blanco, accesible y responsive sin dependencias nuevas.

## Límites y manejo de datos

- No se agregan favoritos, descuentos, rating, carrito, promociones ni lógica de “mejor plan”.
- No se mostrará “sin interés” porque el API no expone un atributo confiable.
- Si no hay cuotas, se mostrará “Financiación / Consultar alternativas disponibles” y no habrá botón `Ver planes`.
- Si el producto no está disponible, se conserva `No disponible ahora` en lugar del CTA.
- Si falta una imagen o falla, se muestra `Imagen no disponible` dentro del mismo marco 4:3.
- Las especificaciones se leerán únicamente de campos existentes si aparecieran en una respuesta futura; sin datos no se mostrará fila vacía, `N/A` ni guiones.
- Todo valor proveniente del API seguirá escapándose antes de entrar en HTML.

## Fallos posibles y cobertura

1. **API sin cuotas, colores o imagen:** la card degrada a sus estados explícitos; no se abre un modal vacío y la imagen conserva proporción.
2. **Nombres comerciales o desconocidos de colores:** se normalizan acentos/casing, se mapean nombres conocidos y se usa un círculo neutro como fallback; el nombre original permanece accesible.
3. **Re-render por filtros después de elegir un plan:** la selección permanece en memoria indexada por `productoID` y se reaplica al enlace de WhatsApp cuando el producto vuelve a aparecer.

## Verificación

No se crearán ni ejecutarán tests automatizados, según el requisito del usuario. La validación será proporcional al alcance: inspección del diff, escaneo de stubs, compilación de la aplicación y revisión visual/interactiva del catálogo en los breakpoints relevantes si el entorno local permite levantarlo.

## No incluidos

- Cambios de modelo, DTO, controlador, base de datos o migraciones.
- Rediseño de hero, filtros, header, navbar, footer u otras vistas.
- Número de WhatsApp hardcodeado.
