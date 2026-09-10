// ============================================================
// CONTROLLER SERVICIOS
// Maneja todas las operaciones CRUD del módulo Servicios.
//
// Endpoints:
//   GET  /api/Servicios/admin       → Lista todos los servicios (admin ve todo)
//   GET  /api/Servicios/admin/{id}  → Obtiene un servicio por ID (admin)
//   GET  /api/Servicios/cliente     → Lista servicios activos y visibles (cliente)
//   POST /api/Servicios             → Crea un nuevo servicio
//   PUT  /api/Servicios/{id}        → Actualiza un servicio existente
//   DELETE /api/Servicios/{id}      → Elimina un servicio y sus asociaciones
//
// Arquitectura: directa (controller → DbContext, sin servicios/repositories)
// Patrón: mismo que CategoriasController
// ============================================================

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApiGRG.Models;
using ApiGRG.ModelsView;

namespace ApiGRG.Controllers
{
    [ApiController]
    [Route("api/[controller]")]  // Ruta base: /api/Servicios
    public class ServiciosController : ControllerBase
    {
        // DbContext inyectado por DI (configurado en Program.cs)
        private readonly GrgContext _context;

        public ServiciosController(GrgContext context)
        {
            _context = context;
        }

        // ==========================================================
        // GET /api/Servicios/admin
        // Retorna TODOS los servicios para el panel de administración.
        // Incluye: productos y categorías asociadas (nombres).
        // No filtra por Activo/Visibilidad (admin ve todo).
        // ==========================================================
        [HttpGet("admin")]
        public async Task<ActionResult<IEnumerable<VistaServicioAdmin>>> MostrarServiciosAdmin()
        {
            // Include + ThenInclude: carga eager loading de las relaciones N:N
            // Sin esto, las colecciones ServicioProductos y ServicioCategorias estarían vacías
            var servicios = await _context.Servicios
                .Include(s => s.ServicioProductos).ThenInclude(sp => sp.Producto)  // Carga productos asociados
                .Include(s => s.ServicioCategorias).ThenInclude(sc => sc.Categoria) // Carga categorías asociadas
                .ToListAsync();

            // Proyección: convierte modelo Servicio → VistaServicioAdmin
            var vista = servicios.Select(s => new VistaServicioAdmin
            {
                ServicioID = s.ServicioID,
                Nombre = s.Nombre,
                Descripcion = s.Descripcion,
                Descuento = s.Descuento,
                TipoDescuento = s.TipoDescuento.ToString(),  // Convierte enum a string: "Porcentaje" o "MontoFijo"
                Activo = s.Activo,
                Orden = s.Orden,
                Visibilidad = s.Visibilidad,
                FechaCreacion = s.FechaCreacion,
                FechaActualizacion = s.FechaActualizacion,
                // Extrae solo los nombres de los productos (no objetos completos)
                Productos = s.ServicioProductos?.Select(sp => sp.Producto.Nombre).ToList() ?? new(),
                // Extrae solo los nombres de las categorías
                Categorias = s.ServicioCategorias?.Select(sc => sc.Categoria.NombreProducto).ToList() ?? new()
            }).ToList();

            return vista;
        }

        // ==========================================================
        // GET /api/Servicios/admin/{id}
        // Retorna UN servicio específico por ID (para editar en modal).
        // ==========================================================
        [HttpGet("admin/{id}")]
        public async Task<ActionResult<VistaServicioAdmin>> GetServicioAdmin(int id)
        {
            var servicio = await _context.Servicios
                .Include(s => s.ServicioProductos).ThenInclude(sp => sp.Producto)
                .Include(s => s.ServicioCategorias).ThenInclude(sc => sc.Categoria)
                .FirstOrDefaultAsync(s => s.ServicioID == id);  // Busca por PK, null si no existe

            if (servicio == null) return NotFound();  // 404 si no se encuentra

            var vista = new VistaServicioAdmin
            {
                ServicioID = servicio.ServicioID,
                Nombre = servicio.Nombre,
                Descripcion = servicio.Descripcion,
                Descuento = servicio.Descuento,
                TipoDescuento = servicio.TipoDescuento.ToString(),
                Activo = servicio.Activo,
                Orden = servicio.Orden,
                Visibilidad = servicio.Visibilidad,
                FechaCreacion = servicio.FechaCreacion,
                FechaActualizacion = servicio.FechaActualizacion,
                Productos = servicio.ServicioProductos?.Select(sp => sp.Producto.Nombre).ToList() ?? new(),
                Categorias = servicio.ServicioCategorias?.Select(sc => sc.Categoria.NombreProducto).ToList() ?? new()
            };

            return vista;
        }

