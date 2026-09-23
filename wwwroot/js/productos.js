(function () {
    'use strict';

    const estadoNombres = {
        1: 'Sellado',
        2: 'Seminuevo'
    };

    let productos = [];
    let modalNuevoProducto;
    let mediosPago = [];

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

        inicializarFormularioProducto();
        obtenerProductos();
    });

    function inicializarFormularioProducto() {
        const modalElement = document.getElementById('modalNuevoProducto');
        const formulario = document.getElementById('form-nuevo-producto');

        modalNuevoProducto = new bootstrap.Modal(modalElement);
        document.getElementById('btn-nuevo-producto').addEventListener('click', abrirModalNuevoProducto);
        document.getElementById('agregar-color').addEventListener('click', function () { agregarColorFila(); });
        document.getElementById('agregar-cuota').addEventListener('click', function () { agregarCuotaFila(); });
        document.getElementById('producto-imagen-url').addEventListener('input', actualizarPreviewImagen);
        formulario.addEventListener('submit', guardarProducto);
        modalElement.addEventListener('hidden.bs.modal', limpiarFormularioProducto);

        cargarCategoriasFormulario();
        cargarMediosPago();
    }

    function cargarCategoriasFormulario() {
        fetch(`${linkApi}/categorias`)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('No se pudieron cargar las categorías');
                }
                return response.json();
            })
            .then(function (categorias) {
                const select = document.getElementById('producto-categoria');
                select.innerHTML = '<option value="">Seleccionar categoría</option>';

                categorias
                    .filter(function (categoria) { return !categoria.eliminado; })
                    .sort(function (a, b) { return a.nombreProducto.localeCompare(b.nombreProducto, 'es'); })
                    .forEach(function (categoria) {
                        const option = document.createElement('option');
                        option.value = categoria.categoriaID;
                        option.textContent = categoria.nombreProducto;
                        select.appendChild(option);
                    });
            })
            .catch(function () {
                mostrarFormMensaje('No se pudieron cargar las categorías disponibles.');
            });
    }

    function cargarMediosPago() {
        fetch(`${linkApi}/mediospagos`)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('No se pudieron cargar los medios de pago');
                }
                return response.json();
            })
            .then(function (listaMediosPago) {
                mediosPago = Array.isArray(listaMediosPago) ? listaMediosPago : [];
                actualizarOpcionesMediosPago();
            })
            .catch(function () {
                mediosPago = [];
                actualizarOpcionesMediosPago();
                mostrarFormMensaje('No se pudieron cargar los medios de pago.');
            });
    }

    function abrirModalNuevoProducto() {
        limpiarFormularioProducto();
        ocultarFormMensaje();
        agregarColorFila();
        actualizarPreviewImagen();
        modalNuevoProducto.show();
    }

    function agregarColorFila(valor) {
        const lista = document.getElementById('producto-colores');
        const fila = document.createElement('div');
        fila.className = 'dynamic-row color-row';
        fila.innerHTML = `
            <input type="text" class="form-control" data-color placeholder="Ej. Negro" value="${escaparHtml(valor || '')}">
            <button type="button" class="btn-remove-row" aria-label="Eliminar color">
                <i class="bi bi-x-lg" aria-hidden="true"></i>
            </button>`;

        fila.querySelector('.btn-remove-row').addEventListener('click', function () {
            fila.remove();
        });
        lista.appendChild(fila);
    }

    function agregarCuotaFila() {
        const lista = document.getElementById('producto-cuotas');
        const fila = document.createElement('div');
        fila.className = 'dynamic-row financing-row';
        fila.dataset.cuotaRow = 'true';
        fila.innerHTML = `
            <input type="number" class="form-control" data-cantidad-cuotas min="1" step="1" placeholder="6">
            <div class="input-with-prefix input-with-prefix-small"><span>$</span><input type="number" class="form-control" data-monto-cuota min="0" step="0.01" placeholder="100000"></div>
            <select class="form-select" data-medio-pago>${opcionesMediosPago()}</select>
            <button type="button" class="btn-remove-row" aria-label="Eliminar financiación">
                <i class="bi bi-x-lg" aria-hidden="true"></i>
            </button>`;

        fila.querySelector('.btn-remove-row').addEventListener('click', function () {
            fila.remove();
        });
        lista.appendChild(fila);
    }

    function opcionesMediosPago() {
        if (!mediosPago.length) {
            return '<option value="">Sin medios disponibles</option>';
        }

        return '<option value="">Seleccionar medio</option>' + mediosPago.map(function (medioPago) {
            return `<option value="${medioPago.medioPagoID}">${escaparHtml(medioPago.nombre)}</option>`;
        }).join('');
    }

    function actualizarOpcionesMediosPago() {
        document.querySelectorAll('[data-medio-pago]').forEach(function (select) {
            const valorActual = select.value;
            select.innerHTML = opcionesMediosPago();
            select.value = valorActual;
        });
    }

    function actualizarPreviewImagen() {
        const url = document.getElementById('producto-imagen-url').value.trim();
        const preview = document.getElementById('producto-imagen-preview');

        if (!url) {
            preview.innerHTML = `<div class="image-preview-placeholder">
                <i class="bi bi-image" aria-hidden="true"></i>
                <span>La vista previa aparecerá aquí</span>
            </div>`;
            return;
        }

        preview.innerHTML = `<img src="${escaparHtml(url)}" alt="Vista previa del producto">
            <div class="image-preview-overlay"><i class="bi bi-eye" aria-hidden="true"></i> Vista previa</div>`;
        preview.querySelector('img').addEventListener('error', function () {
            preview.innerHTML = `<div class="image-preview-placeholder image-preview-error">
                <i class="bi bi-image-alt" aria-hidden="true"></i>
                <span>No se pudo cargar la imagen</span>
            </div>`;
        });
    }

    async function guardarProducto(event) {
        event.preventDefault();

        const formulario = event.currentTarget;
        if (!formulario.checkValidity()) {
            formulario.classList.add('was-validated');
            return;
        }

        const cuotasResultado = leerCuotasFormulario();
        if (!cuotasResultado.valido) {
            mostrarFormMensaje('Completá todos los datos de cada financiación o eliminá la fila incompleta.');
            return;
        }

        const botonGuardar = document.getElementById('guardar-producto');
        botonGuardar.disabled = true;
        botonGuardar.innerHTML = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Guardando...';
        ocultarFormMensaje();

        const payload = {
            nombre: document.getElementById('producto-nombre').value.trim(),
            categoriaID: Number(document.getElementById('producto-categoria').value),
            estado: Number(document.getElementById('producto-estado').value),
            precioARS: Number(document.getElementById('producto-precio-ars').value),
            precioUSD: Number(document.getElementById('producto-precio-usd').value),
            disponible: document.getElementById('producto-disponible').checked,
            imagenUrl: document.getElementById('producto-imagen-url').value.trim() || null,
            colores: Array.from(document.querySelectorAll('[data-color]'))
                .map(function (input) { return input.value.trim(); })
                .filter(Boolean)
                .map(function (color) { return { color: color }; }),
            cuotas: cuotasResultado.cuotas
        };

        try {
            const response = await fetch(`${linkApi}/productos`, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(function () { return null; });
                throw new Error(errorData && errorData.message ? errorData.message : 'No se pudo guardar el producto.');
            }

            modalNuevoProducto.hide();
            obtenerProductos();
            mostrarConfirmacionProducto();
        } catch (error) {
            mostrarFormMensaje(error.message);
        } finally {
            botonGuardar.disabled = false;
            botonGuardar.innerHTML = '<i class="bi bi-check2" aria-hidden="true"></i> Guardar producto';
        }
    }

    function leerCuotasFormulario() {
        const cuotas = [];
        let valido = true;

        document.querySelectorAll('[data-cuota-row]').forEach(function (fila) {
            const cantidad = fila.querySelector('[data-cantidad-cuotas]').value;
            const monto = fila.querySelector('[data-monto-cuota]').value;
            const medioPagoID = fila.querySelector('[data-medio-pago]').value;
            const tieneDatos = cantidad || monto || medioPagoID;

            if (!tieneDatos) {
                return;
            }

            if (!cantidad || !monto || Number(cantidad) <= 0 || Number(monto) < 0 || !medioPagoID) {
                valido = false;
                return;
            }

            cuotas.push({
                medioPagoID: Number(medioPagoID),
                cantidadCuotas: Number(cantidad),
                montoCuota: Number(monto)
            });
        });

        return { valido: valido, cuotas: cuotas };
    }

    function limpiarFormularioProducto() {
        const formulario = document.getElementById('form-nuevo-producto');
        if (!formulario) {
            return;
        }

        formulario.reset();
        formulario.classList.remove('was-validated');
        document.getElementById('producto-colores').innerHTML = '';
        document.getElementById('producto-cuotas').innerHTML = '';
        document.getElementById('producto-imagen-preview').innerHTML = `<div class="image-preview-placeholder">
            <i class="bi bi-image" aria-hidden="true"></i>
            <span>La vista previa aparecerá aquí</span>
        </div>`;
        const botonGuardar = document.getElementById('guardar-producto');
        botonGuardar.disabled = false;
        botonGuardar.innerHTML = '<i class="bi bi-check2" aria-hidden="true"></i> Guardar producto';
    }

    function mostrarFormMensaje(mensaje) {
        const contenedor = document.getElementById('producto-form-mensaje');
        contenedor.textContent = mensaje;
        contenedor.hidden = false;
    }

    function ocultarFormMensaje() {
        const contenedor = document.getElementById('producto-form-mensaje');
        contenedor.hidden = true;
        contenedor.textContent = '';
    }

    function mostrarConfirmacionProducto() {
        if (window.Swal) {
            Swal.fire({
                text: 'El producto fue creado correctamente.',
                icon: 'success',
                position: 'top-end',
                toast: true,
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false
            });
        }
    }

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
