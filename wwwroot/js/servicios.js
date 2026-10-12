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

  // Reglas de validación: "req" = obligatorio, "test" = formato si el campo se completó.
  var REGLAS = {
    nombreDispositivo: { req: true, msg: 'Escribí qué equipo es para poder seguir.' },
    nombre: { req: true, msg: 'Escribí tu nombre.' },
    apellido: { req: true, msg: 'Escribí tu apellido.' },
    numero: { req: true, test: /^[\d\s()+-]{8,}$/, msg: 'Escribí un teléfono válido, con característica (sin 0 ni 15).' },
    dni: { test: /^\d{7,8}$/, msg: 'El DNI tiene 7 u 8 números, sin puntos.' },
    email: { test: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg: 'Revisá el email, parece incompleto.' }
  };

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
      var primero = document.getElementById('nombreDispositivo');
      if (primero) primero.focus({ preventScroll: true });
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
      Object.keys(REGLAS).forEach(function (id) {
        var input = document.getElementById(id);
        if (input) limpiarError(input);
      });
    }

    // Valida todos los campos y enfoca el primero que falle.
    function validar() {
      var primerInvalido = null;

      Object.keys(REGLAS).forEach(function (id) {
        var input = document.getElementById(id);
        if (!input) return;

        var regla = REGLAS[id];
        var v = input.value.trim();
        var falla = (regla.req && !v) || (v && regla.test && !regla.test.test(v));

        if (falla) {
          mostrarError(input, regla.msg);
          if (!primerInvalido) primerInvalido = input;
        } else {
          limpiarError(input);
        }
      });

      if (primerInvalido) primerInvalido.focus();
      return !primerInvalido;
    }

    Object.keys(REGLAS).forEach(function (id) {
      var input = document.getElementById(id);
      if (input) input.addEventListener('input', function () { limpiarError(input); });
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

   // ¿El teléfono puede formar un link válido de WhatsApp?
    function telefonoValido(valorTel) {
      var d = String(valorTel || '').replace(/\D/g, '');
      if (d.indexOf('54') === 0) return true;           // ya tiene el país
      if (d.charAt(0) === '0') d = d.slice(1);           // quitar 0 inicial
      if (d.length === 12 && d.slice(d.length - 10, d.length - 8) === '15') {
        d = d.slice(0, d.length - 10) + d.slice(d.length - 8); // quitar el 15
      }
      return d.length === 10;
    }

    form.addEventListener('submit', function (evento) {
      evento.preventDefault();

      if (envioEnCurso) return;

      if (!validar()) return;

      var telInput = document.getElementById('numero');
      if (!telefonoValido(telInput.value)) {
        mostrarError(telInput, 'Escribí el teléfono con 10 dígitos, sin 0 ni 15 (ej: 11 4444-5555).');
        telInput.focus();
        return;
      }

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
      if (arreglo) tipos.push('Arreglo');
      if (inspeccion) tipos.push('Inspección');

      var equipo = [marca, modelo].filter(Boolean).join(' ');
      var solicitante = [valor('nombre'), valor('apellido')].filter(Boolean).join(' ');

      texto('confirmSolicitante', 'Solicitante: ' + solicitante + ' · Tel: ' + valor('numero'));
      texto('confirmDispositivo', 'Dispositivo: ' + valor('nombreDispositivo'));
      texto('confirmMarcaModelo', 'Equipo: ' + (equipo || 'sin especificar'));
      texto('confirmTipo', 'Tipo de atención: ' + (tipos.length ? tipos.join(' y ') : 'sin especificar'));
      texto('confirmDescripcion', 'Descripción: ' + (descripcion || 'sin detalles'));

      // Payload público para la API. El servidor asigna ID, fecha, baja y confirmación.
      var payload = {
        nombre: valor('nombre'),
        apellido: valor('apellido'),
        numero: valor('numero'),
        dni: valor('dni'),
        email: valor('email'),
        localidad: valor('localidad'),
        nombreDispositivo: valor('nombreDispositivo'),
        marca: marca,
        modelo: modelo,
        tipoArreglo: arreglo,
        tipoInspeccion: inspeccion,
        descripcion: descripcion
      };

      function armarLinkWhatsapp() {
  var lineas = [
    'Hola, quiero solicitar un servicio técnico:',
    '*Dispositivo:* ' + valor('nombreDispositivo'),
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
          if (!res.ok) throw new Error('HTTP ' + res.status);
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
        var primero = document.getElementById('nombreDispositivo');
        if (primero) primero.focus();
      });
    }
  }
})();