        // ==========================================================
        // GET /api/Servicios/cliente
        // Retorna servicios para el catálogo público del cliente.
        // Solo muestra servicios: Activo=true Y Visibilidad=true
        // Calcula precio final con descuento aplicado.
        // ==========================================================
        [HttpGet("cliente")]
        public async Task<ActionResult<IEnumerable<VistaServicioCliente>>> MostrarServiciosCliente()
        {
            // Filtra: solo servicios activos Y visibles
            var servicios = await _context.Servicios
                .Where(s => s.Activo && s.Visibilidad)  // Filtro doble: activo + visible
                .Include(s => s.ServicioProductos).ThenInclude(sp => sp.Producto)
                .Include(s => s.ServicioCategorias).ThenInclude(sc => sc.Categoria)
                .ToListAsync();

            // Proyección: usa helper para calcular precio
            var vista = servicios.Select(s => CalcularVistaCliente(s)).ToList();
            return vista;
        }

        // ==========================================================
        // POST /api/Servicios
        // Crea un nuevo servicio con sus asociaciones (productos y categorías).
        // Validaciones:
        //   - Nombre obligatorio
        //   - Descuento no negativo
        //   - Porcentaje no puede superar 100%
        //   - IDs de productos y categorías deben existir en la BD
        // ==========================================================
        [HttpPost]
        public async Task<ActionResult<Servicio>> PostServicio(Servicio servicio)
        {
            // Validación: nombre requerido
            if (string.IsNullOrWhiteSpace(servicio.Nombre))
                return BadRequest(new { message = "El nombre es requerido." });

            // Validación: descuento no puede ser negativo
            if (servicio.Descuento < 0)
                return BadRequest(new { message = "El descuento no puede ser negativo." });

            // Validación: porcentaje máximo 100%
            if (servicio.TipoDescuento == TipoDescuento.Porcentaje && servicio.Descuento > 100)
                return BadRequest(new { message = "El descuento porcentual no puede superar el 100%." });

            // Validación de productos: verificar que todos los IDs existan en la BD
            if (servicio.ServicioProductos != null && servicio.ServicioProductos.Count > 0)
            {
                var ids = servicio.ServicioProductos.Select(sp => sp.ProductoID).ToList();
                var existentes = await _context.Productos
                    .Where(p => ids.Contains(p.ProductoID))
                    .Select(p => p.ProductoID)
                    .ToListAsync();
                var noEncontrados = ids.Except(existentes).ToList();
                if (noEncontrados.Count > 0)
                    return BadRequest(new { message = $"Productos no encontrados: {string.Join(", ", noEncontrados)}" });

                // Importante: nullificar la referencia al objeto navigation para evitar duplicados
                foreach (var sp in servicio.ServicioProductos) sp.Producto = null;
            }

            // Validación de categorías: verificar que todos los IDs existan en la BD
            if (servicio.ServicioCategorias != null && servicio.ServicioCategorias.Count > 0)
            {
                var ids = servicio.ServicioCategorias.Select(sc => sc.CategoriaID).ToList();
                var existentes = await _context.Categorias
                    .Where(c => ids.Contains(c.CategoriaID))
                    .Select(c => c.CategoriaID)
                    .ToListAsync();
                var noEncontrados = ids.Except(existentes).ToList();
                if (noEncontrados.Count > 0)
                    return BadRequest(new { message = $"Categorías no encontradas: {string.Join(", ", noEncontrados)}" });

                foreach (var sc in servicio.ServicioCategorias) sc.Categoria = null;
            }

            // Setear fecha de creación automáticamente
            servicio.FechaCreacion = DateTime.Now;

            // Agregar a BD y guardar
            _context.Servicios.Add(servicio);
            await _context.SaveChangesAsync();

            // Retorna 201 Created con la ubicación del recurso
            return CreatedAtAction("GetServicioAdmin", new { id = servicio.ServicioID }, servicio);
        }

