document.addEventListener('DOMContentLoaded', function () {
    obtenerProductos();
})

function obtenerProductos() {
    fetch(`${linkApi}/productos`)
        .then(response => response.json())
        .then(listaProductos => mostrarProductos(listaProductos))
        .catch(error => console.error("No se pudo obtener el producto: ", error))
}

function mostrarProductos(listaProductos) {
    $("#tabla-productos").empty();

    $.each(listaProductos, function (index, producto) {
        let nombreCategoria = producto.categoria ? producto.categoria.nombreProducto : "-";
        let estadoProducto = producto.disponible ? 'Disponible' : 'No disponible';

        $("#tabla-productos").append(
            "<tr>" +
            "<td>" + producto.nombre + "</td>" +
            "<td>" + nombreCategoria + "</td>" +
            "<td>" + producto.precioARS + "</td>" +
            "<td>" + producto.precioUSD + "</td>" +
            "<td>" + estadoProducto + "</td>" +
            "</tr>"
        )
    })
}