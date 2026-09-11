function cargarComponente(id, path) {
  return fetch(path)
    .then(res => res.text())
    .then(html => {
      document.getElementById(id).innerHTML = html;
    });
}

function cargarVista(view) {
  fetch(`../views/${view}.html`)
    .then(res => res.text())
    .then(html => {
      const app = document.getElementById('app');
      app.innerHTML = html;

      // Ejecutar scripts de la vista si hay
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const scripts = tempDiv.querySelectorAll('script');

      scripts.forEach(script => {
        const nuevoScript = document.createElement('script');
        if (script.src) {
          nuevoScript.src = script.src;
        } else {
          nuevoScript.textContent = script.textContent;
        }
        document.body.appendChild(nuevoScript);
      });
    });
}

function cargarVistaPorHash() {
  const vista = window.location.hash.replace('#', '') || 'Asignaturas/Asignatura';
  cargarVista(vista);
  actualizarLinkActivo(); // 👈 Asegurate de actualizar los estilos del menú
}

function navigateTo(vista) {
  window.location.hash = vista;
}

function actualizarLinkActivo() {

  // //CERRAR EL MENU HAMBURGUESA CADA VEZ QUE SELECCIONA UNA ACCION
  // const sidebar = document.querySelector(".sidebar");
  // const menuToggler = document.querySelector(".menu-toggler");
  // sidebar.style.height = "56px";
  // menuToggler.querySelector("span").innerText = "menu";
  // //FIN CERRAR EL MENU HAMBURGUESA CADA VEZ QUE SELECCIONA UNA ACCION

  const vistaActual = window.location.hash.replace('#', '') || 'home';

  // Elimina la clase 'active' de todos los nav-items y links
  const todosItemsNav = document.querySelectorAll('.nav-item');
  todosItemsNav.forEach(item => item.classList.remove('active'));

  const todosLinks = document.querySelectorAll('a[href^="#"]');
  todosLinks.forEach(link => {
    const hrefVista = link.getAttribute('href').replace('#', '');
    if (hrefVista === vistaActual) {
      link.classList.add('active');

      // Agrega clase active al nav-item padre si existe
      const itemNavPadre = link.closest('.nav-item');
      if (itemNavPadre) {
        itemNavPadre.classList.add('active');
      }

      const contenedorColapsar = link.closest('.collapse');

      if (contenedorColapsar) {
        // Si está dentro de un collapse, abrirlo
        contenedorColapsar.classList.add('show');
        const linkColapsar = document.querySelector(`[data-target="#${contenedorColapsar.id}"]`);
        //console.log(linkColapsar);
        if (linkColapsar) {
          linkColapsar.classList.remove('collapsed');
          linkColapsar.setAttribute('aria-expanded', 'true');
        }
      } else {
        // Si NO está dentro de un collapse, cerrar todos los collapses
        document.querySelectorAll('.collapse').forEach(collapse => {
          collapse.classList.remove('show');
        });
        document.querySelectorAll('[data-linkColapsar="collapse"]').forEach(linkColapsar => {
          linkColapsar.classList.add('collapsed');
          linkColapsar.setAttribute('aria-expanded', 'false');
        });
      }
    } else {
      link.classList.remove('active');
    }
  });
}

// Inicializar
//hashchange evento de ejecutar una funcion cuando cambia el hash del link
window.addEventListener('hashchange', cargarVistaPorHash);
//load se ejecuta cuando toda la página, incluyendo todos los recursos, ha sido cargada completamente. 
window.addEventListener('load', actualizarLinkActivo);
//DOMContentLoaded se ejecuta cuando el HTML ha sido completamente cargado y analizado, sin importar si los recursos externos (imágenes, hojas de estilo, etc.) se han cargado
window.addEventListener('DOMContentLoaded', () => {
  cargarComponente('accordionSidebar', '../views/components/sidebar.html')
  .then(() => {//ES UNA PROMESA QUE DESENCADENA UNA ACCION
    initSidebar(); // 👈 acá está la clave
    actualizarLinkActivo(); //Se ejecuta después de cargar el menú
  });

  cargarComponente('footer', '../views/components/footer.html');
  cargarVistaPorHash();
  setTimeout("verificarUsuario();", 200);//Se ejecuta después de cargar el menú 
});