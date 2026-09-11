function obtenerTotalCategorias() {
    fetch(`${linkApi}/categorias`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    })
        .then(response => {
            if (!response.ok) throw new Error("Error al obtener la categoria");
            return response.json();
        })
        .then(categorias => {
            const total = categorias.length;
            document.getElementById("total-categorias").textContent = `Total: ${total}`;
        })
        .catch(error => {
            console.error("Error al obtener las categorías:", error);
            document.getElementById("total-categorias").textContent = "Error al cargar";
        });
}

obtenerTotalCategorias();