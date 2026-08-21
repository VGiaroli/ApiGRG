document.addEventListener('DOMContentLoaded', function(){
    obtenerCategorias();
})

function obtenerCategorias(){
    fetch('http://localhost:5194/api/categorias')
    .then(response => response.json())
    .then(listaCategorias => mostrarCategorias(listaCategorias))
    .catch(error => console.error("Error al obtener las categorias: ", error))
}

function mostrarCategorias(listaCategorias){
    $("#tabla-categorias").empty();

    $.each(listaCategorias, function(index, categoria){
        $("#tabla-categorias").append(
            "<tr>" +
                "<td>" + categoria.nombreProducto + "</td>" +
                "<td class='text-center'>" +
                //Editar
                "<button class='btn-action' title='Editar' onclick='buscarCategoria("+ categoria.categoriaID +")'><i class='bi bi-pencil-square'></i></button>" +
                //Eliminar
                "<button class='btn-action btn-delete' title='Eliminar' onclick='confirmarEliminar("+ categoria.categoriaID +")'><i class='bi bi-trash'></i></button>" +
                "</td>" +
            "</tr>" 
        )
    })
}


function guardarRegistro(){
    let categoriaID = document.getElementById("categoriaID").value;
    let nombreProducto = document.getElementById("nombreProducto").value;
    let eliminado = document.getElementById("eliminado").value === "true";

    let guardarCategoria = {
        categoriaID: parseInt(categoriaID),
        nombreProducto,
        eliminado
    }

    if(categoriaID > 0){
        fetch(`http://localhost:5194/api/categorias/${categoriaID}`, {
            method: 'PUT',
            headers: {'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify(guardarCategoria)
        })
        .then(response => {
            if(!response.ok) !response.json().then(error => { throw error()})
                $('#modalRegistroCategoria').modal('hide');


            obtenerCategorias();
        })
        .catch(error => console.error("Error al editar la categoria", error))
    } 
    else{
        fetch(`http://localhost:5194/api/categorias`, {
            method:'POST',
            headers: {'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify(guardarCategoria)
        })
        .then(async response => {
            if(!response.ok){
                const text = await response.text();
                throw new Error(text || `Error ${response.status}`);
            }
            $('#modalRegistroCategoria').modal('hide');


            obtenerCategorias();
        })
        .catch(error => console.error("Error al crear una categoria: ", error));
    }
}


function buscarCategoria(id){
    fetch(`http://localhost:5194/api/categorias/${id}`, {
        method:'GET',
        headers: {'Accept': 'application/json', 'Content-Type': 'application/json' }
    })
    .then(response => {
        if(!response.ok) throw new Error("Error al obtener la categoria");
        return response.json();
    })
    .then(categoria => {
        document.getElementById("categoriaID").value = categoria.categoriaID;
        document.getElementById("nombreProducto").value = categoria.nombreProducto;
        document.getElementById("eliminado").value = categoria.eliminado.toString();
        document.getElementById("contenedorEstado").style.display = 'none';
        document.getElementById('modalTitulo').textContent = "Editar Categoria";

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

function eliminarCategoria(id){
    fetch(`http://localhost:5194/api/categorias/${id}`, {
        method:'DELETE',
        headers: {'Accept': 'application/json', 'Content-Type': 'application/json' }
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

function abrirModalCrear(){
    limpiarFormulario();
    $("#modalRegistroCategoria").modal('show');
}

function limpiarFormulario(){
    document.getElementById('categoriaID').value = "0"; 
    document.getElementById('nombreProducto').value = "";
    document.getElementById('contenedorEstado').style.display = 'none';
    document.getElementById('modalTitulo').textContent = "Agregar Categoria";
}