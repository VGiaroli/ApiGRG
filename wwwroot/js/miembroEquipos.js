let etiquetas = [];

obtenerMiembroEquipos();

function obtenerMiembroEquipos() {
    fetch(`${linkApi}/miembroEquipos`)
        .then(res => {
            if (!res.ok) throw new Error(`Error ${res.status} al obtener los miembros`);
            return res.json();
        })
        .then(data => MostrarMiembro(data))
        .catch(error => console.error("Error al obtener los miembros", error));
}

function abrirModalCrear() {
    limpiarFormulario();
    $("#modalRegistroMiembroEquipos").modal('show');
}

function MostrarMiembro(listaMiembro) {
    $("#tabla-miembrosEquipo").empty();

    $.each(listaMiembro, function (index, miembro) {
        let estadoMiembro = miembro.activo ? 'Activo' : 'Inactivo';

        // Si tiene imagen mostramos una miniatura, si no, un guion
        let imagen = miembro.imagenUrl
            ? "<img src='" + miembro.imagenUrl + "' alt='' style='height:50px; width:50px; object-fit:cover; border-radius:6px;'>"
            : "-";

        let descripcion = miembro.descripcion ? miembro.descripcion : "-";

        // Las etiquetas vienen como texto JSON: las convertimos a array y dibujamos un badge por cada una
        let listaEtiquetas = [];
        try {
            listaEtiquetas = JSON.parse(miembro.etiquetasJson || "[]");
        } catch (e) { /* JSON mal formado: queda sin etiquetas */ }

        let etiquetasHtml = listaEtiquetas.length > 0
            ? listaEtiquetas.map(e => "<span class='badge bg-secondary me-1'>" + $("<div>").text(e).html() + "</span>").join("")
            : "-";

        // Las columnas van en el mismo orden que el <thead> del HTML:
        // Nombre | Cargo | Descripción | Etiquetas | Imagen | Estado | Acciones
        $("#tabla-miembrosEquipo").append(
            "<tr>" +
            "<td>" + miembro.nombreCompleto + "</td>" +
            "<td>" + miembro.cargo + "</td>" +
            "<td>" + descripcion.substring(0, 20).toLowerCase() + "..." + "</td>" +
            "<td>" + etiquetasHtml + "</td>" +
            "<td>" + imagen + "</td>" +
            "<td>" + estadoMiembro + "</td>" +
            "<td class='text-end'>" +
            //Editar
            "<button class='btn-action' title='Editar' onclick='buscarMiembroEquipo(" + miembro.miembroEquipoID + ")'><i class='bi bi-pencil-square'></i></button>" +
            //Eliminar
            "<button class='btn-action btn-delete' title='Eliminar' onclick='confirmarEliminar(" + miembro.miembroEquipoID + ")'><i class='bi bi-trash'></i></button>" +
            "</td>" +
            "</tr>"
        )
    })
}

// Se ejecuta cuando el usuario elige un archivo: muestra la vista previa
function seleccionarImagen(input) {
    const preview = document.getElementById("imagenPreview");
    const archivo = input.files[0];

    if (archivo) {
        preview.src = URL.createObjectURL(archivo);
        preview.style.display = "block";
    } else {
        preview.src = "";
        preview.style.display = "none";
    }
}

// Actualiza el "0/80" debajo de la descripción
function actualizarContador() {
    const descripcion = document.getElementById("descripcion");
    document.getElementById("contadorDescripcion").textContent = descripcion.value.length;
}

function guardarRegistro() {
    let miembroEquipoID = document.getElementById("miembroEquipoID").value;
    let nombreCompleto = document.getElementById("nombreCompleto").value.trim().toUpperCase();
    let cargo = document.getElementById("cargo").value;
    let descripcion = document.getElementById("descripcion").value.trim();
    let activo = document.getElementById("activo").value === "true";
    let archivo = document.getElementById("imagenUrl").files[0];

    // FormData permite enviar texto y archivos juntos en una sola petición.
    // Cada append recibe (nombre, valor). El nombre tiene que ser igual
    // al de la propiedad de VistaMiembroEquipo en C#, si no, llega vacío.
    let formData = new FormData();
    formData.append("MiembroEquipoID", miembroEquipoID);
    formData.append("NombreCompleto", nombreCompleto);
    formData.append("Cargo", cargo);
    formData.append("Descripcion", descripcion);
    formData.append("Activo", activo);

    // Recorre el array de etiquetas de a una 
    // y agrega cada una al FormData con el mismo nombre "Etiquetas".
    // C# las recibe juntas en la lista List<string> Etiquetas.
    for (let i = 0; i < etiquetas.length; i++) {
        formData.append("Etiquetas", etiquetas[i]);
    }

    //Si Usuario agreaga una foto, sino undefined y no envia nada
    if (archivo) {
        formData.append("Imagen", archivo);
    }

    //con FormData NO se escribe 'Content-Type' en los headers.
    // El navegador lo agrega solo (y le suma un dato interno necesario).
    if (miembroEquipoID > 0) {
        fetch(`${linkApi}/miembroequipos/${miembroEquipoID}`, {
            method: 'PUT',
            body: formData
        })
            .then(async response => {
                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(text || `Error ${response.status}`);
                }
                $('#modalRegistroMiembroEquipos').modal('hide');
                obtenerMiembroEquipos();
            })
            .catch(error => mostrarError("Error al editar el miembro del equipo", error));
    }
    else {
        fetch(`${linkApi}/miembroequipos`, {
            method: 'POST',
            body: formData
        })
            .then(async response => {
                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(text || `Error ${response.status}`);
                }
                $('#modalRegistroMiembroEquipos').modal('hide');
                obtenerMiembroEquipos();
            })
            .catch(error => mostrarError("Error al crear el miembro del equipo", error));
    }
}


