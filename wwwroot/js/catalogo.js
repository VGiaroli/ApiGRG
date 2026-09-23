(function () {
    'use strict';

    const estadoNombres = {
        1: 'Sellado',
        2: 'Seminuevo'
    };

    let productos = [];

    document.addEventListener('DOMContentLoaded', function () {
        const filtros = [
            document.getElementById('catalogo-busqueda'),
            document.getElementById('catalogo-categoria'),
            document.getElementById('catalogo-estado'),
            document.getElementById('catalogo-disponibilidad')
        ];

        filtros.forEach(function (filtro) {
            filtro.addEventListener(filtro.tagName === 'INPUT' ? 'input' : 'change', renderizarCatalogo);
        });

        document.getElementById('catalogo-limpiar-filtros').addEventListener('click', limpiarFiltros);
        document.getElementById('catalogo-limpiar-vacio').addEventListener('click', limpiarFiltros);
        document.getElementById('catalogo-reintentar').addEventListener('click', obtenerProductos);

        obtenerProductos();
    });

    function obtenerProductos() {
        mostrarEstado('cargando');

        fetch(`${linkApi}/productos`)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('No se pudo obtener el catálogo');
                }
                return response.json();
            })
            .then(function (listaProductos) {
                productos = Array.isArray(listaProductos) ? listaProductos : [];
                cargarCategorias(productos);
                document.getElementById('total-productos').textContent = productos.length;
                renderizarCatalogo();
            })
            .catch(function () {
                document.getElementById('catalogo-contador').textContent = 'No se pudo cargar el catálogo';
                mostrarEstado('error');
            });
    }

    function cargarCategorias(listaProductos) {
        const select = document.getElementById('catalogo-categoria');
        const categorias = [...new Set(listaProductos
            .map(function (producto) { return producto.categoria || ''; })
            .filter(Boolean))]
            .sort(function (a, b) { return a.localeCompare(b, 'es'); });

        select.innerHTML = '<option value="">Todas</option>';
        categorias.forEach(function (categoria) {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            select.appendChild(option);
        });
    }

    function renderizarCatalogo() {
        const query = document.getElementById('catalogo-busqueda').value.trim().toLowerCase();
        const categoria = document.getElementById('catalogo-categoria').value;
        const estado = document.getElementById('catalogo-estado').value;
        const disponibilidad = document.getElementById('catalogo-disponibilidad').value;

        const filtrados = productos.filter(function (producto) {
            const textoBusqueda = [
                producto.nombre,
                producto.categoria,
                ...(producto.colores || [])
            ].join(' ').toLowerCase();

            return (!query || textoBusqueda.includes(query))
                && (!categoria || producto.categoria === categoria)
                && (!estado || String(producto.estado) === estado)
                && (!disponibilidad || String(producto.disponible) === disponibilidad);
        });

        const grid = document.getElementById('catalogo-grid');
        grid.innerHTML = filtrados.map(crearCardProducto).join('');
        activarFallbackImagenes(grid);
        grid.setAttribute('aria-busy', 'false');

        document.getElementById('catalogo-contador').textContent = `${filtrados.length} equipos encontrados`;
        mostrarEstado(filtrados.length ? 'resultado' : 'vacio');
    }

    function crearCardProducto(producto) {
        const estado = estadoNombres[producto.estado] || 'Sin definir';
        const colores = producto.colores || [];
        const disponible = producto.disponible === true;
        const cuota = producto.cuotas && producto.cuotas.length ? producto.cuotas[0] : null;
        const imagenUrl = typeof producto.imagenUrl === 'string' ? producto.imagenUrl.trim() : '';
        const mensaje = encodeURIComponent(`Hola GRG, me interesa el equipo ${producto.nombre}. ¿Podrían brindarme más información?`);

        return `<article class="catalog-card">
            <div class="catalog-device">
                ${imagenUrl
                    ? `<img class="catalog-product-image" src="${escaparHtml(imagenUrl)}" alt="Imagen de ${escaparHtml(producto.nombre)}" loading="lazy">
                        <span class="catalog-image-placeholder" hidden aria-hidden="true"><i class="bi ${obtenerIcono(producto)}"></i></span>`
                    : `<span class="catalog-image-placeholder" aria-hidden="true"><i class="bi ${obtenerIcono(producto)}"></i></span>`}
            </div>

            <div class="catalog-card-body">
                <div class="catalog-card-top">
                    <div class="catalog-card-heading">
                        <p class="catalog-category">${escaparHtml(producto.categoria || 'Equipo')}</p>
                        <h2>${escaparHtml(producto.nombre)}</h2>
                    </div>
                    <span class="catalog-status ${producto.estado === 2 ? 'status-seminuevo' : ''}">${estado}</span>
                </div>

                <div class="catalog-tags ${colores.length ? '' : 'is-empty'}">
                    ${colores.length
                        ? colores.slice(0, 3).map(function (color) { return `<span class="catalog-tag">${escaparHtml(color)}</span>`; }).join('')
                        : ''}
                </div>

                <div class="catalog-prices">
                    <p class="catalog-price-ars">${formatearMoneda(producto.precioARS, 'ARS')}</p>
                    <p class="catalog-price-usd">${formatearMoneda(producto.precioUSD, 'USD')}</p>
                </div>

                <div class="catalog-financing">
                    <span class="financing-icon"><i class="bi bi-credit-card-2-front" aria-hidden="true"></i></span>
                    <div class="financing-copy">
                        <strong>${cuota ? `Hasta ${cuota.cantidadCuotas} cuotas` : 'Financiación'}</strong>
                        <span>${cuota ? `de ${formatearMoneda(cuota.montoCuota, 'ARS')}` : 'Consultar alternativas disponibles'}</span>
                    </div>
                    ${cuota && cuota.medioPago ? `<small>${escaparHtml(cuota.medioPago)}</small>` : ''}
                </div>

                ${disponible
                    ? `<a class="catalog-action" href="https://wa.me/?text=${mensaje}" target="_blank" rel="noopener noreferrer">
                        <i class="bi bi-whatsapp" aria-hidden="true"></i> Consultar por WhatsApp
                    </a>`
                    : '<span class="catalog-unavailable"><i class="bi bi-clock" aria-hidden="true"></i> No disponible ahora</span>'}
            </div>
        </article>`;
    }

    function activarFallbackImagenes(grid) {
        grid.querySelectorAll('.catalog-product-image').forEach(function (imagen) {
            imagen.addEventListener('error', function () {
                imagen.hidden = true;
                const placeholder = imagen.parentElement.querySelector('.catalog-image-placeholder');
                if (placeholder) {
                    placeholder.hidden = false;
                }
            });
        });
    }

    function obtenerIcono(producto) {
        const texto = `${producto.nombre || ''} ${producto.categoria || ''}`.toLowerCase();

        if (texto.includes('watch') || texto.includes('reloj')) {
            return 'bi-watch';
        }

        if (texto.includes('ipad') || texto.includes('tablet')) {
            return 'bi-tablet';
        }

        if (texto.includes('mac') || texto.includes('notebook') || texto.includes('laptop')) {
            return 'bi-laptop';
        }

        if (texto.includes('auricular') || texto.includes('audio')) {
            return 'bi-headphones';
        }

        return 'bi-phone';
    }

    function formatearMoneda(valor, moneda) {
        const prefijo = moneda ? `${moneda} ` : '';
        return `${prefijo}${Number(valor || 0).toLocaleString('es-AR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        })}`;
    }

    function limpiarFiltros() {
        document.getElementById('catalogo-busqueda').value = '';
        document.getElementById('catalogo-categoria').value = '';
        document.getElementById('catalogo-estado').value = '';
        document.getElementById('catalogo-disponibilidad').value = '';
        renderizarCatalogo();
    }

    function mostrarEstado(estado) {
        const cargando = document.getElementById('catalogo-cargando');
        const error = document.getElementById('catalogo-error');
        const vacio = document.getElementById('catalogo-vacio');
        const grid = document.getElementById('catalogo-grid');

        cargando.hidden = estado !== 'cargando';
        error.hidden = estado !== 'error';
        vacio.hidden = estado !== 'vacio';
        grid.hidden = estado !== 'resultado';

        if (estado === 'cargando') {
            grid.setAttribute('aria-busy', 'true');
        }
    }

    function escaparHtml(valor) {
        return String(valor || '').replace(/[&<>'"]/g, function (caracter) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#039;',
                '"': '&quot;'
            }[caracter];
        });
    }
})();
