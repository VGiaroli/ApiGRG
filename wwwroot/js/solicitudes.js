document.addEventListener('DOMContentLoaded', function () {
    obtenerSolicitudes();
})

// La lista queda en memoria: los onclick de la fila pasan SOLO IDs
// (pasar objetos rompería el HTML por las comillas).
let solicitudes = [];

// Debe coincidir con el enum EstadoConfirmacion del backend.
const ESTADOS_CONFIRMACION = {
    Pendiente:  { cls: 'bg-secondary', label: 'Pendiente' },
    Enviado:    { cls: 'bg-primary',   label: 'Enviado', title: 'Enviado (a confirmar)' },
    Confirmado: { cls: 'bg-success',   label: 'Confirmado' },
    NoRecibido: { cls: 'bg-danger',    label: 'No recibido' }
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

/* ---------------- Carga ---------------- */

function obtenerSolicitudes() {
    authFetch('/servicios')
        .then(response => {
            if (!response.ok) throw new Error(`Error ${response.status}`);
            return response.json();
        })
        .then(lista => {
            solicitudes = lista;
            mostrarSolicitudes(lista);
        })
        .catch(error => console.error("Error al obtener las solicitudes: ", error))
}

/* ---------------- Tabla ---------------- */

function mostrarSolicitudes(listaSolicitudes) {
    $("#tabla-solicitudes").empty();

    $.each(listaSolicitudes, function (index, s) {
        let fecha = s.fechaCreacion ? new Date(s.fechaCreacion).toLocaleDateString('es-AR') : '';
        let equipo = [s.marca, s.modelo].filter(Boolean).join(' ');

        let tipos = '';
        if (s.tipoArreglo) tipos += "<span class='badge bg-warning text-dark me-1'>Arreglo</span>";
        if (s.tipoInspeccion) tipos += "<span class='badge bg-info text-dark'>Inspección</span>";
        if (!tipos) tipos = '-';

        let estado = s.eliminado
            ? "<span class='badge bg-secondary'>Inactivo</span>"
            : "<span class='badge bg-success'>Activo</span>";

        let confirmacion = badgeConfirmacion(s.confirmacion);
        let acciones = botonesFila(s);

        $("#tabla-solicitudes").append(
            "<tr>" +
            "<td>" + fecha + "</td>" +
            "<td>" + esc(s.nombre) + " " + esc(s.apellido) + "</td>" +
            "<td>" + esc(s.numero) + (s.gmail ? "<br><small>" + esc(s.gmail) + "</small>" : "") + "</td>" +
            "<td>" + esc(s.nombreDispositivo) + (equipo ? "<br><small>" + esc(equipo) + "</small>" : "") + "</td>" +
            "<td>" + tipos + "</td>" +
            "<td>" + estado + "</td>" +
            "<td>" + confirmacion + "</td>" +
            "<td class='text-center'>" + acciones + "</td>" +
            "</tr>"
        )
    })
}

function badgeConfirmacion(estado) {
    let e = ESTADOS_CONFIRMACION[estado] || ESTADOS_CONFIRMACION.Pendiente;
    let title = e.title ? " title='" + e.title + "'" : "";
    return "<span class='badge " + e.cls + "'" + title + ">" + e.label + "</span>";
}

// Reglas: WhatsApp en Pendiente/Enviado/No recibido; ✓ y ✗ solo en Enviado;
// inactivos sin botones de WhatsApp.
function botonesFila(s) {
    let html =
        "<button class='btn-action' title='Editar' onclick='buscarSolicitud(" + s.servicioID + ")'><i class='bi bi-pencil-square'></i></button>" +
        "<button class='btn-action btn-delete' title='Eliminar' onclick='confirmarEliminar(" + s.servicioID + ")'><i class='bi bi-trash'></i></button>";

    if (s.eliminado) return html;

    let estado = ESTADOS_CONFIRMACION[s.confirmacion] ? s.confirmacion : 'Pendiente';

    if (estado === 'Pendiente' || estado === 'Enviado' || estado === 'NoRecibido') {
        html += "<button class='btn-action btn-whatsapp' title='Enviar por WhatsApp' onclick='enviarWhatsapp(" + s.servicioID + ")'><i class='bi bi-whatsapp'></i></button>";
    }
    if (estado === 'Pendiente' || estado === 'NoRecibido') {
        html += "<button class='btn-action btn-confirm' title='Marcar mensaje como enviado' onclick='cambiarConfirmacion(" + s.servicioID + ", \"Enviado\")'><i class='bi bi-check2'></i></button>";
    }
    if (estado === 'Enviado') {
        html += "<button class='btn-action btn-confirm' title='Confirmar que llegó el mensaje' onclick='cambiarConfirmacion(" + s.servicioID + ", \"Confirmado\")'><i class='bi bi-check-lg'></i></button>";
        html += "<button class='btn-action btn-delete' title='Marcar como no recibido' onclick='cambiarConfirmacion(" + s.servicioID + ", \"NoRecibido\")'><i class='bi bi-x-lg'></i></button>";
    }
    return html;
}

/* ---------------- WhatsApp ---------------- */

// Formatos argentinos -> "549" + 10 dígitos. Devuelve null si no se puede armar.
function normalizarTelefono(raw) {
    let d = String(raw || '').replace(/\D/g, '');
    if (d.startsWith('54')) return d.startsWith('549') ? d : '549' + d.slice(2);
    if (d.startsWith('0')) d = d.slice(1);                                  // quitar 0 inicial
    if (d.length === 12 && d.slice(d.length - 10, d.length - 8) === '15') { // quitar el 15
        d = d.slice(0, d.length - 10) + d.slice(d.length - 8);
    }
    if (d.length !== 10) return null;
    return '549' + d;
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
        ', recibimos tu solicitud para *' + (s.nombreDispositivo || 'tu equipo') + '*' +
        (equipo ? ' (' + equipo + ')' : '') +
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

function cambiarConfirmacion(id, estado) {
    const configuracion = {
        Enviado: {
            title: '¿Marcar el mensaje como enviado?',
            icon: 'question',
            confirmButtonText: 'Sí, marcar enviado'
        },
        Confirmado: {
            title: '¿Confirmás que llegó el mensaje?',
            icon: 'question',
            confirmButtonText: 'Sí, confirmar'
        },
        NoRecibido: {
            title: '¿Marcar como no recibido?',
            icon: 'warning',
            confirmButtonText: 'Sí, marcar no recibido'
        }
    }[estado];

    if (!configuracion) return;

    Swal.fire({
        title: configuracion.title,
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
            .then(r => { if (!r.ok) throw new Error(`Error ${r.status}`); obtenerSolicitudes(); })
            .catch(error => {
                console.error("Error al cambiar la confirmación: ", error);
                avisarError("No se pudo actualizar la confirmación.");
            });
    });
}

/* ---------------- ABM ---------------- */

function valor(id) {
    return document.getElementById(id).value.trim();
}

function guardarRegistro() {
    let servicioID = document.getElementById("servicioID").value;

    let guardarServicio = {
        servicioID: parseInt(servicioID),
        nombre: valor("nombre"),
        apellido: valor("apellido"),
        numero: valor("numero"),
        dni: valor("dni"),
        gmail: valor("gmail"),
        localidad: valor("localidad"),
        nombreDispositivo: valor("nombreDispositivo"),
        marca: valor("marca"),
        modelo: valor("modelo"),
        tipoArreglo: document.getElementById("tipoArreglo").checked,
        tipoInspeccion: document.getElementById("tipoInspeccion").checked,
        descripcion: valor("descripcion"),
        eliminado: document.getElementById("eliminado").value === "true"
        // La confirmación NO se manda: el backend la preserva en el PUT.
    }

    // Validación mínima antes de llamar a la API
    if (!guardarServicio.nombre || !guardarServicio.apellido || !guardarServicio.numero || !guardarServicio.nombreDispositivo) {
        Swal.fire({ icon: 'warning', text: 'Completá nombre, apellido, teléfono y dispositivo.' });
        return;
    }
    if (guardarServicio.dni && !/^\d{7,8}$/.test(guardarServicio.dni)) {
        Swal.fire({ icon: 'warning', text: 'El DNI tiene 7 u 8 números, sin puntos.' });
        return;
    }

    if (servicioID > 0) {
        authFetch('/servicios/' + servicioID, {
            method: 'PUT',
            body: JSON.stringify(guardarServicio)
        })
            .then(response => {
                if (!response.ok) throw new Error(`Error ${response.status}`);
                $('#modalRegistroServicio').modal('hide');
                obtenerSolicitudes();
            })
            .catch(error => {
                console.error("Error al editar la solicitud", error);
                avisarError("No se pudo guardar la solicitud.");
            })
    }
    else {
        fetch(`${linkApi}/servicios`, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify(guardarServicio)
        })
            .then(async response => {
                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(text || `Error ${response.status}`);
                }
                $('#modalRegistroServicio').modal('hide');
                obtenerSolicitudes();
            })
            .catch(error => {
                console.error("Error al crear una solicitud: ", error);
                avisarError("No se pudo crear la solicitud.");
            });
    }
}

