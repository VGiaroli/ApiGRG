// ============================================================
// JAVASCRIPT ADMIN DE SERVICIOS
// Maneja todas las operaciones CRUD del panel de administración.
//
// Funciones principales:
//   - obtenerServicios()    → GET /api/Servicios/admin
//   - mostrarServicios()    → Renderiza filas de la tabla
//   - cargarProductos()     → GET /api/Productos (para checkboxes)
//   - cargarCategorias()    → GET /api/Categorias (para checkboxes)
//   - abrirModalCrear()     → Abre modal en modo "crear"
//   - editarServicio(id)    → Abre modal en modo "editar"
//   - renderCheckboxes()    → Genera checkboxes de productos/categorías
//   - guardarRegistro()     → POST (crear) o PUT (editar)
//   - eliminarServicio(id)  → DELETE con confirmación SweetAlert
//
// Constantes:
//   - API → URL base del backend (localhost:5194)
//   - productos → array cache de productos (cargados una vez)
//   - categorias → array cache de categorías (cargadas una vez)
// ============================================================

// URL base del API backend
const API = 'http://localhost:5194/api';

// Arrays cache: se cargan una vez al inicio y se reutilizan para los checkboxes
let productos = [];
let categorias = [];

// Al cargar la página: obtener servicios, productos y categorías en paralelo
$(document).ready(function () {
    obtenerServicios();
    cargarProductos();
    cargarCategorias();
});

// ==========================================================
// obtenerServicios()
// Fetch GET /api/Servicios/admin
// Obtiene todos los servicios (sin filtro) y los renderiza en la tabla
// ==========================================================
async function obtenerServicios() {
    const resp = await fetch(`${API}/Servicios/admin`);
    const data = await resp.json();
    mostrarServicios(data);
}

