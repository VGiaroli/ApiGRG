// layout.js
// Se encarga de insertar el sidebar (Components/sidebar.html) en cualquier
// vista que tenga un <div id="navbar-placeholder"></div>.
// Así evitamos copiar el mismo bloque de fetch + createElement en cada HTML:
// cada vista solo necesita incluir <script src="/js/layout.js"></script>.

document.addEventListener('DOMContentLoaded', function () {
  var placeholder = document.getElementById('navbar-placeholder');

  if (!placeholder) {
    return; // esta vista no usa sidebar (ej: login), no hacemos nada
  }

  fetch('/views/Components/sidebar.html')
    .then(function (response) {
      if (!response.ok) {
        throw new Error('No se pudo cargar el sidebar (' + response.status + ')');
      }
      return response.text();
    })
    .then(function (html) {
      placeholder.innerHTML = html;

      // sidebar.html trae un <script src="/wwwroot/js/sidebar.js">, pero al insertarlo
      // con innerHTML el navegador NO lo ejecuta (restricción de seguridad del DOM).
      // Por eso hace falta agregarlo a mano con createElement.
      var script = document.createElement('script');
      script.src = '/js/sidebar.js';
      document.body.appendChild(script);
    })
    .catch(function (error) {
      console.error('Error cargando sidebar:', error);
    });
});