function buscarSolicitud(id) {
    authFetch('/servicios/' + id, { method: 'GET' })
        .then(response => {
            if (!response.ok) throw new Error("Error al obtener la solicitud");
            return response.json();
        })
        .then(s => {
            document.getElementById("servicioID").value = s.servicioID;
            document.getElementById("nombre").value = s.nombre ?? '';
            document.getElementById("apellido").value = s.apellido ?? '';
            document.getElementById("numero").value = s.numero ?? '';
            document.getElementById("dni").value = s.dni ?? '';
            document.getElementById("gmail").value = s.gmail ?? '';
            document.getElementById("localidad").value = s.localidad ?? '';
            document.getElementById("nombreDispositivo").value = s.nombreDispositivo ?? '';
            document.getElementById("marca").value = s.marca ?? '';
            document.getElementById("modelo").value = s.modelo ?? '';
            document.getElementById("tipoArreglo").checked = !!s.tipoArreglo;
            document.getElementById("tipoInspeccion").checked = !!s.tipoInspeccion;
            document.getElementById("descripcion").value = s.descripcion ?? '';
            document.getElementById("eliminado").value = s.eliminado.toString();
            document.getElementById("contenedorEstado").style.display = 'block';
            document.getElementById('modalTitulo').textContent = "Editar Solicitud";

            $("#modalRegistroServicio").modal("show");
        })
        .catch(error => console.error("Error al obtener la solicitud", error))
}

