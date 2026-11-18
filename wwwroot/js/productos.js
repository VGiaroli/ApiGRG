(function () {
    'use strict';

    const estadoNombres = {
        1: 'Sellado',
        2: 'Seminuevo'
    };

    let productos = [];
    let modalNuevoProducto;
    let mediosPago = [];
    let modoFormulario = 'crear';
    let productoEditandoId = null;
    let solicitudProductoEdicion = 0;
    let formularioProductoCargando = false;
    let categoriasFormularioPromise = Promise.resolve(false);
    let mediosPagoPromise = Promise.resolve(false);
    let modalPrecioProducto;
    let productoPrecioEditandoId = null;
    let productoBaseActual = null;

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
        document.getElementById('tabla-productos').addEventListener('click', manejarAccionesTabla);
        limpiarFiltros.addEventListener('click', function () {
            buscador.value = '';
            filtroCategoria.value = '';
            filtroEstado.value = '';
            filtroDisponibilidad.value = '';
            renderizarProductos();
        });

        inicializarFormularioProducto();
        window.StockMovements.init();
        obtenerProductos();
        if (window.location.hash === '#nuevo-producto') {
            abrirModalNuevoProducto();
        }
    });

    function inicializarFormularioProducto() {
        const modalElement = document.getElementById('modalNuevoProducto');
        const formulario = document.getElementById('form-nuevo-producto');

        modalNuevoProducto = new bootstrap.Modal(modalElement);
        modalPrecioProducto = new bootstrap.Modal(document.getElementById('modalPrecioProducto'));
        document.getElementById('btn-nuevo-producto').addEventListener('click', abrirModalNuevoProducto);
        document.getElementById('agregar-color').addEventListener('click', function () { agregarColorFila(); });
        document.getElementById('agregar-cuota').addEventListener('click', function () { agregarCuotaFila(); });
        document.getElementById('producto-imagen-url').addEventListener('input', actualizarPreviewImagen);
        document.getElementById('vista-previa-formulario').addEventListener('click', abrirVistaPreviaFormulario);
        document.getElementById('form-precio-producto').addEventListener('submit', guardarPrecioRapido);
        formulario.addEventListener('submit', guardarProducto);
        modalElement.addEventListener('hidden.bs.modal', limpiarFormularioProducto);

        categoriasFormularioPromise = cargarCategoriasFormulario();
        mediosPagoPromise = cargarMediosPago();
    }

    function cargarCategoriasFormulario() {
        return fetch(`${linkApi}/categorias`)
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
                return true;
            })
            .catch(function () {
                mostrarFormMensaje('No se pudieron cargar las categorías disponibles.');
                return false;
            });
    }

    function cargarMediosPago() {
        return fetch(`${linkApi}/mediospagos`)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('No se pudieron cargar los medios de pago');
                }
                return response.json();
            })
            .then(function (listaMediosPago) {
                mediosPago = Array.isArray(listaMediosPago) ? listaMediosPago : [];
                actualizarOpcionesMediosPago();
                return true;
            })
            .catch(function () {
                mediosPago = [];
                actualizarOpcionesMediosPago();
                mostrarFormMensaje('No se pudieron cargar los medios de pago.');
                return false;
            });
    }

    function abrirModalNuevoProducto() {
        limpiarFormularioProducto();
        ocultarFormMensaje();
        agregarColorFila();
        actualizarPreviewImagen();
        modalNuevoProducto.show();
    }

    function manejarAccionesTabla(event) {
        const boton = event.target.closest('[data-producto-id][data-action]');
        if (!boton || !event.currentTarget.contains(boton)) {
            return;
        }

        const productoID = Number(boton.dataset.productoId);
        const producto = productos.find(function (item) { return Number(item.productoID) === productoID; });
        if (!producto) {
            return;
        }

        switch (boton.dataset.action) {
            case 'edit':
                abrirModalEditarProducto(productoID);
                break;
            case 'price':
                abrirModalPrecioProducto(producto);
                break;
            case 'stock':
                window.StockMovements.open(producto, function () { obtenerProductos(); });
                break;
            case 'availability':
                cambiarDisponibilidad(producto);
                break;
            case 'preview':
                ProductPreview.open(producto, { unsaved: false });
                break;
        }
    }

    function abrirModalEditarProducto(productoID) {
        if (!Number.isInteger(productoID) || productoID <= 0) {
            return;
        }

        const solicitudActual = ++solicitudProductoEdicion;
        prepararFormularioProductoLimpio();
        modoFormulario = 'editar';
        productoEditandoId = productoID;
        productoBaseActual = productos.find(function (item) { return Number(item.productoID) === productoID; }) || null;
        actualizarModalFormulario();
        ocultarFormMensaje();
        alternarCargaFormulario(true);
        modalNuevoProducto.show();

        Promise.all([categoriasFormularioPromise, mediosPagoPromise])
            .then(function (resultados) {
                if (!esSolicitudEdicionActiva(solicitudActual, productoID)) {
                    return null;
                }

                if (resultados.some(function (resultado) { return !resultado; })) {
                    throw new Error('No se pudieron cargar los datos necesarios para editar el producto.');
                }

                return fetch(`${linkApi}/productos/${productoID}`, {
                    headers: { 'Accept': 'application/json' }
                });
            })
            .then(function (response) {
                if (!response) {
                    return null;
                }

                if (!response.ok) {
                    throw new Error(response.status === 404
                        ? 'El producto ya no existe.'
                        : 'No se pudo obtener el producto para editar.');
                }

                return response.json();
            })
            .then(function (producto) {
                if (!producto || !esSolicitudEdicionActiva(solicitudActual, productoID)) {
                    return;
                }

                completarFormularioProducto(producto);
                alternarCargaFormulario(false);
            })
            .catch(function (error) {
                if (!esSolicitudEdicionActiva(solicitudActual, productoID)) {
                    return;
                }

                alternarCargaFormulario(false);
                mostrarFormMensaje(error.message || 'No se pudo cargar el producto para editar.');
            });
    }

    function esSolicitudEdicionActiva(solicitud, productoID) {
        return solicitud === solicitudProductoEdicion
            && modoFormulario === 'editar'
            && productoEditandoId === productoID;
    }

    function completarFormularioProducto(producto) {
        document.getElementById('producto-nombre').value = producto.nombre || '';
        document.getElementById('producto-categoria').value = String(producto.categoriaID || '');
        document.getElementById('producto-estado').value = String(producto.estado || '');
        document.getElementById('producto-precio-ars').value = producto.precioARS ?? '';
        document.getElementById('producto-precio-usd').value = producto.precioUSD ?? '';
        document.getElementById('producto-disponible').checked = Boolean(producto.disponible);
        document.getElementById('producto-sku').value = producto.sku || '';
        document.getElementById('producto-stock-minimo').value = producto.stockMinimo ?? 1;
        document.getElementById('producto-imagen-url').value = producto.imagenUrl || '';

        document.getElementById('producto-colores').innerHTML = '';
        (Array.isArray(producto.colores) ? producto.colores : []).forEach(function (color) {
            agregarColorFila(color.color);
        });

        document.getElementById('producto-cuotas').innerHTML = '';
        (Array.isArray(producto.cuotas) ? producto.cuotas : []).forEach(function (cuota) {
            agregarCuotaFila(cuota);
        });

        document.getElementById('form-nuevo-producto').classList.remove('was-validated');
        actualizarPreviewImagen();
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

    function agregarCuotaFila(datosIniciales) {
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

        fila.querySelector('[data-cantidad-cuotas]').value = datosIniciales?.cantidadCuotas ?? '';
        fila.querySelector('[data-monto-cuota]').value = datosIniciales?.montoCuota ?? '';
        fila.querySelector('[data-medio-pago]').value = datosIniciales?.medioPagoID
            ? String(datosIniciales.medioPagoID)
            : '';
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

    function abrirVistaPreviaFormulario() {
        const producto = {
            productoID: productoEditandoId || 'preview',
            nombre: document.getElementById('producto-nombre').value.trim() || 'Producto sin nombre',
            categoria: document.getElementById('producto-categoria').selectedOptions[0]?.textContent || 'Equipo',
            estado: Number(document.getElementById('producto-estado').value || 1),
            precioARS: Number(document.getElementById('producto-precio-ars').value || 0),
            precioUSD: Number(document.getElementById('producto-precio-usd').value || 0),
            disponible: document.getElementById('producto-disponible').checked,
            stockActual: productoBaseActual ? productoBaseActual.stockActual : null,
            imagenUrl: document.getElementById('producto-imagen-url').value.trim(),
            colores: Array.from(document.querySelectorAll('[data-color]')).map(function (input) { return input.value.trim(); }).filter(Boolean),
            cuotas: leerCuotasFormulario().cuotas.map(function (cuota) {
                const medio = mediosPago.find(function (item) { return Number(item.medioPagoID) === Number(cuota.medioPagoID); });
                return { cantidadCuotas: cuota.cantidadCuotas, montoCuota: cuota.montoCuota, medioPago: medio ? medio.nombre : '' };
            })
        };

        producto.disponibilidadEfectiva = producto.stockActual === null || producto.stockActual === undefined
            ? producto.disponible
            : producto.disponible && producto.stockActual > 0;
        ProductPreview.open(producto, { unsaved: true });
    }

    function abrirModalPrecioProducto(producto) {
        productoPrecioEditandoId = Number(producto.productoID);
        document.getElementById('precio-producto-nombre').textContent = producto.nombre || 'Producto';
        document.getElementById('precio-rapido-ars').value = producto.precioARS ?? '';
        document.getElementById('precio-rapido-usd').value = producto.precioUSD ?? '';
        document.getElementById('precio-mensaje').hidden = true;
        document.getElementById('precio-mensaje').textContent = '';
        modalPrecioProducto.show();
    }

    async function guardarPrecioRapido(event) {
        event.preventDefault();
        if (!productoPrecioEditandoId) {
            return;
        }

        const precioARS = Number(document.getElementById('precio-rapido-ars').value);
        const precioUSD = Number(document.getElementById('precio-rapido-usd').value);
        const button = document.getElementById('guardar-precio-rapido');

        if (!Number.isFinite(precioARS) || !Number.isFinite(precioUSD) || precioARS < 0 || precioUSD < 0) {
            mostrarMensajePrecio('Ingresá importes válidos y no negativos.');
            return;
        }

        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Guardando...';

        try {
            const response = await fetch(`${linkApi}/productos/${productoPrecioEditandoId}/precios`, {
                method: 'PATCH',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ precioARS: precioARS, precioUSD: precioUSD })
            });

            if (!response.ok) {
                const error = await response.json().catch(function () { return null; });
                throw new Error(error && error.message ? error.message : 'No se pudo guardar el precio.');
            }

            modalPrecioProducto.hide();
            mostrarConfirmacionRapida('Precio actualizado correctamente.');
            obtenerProductos();
        } catch (error) {
            mostrarMensajePrecio(error.message || 'No se pudo guardar el precio.');
        } finally {
            button.disabled = false;
            button.innerHTML = '<i class="bi bi-check2" aria-hidden="true"></i> Guardar precio';
        }
    }

    async function cambiarDisponibilidad(producto) {
        const nuevoValor = !(producto.habilitadoVenta ?? producto.disponible);
        const accion = nuevoValor ? 'habilitar' : 'deshabilitar';
        let confirmado = true;

        if (window.Swal) {
            const respuesta = await Swal.fire({
                title: `${nuevoValor ? 'Habilitar' : 'Deshabilitar'} producto`,
                text: `¿Querés ${accion} la venta de ${producto.nombre}?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: nuevoValor ? 'Habilitar' : 'Deshabilitar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: nuevoValor ? '#6d28d9' : '#b93828'
            });
            confirmado = respuesta.isConfirmed;
        }

        if (!confirmado) {
            return;
        }

        try {
            const response = await fetch(`${linkApi}/productos/${producto.productoID}/disponibilidad`, {
                method: 'PATCH',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ disponible: nuevoValor })
            });

            if (!response.ok) {
                const error = await response.json().catch(function () { return null; });
                throw new Error(error && error.message ? error.message : 'No se pudo actualizar la disponibilidad.');
            }

            const resultado = await response.json();
            mostrarConfirmacionRapida(resultado.disponibilidadEfectiva ? 'Producto disponible para venta.' : 'Disponibilidad actualizada; el stock puede impedir la venta efectiva.');
            obtenerProductos();
        } catch (error) {
            mostrarConfirmacionRapida(error.message || 'No se pudo actualizar la disponibilidad.', 'error');
        }
    }

    function mostrarMensajePrecio(mensaje) {
        const element = document.getElementById('precio-mensaje');
        element.textContent = mensaje;
        element.hidden = false;
    }

    function mostrarConfirmacionRapida(mensaje, icono) {
        if (window.Swal) {
            Swal.fire({ text: mensaje, icon: icono || 'success', position: 'top-end', toast: true, timer: 3200, timerProgressBar: true, showConfirmButton: false });
        }
    }

    async function guardarProducto(event) {
        event.preventDefault();

        if (formularioProductoCargando) {
            return;
        }

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
            sku: document.getElementById('producto-sku').value.trim() || null,
            stockMinimo: Number(document.getElementById('producto-stock-minimo').value),
            imagenUrl: document.getElementById('producto-imagen-url').value.trim() || null,
            colores: Array.from(document.querySelectorAll('[data-color]'))
                .map(function (input) { return input.value.trim(); })
                .filter(Boolean)
                .map(function (color) { return { color: color }; }),
            cuotas: cuotasResultado.cuotas
        };

        const estaEditando = modoFormulario === 'editar';
        const idProducto = productoEditandoId;
        const url = estaEditando
            ? `${linkApi}/productos/${idProducto}`
            : `${linkApi}/productos`;

        try {
            const response = await fetch(url, {
                method: estaEditando ? 'PUT' : 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(function () { return null; });
                throw new Error(errorData && errorData.message ? errorData.message : 'No se pudo guardar el producto.');
            }

            modalNuevoProducto.hide();
            obtenerProductos();
            mostrarConfirmacionProducto(estaEditando);
        } catch (error) {
            mostrarFormMensaje(error.message);
        } finally {
            botonGuardar.disabled = false;
            actualizarTextoBotonGuardar();
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
        solicitudProductoEdicion += 1;
        modoFormulario = 'crear';
        productoEditandoId = null;
        productoBaseActual = null;
        prepararFormularioProductoLimpio();
        ocultarFormMensaje();
        alternarCargaFormulario(false);
        actualizarModalFormulario();
    }

    function prepararFormularioProductoLimpio() {
        const formulario = document.getElementById('form-nuevo-producto');
        if (!formulario) {
            return;
        }

        formulario.reset();
        formulario.classList.remove('was-validated');
        document.getElementById('producto-colores').innerHTML = '';
        document.getElementById('producto-cuotas').innerHTML = '';
        document.getElementById('producto-sku').value = '';
        document.getElementById('producto-stock-minimo').value = '1';
        document.getElementById('producto-imagen-preview').innerHTML = `<div class="image-preview-placeholder">
            <i class="bi bi-image" aria-hidden="true"></i>
            <span>La vista previa aparecerá aquí</span>
        </div>`;
        document.getElementById('producto-form-contenido').hidden = false;
    }

    function alternarCargaFormulario(cargando) {
        formularioProductoCargando = cargando;
        document.getElementById('producto-form-carga').hidden = !cargando;
        document.getElementById('producto-form-contenido').hidden = cargando;
        document.getElementById('form-nuevo-producto').setAttribute('aria-busy', String(cargando));

        const botonGuardar = document.getElementById('guardar-producto');
        botonGuardar.disabled = cargando;
        botonGuardar.innerHTML = cargando
            ? '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Cargando...'
            : '<i class="bi bi-check2" aria-hidden="true"></i> ' + (modoFormulario === 'editar' ? 'Guardar cambios' : 'Guardar producto');
    }

    function actualizarModalFormulario() {
        document.getElementById('modalNuevoProductoTitulo').textContent = modoFormulario === 'editar'
            ? 'Editar producto'
            : 'Nuevo producto';
        actualizarTextoBotonGuardar();
    }

    function actualizarTextoBotonGuardar() {
        const botonGuardar = document.getElementById('guardar-producto');
        botonGuardar.innerHTML = '<i class="bi bi-check2" aria-hidden="true"></i> '
            + (modoFormulario === 'editar' ? 'Guardar cambios' : 'Guardar producto');
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

    function mostrarConfirmacionProducto(estaEditando) {
        if (window.Swal) {
            Swal.fire({
                text: estaEditando
                    ? 'Producto actualizado correctamente.'
                    : 'Producto creado correctamente.',
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
        fetch(`${linkApi}/productos/admin`)
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
                cuerpo.innerHTML = '<tr><td colspan="9" class="table-message error-message">No se pudo cargar el inventario.</td></tr>';
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
                producto.sku,
                ...(producto.colores || [])
            ].join(' ').toLowerCase();
            const disponibilidadEfectiva = producto.disponibilidadEfectiva ?? producto.disponible;

            return (!query || textoBusqueda.includes(query))
                && (!categoria || producto.categoria === categoria)
                && (!estado || String(producto.estado) === estado)
                && (!disponibilidad || String(disponibilidadEfectiva) === disponibilidad);
        });

        cuerpo.innerHTML = filtrados.length
            ? filtrados.map(crearFilaProducto).join('')
            : '<tr><td colspan="9" class="table-message">No hay productos que coincidan con los filtros.</td></tr>';

        document.getElementById('contador-productos').textContent = `${filtrados.length} de ${productos.length} productos`;
    }

    function crearFilaProducto(producto) {
        const estado = estadoNombres[producto.estado] || 'Sin definir';
        const habilitadoVenta = producto.habilitadoVenta ?? producto.disponible;
        const disponibilidad = producto.disponibilidadEfectiva ?? producto.disponible;
        const disponibilidadTexto = disponibilidad
            ? 'Disponible'
            : (habilitadoVenta && producto.stockActual === 0 ? 'Agotado' : 'No disponible');
        const colores = producto.colores && producto.colores.length
            ? producto.colores.join(', ')
            : 'Sin colores cargados';
        const stockTexto = producto.stockActual === null || producto.stockActual === undefined
            ? 'Sin registrar'
            : Number(producto.stockActual).toLocaleString('es-AR');
        const stockClass = producto.estadoStock === 'Normal'
            ? 'is-normal'
            : producto.estadoStock === 'Bajo'
                ? 'is-low'
                : producto.estadoStock === 'Agotado' ? 'is-empty' : '';
        const availabilityTitle = habilitadoVenta
            ? (producto.stockActual === 0 ? 'Habilitado para venta, pero agotado' : 'Deshabilitar venta')
            : 'Habilitar venta';

        return `<tr>
            <td class="product-sku-cell">${escaparHtml(producto.sku || 'Sin SKU')}</td>
            <td>
                <div class="product-name-cell">${escaparHtml(producto.nombre)}</div>
                <small class="product-detail">${escaparHtml(colores)}</small>
            </td>
            <td>${escaparHtml(producto.categoria || 'Sin categoría')}</td>
            <td class="price-cell">${formatearMoneda(producto.precioARS, 'ARS')}</td>
            <td class="price-cell">${formatearMoneda(producto.precioUSD, 'USD')}</td>
            <td><span class="status-pill status-${String(producto.estado).toLowerCase()}">${estado}</span></td>
            <td><span class="stock-inline ${stockClass}" title="Stock mínimo: ${Number(producto.stockMinimo || 0).toLocaleString('es-AR')}">${stockTexto}</span></td>
            <td><span class="availability-pill ${disponibilidad ? 'is-available' : 'is-unavailable'}" title="${escaparHtml(habilitadoVenta ? 'Habilitado comercialmente' : 'Deshabilitado comercialmente')}">
                <span class="availability-dot" aria-hidden="true"></span>${disponibilidadTexto}
            </span></td>
            <td><div class="product-actions">
                <button type="button" class="btn-action btn-icon-only" data-action="price" data-producto-id="${producto.productoID}" title="Cambiar precio" aria-label="Cambiar precio de ${escaparHtml(producto.nombre)}"><i class="bi bi-currency-dollar" aria-hidden="true"></i></button>
                <button type="button" class="btn-action btn-icon-only" data-action="stock" data-producto-id="${producto.productoID}" title="Ajustar stock" aria-label="Ajustar stock de ${escaparHtml(producto.nombre)}"><i class="bi bi-boxes" aria-hidden="true"></i></button>
                <button type="button" class="btn-action btn-icon-only ${habilitadoVenta ? 'btn-availability-off' : ''}" data-action="availability" data-producto-id="${producto.productoID}" title="${availabilityTitle}" aria-label="${availabilityTitle} para ${escaparHtml(producto.nombre)}"><i class="bi ${habilitadoVenta ? 'bi-toggle-on' : 'bi-toggle-off'}" aria-hidden="true"></i></button>
                <button type="button" class="btn-action btn-icon-only" data-action="preview" data-producto-id="${producto.productoID}" title="Vista previa" aria-label="Vista previa de ${escaparHtml(producto.nombre)}"><i class="bi bi-eye" aria-hidden="true"></i></button>
                <button type="button" class="btn-action btn-edit-product" data-action="edit" data-producto-id="${producto.productoID}" aria-label="Editar ${escaparHtml(producto.nombre)}"><i class="bi bi-pencil-square" aria-hidden="true"></i><span>Editar</span></button>
            </div>
            </td>
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
