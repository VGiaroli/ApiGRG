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
        List<string> Colores,
        List<CuotaProductoDto> Cuotas);

    public sealed record CuotaProductoDto(
        int CantidadCuotas,
        decimal MontoCuota,
        string MedioPago);
}
