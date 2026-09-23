using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApiGRG.Models
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductosController : ControllerBase
    {
        private readonly GrgContext _context;

        public ProductosController(GrgContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductoListadoDto>>> MostrarProductos()
        {
            var productos = await _context.Productos
                .AsNoTracking()
                .Select(p => new ProductoListadoDto(
                    p.ProductoID,
                    p.CategoriaID,
                    p.Categoria == null ? string.Empty : p.Categoria.NombreProducto,
                    p.Nombre,
                    p.Estado,
                    p.PrecioARS,
                    p.PrecioUSD,
                    p.Disponible,
                    p.ImagenUrl,
                    p.ProductoColores
                        .OrderBy(c => c.Color)
                        .Select(c => c.Color)
                        .ToList(),
                    p.ProductoCuotas
                        .OrderBy(c => c.CantidadCuotas)
                        .Select(c => new CuotaProductoDto(
                            c.CantidadCuotas,
                            c.MontoCuota,
                            c.MedioPago == null ? string.Empty : c.MedioPago.Nombre))
                        .ToList()))
                .ToListAsync();

            return Ok(productos);
        }

        [HttpPost]
        public async Task<ActionResult> CrearProducto(CrearProductoDto solicitud)
        {
            if (string.IsNullOrWhiteSpace(solicitud.Nombre))
            {
                return BadRequest(new { message = "El nombre del producto es requerido." });
            }

            if (!Enum.IsDefined(typeof(EstadoProducto), solicitud.Estado))
            {
                return BadRequest(new { message = "El estado del producto no es válido." });
            }

            if (solicitud.PrecioARS < 0 || solicitud.PrecioUSD < 0)
            {
                return BadRequest(new { message = "Los precios no pueden ser negativos." });
            }

            var categoriaExiste = await _context.Categorias
                .AnyAsync(c => c.CategoriaID == solicitud.CategoriaID && !c.Eliminado);

            if (!categoriaExiste)
            {
                return BadRequest(new { message = "La categoría seleccionada no existe o está inactiva." });
            }

            var colores = (solicitud.Colores ?? new List<CrearProductoColorDto>())
                .Select(color => color.Color?.Trim())
                .Where(color => !string.IsNullOrWhiteSpace(color))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var cuotas = solicitud.Cuotas ?? new List<CrearProductoCuotaDto>();
            if (cuotas.Any(cuota => cuota.MedioPagoID <= 0 || cuota.CantidadCuotas <= 0 || cuota.MontoCuota < 0))
            {
                return BadRequest(new { message = "Los datos de financiación no son válidos." });
            }

            var mediosPagoSolicitados = cuotas
                .Select(cuota => cuota.MedioPagoID)
                .Distinct()
                .ToList();

            var mediosPagoValidos = await _context.MedioPagos
                .Where(medioPago => mediosPagoSolicitados.Contains(medioPago.MedioPagoID))
                .Select(medioPago => medioPago.MedioPagoID)
                .ToListAsync();

            if (mediosPagoValidos.Count != mediosPagoSolicitados.Count)
            {
                return BadRequest(new { message = "Uno o más medios de pago no existen." });
            }

            var producto = new Producto
            {
                Nombre = solicitud.Nombre.Trim(),
                CategoriaID = solicitud.CategoriaID,
                Estado = solicitud.Estado,
                PrecioARS = solicitud.PrecioARS,
                PrecioUSD = solicitud.PrecioUSD,
                Disponible = solicitud.Disponible,
                ImagenUrl = string.IsNullOrWhiteSpace(solicitud.ImagenUrl) ? null : solicitud.ImagenUrl.Trim(),
                FechaCreacion = DateTime.UtcNow,
                ProductoColores = colores
                    .Select(color => new ProductoColor { Color = color })
                    .ToList(),
                ProductoCuotas = cuotas
                    .Select(cuota => new ProductoCuota
                    {
                        MedioPagoID = cuota.MedioPagoID,
                        CantidadCuotas = cuota.CantidadCuotas,
                        MontoCuota = cuota.MontoCuota
                    })
                    .ToList()
            };

            _context.Productos.Add(producto);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProducto), new { id = producto.ProductoID }, new { producto.ProductoID });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Producto>> GetProducto(int id)
        {
            var producto = await _context.Productos
                .Include(p => p.Categoria)
                .FirstOrDefaultAsync(p => p.ProductoID == id);

            if (producto == null)
            {
                return NotFound();
            }

            return producto;
        }

    }

    public sealed record ProductoListadoDto(
        int ProductoID,
        int CategoriaID,
        string Categoria,
        string Nombre,
        EstadoProducto Estado,
        decimal PrecioARS,
        decimal PrecioUSD,
        bool Disponible,
        string? ImagenUrl,
        List<string> Colores,
        List<CuotaProductoDto> Cuotas);

    public sealed record CuotaProductoDto(
        int CantidadCuotas,
        decimal MontoCuota,
        string MedioPago);

    public sealed class CrearProductoDto
    {
        public string Nombre { get; set; } = string.Empty;
        public int CategoriaID { get; set; }
        public EstadoProducto Estado { get; set; }
        public decimal PrecioARS { get; set; }
        public decimal PrecioUSD { get; set; }
        public bool Disponible { get; set; }
        public string? ImagenUrl { get; set; }
        public List<CrearProductoColorDto>? Colores { get; set; }
        public List<CrearProductoCuotaDto>? Cuotas { get; set; }
    }

    public sealed class CrearProductoColorDto
    {
        public string? Color { get; set; }
    }

    public sealed class CrearProductoCuotaDto
    {
        public int MedioPagoID { get; set; }
        public int CantidadCuotas { get; set; }
        public decimal MontoCuota { get; set; }
    }
}
