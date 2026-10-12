using ApiGRG.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApiGRG.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // api/servicios
    [Authorize]                 // TODO protegido salvo lo que diga [AllowAnonymous]
    public class ServiciosController : ControllerBase
    {
        private readonly GrgContext _context;

        public ServiciosController(GrgContext context)
        {
            _context = context;
        }

        // GET: api/servicios -> todas las solicitudes (activas e inactivas), las más nuevas primero
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Servicio>>> GetServicios()
        {
            return await _context.Servicios
                .AsNoTracking()
                .OrderByDescending(s => s.FechaCreacion)
                .ToListAsync();
        }

        // GET: api/servicios/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Servicio>> GetServicio(int id)
        {
            var servicio = await _context.Servicios.FindAsync(id);
            if (servicio == null) return NotFound();
            return servicio;
        }

        // POST: api/servicios -> anónimo: lo usa el formulario público
        [AllowAnonymous]
        [HttpPost]
        public async Task<ActionResult<Servicio>> PostServicio(Servicio servicio)
        {
            // El servidor decide estos valores, no el cliente.
            servicio.ServicioID = 0;
            servicio.FechaCreacion = DateTime.Now;
            servicio.Eliminado = false;
            servicio.Confirmacion = EstadoConfirmacion.Pendiente;

            _context.Servicios.Add(servicio);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetServicio), new { id = servicio.ServicioID }, servicio);
        }

        // PUT: api/servicios/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutServicio(int id, Servicio servicio)
        {
            if (id != servicio.ServicioID) return BadRequest();

            var existente = await _context.Servicios.FindAsync(id);
            if (existente == null) return NotFound();

            existente.Nombre = servicio.Nombre;
            existente.Apellido = servicio.Apellido;
            existente.Numero = servicio.Numero;
            existente.Dni = servicio.Dni;
            existente.Gmail = servicio.Gmail;
            existente.Localidad = servicio.Localidad;
            existente.NombreDispositivo = servicio.NombreDispositivo;
            existente.Marca = servicio.Marca;
            existente.Modelo = servicio.Modelo;
            existente.TipoArreglo = servicio.TipoArreglo;
            existente.TipoInspeccion = servicio.TipoInspeccion;
            existente.Descripcion = servicio.Descripcion;
            existente.Eliminado = servicio.Eliminado;
            // OJO: NO se copia Confirmacion -> editar no resetea la confirmación.
            // FechaCreacion tampoco se modifica.

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // PUT: api/servicios/5/confirmacion -> cambia solo el estado de WhatsApp
        [HttpPut("{id}/confirmacion")]
        public async Task<IActionResult> PutConfirmacion(int id, [FromBody] ConfirmacionDto dto)
        {
            // JsonStringEnumConverter acepta números, así que validamos el valor.
            if (!Enum.IsDefined(typeof(EstadoConfirmacion), dto.Confirmacion))
                return BadRequest("Estado de confirmación inválido.");

            var servicio = await _context.Servicios.FindAsync(id);
            if (servicio == null) return NotFound();

            servicio.Confirmacion = dto.Confirmacion;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/servicios/5 -> baja lógica (Eliminado = true)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteServicio(int id)
        {
            var servicio = await _context.Servicios.FindAsync(id);
            if (servicio == null) return NotFound();

            servicio.Eliminado = true;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    // DTO chico para el endpoint de confirmación
    public class ConfirmacionDto
    {
        public EstadoConfirmacion Confirmacion { get; set; }
    }
}