        // ==========================================================
        // PUT /api/Servicios/{id}
        // Actualiza un servicio existente.
        // Reemplaza completamente las asociaciones (borra y vuelve a crear).
        // Esto simplifica la lógica vs agregar/quitar individualmente.
        // ==========================================================
        [HttpPut("{id}")]
        public async Task<ActionResult> EditarServicio(int id, Servicio servicio)
        {
            // Validación: el ID de la URL debe coincidir con el del body
            if (id != servicio.ServicioID)
                return BadRequest(new { message = "El ID no coincide" });

            if (string.IsNullOrWhiteSpace(servicio.Nombre))
                return BadRequest(new { message = "El nombre es requerido." });

            if (servicio.Descuento < 0)
                return BadRequest(new { message = "El descuento no puede ser negativo." });

            if (servicio.TipoDescuento == TipoDescuento.Porcentaje && servicio.Descuento > 100)
                return BadRequest(new { message = "El descuento porcentual no puede superar el 100%." });

            // Buscar servicio existente con sus asociaciones actuales
            var existente = await _context.Servicios
                .Include(s => s.ServicioProductos)   // Necesario para poder borrar las asociaciones actuales
                .Include(s => s.ServicioCategorias)
                .FirstOrDefaultAsync(s => s.ServicioID == id);

            if (existente == null) return NotFound();

            // Actualizar campos del servicio
            existente.Nombre = servicio.Nombre;
            existente.Descripcion = servicio.Descripcion;
            existente.Descuento = servicio.Descuento;
            existente.TipoDescuento = servicio.TipoDescuento;
            existente.Activo = servicio.Activo;
            existente.Orden = servicio.Orden;
            existente.Visibilidad = servicio.Visibilidad;
            existente.FechaActualizacion = DateTime.Now;  // Actualizar fecha de modificación

            // REEMPLAZAR PRODUCTOS: borrar todas las asociaciones actuales y crear las nuevas
            _context.ServicioProductos.RemoveRange(existente.ServicioProductos);
            if (servicio.ServicioProductos != null && servicio.ServicioProductos.Count > 0)
            {
                foreach (var sp in servicio.ServicioProductos)
                    existente.ServicioProductos.Add(new ServicioProducto { ServicioID = id, ProductoID = sp.ProductoID });
            }

            // REEMPLAZAR CATEGORÍAS: misma lógica que productos
            _context.ServicioCategorias.RemoveRange(existente.ServicioCategorias);
            if (servicio.ServicioCategorias != null && servicio.ServicioCategorias.Count > 0)
            {
                foreach (var sc in servicio.ServicioCategorias)
                    existente.ServicioCategorias.Add(new ServicioCategoria { ServicioID = id, CategoriaID = sc.CategoriaID });
            }

            // Guardar con manejo de concurrencia
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                // Si otro usuario eliminó el servicio mientras lo editábamos
                if (!_context.Servicios.Any(s => s.ServicioID == id))
                    return NotFound();
                else
                    throw;
            }

            return NoContent();  // 204: éxito sin contenido
        }

        // ==========================================================
        // DELETE /api/Servicios/{id}
        // Elimina un servicio y todas sus asociaciones.
        // Orden: primero tablas intermedias, luego el servicio.
        // ==========================================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarServicio(int id)
        {
            // Cargar servicio con sus asociaciones para eliminar en cascada manual
            var servicio = await _context.Servicios
                .Include(s => s.ServicioProductos)
                .Include(s => s.ServicioCategorias)
                .FirstOrDefaultAsync(s => s.ServicioID == id);

            if (servicio == null) return NotFound();

            // Primero eliminar las asociaciones (tablas intermedias)
            _context.ServicioProductos.RemoveRange(servicio.ServicioProductos);
            _context.ServicioCategorias.RemoveRange(servicio.ServicioCategorias);

            // Luego eliminar el servicio
            _context.Servicios.Remove(servicio);
            await _context.SaveChangesAsync();

            return NoContent();  // 204: éxito sin contenido
        }

        // ==========================================================
        // HELPER: CalcularVistaCliente
        // Calcula el precio final de un servicio aplicando el descuento.
        //
        // Lógica:
        //   1. Parte de un precio base (precioBase)
        //   2. Si es Porcentaje: precioFinal = precioBase - (precioBase * descuento / 100)
        //   3. Si es MontoFijo: precioFinal = precioBase - descuento
        //   4. Si el resultado es negativo → precioFinal = 0
        //
        // NOTA: precioBase está hardcodeado en 0.
        // Si querés agregar un precio base al servicio, agregar campo "Precio" al modelo Servicio.
        // ==========================================================
        private VistaServicioCliente CalcularVistaCliente(Servicio s)
        {
            decimal precioBase = 0; // TODO: Cambiar si se agrega campo Precio al modelo Servicio
            decimal precioFinal = precioBase;

            if (s.TipoDescuento == TipoDescuento.Porcentaje)
                precioFinal = precioBase - (precioBase * s.Descuento / 100);
            else if (s.TipoDescuento == TipoDescuento.MontoFijo)
                precioFinal = precioBase - s.Descuento;

            // Prevenir precios negativos
            if (precioFinal < 0) precioFinal = 0;

            return new VistaServicioCliente
            {
                ServicioID = s.ServicioID,
                Nombre = s.Nombre,
                Descripcion = s.Descripcion,
                PrecioOriginal = precioBase,
                PrecioFinal = precioFinal,
                TipoDescuento = s.TipoDescuento.ToString(),
                Descuento = s.Descuento,
                // Extrae nombres de productos (con null check para evitar NullReferenceException)
                Productos = s.ServicioProductos?.Select(sp => sp.Producto?.Nombre ?? "").ToList() ?? new(),
                // Extrae nombres de categorías (con null check)
                Categorias = s.ServicioCategorias?.Select(sc => sc.Categoria?.NombreProducto ?? "").ToList() ?? new()
            };
        }
    }
}
