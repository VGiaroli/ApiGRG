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
        public async Task<ActionResult<IEnumerable<Producto>>> MostrarProductos()
        {
            return await _context.Productos
                .Include(p => p.Categoria)
                .ToListAsync();
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
}