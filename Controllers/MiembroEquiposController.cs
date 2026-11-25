using System.Text.Json;
using ApiGRG.Models;
using ApiGRG.ModelsView;
using Microsoft.AspNetCore.Mvc;
using Microsoft.CodeAnalysis.Elfie.Serialization;
using Microsoft.EntityFrameworkCore;


namespace ApiGRG.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MiembroEquiposController : ControllerBase
    {
        private readonly GrgContext _context;

        private readonly IWebHostEnvironment _env;

        public MiembroEquiposController(GrgContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MiembroEquipo>>> MostrarMiembroEquipos()
        {
            return await _context.MiembroEquipos.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MiembroEquipo>> GetMiembroEquipos(int id)
        {
            var mostrarCategoria = await _context.MiembroEquipos.FindAsync(id);
            if (mostrarCategoria == null)
            {
                return NotFound();
            }

            return mostrarCategoria;
        }

        [HttpPost]
        public async Task<ActionResult<MiembroEquipo>> PostMiembroEquipo([FromForm] VistaMiembroEquipo miembroEquipo)
        {
            var miembros = new MiembroEquipo
            {
                NombreCompleto = miembroEquipo.NombreCompleto,
                Cargo = miembroEquipo.Cargo,
                Descripcion = miembroEquipo.Descripcion,
                Activo = miembroEquipo.Activo,
                EtiquetasJson = JsonSerializer.Serialize(miembroEquipo.Etiquetas)
            };

            // si el usuario eligió una imagen
            if (miembroEquipo.Imagen != null)
            {
                var resultado = await GuardarImagen(miembroEquipo.Imagen);
                if (resultado.error != null)
                {
                    return BadRequest(new { message = resultado.error });
                }
                miembros.ImagenUrl = resultado.url!;
            }

            _context.MiembroEquipos.Add(miembros);


            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Si falló el guardado, la imagen quedó huérfana en el disco: la borramos
                BorrarImagen(miembros.ImagenUrl);
                return StatusCode(500, new { message = "No se pudo guardar el miembro del equipo." });
            }


            return CreatedAtAction(nameof(GetMiembroEquipos), new { id = miembros.MiembroEquipoID }, miembros);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> PutMiembroEquipo(int id, [FromForm] VistaMiembroEquipo editarMiembro)
        {
            if (id != editarMiembro.MiembroEquipoID)
            {
                return BadRequest(new { message = "El ID no coincide" });
            }

            // Buscamos el miembro que ya existe en la base de datos
            var miembroEditar = await _context.MiembroEquipos.FindAsync(id);
            if (miembroEditar == null)
            {
                return NotFound();
            }

            miembroEditar.NombreCompleto = editarMiembro.NombreCompleto;
            miembroEditar.Descripcion = editarMiembro.Descripcion;
            miembroEditar.Cargo = editarMiembro.Cargo;
            miembroEditar.Activo = editarMiembro.Activo;
            miembroEditar.EtiquetasJson = JsonSerializer.Serialize(editarMiembro.Etiquetas);

            // Solo si eligió una imagen NUEVA reemplazamos la anterior.
            // Si no eligió ninguna, ImagenUrl queda como estaba.
            string? imagenVieja = null;
            string? imagenNueva = null;
            if (editarMiembro.Imagen != null)
            {
                var resultado = await GuardarImagen(editarMiembro.Imagen);
                if (resultado.error != null)
                {
                    return BadRequest(new { message = resultado.error });
                }
                imagenVieja = miembroEditar.ImagenUrl;
                imagenNueva = resultado.url;
                miembroEditar.ImagenUrl = imagenNueva!;
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                // Si falló el guardado, la imagen nueva quedó huérfana en el disco: la borramos
                BorrarImagen(imagenNueva);

                // Alguien pudo haber eliminado el miembro mientras lo editábamos
                if (!MiembroEquipoExists(id))
                {
                    return NotFound();
                }

                throw;
            }
            catch (DbUpdateException)
            {
                BorrarImagen(imagenNueva);
                return StatusCode(500, new { message = "No se pudo guardar el miembro del equipo." });
            }

            // Borramos la imagen vieja recién cuando ya se guardó todo bien
            BorrarImagen(imagenVieja);

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarMiembroEquipo(int id)
        {
            var miembroEliminar = await _context.MiembroEquipos.FindAsync(id);
            if (miembroEliminar == null)
            {
                return NotFound();
            }

            var imagen = miembroEliminar.ImagenUrl;

            _context.MiembroEquipos.Remove(miembroEliminar);
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
            var carpeta = Path.Combine(_env.WebRootPath, "img", "miembroEquipos");
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
            return ($"/img/miembroEquipos/{nombreArchivo}", null);
        }

        // Borra el archivo del disco (si existe)
        private void BorrarImagen(string? urlImagen)
        {
            if (string.IsNullOrEmpty(urlImagen)) return;

            // Solo borramos archivos de nuestra carpeta, por seguridad
            if (!urlImagen.StartsWith("/img/miembroEquipos/")) return;

            var ruta = Path.Combine(_env.WebRootPath, urlImagen.TrimStart('/'));

            try
            {
                if (System.IO.File.Exists(ruta))
                {
                    System.IO.File.Delete(ruta);
                }
            }
            catch (Exception ex) when (ex is IOException || ex is UnauthorizedAccessException)
            {
                // El archivo puede estar en uso o sin permisos.
                // No es grave: el registro ya se guardó, solo queda un archivo suelto en el disco.
            }
        }


        private bool MiembroEquipoExists(int id)
        {
            return _context.MiembroEquipos.Any(c => c.MiembroEquipoID == id);
        }

    }
}