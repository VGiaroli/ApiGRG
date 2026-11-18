// Validaciones de las solicitudes de servicio.
// Se usan en el formulario público (servicios.js) y en la administración (solicitudes.js).
// Cargar este archivo ANTES de servicios.js / solicitudes.js.
(function (global) {
  'use strict';

  // Letras de cualquier idioma, con espacios, apóstrofo (recto o curvo), punto y guion entre palabras.
  var SOLO_LETRAS = /^\p{L}+(?:[ '’.-]+\p{L}+)*\.?$/u;

  // usuario@dominio.tld (TLD de 2+ letras, sin guiones al borde de cada parte del dominio)
  var EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

  // Errores de tipeo frecuentes en el dominio.
  var DOMINIOS_CON_ERROR = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gmail.con': 'gmail.com',
    'gmail.cm': 'gmail.com',
    'hotmial.com': 'hotmail.com',
    'hotmail.con': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'yahoo.con': 'yahoo.com'
  };

  function limpiar(valor) {
    return String(valor == null ? '' : valor).replace(/\s+/g, ' ').trim();
  }

  // "Juan Carlos Pérez" -> { nombre: "Juan Carlos", apellido: "Pérez" }
  // Siempre se pueden volver a unir con un espacio y da el texto original.
  function partirNombre(completo) {
    var p = limpiar(completo).split(' ').filter(Boolean);
    var apellido = p.length > 1 ? p.pop() : '';
    return { nombre: p.join(' '), apellido: apellido };
  }

  // Formatos argentinos -> "549" + 10 dígitos. Devuelve null si no se puede armar.
  function normalizarTelefono(raw) {
    var d = String(raw || '').replace(/\D/g, '');

    if (d.indexOf('54') === 0) {            // ya trae el país (con o sin el 9)
      d = d.slice(2);
      if (d.charAt(0) === '9') d = d.slice(1);
    }
    if (d.charAt(0) === '0') d = d.slice(1);  // quitar 0 inicial

    // Quitar el 15: característica (2 a 4 dígitos) + 15 + número = 12 dígitos
    if (d.length === 12) {
      for (var area = 2; area <= 4; area++) {
        if (d.slice(area, area + 2) === '15') {
          d = d.slice(0, area) + d.slice(area + 2);
          break;
        }
      }
    }

    return d.length === 10 ? '549' + d : null;
  }

  function telefonoValido(raw) {
    return normalizarTelefono(raw) !== null;
  }

  // Nombre y apellido juntos: al menos dos palabras y cada parte entra en la base (60).
  function nombreYApellido(v) {
    var p = partirNombre(v);
    if (!p.apellido) return 'Escribí nombre y apellido.';
    if (p.nombre.length > 60 || p.apellido.length > 60) return 'El nombre es demasiado largo.';
    return true;
  }

  function emailRevisado(v) {
    var arroba = v.lastIndexOf('@');
    var usuario = v.slice(0, arroba);
    var dominio = v.slice(arroba + 1).toLowerCase();

    if (/^\.|\.$|\.\./.test(usuario)) return false;   // puntos al borde o dobles
    if (DOMINIOS_CON_ERROR[dominio]) {
      return 'Revisá el email: ¿quisiste decir ' + DOMINIOS_CON_ERROR[dominio] + '?';
    }
    return true;
  }

  // "req" = obligatorio. Si el campo se completó se controlan "max", "test" y "fn".
  // "fn" devuelve true (ok), false (usa msgFormato) o un texto (ese es el mensaje).
  var REGLAS = {
    // Campo único "Nombre y apellido" del formulario público.
    nombreCompleto: {
      req: true, max: 100, test: SOLO_LETRAS, fn: nombreYApellido,
      msgReq: 'Ingresá tu nombre y apellido.',
      msgFormato: 'El nombre solo puede tener letras.'
    },
    // Nombre y apellido por separado (formulario de administración).
    nombre: {
      req: true, max: 60, test: SOLO_LETRAS,
      msgReq: 'Ingresá el nombre.',
      msgFormato: 'El nombre solo puede tener letras.'
    },
    apellido: {
      req: true, max: 60, test: SOLO_LETRAS,
      msgReq: 'Ingresá el apellido.',
      msgFormato: 'El apellido solo puede tener letras.'
    },
    numero: {
      req: true, max: 20, test: /^[\d\s()+.-]+$/, fn: telefonoValido,
      msgReq: 'Ingresá el teléfono.',
      msgFormato: 'Escribí el teléfono con 10 dígitos, sin 0 ni 15 (ej: 11 4444-5555).'
    },
    dni: {
      req: true, test: /^[1-9]\d{6,7}$/,
      msgReq: 'Ingresá el DNI.',
      msgFormato: 'El DNI tiene 7 u 8 números, sin puntos.'
    },
    email: {
      req: true, max: 100, test: EMAIL, fn: emailRevisado,
      msgReq: 'Ingresá el email.',
      msgFormato: 'Revisá el email, parece incompleto (ej: nombre@gmail.com).'
    },
    localidad: {
      req: true, max: 80, test: /^[\p{L}\d][\p{L}\d'’ .,-]+$/u,
      msgReq: 'Ingresá la localidad.',
      msgFormato: 'Revisá la localidad.'
    }
  };

  // Devuelve el mensaje de error del campo, o '' si está bien.
  function validarCampo(id, valor) {
    var r = REGLAS[id];
    if (!r) return '';

    var v = limpiar(valor);
    if (!v) return r.req ? r.msgReq : '';
    if (r.max && v.length > r.max) return 'Máximo ' + r.max + ' caracteres.';
    if (r.test && !r.test.test(v)) return r.msgFormato;
    if (r.fn) {
      var res = r.fn(v);
      if (res !== true) return typeof res === 'string' ? res : r.msgFormato;
    }
    return '';
  }

  // datos = { campo: valor, ... } -> { campo: mensaje } solo con los que fallan (vacío si todo está bien).
  // Valida únicamente los campos que vienen en "datos".
  function validarTodo(datos) {
    var errores = {};
    Object.keys(datos).forEach(function (id) {
      var mensaje = validarCampo(id, datos[id]);
      if (mensaje) errores[id] = mensaje;
    });
    return errores;
  }

  global.ValidacionesServicio = {
    REGLAS: REGLAS,
    validarCampo: validarCampo,
    validarTodo: validarTodo,
    normalizarTelefono: normalizarTelefono,
    telefonoValido: telefonoValido,
    partirNombre: partirNombre
  };
})(window);