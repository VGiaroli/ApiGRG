(function () {
    'use strict';

    const estadoNombres = {
        1: 'Sellado',
        2: 'Seminuevo'
    };

    let productos = [];

    document.addEventListener('DOMContentLoaded', function () {
        const buscador = document.getElementById('buscador-productos');
        const filtroCategoria = document.getElementById('filtro-categoria');
        const filtroEstado = document.getElementById('filtro-estado');
        const filtroDisponibilidad = document.getElementById('filtro-disponibilidad');
        const limpiarFiltros = document.getElementById('limpiar-filtros');

        if (!buscador || !filtroCategoria || !filtroEstado || !filtroDisponibilidad) {
            return;
        }

        buscador.addEventListener('input', renderizarProductos);
        filtroCategoria.addEventListener('change', renderizarProductos);
        filtroEstado.addEventListener('change', renderizarProductos);
        filtroDisponibilidad.addEventListener('change', renderizarProductos);
        limpiarFiltros.addEventListener('click', function () {
            buscador.value = '';
            filtroCategoria.value = '';
            filtroEstado.value = '';
            filtroDisponibilidad.value = '';
            renderizarProductos();
        });

        obtenerProductos();
    });

    function obtenerProductos() {
        fetch(`${linkApi}/productos`)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('No se pudo obtener el inventario');
                }
                return response.json();
            })
            .then(function (listaProductos) {
                productos = Array.isArray(listaProductos) ? listaProductos : [];
                cargarCategorias(productos);
                renderizarProductos();
            })
            .catch(function () {
                const cuerpo = document.getElementById('tabla-productos');
                cuerpo.innerHTML = '<tr><td colspan="6" class="table-message error-message">No se pudo cargar el inventario.</td></tr>';
                document.getElementById('contador-productos').textContent = 'Error al cargar los productos';
            });
    }

    function cargarCategorias(listaProductos) {
        const select = document.getElementById('filtro-categoria');
        const categorias = [...new Set(listaProductos
            .map(function (producto) { return producto.categoria || ''; })
            .filter(Boolean))]
            .sort(function (a, b) { return a.localeCompare(b, 'es'); });

        select.innerHTML = '<option value="">Todas las categorías</option>';
        categorias.forEach(function (categoria) {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            select.appendChild(option);
        });
    }

    function renderizarProductos() {
        const cuerpo = document.getElementById('tabla-productos');
        const query = document.getElementById('buscador-productos').value.trim().toLowerCase();
        const categoria = document.getElementById('filtro-categoria').value;
        const estado = document.getElementById('filtro-estado').value;
        const disponibilidad = document.getElementById('filtro-disponibilidad').value;

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

        cuerpo.innerHTML = filtrados.length
            ? filtrados.map(crearFilaProducto).join('')
            : '<tr><td colspan="6" class="table-message">No hay productos que coincidan con los filtros.</td></tr>';

        document.getElementById('contador-productos').textContent = `${filtrados.length} de ${productos.length} productos`;
    }

    function crearFilaProducto(producto) {
        const estado = estadoNombres[producto.estado] || 'Sin definir';
        const disponibilidad = producto.disponible;
        const colores = producto.colores && producto.colores.length
            ? producto.colores.join(', ')
            : 'Sin colores cargados';

        return `<tr>
            <td>
                <div class="product-name-cell">${escaparHtml(producto.nombre)}</div>
                <small class="product-detail">${escaparHtml(colores)}</small>
            </td>
            <td>${escaparHtml(producto.categoria || 'Sin categoría')}</td>
            <td class="price-cell">${formatearMoneda(producto.precioARS, 'ARS')}</td>
            <td class="price-cell">${formatearMoneda(producto.precioUSD, 'USD')}</td>
            <td><span class="status-pill status-${String(producto.estado).toLowerCase()}">${estado}</span></td>
            <td><span class="availability-pill ${disponibilidad ? 'is-available' : 'is-unavailable'}">
                <span class="availability-dot" aria-hidden="true"></span>${disponibilidad ? 'Disponible' : 'No disponible'}
            </span></td>
        </tr>`;
    }

    function formatearMoneda(valor, moneda) {
        return `${moneda} ${Number(valor || 0).toLocaleString('es-AR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        })}`;
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