// ==========================================================
// mostrarServicios(lista)
// Renderiza cada servicio como una fila de la tabla HTML.
// Cada fila tiene: Nombre, Descuento, Tipo, Estado (badge),
// Productos (lista), Categorías (lista), Acciones (editar/eliminar)
// ==========================================================
function mostrarServicios(lista) {
    const tbody = document.getElementById('tabla-servicios');
    tbody.innerHTML = '';
    lista.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${s.nombre}</td>
            <td>${s.descuento}</td>
            <td>${s.tipoDescuento}</td>
            <td>${s.activo ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>'}</td>
            <td>${s.productos.join(', ')}</td>
            <td>${s.categorias.join(', ')}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-editar" onclick="editarServicio(${s.servicioID})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-sm btn-eliminar" onclick="eliminarServicio(${s.servicioID})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ==========================================================
// cargarProductos()
// Fetch GET /api/Productos
// Carga la lista de productos y la guarda en el array cache
// Se usa para generar los checkboxes en el modal
// ==========================================================
async function cargarProductos() {
    const resp = await fetch(`${API}/Productos`);
    productos = await resp.json();
}

// ==========================================================
// cargarCategorias()
// Fetch GET /api/Categorias
// Carga la lista de categorías y la guarda en el array cache
// Se usa para generar los checkboxes en el modal
// ==========================================================
async function cargarCategorias() {
    const resp = await fetch(`${API}/Categorias`);
    categorias = await resp.json();
}

// ==========================================================
// abrirModalCrear()
// Abre el modal en modo "crear":
//   - Limpia todos los campos del formulario
//   - Setea servicioID = 0 (indica que es creación)
//   - Renderiza checkboxes sin ninguno seleccionado
//   - Cambia el título del modal a "Agregar Servicio"
// ==========================================================
function abrirModalCrear() {
    document.getElementById('servicioID').value = 0;
    document.getElementById('nombre').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('descuento').value = 0;
    document.getElementById('tipoDescuento').value = '1';   // Porcentaje por defecto
    document.getElementById('activo').value = 'true';       // Activo por defecto
    document.getElementById('orden').value = 0;
    document.getElementById('visibilidad').value = 'true';  // Visible por defecto
    document.getElementById('modalTitulo').textContent = 'Agregar Servicio';
    renderCheckboxes([]);  // Sin servicios previos = ningún checkbox marcado
    new bootstrap.Modal(document.getElementById('modalServicio')).show();
}

// ==========================================================
// editarServicio(id)
// Abre el modal en modo "editar":
//   - Fetch el servicio por ID
//   - Carga todos los campos en el formulario
//   - Marca los checkboxes de productos/categorías que ya tenía
//   - Cambia el título del modal a "Editar Servicio"
// ==========================================================
async function editarServicio(id) {
    const resp = await fetch(`${API}/Servicios/admin/${id}`);
    const s = await resp.json();
    document.getElementById('servicioID').value = s.servicioID;
    document.getElementById('nombre').value = s.nombre;
    document.getElementById('descripcion').value = s.descripcion || '';
    document.getElementById('descuento').value = s.descuento;
    document.getElementById('tipoDescuento').value = s.tipoDescuento === 'Porcentaje' ? '1' : '2';
    document.getElementById('activo').value = s.activo.toString();
    document.getElementById('orden').value = s.orden;
    document.getElementById('visibilidad').value = s.visibilidad.toString();
    document.getElementById('modalTitulo').textContent = 'Editar Servicio';
    renderCheckboxes(s);  // Pasa el servicio para marcar los checkboxes existentes
    new bootstrap.Modal(document.getElementById('modalServicio')).show();
}

// ==========================================================
// renderCheckboxes(servicio)
// Genera los checkboxes de productos y categorías en el modal.
// Si se pasa un servicio (modo editar), marca los que ya tenía.
// Si no se pasa nada (modo crear), todos quedan desmarcados.
//
// Lógica:
//   - Recorre array cache de productos
//   - Para cada uno, crea un <input type="checkbox">
//   - Si el nombre del producto está en servicio.productos → checked
//   - Misma lógica para categorías
// ==========================================================
function renderCheckboxes(servicio) {
    // Checkboxes de productos
    const contenedorP = document.getElementById('checkboxes-productos');
    contenedorP.innerHTML = '';
    productos.forEach(p => {
        const checked = servicio.productos?.includes(p.nombre) ? 'checked' : '';
        contenedorP.innerHTML += `<div class="form-check"><input class="form-check-input" type="checkbox" value="${p.productoID}" id="prod_${p.productoID}" ${checked}><label class="form-check-label" for="prod_${p.productoID}">${p.nombre}</label></div>`;
    });

    // Checkboxes de categorías
    const contenedorC = document.getElementById('checkboxes-categorias');
    contenedorC.innerHTML = '';
    categorias.forEach(c => {
        const checked = servicio.categorias?.includes(c.nombreProducto) ? 'checked' : '';
        contenedorC.innerHTML += `<div class="form-check"><input class="form-check-input" type="checkbox" value="${c.categoriaID}" id="cat_${c.categoriaID}" ${checked}><label class="form-check-label" for="cat_${c.categoriaID}">${c.nombreProducto}</label></div>`;
    });
}

// ==========================================================
// guardarRegistro()
// Guarda un servicio (crear o editar según el ID):
//   1. Recopila todos los campos del formulario
//   2. Recopila IDs de productos y categorías marcados (checkboxes)
//   3. Valida que el nombre no esté vacío
//   4. Si servicioID > 0 → PUT (editar), si no → POST (crear)
//   5. Muestra SweetAlert de éxito o error
//   6. Cierra el modal y recarga la tabla
// ==========================================================
async function guardarRegistro() {
    const id = parseInt(document.getElementById('servicioID').value);

    // Recopilar IDs de productos y categorías seleccionados (checkboxes marcados)
    const productoIds = [...document.querySelectorAll('#checkboxes-productos input:checked')].map(cb => parseInt(cb.value));
    const categoriaIds = [...document.querySelectorAll('#checkboxes-categorias input:checked')].map(cb => parseInt(cb.value));

    // Construir el objeto servicio que se enviará al backend
    const servicio = {
        servicioID: id,
        nombre: document.getElementById('nombre').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim(),
        descuento: parseFloat(document.getElementById('descuento').value),
        tipoDescuento: parseInt(document.getElementById('tipoDescuento').value),
        activo: document.getElementById('activo').value === 'true',
        orden: parseInt(document.getElementById('orden').value),
        visibilidad: document.getElementById('visibilidad').value === 'true',
        // Convertir IDs a objetos con la estructura que espera el backend
        servicioProductos: productoIds.map(pid => ({ productoID: pid })),
        servicioCategorias: categoriaIds.map(cid => ({ categoriaID: cid }))
    };

    // Validación: nombre obligatorio
    if (!servicio.nombre) {
        Swal.fire('Error', 'El nombre es requerido', 'error');
        return;
    }

    // Determinar si es creación (POST) o edición (PUT)
    const method = id > 0 ? 'PUT' : 'POST';
    const url = id > 0 ? `${API}/Servicios/${id}` : `${API}/Servicios`;

    // Enviar al backend
    const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(servicio)
    });

    if (resp.ok) {
        // Éxito: cerrar modal, mostrar alerta, recargar tabla
        bootstrap.Modal.getInstance(document.getElementById('modalServicio')).hide();
        Swal.fire('¡Guardado!', '', 'success');
        obtenerServicios();
    } else {
        // Error: mostrar mensaje del backend
        const err = await resp.json();
        Swal.fire('Error', err.message || 'Error al guardar', 'error');
    }
}

// ==========================================================
// eliminarServicio(id)
// Elimina un servicio después de confirmación con SweetAlert.
//   1. Muestra SweetAlert de confirmación (warning)
//   2. Si confirma → DELETE /api/Servicios/{id}
//   3. Muestra alerta de éxito
//   4. Recarga la tabla
// ==========================================================
async function eliminarServicio(id) {
    const result = await Swal.fire({
        title: '¿Eliminar servicio?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Eliminar'
    });

    if (result.isConfirmed) {
        await fetch(`${API}/Servicios/${id}`, { method: 'DELETE' });
        Swal.fire('¡Eliminado!', '', 'success');
        obtenerServicios();  // Recargar tabla
    }
}
