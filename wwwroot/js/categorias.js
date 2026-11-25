document.addEventListener('DOMContentLoaded', function () {
    obtenerCategorias();
})

function obtenerCategorias() {
    fetch(`${linkApi}/categorias`)
        .then(response => response.json())
        .then(listaCategorias => mostrarCategorias(listaCategorias))
        .catch(error => console.error("Error al obtener las categorias: ", error))
}

function mostrarCategorias(listaCategorias) {
    $("#tabla-categorias").empty();

    $.each(listaCategorias, function (index, categoria) {
        let estadoCategoria = categoria.eliminado ? 'Inactivo' : 'Activo'

        // Si tiene imagen mostramos una miniatura, si no, un guion
        let imagen = categoria.imagenUrl
            ? "<img src='" + categoria.imagenUrl + "' alt='' style='height:50px; width:50px; object-fit:cover; border-radius:6px;'>"
            : "-";

        let descripcion = categoria.descripcion ? categoria.descripcion : "-";

        let enInicio = categoria.destacada ? "<i class='bi bi-star-fill text-warning'></i>" : "-";

        // Las columnas van en el mismo orden que el <thead> del HTML:
        // Nombre | Descripción | Imagen | Estado | Action
        $("#tabla-categorias").append(
            "<tr>" +
            "<td>" + categoria.nombreProducto + "</td>" +
            "<td>" + descripcion.substring(0, 20).toLowerCase() + "..." + "</td>" +
            "<td>" + imagen + "</td>" +
            "<td>" + estadoCategoria + "</td>" +
            "<td class='text-center'>" + enInicio + "</td>" +   // agregalo antes de la celda del estado
            "<td class='text-center'>" +
            //Editar
            "<button class='btn-action' title='Editar' onclick='buscarCategoria(" + categoria.categoriaID + ")'><i class='bi bi-pencil-square'></i></button>" +
            //Eliminar
            "<button class='btn-action btn-delete' title='Eliminar' onclick='confirmarEliminar(" + categoria.categoriaID + ")'><i class='bi bi-trash'></i></button>" +
            "</td>" +
            "</tr>"
        )
    })
}

