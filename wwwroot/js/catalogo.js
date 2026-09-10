// ============================================================
// JAVASCRIPT CATÁLOGO DEL CLIENTE
// Muestra los servicios organizados por categoría en tarjetas.
//
// Flujo:
//   1. Al cargar la página → fetch GET /api/Servicios/cliente
//   2. Agrupa servicios por categoría en JavaScript
//   3. Renderiza una sección por cada categoría
//   4. Dentro de cada categoría, renderiza tarjetas de servicios
//
// Agrupación:
//   - Un servicio puede tener múltiples categorías
//   - Aparece en TODAS las categorías a las que pertenece
//   - Si no tiene categoría → aparece en "Sin categoría"
//   - Las categorías se ordenan alfabéticamente
//
// Tarjeta de servicio:
//   - Badge de descuento (rojo, esquina superior derecha)
//   - Nombre del servicio
//   - Descripción
//   - Precio original (tachado) + precio final (verde)
//   - Tags de productos asociados
// ============================================================

const API = 'http://localhost:5194/api';

// Al cargar la página, iniciar el catálogo
document.addEventListener('DOMContentLoaded', function () {
    cargarCatalogo();
});

// ==========================================================
// cargarCatalogo()
// Fetch GET /api/Servicios/cliente
// Obtiene servicios activos y visibles, luego los agrupa por categoría
// ==========================================================
async function cargarCatalogo() {
    const resp = await fetch(`${API}/Servicios/cliente`);
    const servicios = await resp.json();
    agruparYRenderizar(servicios);
}

// ==========================================================
// agruparYRenderizar(servicios)
// Agrupa servicios por categoría y renderiza las secciones.
//
// Lógica:
//   1. Crea un objeto vacío categoriasMap = {}
//   2. Para cada servicio:
//      - Si tiene 0 categorías → va a "Sin categoría"
//      - Si tiene N categorías → aparece en cada una
//   3. Ordena categorías alfabéticamente
//   4. Para cada categoría → crea sección con header + fila de tarjetas
// ==========================================================
function agruparYRenderizar(servicios) {
    const container = document.getElementById('catalogo-categorias');
    container.innerHTML = '';

    // Objeto para agrupar: { "Marca": [servicio1, servicio2], "Dispositivo": [servicio3] }
    const categoriasMap = {};

    servicios.forEach(s => {
        if (s.categorias.length === 0) {
            // Sin categoría → agrupar bajo "Sin categoría"
            if (!categoriasMap['Sin categoría']) categoriasMap['Sin categoría'] = [];
            categoriasMap['Sin categoría'].push(s);
        } else {
            // Con categorías → agregar a cada una
            s.categorias.forEach(cat => {
                if (!categoriasMap[cat]) categoriasMap[cat] = [];
                categoriasMap[cat].push(s);
            });
        }
    });

    // Ordenar categorías alfabéticamente
    const categoriasOrdenadas = Object.keys(categoriasMap).sort();

    // Si no hay servicios, mostrar mensaje
    if (categoriasOrdenadas.length === 0) {
        container.innerHTML = '<p class="text-center">No hay servicios disponibles</p>';
        return;
    }

    // Renderizar cada categoría como una sección
    categoriasOrdenadas.forEach(cat => {
        const serviciosDeCategoria = categoriasMap[cat];

        // Crear sección de categoría
        const seccion = document.createElement('div');
        seccion.className = 'categoria-seccion mb-5';

        // Header de categoría: título + contador de servicios
        seccion.innerHTML = `
            <div class="categoria-header">
                <h2 class="categoria-titulo">${cat}</h2>
                <span class="categoria-contador">${serviciosDeCategoria.length} servicio(s)</span>
            </div>
            <div class="row servicios-row"></div>
        `;

        // Fila donde van las tarjetas de servicios
        const row = seccion.querySelector('.servicios-row');

        // Renderizar cada servicio como tarjeta
        serviciosDeCategoria.forEach(s => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4 mb-4';  // Responsive: 3 cols en lg, 2 en md, 1 en sm
            col.innerHTML = crearTarjetaServicio(s);
            row.appendChild(col);
        });

        container.appendChild(seccion);
    });
}

// ==========================================================
// crearTarjetaServicio(s)
// Genera el HTML de una tarjeta de servicio.
//
// Contenido de la tarjeta:
//   - Badge descuento: "−15%" o "−$500" (rojo, esquina superior derecha)
//   - Nombre del servicio (h3)
//   - Descripción (párrafo)
//   - Precios: original tachado + final en verde
//   - Tags de productos asociados (si tiene)
//
// Lógica de precios:
//   - Si precioOriginal > 0 → muestra original tachado + final
//   - Si precioOriginal = 0 → solo muestra el final
// ==========================================================
function crearTarjetaServicio(s) {
    // Badge de descuento: formatea según tipo
    const descuentoBadge = s.tipoDescuento === 'Porcentaje'
        ? `<span class="badge-descuento">-${s.descuento}%</span>`
        : `<span class="badge-descuento">-$${s.descuento}</span>`;

    // HTML de precios: si hay precio original, mostrar tachado
    const precioHtml = s.precioOriginal > 0
        ? `<span class="precio-original">$${s.precioOriginal.toFixed(2)}</span>
           <span class="precio-final">$${s.precioFinal.toFixed(2)}</span>`
        : `<span class="precio-final">$${s.precioFinal.toFixed(2)}</span>`;

    // Tags de productos asociados (si tiene)
    const productosHtml = s.productos.length > 0
        ? `<div class="asociaciones">
               <strong>Productos:</strong>
               ${s.productos.map(p => `<span class="tag">${p}</span>`).join('')}
           </div>`
        : '';

    // HTML completo de la tarjeta
    return `
        <div class="card-servicio">
            ${descuentoBadge}
            <h3 class="servicio-nombre">${s.nombre}</h3>
            <p class="servicio-descripcion">${s.descripcion || ''}</p>
            <div class="precios">${precioHtml}</div>
            ${productosHtml}
        </div>
    `;
}
