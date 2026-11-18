(function () {
    'use strict';

    const metricMap = {
        totalProductos: 'metric-total',
        productosDisponibles: 'metric-disponibles',
        productosAgotados: 'metric-agotados',
        productosStockBajo: 'metric-bajo',
        productosSinStockRegistrado: 'metric-sin-registrar',
        solicitudesActivas: 'metric-solicitudes'
    };

    document.addEventListener('DOMContentLoaded', function () {
        if (!document.getElementById('contenido-dashboard')) {
            return;
        }

        document.getElementById('dashboard-refrescar').addEventListener('click', cargarResumen);
        document.getElementById('dashboard-reintentar').addEventListener('click', cargarResumen);
        cargarResumen();
    });

    function cargarResumen() {
        mostrarEstado('cargando');

        fetch(`${linkApi}/admin/resumen`)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('No se pudo cargar el resumen.');
                }

                return response.json();
            })
            .then(function (resumen) {
                Object.keys(metricMap).forEach(function (key) {
                    const element = document.getElementById(metricMap[key]);
                    if (element) {
                        element.textContent = Number(resumen[key] || 0).toLocaleString('es-AR');
                    }
                });

                renderizarRecientes(Array.isArray(resumen.productosRecientes) ? resumen.productosRecientes : []);
                mostrarEstado('contenido');
            })
            .catch(function () {
                mostrarEstado('error');
            });
    }

    function renderizarRecientes(productos) {
        const cargando = document.getElementById('dashboard-recientes-cargando');
        const vacio = document.getElementById('dashboard-recientes-vacio');
        const tabla = document.getElementById('dashboard-recientes-tabla');
        const cuerpo = document.getElementById('dashboard-recientes-body');

        cargando.hidden = true;
        vacio.hidden = productos.length !== 0;
        tabla.hidden = productos.length === 0;

        cuerpo.innerHTML = productos.map(function (producto) {
            const stock = producto.stockActual === null || producto.stockActual === undefined
                ? 'Sin registrar'
                : Number(producto.stockActual).toLocaleString('es-AR');
            const stockClass = producto.estadoStock === 'Bajo' ? 'is-low' : producto.estadoStock === 'Agotado' ? 'is-empty' : '';
            const estado = producto.disponibilidadEfectiva ? 'Disponible' : 'No disponible';
            const fecha = producto.fecha ? formatearFecha(producto.fecha) : 'Sin fecha';

            return `<tr>
                <td><span class="recent-product-name">${escaparHtml(producto.nombre)}</span><span class="recent-product-category">${escaparHtml(producto.categoria || 'Sin categoría')}</span></td>
                <td><span class="recent-state ${producto.disponibilidadEfectiva ? '' : 'is-off'}">${estado}</span></td>
                <td><span class="recent-stock ${stockClass}">${stock}</span></td>
                <td>${fecha}</td>
            </tr>`;
        }).join('');
    }

    function mostrarEstado(estado) {
        document.getElementById('dashboard-cargando').hidden = estado !== 'cargando';
        document.getElementById('dashboard-error').hidden = estado !== 'error';
        document.getElementById('dashboard-contenido').hidden = estado !== 'contenido';

        if (estado === 'contenido') {
            document.getElementById('dashboard-recientes-cargando').hidden = true;
        }
    }

    function formatearFecha(valor) {
        const fecha = new Date(valor);
        if (Number.isNaN(fecha.getTime())) {
            return 'Sin fecha';
        }

        return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(fecha);
    }

    function escaparHtml(valor) {
        return String(valor || '').replace(/[&<>'"]/g, function (caracter) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[caracter];
        });
    }
})();
