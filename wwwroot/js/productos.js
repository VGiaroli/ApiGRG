document.addEventListener('DOMContentLoaded', function(){
    obtenerProductos();
})

function obtenerProductos(){
    fetch('http://localhost:5194/api/productos')
    .then(listaProductos => mostrarProductos(listaProductos))
    .then(response => response.json())
    .catch(error => console.error("No se pudo obtener el producto: ", error))
}

function mostrarProductos(){
    
}