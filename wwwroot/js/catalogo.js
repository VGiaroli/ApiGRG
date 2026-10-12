(function () {
    'use strict';

    const estadoNombres = {
        1: 'Sellado',
        2: 'Seminuevo'
    };

    const mapaColores = {
        negro: '#171717',
        black: '#171717',
        blanco: '#f8fafc',
        white: '#f8fafc',
        azul: '#2563eb',
        blue: '#2563eb',
        verde: '#16a34a',
        green: '#16a34a',
        rojo: '#dc2626',
        red: '#dc2626',
        amarillo: '#facc15',
        yellow: '#facc15',
        naranja: '#f97316',
        orange: '#f97316',
        rosa: '#ec4899',
        pink: '#ec4899',
        morado: '#7c3aed',
        purpura: '#7c3aed',
        purple: '#7c3aed',
        gris: '#94a3b8',
        gray: '#94a3b8',
        grey: '#94a3b8',
        plata: '#cbd5e1',
        silver: '#cbd5e1',
        dorado: '#d4a72c',
        gold: '#d4a72c',
        coral: '#fb7185',
        titanio: '#a8a29e',
        'gris espacial': '#475569',
        'space gray': '#475569',
        graphite: '#334155',
        grafito: '#334155',
        midnight: '#172554',
        starlight: '#f5ead5',
        'natural titanium': '#a8a29e',
        'sierra blue': '#7ca6c0',
        'deep purple': '#5b21b6',
        'pacific blue': '#0369a1'
    };

    let productos = [];
    let modalProducto = null;
    let modalTrigger = null;
    const planesSeleccionados = new Map();

    document.addEventListener('DOMContentLoaded', function () {
        const filtros = [
            document.getElementById('catalogo-busqueda'),
            document.getElementById('catalogo-categoria'),
            document.getElementById('catalogo-estado'),
            document.getElementById('catalogo-disponibilidad')
        ];

        inicializarNavegacionPublica();

        filtros.forEach(function (filtro) {
            filtro.addEventListener(filtro.tagName === 'INPUT' ? 'input' : 'change', renderizarCatalogo);
        });

        document.getElementById('catalogo-limpiar-filtros').addEventListener('click', limpiarFiltros);
        document.getElementById('catalogo-limpiar-vacio').addEventListener('click', limpiarFiltros);
        document.getElementById('catalogo-reintentar').addEventListener('click', obtenerProductos);

        const grid = document.getElementById('catalogo-grid');
        grid.addEventListener('click', manejarClickGrid);

        const modal = document.getElementById('catalogo-modal-planes');
        modal.addEventListener('click', manejarClickModal);
        modal.addEventListener('change', manejarCambioModal);
        document.addEventListener('keydown', manejarTeclaDocumento);

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
                ...obtenerColores(producto)
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
        const productoId = obtenerIdProducto(producto);
        const nombre = String(producto.nombre || 'Equipo');
        const estado = estadoNombres[producto.estado] || 'Sin definir';
        const colores = obtenerColores(producto);
        const cuotas = obtenerCuotas(producto);
        const cuota = cuotas[0] || null;
        const disponible = producto.disponible === true;
        const imagenUrl = normalizarImagenUrl(producto.imagenUrl);
        const especificaciones = obtenerEspecificaciones(producto);
        const coloresVisibles = colores.slice(0, 4);
        const coloresExtra = colores.slice(4);
        const planSeleccionado = productoId ? planesSeleccionados.get(productoId) : null;
        const dataProducto = escaparHtml(productoId);

        return `<article class="catalog-card" data-product-id="${dataProducto}">
            <div class="catalog-device">
                ${imagenUrl
                    ? `<img class="catalog-product-image" src="${escaparHtml(imagenUrl)}" alt="Imagen de ${escaparHtml(nombre)}" loading="lazy">
                        ${renderizarPlaceholder(true)}`
                    : renderizarPlaceholder(false)}
            </div>

            <div class="catalog-card-body">
                <div class="catalog-card-top">
                    <div class="catalog-card-heading">
                        <p class="catalog-category">${escaparHtml((producto.categoria || 'Equipo').toString().toUpperCase())}</p>
                        <h2>${escaparHtml(nombre)}</h2>
                    </div>
                    <span class="catalog-status ${producto.estado === 2 ? 'status-seminuevo' : ''}">${escaparHtml(estado)}</span>
                </div>

                ${especificaciones.length
                    ? `<p class="catalog-specifications">${especificaciones.map(escaparHtml).join(' <span aria-hidden="true">·</span> ')}</p>`
                    : ''}

                ${colores.length
                    ? `<div class="catalog-colors" data-color-count="${colores.length}">
                        <div class="catalog-color-list">
                            ${coloresVisibles.map(function (color) { return renderizarSwatch(color, false); }).join('')}
                            ${coloresExtra.map(function (color) { return renderizarSwatch(color, true); }).join('')}
                        </div>
                        ${coloresExtra.length
                            ? `<button type="button" class="catalog-color-toggle" data-action="toggle-colors" aria-expanded="false" aria-label="Mostrar ${coloresExtra.length} colores más">
                                +${coloresExtra.length} colores
                            </button>`
                            : ''}
                    </div>`
                    : ''}

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
                    ${cuota
                        ? `<button type="button" class="catalog-plans-button" data-action="open-plans" data-product-id="${dataProducto}">
                            Ver planes <span aria-hidden="true">›</span>
                        </button>`
                        : ''}
                </div>

                ${disponible
                    ? `<a class="catalog-action" data-product-id="${dataProducto}" href="${construirUrlWhatsApp(producto, planSeleccionado)}" target="_blank" rel="noopener noreferrer">
                        <i class="bi bi-whatsapp" aria-hidden="true"></i> Consultar por WhatsApp
                    </a>`
                    : '<span class="catalog-unavailable"><i class="bi bi-clock" aria-hidden="true"></i> No disponible ahora</span>'}
            </div>
        </article>`;
    }

    function renderizarPlaceholder(oculto) {
        return `<span class="catalog-image-placeholder"${oculto ? ' hidden' : ''} role="img" aria-label="Imagen no disponible">
            <i class="bi bi-image" aria-hidden="true"></i>
            <span>Imagen no disponible</span>
        </span>`;
    }

    function renderizarSwatch(nombreColor, esExtra) {
        const nombre = String(nombreColor || 'Color');
        const clase = esExtra ? 'catalog-color-swatch catalog-color-extra' : 'catalog-color-swatch';
        return `<span class="${clase}" style="--catalog-swatch-color: ${resolverColorVisual(nombre)}" role="img" aria-label="Color ${escaparHtml(nombre)}" title="${escaparHtml(nombre)}"${esExtra ? ' aria-hidden="true"' : ''}></span>`;
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

    function manejarClickGrid(evento) {
        const planes = evento.target.closest('[data-action="open-plans"]');
        if (planes) {
            abrirModalPlanes(planes.dataset.productId, planes);
            return;
        }

        const toggleColores = evento.target.closest('[data-action="toggle-colors"]');
        if (toggleColores) {
            alternarColores(toggleColores);
        }
    }

    function alternarColores(boton) {
        const contenedor = boton.closest('.catalog-colors');
        const expandido = contenedor.classList.toggle('is-expanded');
        boton.setAttribute('aria-expanded', String(expandido));
        boton.innerHTML = expandido
            ? 'Ocultar colores <span aria-hidden="true">‹</span>'
            : `+${contenedor.querySelectorAll('.catalog-color-extra').length} colores`;
        contenedor.querySelectorAll('.catalog-color-extra').forEach(function (swatch) {
            swatch.setAttribute('aria-hidden', String(!expandido));
        });
    }

    function abrirModalPlanes(productoId, elementoTrigger) {
        const producto = productos.find(function (item) {
            return obtenerIdProducto(item) === String(productoId);
        });
        const cuotas = producto ? obtenerCuotas(producto) : [];
        const modal = document.getElementById('catalogo-modal-planes');

        if (!producto || !cuotas.length || !modal) {
            return;
        }

        modalProducto = producto;
        modalTrigger = elementoTrigger;
        modal.dataset.productId = String(productoId);
        document.getElementById('catalogo-modal-titulo').textContent = `Planes para ${producto.nombre || 'este equipo'}`;
        document.getElementById('catalogo-modal-descripcion').textContent = 'Elegí una alternativa para consultar junto con tu mensaje de WhatsApp.';
        renderizarPlanesModal(producto, cuotas);

        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('catalog-modal-open');
        modal.querySelector('.catalog-modal-close').focus();
    }

    function renderizarPlanesModal(producto, cuotas) {
        const seleccionado = planesSeleccionados.get(obtenerIdProducto(producto));
        const lista = document.getElementById('catalogo-modal-lista');

        lista.innerHTML = cuotas.map(function (cuota, indice) {
            const esSeleccionado = seleccionado && seleccionado.indice === indice;
            return `<label class="catalog-plan-option${esSeleccionado ? ' is-selected' : ''}">
                <input type="radio" name="catalogo-plan" value="${indice}"${esSeleccionado ? ' checked' : ''}>
                <span class="catalog-plan-radio" aria-hidden="true"></span>
                <span class="catalog-plan-copy">
                    <strong>${cuota.cantidadCuotas} cuotas de ${formatearMoneda(cuota.montoCuota, 'ARS')}</strong>
                    ${cuota.medioPago ? `<span>${escaparHtml(cuota.medioPago)}</span>` : ''}
                </span>
            </label>`;
        }).join('');
    }

    function manejarCambioModal(evento) {
        if (!evento.target.matches('input[name="catalogo-plan"]') || !modalProducto) {
            return;
        }

        const indice = Number(evento.target.value);
        const cuotas = obtenerCuotas(modalProducto);
        const cuota = cuotas[indice];
        const productoId = obtenerIdProducto(modalProducto);

        if (!cuota || !productoId) {
            return;
        }

        planesSeleccionados.set(productoId, { ...cuota, indice: indice });
        document.querySelectorAll('.catalog-plan-option').forEach(function (opcion) {
            opcion.classList.toggle('is-selected', opcion.querySelector('input').checked);
        });
        actualizarEnlaceWhatsApp(productoId);
        document.getElementById('catalogo-modal-estado').textContent = 'Plan seleccionado para tu consulta.';
    }

    function actualizarEnlaceWhatsApp(productoId) {
        const producto = productos.find(function (item) {
            return obtenerIdProducto(item) === String(productoId);
        });
        const enlace = [...document.querySelectorAll('.catalog-action[data-product-id]')].find(function (item) {
            return item.dataset.productId === String(productoId);
        });

        if (producto && enlace) {
            enlace.href = construirUrlWhatsApp(producto, planesSeleccionados.get(String(productoId)) || null);
        }
    }

    function manejarClickModal(evento) {
        if (evento.target === evento.currentTarget || evento.target.closest('[data-action="close-plans"]')) {
            cerrarModalPlanes();
        }
    }

    function manejarTeclaDocumento(evento) {
        const modal = document.getElementById('catalogo-modal-planes');
        if (!modal || modal.hidden) {
            return;
        }

        if (evento.key === 'Escape') {
            evento.preventDefault();
            cerrarModalPlanes();
            return;
        }

        if (evento.key !== 'Tab') {
            return;
        }

        const elementosEnfocables = [...modal.querySelectorAll('button, input')].filter(function (elemento) {
            return !elemento.disabled;
        });
        const primerElemento = elementosEnfocables[0];
        const ultimoElemento = elementosEnfocables[elementosEnfocables.length - 1];

        if (evento.shiftKey && document.activeElement === primerElemento) {
            evento.preventDefault();
            ultimoElemento.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimoElemento) {
            evento.preventDefault();
            primerElemento.focus();
        }
    }

    function cerrarModalPlanes() {
        const modal = document.getElementById('catalogo-modal-planes');
        if (!modal || modal.hidden) {
            return;
        }

        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('catalog-modal-open');

        if (modalTrigger && document.body.contains(modalTrigger)) {
            modalTrigger.focus();
        }

        modalProducto = null;
        modalTrigger = null;
    }

    function obtenerIdProducto(producto) {
        const id = producto && (producto.productoID ?? producto.ProductoID ?? producto.id ?? producto.ID);
        return id === undefined || id === null ? '' : String(id);
    }

    function obtenerColores(producto) {
        const colores = producto && (producto.colores || producto.Colores);
        return Array.isArray(colores)
            ? colores.map(function (color) { return String(color || '').trim(); }).filter(Boolean)
            : [];
    }

    function obtenerCuotas(producto) {
        const cuotas = producto && (producto.cuotas || producto.Cuotas);
        if (!Array.isArray(cuotas)) {
            return [];
        }

        return cuotas.map(function (cuota) {
            const medioPago = cuota.medioPago ?? cuota.MedioPago ?? cuota.medioPagoNombre ?? cuota.MedioPagoNombre ?? '';
            return {
                cantidadCuotas: Number(cuota.cantidadCuotas ?? cuota.CantidadCuotas ?? 0),
                montoCuota: Number(cuota.montoCuota ?? cuota.MontoCuota ?? 0),
                medioPago: typeof medioPago === 'object'
                    ? String(medioPago.nombre ?? medioPago.Nombre ?? '')
                    : String(medioPago || '')
            };
        }).filter(function (cuota) {
            return cuota.cantidadCuotas > 0;
        });
    }

    function obtenerEspecificaciones(producto) {
        const datos = producto && (producto.especificaciones || producto.especificacionesTecnicas || producto.specifications);
        if (Array.isArray(datos)) {
            return datos.map(function (dato) { return String(dato || '').trim(); }).filter(Boolean);
        }

        if (typeof datos === 'string') {
            return datos.split(/[·|,]/).map(function (dato) { return dato.trim(); }).filter(Boolean);
        }

        return [];
    }

    function resolverColorVisual(nombreColor) {
        const normalizado = normalizarTexto(nombreColor);
        return mapaColores[normalizado] || '#cbd5e1';
    }

    function normalizarTexto(valor) {
        return String(valor || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function normalizarImagenUrl(valor) {
        const url = typeof valor === 'string' ? valor.trim() : '';
        return /^javascript:/i.test(url) ? '' : url;
    }

    function formatearMoneda(valor, moneda) {
        const numero = Number(valor || 0);
        const prefijo = moneda ? `${moneda} ` : '';
        return `${prefijo}${numero.toLocaleString('es-AR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })}`;
    }

    function construirUrlWhatsApp(producto, plan) {
        const mensaje = construirMensajeWhatsApp(producto, plan);
        return `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    }

    function construirMensajeWhatsApp(producto, plan) {
        const nombre = String(producto.nombre || 'este equipo');
        const precio = formatearMoneda(producto.precioARS, 'ARS');

        if (!plan) {
            return `Hola GRG, me interesa el equipo ${nombre}. Precio: ${precio}. ¿Podrían brindarme más información?`;
        }

        const medioPago = plan.medioPago ? ` con ${plan.medioPago}` : '';
        return `Hola GRG, me interesa el equipo ${nombre}. Precio: ${precio}. Quisiera consultar por el plan de ${plan.cantidadCuotas} cuotas de ${formatearMoneda(plan.montoCuota, 'ARS')}${medioPago}.`;
    }

    function limpiarFiltros() {
        document.getElementById('catalogo-busqueda').value = '';
        document.getElementById('catalogo-categoria').value = '';
        document.getElementById('catalogo-estado').value = '';
        document.getElementById('catalogo-disponibilidad').value = '';
        renderizarCatalogo();
    }

    function inicializarNavegacionPublica() {
        const toggle = document.getElementById('public-nav-toggle');
        const nav = document.getElementById('public-site-nav');

        if (!toggle || !nav) {
            return;
        }

        toggle.addEventListener('click', function () {
            const abierto = nav.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(abierto));
            toggle.setAttribute('aria-label', abierto ? 'Cerrar navegación' : 'Abrir navegación');
        });

        nav.querySelectorAll('a').forEach(function (enlace) {
            enlace.addEventListener('click', function () {
                nav.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.setAttribute('aria-label', 'Abrir navegación');
            });
        });
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
