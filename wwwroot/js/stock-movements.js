(function () {
    'use strict';

    let modalInstance;
    let productoActual;
    let onSaved = function () {};

    const tipoLabels = { 1: 'Cantidad inicial', 2: 'Ingreso', 3: 'Egreso', 4: 'Ajuste' };

    function init() {
        const modalElement = document.getElementById('modalMovimientoStock');
        const form = document.getElementById('form-movimiento-stock');
        if (!modalElement || !form || modalElement.dataset.stockInitialized === 'true') {
            return;
        }

        modalElement.dataset.stockInitialized = 'true';
        modalInstance = new bootstrap.Modal(modalElement);
        document.getElementById('movimiento-tipo').addEventListener('change', actualizarAyudaCantidad);
        document.getElementById('movimiento-cerrar-historial').addEventListener('click', function () {
            document.getElementById('movimiento-historial').hidden = true;
        });
        document.getElementById('movimiento-ver-historial').addEventListener('click', function () {
            const historial = document.getElementById('movimiento-historial');
            historial.hidden = !historial.hidden;
            if (!historial.hidden && productoActual) {
                cargarHistorial(productoActual.productoID);
            }
        });
        form.addEventListener('submit', guardarMovimiento);
        actualizarAyudaCantidad();
    }

    function open(producto, callback) {
        if (!producto || !modalInstance) {
            return;
        }

        productoActual = producto;
        onSaved = typeof callback === 'function' ? callback : function () {};
        document.getElementById('movimiento-producto-nombre').textContent = producto.nombre || 'Producto';
        document.getElementById('movimiento-producto-stock').textContent = formatearStock(producto.stockActual);
        document.getElementById('movimiento-tipo').value = producto.stockActual === null ? '1' : '2';
        document.getElementById('movimiento-cantidad').value = '';
        document.getElementById('movimiento-motivo').value = '';
        document.getElementById('movimiento-historial').hidden = true;
        document.getElementById('movimiento-mensaje').hidden = true;
        document.getElementById('movimiento-mensaje').textContent = '';
        document.getElementById('guardar-movimiento').disabled = false;
        document.getElementById('guardar-movimiento').innerHTML = '<i class="bi bi-check2" aria-hidden="true"></i> Guardar movimiento';
        actualizarAyudaCantidad();
        modalInstance.show();
    }

    function actualizarAyudaCantidad() {
        const tipo = Number(document.getElementById('movimiento-tipo').value);
        const label = document.getElementById('movimiento-cantidad-label');
        const help = document.getElementById('movimiento-cantidad-ayuda');
        const input = document.getElementById('movimiento-cantidad');

        if (tipo === 2) {
            label.textContent = 'Unidades que ingresan';
            help.textContent = 'Se suman al stock actual.';
        } else if (tipo === 3) {
            label.textContent = 'Unidades que egresan';
            help.textContent = 'Se descuentan del stock actual.';
        } else if (tipo === 4) {
            label.textContent = 'Nueva cantidad total';
            help.textContent = 'El ajuste reemplaza el stock actual.';
        } else {
            label.textContent = 'Cantidad inicial';
            help.textContent = 'Deja de figurar como sin registrar.';
        }

        input.min = tipo === 2 || tipo === 3 ? '1' : '0';
    }

    async function guardarMovimiento(event) {
        event.preventDefault();
        if (!productoActual) {
            return;
        }

        const tipo = Number(document.getElementById('movimiento-tipo').value);
        const cantidad = Number(document.getElementById('movimiento-cantidad').value);
        const motivo = document.getElementById('movimiento-motivo').value.trim();

        if (!Number.isInteger(cantidad) || cantidad < 0 || ((tipo === 2 || tipo === 3) && cantidad === 0)) {
            mostrarMensaje('Ingresá una cantidad válida para el tipo de movimiento seleccionado.');
            return;
        }

        const button = document.getElementById('guardar-movimiento');
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Guardando...';
        ocultarMensaje();

        try {
            const response = await fetch(`${linkApi}/productos/${productoActual.productoID}/movimientos-stock`, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ tipo: tipo, cantidad: cantidad, motivo: motivo || null })
            });

            if (!response.ok) {
                const error = await response.json().catch(function () { return null; });
                throw new Error(error && error.message ? error.message : 'No se pudo guardar el movimiento.');
            }

            const resultado = await response.json();
            modalInstance.hide();
            onSaved(resultado);
        } catch (error) {
            mostrarMensaje(error.message || 'No se pudo guardar el movimiento.');
        } finally {
            button.disabled = false;
            button.innerHTML = '<i class="bi bi-check2" aria-hidden="true"></i> Guardar movimiento';
        }
    }

    function cargarHistorial(productoId) {
        const lista = document.getElementById('movimiento-historial-lista');
        lista.innerHTML = '<li class="history-loading"><span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Cargando movimientos...</li>';

        fetch(`${linkApi}/productos/${productoId}/movimientos-stock`)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('No se pudo cargar el historial.');
                }

                return response.json();
            })
            .then(function (movimientos) {
                if (!movimientos.length) {
                    lista.innerHTML = '<li class="history-empty">Todavía no hay movimientos registrados.</li>';
                    return;
                }

                lista.innerHTML = movimientos.map(function (movimiento) {
                    const diferencia = movimiento.diferencia > 0 ? `+${movimiento.diferencia}` : movimiento.diferencia;
                    return `<li><div><strong>${tipoLabels[movimiento.tipo] || 'Movimiento'}</strong><span>${escaparHtml(movimiento.motivo || 'Sin motivo')}</span></div><b>${diferencia}</b><time datetime="${escaparHtml(movimiento.fechaUtc)}">${formatearFecha(movimiento.fechaUtc)}</time></li>`;
                }).join('');
            })
            .catch(function (error) {
                lista.innerHTML = `<li class="history-empty">${escaparHtml(error.message)}</li>`;
            });
    }

    function formatearStock(stock) {
        return stock === null || stock === undefined ? 'Sin registrar' : `${Number(stock).toLocaleString('es-AR')} unidades`;
    }

    function formatearFecha(valor) {
        const fecha = new Date(valor);
        return Number.isNaN(fecha.getTime()) ? 'Sin fecha' : new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(fecha);
    }

    function mostrarMensaje(mensaje) {
        const element = document.getElementById('movimiento-mensaje');
        element.textContent = mensaje;
        element.hidden = false;
    }

    function ocultarMensaje() {
        const element = document.getElementById('movimiento-mensaje');
        element.textContent = '';
        element.hidden = true;
    }

    function escaparHtml(valor) {
        return String(valor || '').replace(/[&<>'"]/g, function (caracter) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[caracter];
        });
    }

    window.StockMovements = { init: init, open: open };
})();