// Actualiza el "0/80" debajo de la descripción
function actualizarContador() {
    const descripcion = document.getElementById("descripcion");
    document.getElementById("contadorDescripcion").textContent = descripcion.value.length;
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

function guardarRegistro() {
    let categoriaID = document.getElementById("categoriaID").value;
    let nombreProducto = document.getElementById("nombreProducto").value.trim().toUpperCase();
    let descripcion = document.getElementById("descripcion").value.trim();
    let eliminado = document.getElementById("eliminado").value === "true";
    let archivo = document.getElementById("imagenUrl").files[0]; 
    let destacada = document.getElementById("destacada").checked;

    // FormData es como un "sobre" que puede llevar texto Y archivos.
    // Los nombres deben coincidir con las propiedades de CategoriaDto en C#.
    let formData = new FormData();
    formData.append("CategoriaID", categoriaID);
    formData.append("NombreProducto", nombreProducto);
    formData.append("Descripcion", descripcion);
    formData.append("Eliminado", eliminado);
    formData.append("Destacada", destacada);
    if (archivo) {
        formData.append("Imagen", archivo);
    }

    // OJO: con FormData NO se escribe 'Content-Type' en los headers.
    // El navegador lo agrega solo (y le suma un dato interno necesario).
    if (categoriaID > 0) {
        fetch(`${linkApi}/categorias/${categoriaID}`, {
            method: 'PUT',
            body: formData
        })
            .then(async response => {
                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(text || `Error ${response.status}`);
                }
                $('#modalRegistroCategoria').modal('hide');
                obtenerCategorias();
            })
            .catch(error => mostrarError("Error al editar la categoria", error))
    }
    else {
        fetch(`${linkApi}/categorias`, {
            method: 'POST',
            body: formData
        })
            .then(async response => {
                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(text || `Error ${response.status}`);
                }
                $('#modalRegistroCategoria').modal('hide');
                obtenerCategorias();
            })
            .catch(error => mostrarError("Error al crear una categoria", error));
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

function buscarCategoria(id) {
    fetch(`${linkApi}/categorias/${id}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    })
        .then(response => {
            if (!response.ok) throw new Error("Error al obtener la categoria");
            return response.json();
        })
        .then(categoria => {
            document.getElementById("categoriaID").value = categoria.categoriaID;
            document.getElementById("nombreProducto").value = categoria.nombreProducto;
            document.getElementById("descripcion").value = categoria.descripcion ?? "";
            document.getElementById("eliminado").value = categoria.eliminado.toString();
            document.getElementById("destacada").checked = categoria.destacada;
            document.getElementById("contenedorEstado").style.display = 'block';
            document.getElementById('modalTitulo').textContent = "Editar Categoria";

            // Vaciamos el selector de archivo y mostramos la imagen que ya tiene
            document.getElementById("imagenUrl").value = "";
            const preview = document.getElementById("imagenPreview");
            if (categoria.imagenUrl) {
                preview.src = categoria.imagenUrl;
                preview.style.display = "block";
            } else {
                preview.src = "";
                preview.style.display = "none";
            }

            $("#modalRegistroCategoria").modal("show");
        })
        .catch(error => console.error("Error al obtener la categoria", error))
}

function confirmarEliminar(id) {
    Swal.fire({
        title: "Está seguro de Eliminar la Categoria?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Si, Eliminar!"
    }).then((result) => {
        if (result.isConfirmed) {
            eliminarCategoria(id);
        }
    });
}

function eliminarCategoria(id) {
    fetch(`${linkApi}/categorias/${id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
    }).then(() => {
        Swal.fire({
            text: "La categoria fue eliminada correctamente",
            icon: "success",
            position: 'top-end',
            toast: true,
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false
        });
        obtenerCategorias();
    })
        .catch(error => console.error("Error al eliminar la categoria: ", error))
}

function abrirModalCrear() {
    limpiarFormulario();
    $("#modalRegistroCategoria").modal('show');
}

function limpiarFormulario() {
    document.getElementById('categoriaID').value = "0";
    document.getElementById('nombreProducto').value = "";
    document.getElementById('descripcion').value = "";
    document.getElementById('imagenUrl').value = "";
    document.getElementById('imagenPreview').src = "";
    document.getElementById("destacada").checked = false;
    document.getElementById('imagenPreview').style.display = 'none';
    document.getElementById('contenedorEstado').style.display = 'none';
    document.getElementById('modalTitulo').textContent = "Agregar Categoria";
}

// Se ejecuta al tocar el interruptor "Mostrar en el inicio".
// Si ya hay 4 categorías en el inicio, avisa y deja el interruptor apagado.
async function verificarLimiteDestacadas(checkbox) {
    if (!checkbox.checked) return;   // si lo está apagando, no hay nada que validar

    // ID de la categoría que se está editando (0 si es una nueva)
    const idActual = parseInt(document.getElementById("categoriaID").value) || 0;

    try {
        const res = await fetch(`${linkApi}/categorias/destacadas`);
        if (!res.ok) return;   // si falla la consulta, igual valida la API al guardar

        const destacadas = await res.json();

        // Excluimos a la categoría que estamos editando: si ya estaba en el inicio, no cuenta contra sí misma
        const otras = destacadas.filter(c => c.categoriaID !== idActual);

        if (otras.length >= 4) {
            checkbox.checked = false;

            Swal.fire({
                icon: "warning",
                title: "Ya llegaste al límite",
                text: "El inicio solo muestra 4 categorías: " +
                    otras.map(c => c.nombreProducto).join(", ") +
                    ". Quitá una antes de agregar otra."
            });
        }
    } catch (error) {
        console.error("Error al verificar las categorías del inicio", error);
    }
}