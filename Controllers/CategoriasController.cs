using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApiGRG.Models
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriasController : ControllerBase
    {
        private readonly GrgContext _context;

        public CategoriasController(GrgContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Categoria>>> MostrarCategoria()
        {
            return await _context.Categorias.ToListAsync();
        }

        [HttpGet("${id}")]
        public async Task<ActionResult<Categoria>> GetCategoria(int id)
        {
            var categorias = await _context.Categorias.FindAsync(id);
            
            if(categorias == null)
            {
                return NotFound();
            }

            return categorias;
        }

        [HttpPost]
        public async Task<ActionResult<Categoria>> PostCategoria(Categoria categoria)
        {

            if (string.IsNullOrWhiteSpace(categoria.NombreProducto))
            {
                return BadRequest(new { message = "El nombre del producto es requerido." });
            }

            _context.Categorias.Add(categoria);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetCategoria", new { id = categoria.CategoriaID }, categoria);
        } 


        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarCategoria(int id)
        {
            var categoria = await _context.Categorias.FindAsync(id);
            if(categoria == null)
            {
                return NotFound();
            }

            _context.Categorias.Remove(categoria);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CategoriaExists(int id)
        {
            return _context.Categorias.Any(c => c.CategoriaID == id);
        }
    }
}