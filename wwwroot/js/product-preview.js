(function () {
    'use strict';

    const estadoNombres = { 1: 'Sellado', 2: 'Seminuevo' };
    const mapaColores = {
        negro: '#171717', black: '#171717', blanco: '#f8fafc', white: '#f8fafc', azul: '#2563eb', blue: '#2563eb', verde: '#16a34a', green: '#16a34a', rojo: '#dc2626', red: '#dc2626', amarillo: '#facc15', yellow: '#facc15', naranja: '#f97316', orange: '#f97316', rosa: '#ec4899', pink: '#ec4899', morado: '#7c3aed', purpura: '#7c3aed', purple: '#7c3aed', gris: '#94a3b8', gray: '#94a3b8', grey: '#94a3b8', plata: '#cbd5e1', silver: '#cbd5e1', dorado: '#d4a72c', gold: '#d4a72c', coral: '#fb7185', titanio: '#a8a29e', 'gris espacial': '#475569', 'space gray': '#475569', graphite: '#334155', grafito: '#334155', midnight: '#172554', starlight: '#f5ead5', 'natural titanium': '#a8a29e', 'sierra blue': '#7ca6c0', 'deep purple': '#5b21b6', 'pacific blue': '#0369a1'
    };

    let modalInstance;

    function renderCard(producto, options) {
        options = options || {};
        const product = normalizeProduct(producto);
        const productId = escapeHtml(product.productoID);
        const colors = product.colores;
        const visibleColors = colors.slice(0, 4);
        const extraColors = colors.slice(4);
        const cuotas = product.cuotas;
        const cuota = cuotas[0] || null;
        const isCatalog = options.mode === 'catalog';
        const availability = product.disponibilidadEfectiva;
        const imageUrl = normalizeImageUrl(product.imagenUrl);
        const footer = isCatalog
            ? availability
                ? `<a class="catalog-action" data-product-id="${productId}" href="${escapeHtml(options.whatsappUrl || '#')}" target="_blank" rel="noopener noreferrer"><i class="bi bi-whatsapp" aria-hidden="true"></i> Consultar por WhatsApp</a>`
                : '<span class="catalog-unavailable"><i class="bi bi-clock" aria-hidden="true"></i> No disponible ahora</span>'
            : `<span class="catalog-unavailable preview-availability ${availability ? 'preview-available' : ''}"><i class="bi ${availability ? 'bi-eye' : 'bi-clock'}" aria-hidden="true"></i> ${availability ? 'Disponible para consulta' : 'No disponible ahora'}</span>`;

        return `<article class="catalog-card preview-card" data-product-id="${productId}">
            <div class="catalog-device">
                ${imageUrl ? `<img class="catalog-product-image" src="${escapeHtml(imageUrl)}" alt="Imagen de ${escapeHtml(product.nombre)}" loading="lazy">${renderPlaceholder(true)}` : renderPlaceholder(false)}
            </div>
            <div class="catalog-card-body">
                <div class="catalog-card-top"><div class="catalog-card-heading"><p class="catalog-category">${escapeHtml((product.categoria || 'Equipo').toUpperCase())}</p><h2>${escapeHtml(product.nombre)}</h2></div><span class="catalog-status ${product.estado === 2 ? 'status-seminuevo' : ''}">${escapeHtml(estadoNombres[product.estado] || 'Sin definir')}</span></div>
                ${product.especificaciones.length ? `<p class="catalog-specifications">${product.especificaciones.map(escapeHtml).join(' <span aria-hidden="true">·</span> ')}</p>` : ''}
                ${colors.length ? `<div class="catalog-colors" data-color-count="${colors.length}"><div class="catalog-color-list">${visibleColors.map(function (color) { return renderSwatch(color, false); }).join('')}${extraColors.map(function (color) { return renderSwatch(color, true); }).join('')}</div>${extraColors.length ? (isCatalog ? `<button type="button" class="catalog-color-toggle" data-action="toggle-colors" aria-expanded="false" aria-label="Mostrar ${extraColors.length} colores más">+${extraColors.length} colores</button>` : `<span class="catalog-color-toggle preview-color-count">+${extraColors.length} colores</span>`) : ''}</div>` : ''}
                <div class="catalog-prices"><p class="catalog-price-ars">${formatMoney(product.precioARS, 'ARS')}</p><p class="catalog-price-usd">${formatMoney(product.precioUSD, 'USD')}</p></div>
                <div class="catalog-financing"><span class="financing-icon"><i class="bi bi-credit-card-2-front" aria-hidden="true"></i></span><div class="financing-copy"><strong>${cuota ? `Hasta ${cuota.cantidadCuotas} cuotas` : 'Financiación'}</strong><span>${cuota ? `de ${formatMoney(cuota.montoCuota, 'ARS')}` : 'Consultar alternativas disponibles'}</span></div>${isCatalog && cuota && options.plansButton ? options.plansButton : ''}</div>
                ${footer}
            </div>
        </article>`;
    }

    function open(producto, options) {
        options = options || {};
        const modal = document.getElementById('modalVistaPreviaProducto');
        const content = document.getElementById('vista-previa-contenido');
        if (!modal || !content) {
            return;
        }

        if (!modalInstance) {
            modalInstance = new bootstrap.Modal(modal);
        }

        content.innerHTML = renderCard(producto, { mode: 'preview' });
        document.getElementById('vista-previa-indicador').textContent = options.unsaved ? 'Cambios sin guardar' : 'Vista de publicación';
        modalInstance.show();
        activarFallbackImagenes(content);
    }

    function normalizeProduct(producto) {
        producto = producto || {};
        const disponible = producto.disponibilidadEfectiva ?? producto.disponible ?? producto.habilitadoVenta ?? false;
        return {
            productoID: producto.productoID ?? producto.ProductoID ?? producto.id ?? '',
            nombre: String(producto.nombre || producto.Nombre || 'Equipo'),
            categoria: String(producto.categoria || producto.Categoria || 'Equipo'),
            estado: Number(producto.estado ?? producto.Estado ?? 1),
            precioARS: Number(producto.precioARS ?? producto.PrecioARS ?? 0),
            precioUSD: Number(producto.precioUSD ?? producto.PrecioUSD ?? 0),
            habilitadoVenta: Boolean(producto.habilitadoVenta ?? producto.disponible ?? false),
            disponibilidadEfectiva: Boolean(disponible),
            imagenUrl: producto.imagenUrl ?? producto.ImagenUrl ?? '',
            colores: getColors(producto),
            cuotas: getInstallments(producto),
            especificaciones: getSpecifications(producto)
        };
    }

    function renderPlaceholder(hidden) {
        return `<span class="catalog-image-placeholder"${hidden ? ' hidden' : ''} role="img" aria-label="Imagen no disponible"><i class="bi bi-image" aria-hidden="true"></i><span>Imagen no disponible</span></span>`;
    }

    function renderSwatch(color, extra) {
        return `<span class="catalog-color-swatch${extra ? ' catalog-color-extra' : ''}" style="--catalog-swatch-color: ${resolveColor(color)}" role="img" aria-label="Color ${escapeHtml(color)}" title="${escapeHtml(color)}"${extra ? ' aria-hidden="true"' : ''}></span>`;
    }

    function activateFallbackImages(container) {
        container.querySelectorAll('.catalog-product-image').forEach(function (image) {
            image.addEventListener('error', function () {
                image.hidden = true;
                const placeholder = image.parentElement.querySelector('.catalog-image-placeholder');
                if (placeholder) {
                    placeholder.hidden = false;
                }
            });
        });
    }

    function getColors(producto) {
        const colors = producto.colores || producto.Colores || [];
        return Array.isArray(colors) ? colors.map(function (color) { return String(color || '').trim(); }).filter(Boolean) : [];
    }

    function getInstallments(producto) {
        const cuotas = producto.cuotas || producto.Cuotas || [];
        if (!Array.isArray(cuotas)) {
            return [];
        }

        return cuotas.map(function (cuota) {
            const medio = cuota.medioPago ?? cuota.MedioPago ?? cuota.medioPagoNombre ?? cuota.MedioPagoNombre ?? '';
            return { cantidadCuotas: Number(cuota.cantidadCuotas ?? cuota.CantidadCuotas ?? 0), montoCuota: Number(cuota.montoCuota ?? cuota.MontoCuota ?? 0), medioPago: typeof medio === 'object' ? String(medio.nombre ?? medio.Nombre ?? '') : String(medio || '') };
        }).filter(function (cuota) { return cuota.cantidadCuotas > 0; });
    }

    function getSpecifications(producto) {
        const values = producto.especificaciones || producto.especificacionesTecnicas || producto.specifications;
        if (Array.isArray(values)) return values.map(function (value) { return String(value || '').trim(); }).filter(Boolean);
        if (typeof values === 'string') return values.split(/[·|,]/).map(function (value) { return value.trim(); }).filter(Boolean);
        return [];
    }

    function resolveColor(name) {
        return mapaColores[normalizeText(name)] || '#cbd5e1';
    }

    function normalizeText(value) {
        return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function normalizeImageUrl(value) {
        const url = typeof value === 'string' ? value.trim() : '';
        return /^javascript:/i.test(url) ? '' : url;
    }

    function formatMoney(value, currency) {
        return `${currency} ${Number(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>'"]/g, function (character) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character];
        });
    }

    window.ProductPreview = { renderCard: renderCard, open: open, normalizeProduct: normalizeProduct, normalizeImageUrl: normalizeImageUrl, getColors: getColors, getInstallments: getInstallments, formatMoney: formatMoney, escapeHtml: escapeHtml, activateFallbackImages: activateFallbackImages };
})();
