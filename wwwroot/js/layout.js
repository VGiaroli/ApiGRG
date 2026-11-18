(function () {
    'use strict';

    function inicializarLayoutAdmin() {
        const placeholder = document.getElementById('navbar-placeholder');

        if (!placeholder || placeholder.dataset.layoutLoaded === 'true') {
            return;
        }

        placeholder.dataset.layoutLoaded = 'loading';

        fetch('/views/Components/sidebar.html')
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('No se pudo cargar el sidebar (' + response.status + ')');
                }

                return response.text();
            })
            .then(function (html) {
                placeholder.innerHTML = html;
                placeholder.dataset.layoutLoaded = 'true';

                if (typeof window.initAdminSidebar === 'function') {
                    window.initAdminSidebar();
                }

                if (typeof window.verificarUsuario === 'function') {
                    window.verificarUsuario();
                }
            })
            .catch(function (error) {
                placeholder.dataset.layoutLoaded = 'error';
                console.error('Error cargando sidebar:', error);
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarLayoutAdmin, { once: true });
    } else {
        inicializarLayoutAdmin();
    }
})();