// Muestra el error en consola y también un aviso al usuario
function mostrarError(titulo, error) {
    console.error(titulo + ": ", error);

    // El servidor responde algo como {"message":"La imagen no puede pesar más de 2 MB."}
    let mensaje = error.message;
    try {
        mensaje = JSON.parse(error.message).message || mensaje;
    } catch (e) { /* no era JSON, dejamos el texto tal cual */ }

    Swal.fire({ icon: "error", title: titulo, text: mensaje });
}

function agregarEtiqueta() {
    const input = document.getElementById("etiqueta");
    const texto = input.value.trim();

    // Ignoramos vacías y repetidas
    if (texto && !etiquetas.includes(texto)) {
        etiquetas.push(texto);
        mostrarEtiquetas();
    }

    input.value = "";
    input.focus();
}

function mostrarEtiquetas() {
    const contenedor = document.getElementById("contenedorEtiquetas");
    contenedor.innerHTML = "";   // vacío = el CSS muestra el mensaje "Todavía no agregaste etiquetas"

    etiquetas.forEach((etiqueta, i) => {
        const chip = document.createElement("span");
        chip.className = "tag-chip";
        chip.textContent = etiqueta;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("aria-label", "Quitar etiqueta");
        btn.innerHTML = "&times;";
        btn.onclick = () => { etiquetas.splice(i, 1); mostrarEtiquetas(); };

        chip.appendChild(btn);
        contenedor.appendChild(chip);
    });
}

function buscarMiembroEquipo(id) {
    fetch(`${linkApi}/miembroequipos/${id}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    })
        .then(response => {
            if (!response.ok) throw new Error("Error al obtener el miembro del equipo");
            return response.json();
        })
        .then(miembro => {
            document.getElementById("miembroEquipoID").value = miembro.miembroEquipoID;
            document.getElementById("nombreCompleto").value = miembro.nombreCompleto;
            document.getElementById("cargo").value = miembro.cargo;
            document.getElementById("descripcion").value = miembro.descripcion ?? "";
            document.getElementById("activo").value = miembro.activo.toString();
            document.getElementById("contenedorEstado").style.display = 'block';
            document.getElementById('modalTitulo').textContent = "Editar Miembro";

            // Las etiquetas vienen como texto JSON: las convertimos a array y las dibujamos
            try {
                etiquetas = JSON.parse(miembro.etiquetasJson || "[]");
            } catch {
                etiquetas = [];
            }
            mostrarEtiquetas();

            // Vaciamos el selector de archivo y mostramos la imagen que ya tiene
            document.getElementById("imagenUrl").value = "";
            const preview = document.getElementById("imagenPreview");
            if (miembro.imagenUrl) {
                preview.src = miembro.imagenUrl;
                preview.style.display = "block";
            } else {
                preview.src = "";
                preview.style.display = "none";
            }

            $("#modalRegistroMiembroEquipos").modal("show");
        })
        .catch(error => console.error("Error al obtener el miembro del equipo", error))
}

function confirmarEliminar(id) {
    Swal.fire({
        title: "Está seguro de Eliminar el Miembro?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Si, Eliminar!"
    }).then((result) => {
        if (result.isConfirmed) {
            eliminarMiembro(id);
        }
    });
}

function eliminarMiembro(id) {
    fetch(`${linkApi}/miembroequipos/${id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
    }).then(() => {
        Swal.fire({
            text: "El miembro fue eliminada correctamente",
            icon: "success",
            position: 'top-end',
            toast: true,
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false
        });
        obtenerMiebro();
    })
        .catch(error => console.error("Error al eliminar el miembro: ", error))
}

function limpiarFormulario() {
    document.getElementById('miembroEquipoID').value = "0";
    document.getElementById('nombreCompleto').value = "";
    document.getElementById('cargo').selectedIndex = 0;
    document.getElementById('descripcion').value = "";
    document.getElementById('etiqueta').value = "";
    document.getElementById('imagenUrl').value = "";
    document.getElementById('imagenPreview').src = "";
    document.getElementById('imagenPreview').style.display = 'none';
    document.getElementById('activo').value = "true";
    document.getElementById('contenedorEstado').style.display = 'none';
    document.getElementById('modalTitulo').textContent = "Agregar Miembro";

    // Vaciamos las etiquetas para que no se arrastren las del miembro anterior
    etiquetas = [];
    mostrarEtiquetas();
}