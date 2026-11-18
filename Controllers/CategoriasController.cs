using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApiGRG.ModelsView;

namespace ApiGRG.Models
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriasController : ControllerBase
    {
        private readonly GrgContext _context;


        // Proporciona información sobre el entorno de la aplicación,
        // nos dice dónde está la carpeta wwwroot
        private readonly IWebHostEnvironment _env; 

        public CategoriasController(GrgContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Categoria>>> MostrarCategoria()
        {
            return await _context.Categorias.ToListAsync();
        }

        //obtenemos el total de categorias cargadas en el index
        [HttpGet("total")]
        public async Task<ActionResult<int>> GetTotalCategorias()
        {
            return await _context.Categorias.CountAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Categoria>> GetCategoria(int id)
        {
            var categorias = await _context.Categorias.FindAsync(id);

            if (categorias == null)
            {
                return NotFound();
            }

            return categorias;
        }

        [HttpPost]
        public async Task<ActionResult<Categoria>> PostCategoria([FromForm] VistaCategoria vistaCategoria)
        {

            if (string.IsNullOrWhiteSpace(vistaCategoria.NombreProducto))
            {
                return BadRequest(new { message = "El nombre del producto es requerido." });
            }

            var categoria = new Categoria
            {
                // Convertir a mayúsculas aquí  
                NombreProducto = vistaCategoria.NombreProducto.Trim().ToUpper(),
                Descripcion = vistaCategoria.Descripcion?.Trim(),
                Eliminado = vistaCategoria.Eliminado
            };

            // si el usuario eligió una imagen
            if (vistaCategoria.Imagen != null)
            {
                var resultado = await GuardarImagen(vistaCategoria.Imagen);
                if (resultado.error != null)
                {
                    return BadRequest(new { message = resultado.error });
                }
                categoria.ImagenUrl = resultado.url;
            }

            _context.Categorias.Add(categoria);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetCategoria", new { id = vistaCategoria.CategoriaID }, categoria);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> EditarCategoria(int id, [FromForm] VistaCategoria dto)
        {
            if (id != dto.CategoriaID)
            {
                return BadRequest(new { message = "El ID no coincide" });
            }

            if (string.IsNullOrWhiteSpace(dto.NombreProducto))
            {
                return BadRequest(new { message = "El Nombre del Producto es requerido." });
            }

            // Buscamos la categoría que ya existe en la base de datos
            var categoria = await _context.Categorias.FindAsync(id);
            if (categoria == null)
            {
                return NotFound();
            }

            // Actualizamos solo los campos que vienen del formulario
            categoria.NombreProducto = dto.NombreProducto.Trim().ToUpper();
            categoria.Descripcion = dto.Descripcion?.Trim();
            categoria.Eliminado = dto.Eliminado;

            // Solo si eligió una imagen NUEVA reemplazamos la anterior.
            // Si no eligió ninguna, ImagenUrl queda como estaba.
            string? imagenVieja = null;
            if (dto.Imagen != null)
            {
                var resultado = await GuardarImagen(dto.Imagen);
                if (resultado.error != null)
                {
                    return BadRequest(new { message = resultado.error });
                }
                imagenVieja = categoria.ImagenUrl;
                categoria.ImagenUrl = resultado.url;
            }

            await _context.SaveChangesAsync();

            // Borramos la imagen vieja recién cuando ya se guardó todo bien
            BorrarImagen(imagenVieja);

            return NoContent();
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarCategoria(int id)
        {
            var categoria = await _context.Categorias.FindAsync(id);
            if (categoria == null)
            {
                return NotFound();
            }

            var imagen = categoria.ImagenUrl;

            _context.Categorias.Remove(categoria);
            await _context.SaveChangesAsync();

            // Borramos el archivo del disco después de borrar el registro
            BorrarImagen(imagen);

            return NoContent();
        }

        
        // Guarda la imagen en wwwroot/img/categorias y devuelve la ruta (o un error)
        private async Task<(string? url, string? error)> GuardarImagen(IFormFile archivo)
        {
            // 1. Validar extensión
            var extensionesPermitidas = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var extension = Path.GetExtension(archivo.FileName).ToLower();
            if (!extensionesPermitidas.Contains(extension))
            {
                return (null, "Solo se permiten imágenes JPG, PNG o WEBP.");
            }

            // 2. Validar tamaño (máximo 2 MB)
            if (archivo.Length > 2 * 1024 * 1024)
            {
                return (null, "La imagen no puede pesar más de 2 MB.");
            }

            // 3. Construimos la ruta de la carpeta de imágenes dentro de wwwroot.
            // Si la carpeta no existe, la creamos automáticamente.
            var carpeta = Path.Combine(_env.WebRootPath, "img", "categorias");
            Directory.CreateDirectory(carpeta);

            // 4. Nombre único para que dos imágenes nunca se pisen
            // Guid es un identificador que se utiliza para generar valores prácticamente únicos.
            var nombreArchivo = Guid.NewGuid() + extension;
            var rutaCompleta = Path.Combine(carpeta, nombreArchivo);

            // 5. Guardar el archivo en el disco
            using (var stream = new FileStream(rutaCompleta, FileMode.Create))
            {
                await archivo.CopyToAsync(stream);
            }

            // 6. Esta es la ruta que se guarda en la base de datos
            return ($"/img/categorias/{nombreArchivo}", null);
        }

        // Borra el archivo del disco (si existe)
        private void BorrarImagen(string? urlImagen)
        {
            if (string.IsNullOrEmpty(urlImagen)) return;

            // Solo borramos archivos de nuestra carpeta, por seguridad
            if (!urlImagen.StartsWith("/img/categorias/")) return;

            var ruta = Path.Combine(_env.WebRootPath, urlImagen.TrimStart('/'));
            if (System.IO.File.Exists(ruta))
            {
                System.IO.File.Delete(ruta);
            }
        }

        private bool CategoriaExists(int id)
        {
            return _context.Categorias.Any(c => c.CategoriaID == id);
        }
    }
}