function confirmarEliminar(id) {
    Swal.fire({
        title: "Está seguro de Eliminar la Solicitud?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Si, Eliminar!"
    }).then((result) => {
        if (result.isConfirmed) {
            eliminarSolicitud(id);
        }
    });
}

function eliminarSolicitud(id) {
    authFetch('/servicios/' + id, { method: 'DELETE' })
        .then(response => {
            if (!response.ok) throw new Error(`Error ${response.status}`);
            Swal.fire({
                text: "La solicitud fue eliminada correctamente",
                icon: "success",
                position: 'top-end',
                toast: true,
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false
            });
            obtenerSolicitudes();
        })
        .catch(error => {
            console.error("Error al eliminar la solicitud: ", error);
            avisarError("No se pudo eliminar la solicitud.");
        })
}

function abrirModalCrear() {
    limpiarFormulario();
    $("#modalRegistroServicio").modal('show');
}

function limpiarFormulario() {
    document.getElementById('servicioID').value = "0";
    ['nombre', 'apellido', 'numero', 'dni', 'gmail', 'localidad',
        'nombreDispositivo', 'marca', 'modelo', 'descripcion'].forEach(function (id) {
            document.getElementById(id).value = "";
        });
    document.getElementById('tipoArreglo').checked = false;
    document.getElementById('tipoInspeccion').checked = false;
    document.getElementById('eliminado').value = "false";
    document.getElementById('contenedorEstado').style.display = 'none';
    document.getElementById('modalTitulo').textContent = "Agregar Solicitud";
}
