(function () {
    'use strict';

    const sidebarStorageKey = 'adminHMD.sidebarMini';
    const themeStorageKey = 'adminHMD.colorTheme';
    const desktopMedia = '(min-width: 992px)';

    function isDesktop() {
        return window.matchMedia(desktopMedia).matches;
    }

    function canUseStorage() {
        try {
            const testKey = sidebarStorageKey + '.test';
            window.localStorage.setItem(testKey, '1');
            window.localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    function getSavedMiniState(storageAvailable) {
        return storageAvailable && window.localStorage.getItem(sidebarStorageKey) === 'true';
    }

    function saveMiniState(storageAvailable, isMini) {
        if (storageAvailable) {
            window.localStorage.setItem(sidebarStorageKey, String(isMini));
        }
    }

    function applyTheme(storageAvailable) {
        const savedTheme = storageAvailable ? window.localStorage.getItem(themeStorageKey) : null;
        const theme = savedTheme === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.setAttribute('data-bs-theme', theme);
    }

    function normalizePath(path) {
        const withoutQuery = (path || '/').split('?')[0].split('#')[0];
        if (withoutQuery.length <= 1) {
            return '/';
        }

        return withoutQuery.replace(/\/+$/, '').toLowerCase();
    }

    function updateActiveLink() {
        const currentPath = normalizePath(window.location.pathname);
        document.querySelectorAll('.sidebar-nav .nav-link, .sidebar-bottom-nav .nav-link').forEach(function (link) {
            const target = normalizePath(new URL(link.href, window.location.origin).pathname);
            const active = target !== '/' && (currentPath === target || currentPath.indexOf(target + '/') === 0);
            link.classList.toggle('active', active);
            if (active) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }

    function initValidation() {
        document.querySelectorAll('.needs-validation').forEach(function (form) {
            if (form.dataset.validationInitialized === 'true') {
                return;
            }

            form.dataset.validationInitialized = 'true';
            form.addEventListener('submit', function (event) {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }

                form.classList.add('was-validated');
            });
        });
    }

    function initTableSearch() {
        document.querySelectorAll('[data-table-search]').forEach(function (input) {
            if (input.dataset.tableSearchInitialized === 'true') {
                return;
            }

            const table = document.getElementById(input.getAttribute('data-table-search'));
            if (!table) {
                return;
            }

            input.dataset.tableSearchInitialized = 'true';
            input.addEventListener('input', function () {
                const query = input.value.trim().toLowerCase();
                table.querySelectorAll('tbody tr').forEach(function (row) {
                    row.hidden = query !== '' && row.textContent.toLowerCase().indexOf(query) === -1;
                });
            });
        });
    }

    function initUserProfile() {
        const user = window.adminHMDUser;
        if (!user) {
            return;
        }

        document.querySelectorAll('.profile-name').forEach(function (element) {
            element.textContent = user.name || '';
        });
        document.querySelectorAll('.profile-button img').forEach(function (image) {
            if (user.avatar) {
                image.src = user.avatar;
            }
            if (user.name) {
                image.alt = user.name;
            }
        });
    }

    function initAdminSidebar() {
        const body = document.body;
        const sidebar = document.getElementById('adminSidebar');
        if (!sidebar || body.dataset.sidebarInitialized === 'true') {
            return;
        }

        body.dataset.sidebarInitialized = 'true';
        const storageAvailable = canUseStorage();
        const sidebarToggle = document.querySelector('[data-sidebar-toggle]');
        const mediaQuery = window.matchMedia(desktopMedia);

        applyTheme(storageAvailable);
        initValidation();
        initTableSearch();
        initUserProfile();
        updateActiveLink();

        function setToggleExpanded() {
            if (!sidebarToggle) {
                return;
            }

            const expanded = isDesktop()
                ? !body.classList.contains('sidebar-mini')
                : body.classList.contains('sidebar-open');
            sidebarToggle.setAttribute('aria-expanded', String(expanded));
        }

        function closeMobileSidebar() {
            body.classList.remove('sidebar-open');
            setToggleExpanded();
        }

        function toggleSidebar() {
            if (isDesktop()) {
                body.classList.toggle('sidebar-mini');
                saveMiniState(storageAvailable, body.classList.contains('sidebar-mini'));
            } else {
                body.classList.toggle('sidebar-open');
            }

            setToggleExpanded();
        }

        if (getSavedMiniState(storageAvailable) && isDesktop()) {
            body.classList.add('sidebar-mini');
        }

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', toggleSidebar);
        }

        document.querySelectorAll('[data-sidebar-close], .sidebar-nav .nav-link, .sidebar-bottom-nav .nav-link').forEach(function (element) {
            element.addEventListener('click', function () {
                if (!isDesktop()) {
                    closeMobileSidebar();
                }
            });
        });

        document.querySelectorAll('[data-action="logout"]').forEach(function (element) {
            element.addEventListener('click', function (event) {
                event.preventDefault();
                if (typeof window.cerrarSesion === 'function') {
                    window.cerrarSesion();
                } else {
                    window.location.href = '/views/Usuarios/login.html';
                }
            });
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && !isDesktop()) {
                closeMobileSidebar();
            }
        });

        function handleBreakpointChange() {
            if (isDesktop()) {
                body.classList.remove('sidebar-open');
                if (getSavedMiniState(storageAvailable)) {
                    body.classList.add('sidebar-mini');
                }
            } else {
                body.classList.remove('sidebar-mini');
            }

            setToggleExpanded();
        }

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleBreakpointChange);
        } else if (mediaQuery.addListener) {
            mediaQuery.addListener(handleBreakpointChange);
        }

        setToggleExpanded();
    }

    window.initAdminSidebar = initAdminSidebar;
})();
