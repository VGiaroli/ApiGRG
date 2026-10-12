'use strict';

(function () {
    function normalizarRuta(pathname) {
        var ruta = pathname.replace(/\/+$/, '') || '/';
        return ruta === '/index.html' ? '/' : ruta;
    }

    function esCatalogo(ruta) {
        return ruta === '/catalogo.html';
    }

    function esServicios(ruta) {
        return ruta === '/servicios.html';
    }

    function cerrarMenuMovil(contenedor) {
        var toggle = contenedor.querySelector('[data-bs-toggle="dropdown"]');
        if (toggle && window.bootstrap && bootstrap.Dropdown) {
            bootstrap.Dropdown.getOrCreateInstance(toggle).hide();
        }
    }

    function inicializarComportamientoScroll(contenedor) {
        var header = contenedor.querySelector('#mainHeader');
        if (!header || header.dataset.publicNavbarScrollInitialized === 'true') {
            return;
        }

        function actualizarHeader() {
            header.classList.toggle('scrolled', window.scrollY > 40);
        }

        actualizarHeader();
        window.addEventListener('scroll', actualizarHeader, { passive: true });
        header.dataset.publicNavbarScrollInitialized = 'true';
    }

    function inicializarNavbar(contenedor) {
        if (!contenedor || contenedor.dataset.publicNavbarInitialized === 'true') {
            return;
        }

        var rutaActual = normalizarRuta(window.location.pathname);
        var catalogoActivo = esCatalogo(rutaActual);
        var serviciosActivo = esServicios(rutaActual);
        var menuToggle = contenedor.querySelector('[data-bs-toggle="dropdown"]');

        inicializarComportamientoScroll(contenedor);

        if (menuToggle && window.bootstrap && bootstrap.Dropdown) {
            bootstrap.Dropdown.getOrCreateInstance(menuToggle);
        }

        contenedor.querySelectorAll('[data-public-nav]').forEach(function (enlace) {
            var tipo = enlace.getAttribute('data-public-nav');
            var activo = (tipo === 'catalog' && catalogoActivo)
                || (tipo === 'services' && serviciosActivo)
                || (tipo === 'home' && !catalogoActivo && !serviciosActivo);

            enlace.classList.toggle('active', activo);
            if (activo) {
                enlace.setAttribute('aria-current', 'page');
            } else {
                enlace.removeAttribute('aria-current');
            }

            enlace.addEventListener('click', function () {
                cerrarMenuMovil(contenedor);
            });
        });

        contenedor.querySelectorAll('[data-public-section]').forEach(function (enlace) {
            var seccion = enlace.getAttribute('data-public-section');
            enlace.setAttribute('href', (catalogoActivo || serviciosActivo) ? '/#' + seccion : '#' + seccion);
            enlace.addEventListener('click', function () {
                cerrarMenuMovil(contenedor);
            });
        });

        contenedor.dataset.publicNavbarInitialized = 'true';
    }

    function cargarNavbarPublico() {
        var placeholder = document.getElementById('public-navbar-placeholder');
        if (!placeholder || placeholder.dataset.publicNavbarLoaded === 'true') {
            return;
        }

        placeholder.dataset.publicNavbarLoaded = 'true';

        fetch('/views/Components/public-navbar.html')
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('No se pudo cargar el navbar público');
                }
                return response.text();
            })
            .then(function (html) {
                placeholder.innerHTML = html;
                inicializarNavbar(placeholder);
            })
            .catch(function (error) {
                placeholder.dataset.publicNavbarLoaded = 'false';
                console.error('Error cargando navbar público:', error);
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', cargarNavbarPublico, { once: true });
    } else {
        cargarNavbarPublico();
    }
})();
