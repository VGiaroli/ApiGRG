(function () {
  'use strict';

var WHATSAPP_NEGOCIO = '5493562453598'; // 549 + característica + número, sin 0 ni 15

  // Contenido del panel de cada servicio.
  var SERVICE_INFO = {
    diagnostico: {
      color: '#2F6F76',
      title: 'Diagnóstico',
      text: 'Antes de tocar nada, revisamos el equipo y te contamos qué tiene. Así sabés qué esperar antes de decidir si seguís con la reparación.',
      items: ['Evaluación sin compromiso', 'Presupuesto antes de intervenir el equipo', 'Consultar disponibilidad y condiciones']
    },
    reparacion: {
      color: '#B0432B',
      title: 'Reparación',
      text: 'Solucionamos la falla con los repuestos que el equipo necesite, acordes a la marca y el modelo.',
      items: ['Repuestos según marca y modelo', 'Consultar disponibilidad y condiciones', 'Consultar disponibilidad y condiciones']
    },
    inspeccion: {
      color: '#5C7A3D',
      title: 'Inspección técnica',
      text: 'Un chequeo completo del equipo para saber si sigue en condiciones de uso, antes de que la falla aparezca.',
      items: ['Revisión de los componentes principales', 'Informe con el estado del equipo', 'Consultar disponibilidad y condiciones']
    },
    mantenimiento: {
      color: '#C98A3E',
      title: 'Mantenimiento',
      text: 'Limpieza y ajustes preventivos para que la falla no vuelva y el equipo rinda como el primer día.',
      items: ['Limpieza interna y externa', 'Ajustes preventivos', 'Consultar disponibilidad y condiciones']
    }
  };

  // Las reglas de validación viven en /js/validaciones-servicio.js (compartidas con la vista de administración).
var CAMPOS = ['nombre', 'numero', 'dni', 'email', 'localidad'];
var REGLA_DE = { nombre: 'nombreCompleto' };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var form = document.getElementById('serviceForm');
    var confirmBox = document.getElementById('confirm');
    var formSection = document.getElementById('form-section');
    var openFormBtn = document.getElementById('openForm');
    var closeFormBtn = document.getElementById('closeForm');
    var resetBtn = document.getElementById('resetForm');
    var submitBtn = form ? form.querySelector('button[type="submit"]') : null;
    var submitError = document.getElementById('serviceSubmitError');
    var envioEnCurso = false;
    var cards = document.querySelectorAll('.service-card[data-service]');
    var panel = document.getElementById('servicePanel');
    var panelIcon = document.getElementById('servicePanelIcon');
    var panelTitle = document.getElementById('servicePanelTitle');
    var panelText = document.getElementById('servicePanelText');
    var panelList = document.getElementById('servicePanelList');

    // Si falta algo del HTML, cortamos acá en vez de tirar un error en consola.
    if (!form || !confirmBox || !formSection) return;

    var V = window.ValidacionesServicio;
    if (!V) {
      console.error('Falta cargar /js/validaciones-servicio.js antes de servicios.js');
      return;
    }

    /* ---------- Helpers ---------- */

    function valor(id) {
      var el = document.getElementById(id);
      return el ? el.value.trim() : '';
    }

    function texto(id, contenido) {
      var el = document.getElementById(id);
      if (el) el.textContent = contenido;
    }

    /* ---------- Modal del formulario ---------- */

      function volverAlFormulario() {
      form.hidden = false;
      confirmBox.hidden = true;
      mostrarPaso(1);
    }
    function abrirFormulario() {
      // Si quedó la confirmación de un envío anterior, arrancamos de cero.
      if (!confirmBox.hidden) {
        form.reset();
        limpiarTodosLosErrores();
        volverAlFormulario();
      }
      formSection.hidden = false;
      formSection.classList.add('modal-open'); 
      formSection.scrollTop = 0;
      document.body.style.overflow = 'hidden';
      if (openFormBtn) openFormBtn.setAttribute('aria-expanded', 'true');
      var primero = document.getElementById('marca');
var esTactil = window.matchMedia('(hover: none)').matches;
if (primero && !esTactil) primero.focus({ preventScroll: true });
    }

    function cerrarFormulario() {
      formSection.hidden = true;
      formSection.classList.remove('modal-open');
      document.body.style.overflow = '';
      if (openFormBtn) {
        openFormBtn.setAttribute('aria-expanded', 'false');
        openFormBtn.focus();
      }
    }

    if (openFormBtn) openFormBtn.addEventListener('click', abrirFormulario);
    if (closeFormBtn) closeFormBtn.addEventListener('click', cerrarFormulario);

    // Click en el fondo oscuro (fuera del cuadro del formulario) cierra el modal.
    formSection.addEventListener('click', function (e) {
      if (e.target === formSection) cerrarFormulario();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !formSection.hidden) cerrarFormulario();
    });

    /* ---------- Errores por campo ---------- */

    function errorDe(input) {
      var span = document.getElementById(input.id + 'Error');
      if (!span) {
        span = document.createElement('span');
        span.className = 'field-error';
        span.id = input.id + 'Error';
        span.hidden = true;
        input.insertAdjacentElement('afterend', span);
        input.setAttribute('aria-describedby', span.id);
      }
      return span;
    }

    function mostrarError(input, mensaje) {
      var span = errorDe(input);
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
      span.textContent = mensaje;
      span.hidden = false;
    }

    function limpiarError(input) {
      var span = document.getElementById(input.id + 'Error');
      input.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
      if (span) {
        span.textContent = '';
        span.hidden = true;
      }
    }

    function limpiarTodosLosErrores() {
      CAMPOS.forEach(function (id) {
        var input = document.getElementById(id);
        if (input) limpiarError(input);
      });
      mostrarErrorTipo('');
    }

    var tipoError = document.getElementById('tipoAtencionError');

    function mostrarErrorTipo(mensaje) {
      if (!tipoError) return;
      tipoError.textContent = mensaje;
      tipoError.hidden = !mensaje;
    }

    function hayTipoElegido() {
      return !!((document.getElementById('arreglo') || {}).checked ||
                (document.getElementById('inspeccion') || {}).checked);
    }

    // Valida todos los campos y enfoca el primero que falle.
    function validar() {
      var primerInvalido = null;

      if (!hayTipoElegido()) {
        mostrarErrorTipo('Elegí al menos un tipo de atención.');
        primerInvalido = document.getElementById('arreglo');
      } else {
        mostrarErrorTipo('');
      }

      CAMPOS.forEach(function (id) {
        var input = document.getElementById(id);
        if (!input) return;

     var mensaje = V.validarCampo(REGLA_DE[id] || id, input.value);
        if (mensaje) {
          mostrarError(input, mensaje);
          if (!primerInvalido) primerInvalido = input;
        } else {
          limpiarError(input);
        }
      });

      if (primerInvalido) primerInvalido.focus();
      return !primerInvalido;
    }

    CAMPOS.forEach(function (id) {
      var input = document.getElementById(id);
      if (!input) return;

      input.addEventListener('input', function () { limpiarError(input); });

      // Al salir del campo avisamos solo si lo completó mal (lo obligatorio se avisa al enviar).
      input.addEventListener('blur', function () {
        if (!input.value.trim()) return;
        var mensaje = V.validarCampo(REGLA_DE[id] || id, input.value);
        if (mensaje) mostrarError(input, mensaje);
      });
    });

    // Mantenimiento e Inspección son excluyentes: al marcar uno se desmarca el otro.
    ['arreglo', 'inspeccion'].forEach(function (id) {
      var check = document.getElementById(id);
      if (!check) return;
      check.addEventListener('change', function () {
        if (check.checked) {
          var otro = document.getElementById(id === 'arreglo' ? 'inspeccion' : 'arreglo');
          if (otro) otro.checked = false;
        }
        if (hayTipoElegido()) mostrarErrorTipo('');
      });
    });

        /* ---------- Pasos (solo celular) ---------- */

    var TOTAL_PASOS = 2;
    var paso = 1;
    var movil = window.matchMedia('(max-width: 520px)');
    var pasos = form.querySelectorAll('.form-step');
    var puntos = form.querySelectorAll('.steps-item');
    var btnSiguiente = document.getElementById('stepNext');
    var btnAtras = document.getElementById('stepBack');

    function modoPasos() {
      return form.classList.contains('is-stepper');
    }

    function mostrarPaso(n) {
      paso = n;
      form.setAttribute('data-paso', n);
      Array.prototype.forEach.call(pasos, function (p) {
        p.classList.toggle('is-current', Number(p.getAttribute('data-step')) === n);
      });
      Array.prototype.forEach.call(puntos, function (d, i) {
        d.classList.toggle('is-current', i + 1 === n);
      });
      formSection.scrollTop = 0;
    }

    function aplicarModo() {
      form.classList.toggle('is-stepper', movil.matches);
      mostrarPaso(1);
    }

    // En el paso 1 solo es obligatorio el tipo de atención.
    function validarPaso1() {
      if (!hayTipoElegido()) {
        mostrarErrorTipo('Elegí al menos un tipo de atención.');
        var check = document.getElementById('arreglo');
        if (check) check.focus();
        return false;
      }
      mostrarErrorTipo('');
      return true;
    }

    if (btnSiguiente) btnSiguiente.addEventListener('click', function () {
      if (validarPaso1()) mostrarPaso(2);
    });
    if (btnAtras) btnAtras.addEventListener('click', function () { mostrarPaso(1); });

    if (movil.addEventListener) movil.addEventListener('change', aplicarModo);
    else movil.addListener(aplicarModo);
    aplicarModo();

    // El DNI solo admite números.
    var dniInput = document.getElementById('dni');
    if (dniInput) dniInput.addEventListener('input', function () {
      dniInput.value = dniInput.value.replace(/\D/g, '');
    });

    /* ---------- Tarjetas de servicio + panel ---------- */

    function seleccionarServicio(nombreServicio) {
      var info = SERVICE_INFO[nombreServicio];
      if (!info) return;

      Array.prototype.forEach.call(cards, function (card) {
        var activa = card.getAttribute('data-service') === nombreServicio;
        card.classList.toggle('is-active', activa);
        card.setAttribute('aria-pressed', activa ? 'true' : 'false');
        if (activa && panelIcon) {
          panelIcon.innerHTML = card.querySelector('.service-card-icon').innerHTML;
        }
      });

      if (panel) panel.style.setProperty('--panel-color', info.color);
      if (panelTitle) panelTitle.textContent = info.title;
      if (panelText) panelText.textContent = info.text;
      if (panelList) {
        panelList.innerHTML = '';
        info.items.forEach(function (item) {
          var li = document.createElement('li');
          li.textContent = item;
          panelList.appendChild(li);
        });
      }
    }

    Array.prototype.forEach.call(cards, function (card) {
      card.addEventListener('click', function () {
        seleccionarServicio(card.getAttribute('data-service'));
      });
    });

    /* ---------- Envío ---------- */

    form.addEventListener('submit', function (evento) {
      evento.preventDefault();

  if (modoPasos() && paso < TOTAL_PASOS) {
        if (validarPaso1()) mostrarPaso(2);
        return;
      }
      if (envioEnCurso) return;

      if (!validar()) return;

      envioEnCurso = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.textContent = 'Enviando solicitud…';
      }
      if (submitError) {
        submitError.hidden = true;
        submitError.textContent = '';
      }

      var arreglo = !!(document.getElementById('arreglo') || {}).checked;
      var inspeccion = !!(document.getElementById('inspeccion') || {}).checked;
      var marca = valor('marca');
      var modelo = valor('modelo');
      var descripcion = valor('descripcion');

      var tipos = [];
      if (arreglo) tipos.push('Mantenimiento');
      if (inspeccion) tipos.push('Inspección');

       var equipo = [marca, modelo].filter(Boolean).join(' ');

      var persona = V.partirNombre(valor('nombre'));
      var solicitante = [persona.nombre, persona.apellido].filter(Boolean).join(' ');

      texto('confirmSolicitante', 'Solicitante: ' + solicitante + ' · Tel: ' + valor('numero'));
      texto('confirmMarcaModelo', 'Equipo: ' + (equipo || 'sin especificar'));
      texto('confirmTipo', 'Tipo de atención: ' + (tipos.length ? tipos.join(' y ') : 'sin especificar'));
      texto('confirmDescripcion', 'Descripción: ' + (descripcion || 'sin detalles'));

      // Payload público para la API. El servidor asigna ID, fecha, baja y confirmación.
      var payload = {
        nombre: persona.nombre,
        apellido: persona.apellido,
        numero: valor('numero'),
        dni: valor('dni'),
        email: valor('email'),
        localidad: valor('localidad'),
        marca: marca,
        modelo: modelo,
        tipoArreglo: arreglo,
        tipoInspeccion: inspeccion,
        descripcion: descripcion
      };
      function armarLinkWhatsapp() {
  var lineas = [
    'Hola, quiero solicitar un servicio técnico:',
    '*Equipo:* ' + (equipo || 'sin especificar'),
    '*Tipo:* ' + (tipos.length ? tipos.join(' y ') : 'sin especificar'),
    '*Detalle:* ' + (descripcion || 'sin detalles'),
    '*Nombre:* ' + solicitante,
    '*Teléfono:* ' + valor('numero')
  ];
  return 'https://wa.me/' + WHATSAPP_NEGOCIO + '?text=' + encodeURIComponent(lineas.join('\n'));
}

      function mostrarConfirmacion(flag) {
        texto('confirmFlag', flag);
        var linkWsp = document.getElementById('confirmWhatsapp');
if (!linkWsp) {
  linkWsp = document.createElement('a');
  linkWsp.id = 'confirmWhatsapp';
  linkWsp.className = 'btn-whatsapp-cliente'; // para darle estilo en el CSS
  linkWsp.target = '_blank';
  linkWsp.rel = 'noopener';
  linkWsp.textContent = 'Enviar por WhatsApp';
  confirmBox.appendChild(linkWsp);
}
linkWsp.href = armarLinkWhatsapp();
        form.hidden = true;
        confirmBox.hidden = false;
        formSection.scrollTop = 0;
        confirmBox.focus();
      }

      fetch(linkApi + '/servicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
       .then(function (res) {
  if (!res.ok) {
    return res.text().then(function (cuerpo) {
      throw new Error('HTTP ' + res.status + ' ' + cuerpo);
    });
  }
  mostrarConfirmacion('¡Solicitud enviada! Pronto nos comunicamos con vos.');
})
        .catch(function (error) {
          console.warn('No se pudo enviar al servidor:', error);
          if (submitError) {
            submitError.textContent = 'No pudimos enviar la solicitud. Revisá la conexión e intentá nuevamente.';
            submitError.hidden = false;
          }
        })
        .finally(function () {
          envioEnCurso = false;
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.removeAttribute('aria-busy');
            submitBtn.textContent = 'Enviar solicitud';
          }
        });
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        form.reset();
        limpiarTodosLosErrores();
        if (submitError) {
          submitError.hidden = true;
          submitError.textContent = '';
        }
        volverAlFormulario();
        var primero = document.getElementById('marca');
        if (primero) primero.focus();
      });
    }
  }
})();