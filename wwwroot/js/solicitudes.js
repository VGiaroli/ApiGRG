document.addEventListener('DOMContentLoaded', function () {
    configurarFiltros();
    obtenerSolicitudes();
})

// La lista queda en memoria: los onclick de la fila pasan SOLO IDs
// (pasar objetos rompería el HTML por las comillas).
let solicitudes = [];

// Solicitud que se está viendo en el modal (null cuando el modal está en modo "agregar").
let solicitudActual = null;


let cargando = false;


// Si es true, al abrir una solicitud con el ojo queda marcada como "Visto".
const MARCAR_VISTO_AL_ABRIR = true;

// Debe coincidir con el enum EstadoConfirmacion del backend.
const ESTADOS_CONFIRMACION = {
    EnProceso: { cls: 'bg-warning text-dark', label: 'En proceso' },
    Terminado: { cls: 'bg-success',           label: 'Terminado' }
};

// Los datos vienen del formulario público, así que se escapan antes de insertarlos en el HTML.
function esc(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function avisarError(texto) {
    Swal.fire({ icon: 'error', text: texto });
}

function avisarOk(texto) {
    Swal.fire({
        text: texto,
        icon: "success",
        position: 'top-end',
        toast: true,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false
    });
}

function entregaDe(s) {
    return ESTADOS_CONFIRMACION[s.confirmacion] ? s.confirmacion : 'EnProceso';
}

/* ---------------- Carga ---------------- */

function mostrarCargando() {
    cargando = true;
    const anchos = ['70px', '120px', '140px', '100px', '90px', '70px', '80px', '32px'];
    const fila = '<tr>' + anchos.map(w =>
        "<td><span class='skeleton' style='width:" + w + "'></span></td>"
    ).join('') + '</tr>';

    $("#tabla-solicitudes").html(fila.repeat(5));
    document.getElementById('contador-solicitudes').textContent = 'Cargando solicitudes...';
}

// mostrarEsqueleto = false para recargas silenciosas (por ejemplo después de guardar)
function obtenerSolicitudes(mostrarEsqueleto = true) {
    if (mostrarEsqueleto) mostrarCargando();

    authFetch('/servicios')
        .then(response => {
            if (!response.ok) throw new Error(`Error ${response.status}`);
            return response.json();
        })
        .then(lista => {
            solicitudes = lista;
            cargando = false;
            aplicarFiltros();
        })
        .catch(error => {
            cargando = false;
            console.error("Error al obtener las solicitudes: ", error);
            $("#tabla-solicitudes").html(
                "<tr><td colspan='8' class='table-message'>No se pudieron cargar las solicitudes. Revisá tu sesión e intentá de nuevo.</td></tr>"
            );
            document.getElementById('contador-solicitudes').textContent = 'No se pudieron cargar las solicitudes';
        });
}


/* ---------------- Buscador y filtros ---------------- */

function configurarFiltros() {
    document.getElementById('buscador').addEventListener('input', aplicarFiltros);
    document.getElementById('filtro-entrega').addEventListener('change', aplicarFiltros);
    document.getElementById('filtro-visto').addEventListener('change', aplicarFiltros);
    document.getElementById('filtro-tipo').addEventListener('change', aplicarFiltros);

    // Limpiar vuelve a la vista inicial: solo las que están en proceso.
    document.getElementById('limpiar-filtros').addEventListener('click', function () {
        document.getElementById('buscador').value = '';
        document.getElementById('filtro-entrega').value = 'EnProceso';
        document.getElementById('filtro-visto').value = '';
        document.getElementById('filtro-tipo').value = '';
        aplicarFiltros();
    });
}

// Minúsculas y sin tildes, para que "perez" encuentre "Pérez".
function normalizarTexto(t) {
    return String(t ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function aplicarFiltros() {
      if (cargando) return; // <- nueva
    const texto = normalizarTexto(document.getElementById('buscador').value.trim());
    const entrega = document.getElementById('filtro-entrega').value; // '' = todas
    const visto = document.getElementById('filtro-visto').value;     // '' | 'true' | 'false'
    const tipo = document.getElementById('filtro-tipo').value;       // '' | 'mantenimiento' | 'inspeccion'

    // Las bajas anteriores (eliminado) siguen ocultas.
    const vigentes = solicitudes.filter(s => !s.eliminado);

    const lista = vigentes.filter(s => {
        if (entrega && entregaDe(s) !== entrega) return false;
        if (visto && String(!!s.visto) !== visto) return false;
        if (tipo === 'mantenimiento' && !s.tipoArreglo) return false;
        if (tipo === 'inspeccion' && !s.tipoInspeccion) return false;

        if (!texto) return true;
        const contenido = normalizarTexto([
            s.nombre, s.apellido, s.numero, s.dni, s.gmail,
            s.localidad, s.marca, s.modelo, s.descripcion
        ].join(' '));
        return contenido.includes(texto);
    });

    mostrarSolicitudes(lista);
    document.getElementById('contador-solicitudes').textContent =
        lista.length + ' de ' + vigentes.length + ' solicitudes';
}

/* ---------------- Tabla ---------------- */

function mostrarSolicitudes(listaSolicitudes) {
    $("#tabla-solicitudes").empty();

    if (listaSolicitudes.length === 0) {
        $("#tabla-solicitudes").append(
            "<tr><td colspan='8' class='table-message'>No hay solicitudes que coincidan con los filtros.</td></tr>"
        );
        return;
    }

    $.each(listaSolicitudes, function (index, s) {
        let fecha = s.fechaCreacion ? new Date(s.fechaCreacion).toLocaleDateString('es-AR') : '';
        let equipo = [s.marca, s.modelo].filter(Boolean).join(' ');

        let tipos = '';
        if (s.tipoArreglo) tipos += "<span class='badge bg-warning text-dark me-1'>Mantenimiento</span>";
        if (s.tipoInspeccion) tipos += "<span class='badge bg-info text-dark'>Inspección</span>";
        if (!tipos) tipos = '-';

        let estado = badgeVisto(s.visto);
        let confirmacion = badgeConfirmacion(s.confirmacion);

        let acciones =
            "<button class='btn-action' title='Ver solicitud' onclick='verSolicitud(" + s.servicioID + ")'><i class='bi bi-eye'></i></button>";

        $("#tabla-solicitudes").append(
            "<tr" + (s.visto ? "" : " class='fw-semibold'") + ">" +
            "<td>" + fecha + "</td>" +
            "<td>" + esc(s.nombre) + " " + esc(s.apellido) + "</td>" +
            "<td>" + esc(s.numero) + (s.gmail ? "<br><small>" + esc(s.gmail) + "</small>" : "") + "</td>" +
            "<td>" + (equipo ? esc(equipo) : '-') + "</td>" +
            "<td>" + tipos + "</td>" +
            "<td>" + estado + "</td>" +
            "<td>" + confirmacion + "</td>" +
            "<td class='text-center'>" + acciones + "</td>" +
            "</tr>"
        )
    })
}

function badgeVisto(visto) {
    return visto
        ? "<span class='badge bg-success'><i class='bi bi-eye'></i> Visto</span>"
        : "<span class='badge bg-secondary'><i class='bi bi-eye-slash'></i> No visto</span>";
}

function badgeConfirmacion(estado) {
    let e = ESTADOS_CONFIRMACION[estado] || ESTADOS_CONFIRMACION.EnProceso;
    return "<span class='badge " + e.cls + "'>" + e.label + "</span>";
}

/* ---------------- Modal ---------------- */

// modoVer = true: campos en solo lectura + acciones. false: formulario para agregar.
function configurarModal(modoVer) {
    document.getElementById('camposSolicitud').disabled = modoVer;
    document.getElementById('modalTitulo').textContent = modoVer ? 'Solicitud de servicio' : 'Agregar Solicitud';
    document.getElementById('resumenVer').classList.toggle('d-none', !modoVer);
    document.getElementById('accionesVer').classList.toggle('d-none', !modoVer);
    document.getElementById('btnGuardar').classList.toggle('d-none', modoVer);
    if (modoVer) refrescarModal();
}

// Actualiza los badges y los textos de los botones según el estado actual.
function refrescarModal() {
    const s = solicitudActual;
    if (!s) return;

    const fecha = s.fechaCreacion ? new Date(s.fechaCreacion).toLocaleDateString('es-AR') : '';
    document.getElementById('resumenVer').innerHTML =
        badgeVisto(s.visto) + badgeConfirmacion(s.confirmacion) +
        (fecha ? "<span class='text-muted small ms-1'>Recibida el " + fecha + "</span>" : '');

    document.getElementById('btnVisto').innerHTML = s.visto
        ? "<i class='bi bi-eye-slash'></i> Marcar como no visto"
        : "<i class='bi bi-eye'></i> Marcar como visto";

    const btnEntrega = document.getElementById('btnEntrega');
    if (entregaDe(s) === 'EnProceso') {
        btnEntrega.className = 'btn btn-success';
        btnEntrega.innerHTML = "<i class='bi bi-check-lg'></i> Marcar como terminado";
    } else {
        btnEntrega.className = 'btn btn-outline-secondary';
        btnEntrega.innerHTML = "<i class='bi bi-arrow-counterclockwise'></i> Volver a en proceso";
    }
}

function llenarFormulario(s) {
    document.getElementById("nombre").value = s.nombre ?? '';
    document.getElementById("apellido").value = s.apellido ?? '';
    document.getElementById("numero").value = s.numero ?? '';
    document.getElementById("dni").value = s.dni ?? '';
    document.getElementById("gmail").value = s.gmail ?? '';
    document.getElementById("localidad").value = s.localidad ?? '';
    document.getElementById("marca").value = s.marca ?? '';
    document.getElementById("modelo").value = s.modelo ?? '';
    document.getElementById("tipoArreglo").checked = !!s.tipoArreglo;
    document.getElementById("tipoInspeccion").checked = !!s.tipoInspeccion;
    document.getElementById("descripcion").value = s.descripcion ?? '';
}

function limpiarFormulario() {
    ['nombre', 'apellido', 'numero', 'dni', 'gmail', 'localidad',
        'marca', 'modelo', 'descripcion'].forEach(function (id) {
            document.getElementById(id).value = "";
        });
    document.getElementById('tipoArreglo').checked = false;
    document.getElementById('tipoInspeccion').checked = false;
}

// Ojo de la fila: abre la solicitud en solo lectura.
function verSolicitud(id) {
    const s = solicitudes.find(x => x.servicioID === id);
    if (!s) return;

    solicitudActual = s;
    llenarFormulario(s);
    configurarModal(true);
    $("#modalRegistroServicio").modal('show');

    if (MARCAR_VISTO_AL_ABRIR && !s.visto) cambiarVisto(id, true);
}

function abrirModalCrear() {
    solicitudActual = null;
    limpiarFormulario();
    configurarModal(false);
    $("#modalRegistroServicio").modal('show');
}

/* ---------------- Acciones de la solicitud ---------------- */

function alternarVisto() {
    if (solicitudActual) cambiarVisto(solicitudActual.servicioID, !solicitudActual.visto);
}

function alternarEntrega() {
    if (!solicitudActual) return;
    const nuevo = entregaDe(solicitudActual) === 'EnProceso' ? 'Terminado' : 'EnProceso';
    cambiarConfirmacion(solicitudActual.servicioID, nuevo);
}

function enviarWhatsappActual() {
    if (solicitudActual) enviarWhatsapp(solicitudActual.servicioID);
}

function cambiarVisto(id, visto) {
    authFetch('/servicios/' + id + '/visto', {
        method: 'PUT',
        body: JSON.stringify({ visto: visto })
    })
        .then(r => {
            if (!r.ok) throw new Error(`Error ${r.status}`);

            const s = solicitudes.find(x => x.servicioID === id);
            if (s) s.visto = visto;

            aplicarFiltros();
            if (solicitudActual && solicitudActual.servicioID === id) refrescarModal();
        })
        .catch(error => {
            console.error("Error al cambiar visto: ", error);
            avisarError("No se pudo actualizar el estado.");
        });
}

// Terminada = se oculta de la tabla (no se elimina). Se ve con el filtro "Terminados".
function cambiarConfirmacion(id, estado) {
    const configuracion = {
        Terminado: {
            title: '¿Marcar la solicitud como terminada?',
            text: 'Se va a ocultar de la tabla. La encontrás con el filtro "Terminados".',
            icon: 'question',
            confirmButtonText: 'Sí, terminada'
        },
        EnProceso: {
            title: '¿Volver la solicitud a "En proceso"?',
            icon: 'question',
            confirmButtonText: 'Sí, volver a en proceso'
        }
    }[estado];

    if (!configuracion) return;

    Swal.fire({
        title: configuracion.title,
        text: configuracion.text,
        icon: configuracion.icon,
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: configuracion.confirmButtonText,
        cancelButtonText: "Cancelar"
    }).then((result) => {
        if (!result.isConfirmed) return;

        authFetch('/servicios/' + id + '/confirmacion', {
            method: 'PUT',
            body: JSON.stringify({ confirmacion: estado })
        })
            .then(r => {
                if (!r.ok) throw new Error(`Error ${r.status}`);

                const s = solicitudes.find(x => x.servicioID === id);
                if (s) s.confirmacion = estado;

                $('#modalRegistroServicio').modal('hide');
                aplicarFiltros();
                avisarOk(estado === 'Terminado'
                    ? 'Solicitud terminada'
                    : 'La solicitud volvió a "En proceso"');
            })
            .catch(error => {
                console.error("Error al cambiar la confirmación: ", error);
                avisarError("No se pudo actualizar la confirmación.");
            });
    });
}

/* ---------------- WhatsApp ---------------- */

// Formatos argentinos -> "549" + 10 dígitos. Devuelve null si no se puede armar.
function normalizarTelefono(raw) {
    return ValidacionesServicio.normalizarTelefono(raw);
}

function enviarWhatsapp(id) {
    const s = solicitudes.find(x => x.servicioID === id);
    if (!s) return;

    const tel = normalizarTelefono(s.numero);
    if (!tel) {
        Swal.fire({ icon: 'warning', text: 'Revisá el teléfono: no se pudo armar el link de WhatsApp.' });
        return;
    }

    const equipo = [s.marca, s.modelo].filter(Boolean).join(' ');
    const resumen = 'Hola ' + s.nombre + ' ' + s.apellido +
        ', recibimos tu solicitud para *' + (equipo || 'tu equipo') + '*' +
        (s.descripcion ? '. Detalle: ' + s.descripcion : '') +
        '. ¡Gracias!';
    const texto = encodeURIComponent(resumen);

    const esMovil = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    const url = esMovil
        ? 'https://wa.me/' + tel + '?text=' + texto
        : 'https://web.whatsapp.com/send?phone=' + tel + '&text=' + texto;

    // Abrir primero y de forma síncrona para evitar que el navegador bloquee la pestaña.
    window.open(url, '_blank', 'noopener');
}

/* ---------------- Agregar ---------------- */

function valor(id) {
    return document.getElementById(id).value.trim();
}

function guardarRegistro() {
    let nuevaSolicitud = {
        nombre: valor("nombre"),
        apellido: valor("apellido"),
        numero: valor("numero"),
        dni: valor("dni"),
        gmail: valor("gmail"),
        localidad: valor("localidad"),
        marca: valor("marca"),
        modelo: valor("modelo"),
        tipoArreglo: document.getElementById("tipoArreglo").checked,
        tipoInspeccion: document.getElementById("tipoInspeccion").checked,
        descripcion: valor("descripcion")
    }

    // Mismas reglas que el formulario público (/js/validaciones-servicio.js)
    const errores = ValidacionesServicio.validarTodo({
        nombre: nuevaSolicitud.nombre,
        apellido: nuevaSolicitud.apellido,
        numero: nuevaSolicitud.numero,
        dni: nuevaSolicitud.dni,
        email: nuevaSolicitud.gmail,
        localidad: nuevaSolicitud.localidad
    });
    const primerError = Object.values(errores)[0];
    if (primerError) {
        Swal.fire({ icon: 'warning', text: primerError });
        return;
    }

    fetch(`${linkApi}/servicios`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        // El endpoint público espera "email" (el formulario de administración lo llama "gmail").
        body: JSON.stringify({ ...nuevaSolicitud, email: nuevaSolicitud.gmail })
    })
        .then(async response => {
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || `Error ${response.status}`);
            }
            $('#modalRegistroServicio').modal('hide');
           obtenerSolicitudes(false); // ahora
        })
        .catch(error => {
            console.error("Error al crear una solicitud: ", error);
            avisarError("No se pudo crear la solicitud.");
        });
}