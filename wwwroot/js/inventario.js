(function () {
    'use strict';

    let productos = [];

    document.addEventListener('DOMContentLoaded', function () {
        if (!document.getElementById('inventario-tabla')) {
            return;
        }

        document.getElementById('inventario-busqueda').addEventListener('input', renderizar);
        document.getElementById('inventario-categoria').addEventListener('change', renderizar);
        document.getElementById('inventario-estado').addEventListener('change', renderizar);
        document.getElementById('inventario-limpiar').addEventListener('click', limpiarFiltros);
        document.getElementById('inventario-reintentar').addEventListener('click', cargarProductos);
        document.getElementById('inventario-tabla').addEventListener('click', manejarAccion);
        window.StockMovements.init();
        cargarProductos();
    });

    function cargarProductos() {
        mostrarEstado('cargando');

        fetch(`${linkApi}/productos/admin`)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('No se pudo cargar el inventario.');
                }

                return response.json();
            })
            .then(function (lista) {
                productos = Array.isArray(lista) ? lista : [];
                cargarCategorias();
                renderizar();
            })
            .catch(function () {
                mostrarEstado('error');
            });
    }

    function cargarCategorias() {
        const select = document.getElementById('inventario-categoria');
        const seleccionada = select.value;
        const categorias = [...new Set(productos.map(function (producto) { return producto.categoria || ''; }).filter(Boolean))]
            .sort(function (a, b) { return a.localeCompare(b, 'es'); });

        select.innerHTML = '<option value="">Todas las categorías</option>' + categorias.map(function (categoria) {
            return `<option value="${escaparHtml(categoria)}">${escaparHtml(categoria)}</option>`;
        }).join('');
        select.value = categorias.includes(seleccionada) ? seleccionada : '';
    }

    function renderizar() {
        const query = document.getElementById('inventario-busqueda').value.trim().toLowerCase();
        const categoria = document.getElementById('inventario-categoria').value;
        const estado = document.getElementById('inventario-estado').value;
        const filtrados = productos.filter(function (producto) {
            const texto = `${producto.nombre || ''} ${producto.sku || ''} ${producto.categoria || ''}`.toLowerCase();
            return (!query || texto.includes(query))
                && (!categoria || producto.categoria === categoria)
                && (!estado || producto.estadoStock === estado);
        });

        document.getElementById('inventario-contador').textContent = `${filtrados.length} de ${productos.length} productos`;
        document.getElementById('inventario-tabla').innerHTML = filtrados.map(crearFila).join('');

        if (!productos.length || !filtrados.length) {
            mostrarEstado('vacio');
        } else {
            mostrarEstado('contenido');
        }
    }

    function crearFila(producto) {
        const stock = producto.stockActual === null || producto.stockActual === undefined
            ? '<span class="inventory-number is-unregistered">Sin registrar</span>'
            : `<span class="inventory-number">${Number(producto.stockActual).toLocaleString('es-AR')}</span>`;
        const minimo = Number(producto.stockMinimo || 0).toLocaleString('es-AR');
        const estadoClase = String(producto.estadoStock || 'SinRegistrar').toLowerCase();
        const colores = Array.isArray(producto.colores) && producto.colores.length ? producto.colores.join(', ') : 'Sin colores cargados';

        return `<tr>
            <td><span class="inventory-sku">${escaparHtml(producto.sku || 'Sin SKU')}</span></td>
            <td><span class="inventory-product-name">${escaparHtml(producto.nombre)}</span><span class="inventory-product-detail">${escaparHtml(colores)}</span></td>
            <td>${escaparHtml(producto.categoria || 'Sin categoría')}</td>
            <td>${stock}</td>
            <td>${minimo}</td>
            <td><span class="stock-status status-${estadoClase}">${etiquetaEstado(producto.estadoStock)}</span></td>
            <td><span class="effective-status ${producto.disponibilidadEfectiva ? 'is-effective' : ''}">${producto.disponibilidadEfectiva ? 'Disponible' : 'No disponible'}</span></td>
            <td><div class="inventory-action-group"><button type="button" class="inventory-action" data-action="stock" data-producto-id="${producto.productoID}" title="Ajustar stock" aria-label="Ajustar stock de ${escaparHtml(producto.nombre)}"><i class="bi bi-arrow-left-right" aria-hidden="true"></i></button><button type="button" class="inventory-action" data-action="history" data-producto-id="${producto.productoID}" title="Ver movimientos" aria-label="Ver movimientos de ${escaparHtml(producto.nombre)}"><i class="bi bi-clock-history" aria-hidden="true"></i></button></div></td>
        </tr>`;
    }

    function manejarAccion(event) {
        const button = event.target.closest('[data-action]');
        if (!button) {
            return;
        }

        const producto = productos.find(function (item) { return String(item.productoID) === String(button.dataset.productoId); });
        if (!producto) {
            return;
        }

        window.StockMovements.open(producto, function () {
            cargarProductos();
        });

        if (button.dataset.action === 'history') {
            setTimeout(function () { document.getElementById('movimiento-ver-historial').click(); }, 120);
        }
    }

    function limpiarFiltros() {
        document.getElementById('inventario-busqueda').value = '';
        document.getElementById('inventario-categoria').value = '';
        document.getElementById('inventario-estado').value = '';
        renderizar();
    }

    function mostrarEstado(estado) {
        document.getElementById('inventario-cargando').hidden = estado !== 'cargando';
        document.getElementById('inventario-error').hidden = estado !== 'error';
        document.getElementById('inventario-vacio').hidden = estado !== 'vacio';
        document.getElementById('inventario-tabla-contenedor').hidden = estado !== 'contenido';
    }

    function etiquetaEstado(estado) {
        return { Normal: 'Normal', Bajo: 'Bajo', Agotado: 'Agotado', SinRegistrar: 'Sin registrar' }[estado] || 'Sin definir';
    }

    function escaparHtml(valor) {
        return String(valor || '').replace(/[&<>'"]/g, function (caracter) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[caracter];
        });
    }
})();
