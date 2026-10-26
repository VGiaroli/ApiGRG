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

        // GET: api/servicios -> todas las solicitudes, las más nuevas primero
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
        public async Task<IActionResult> PostServicio([FromBody] CrearSolicitudServicioDto solicitud)
        {
            var servicio = new Servicio
            {
                Nombre = solicitud.Nombre,
                Apellido = solicitud.Apellido,
                Numero = solicitud.Numero,
                Dni = solicitud.Dni,
                Gmail = solicitud.Email,
                Localidad = solicitud.Localidad,
                Marca = solicitud.Marca,
                Modelo = solicitud.Modelo,
                TipoArreglo = solicitud.TipoArreglo,
                TipoInspeccion = solicitud.TipoInspeccion,
                Descripcion = solicitud.Descripcion,
                FechaCreacion = DateTime.Now,
                Eliminado = false,
                Visto = false,
                Confirmacion = EstadoConfirmacion.EnProceso
            };

            _context.Servicios.Add(servicio);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetServicio), new { id = servicio.ServicioID }, new
            {
                servicioID = servicio.ServicioID,
                confirmacion = servicio.Confirmacion
            });
        }

        // PUT: api/servicios/5/visto -> marca como visto / no visto
        [HttpPut("{id}/visto")]
        public async Task<IActionResult> PutVisto(int id, [FromBody] VistoDto dto)
        {
            var servicio = await _context.Servicios.FindAsync(id);
            if (servicio == null) return NotFound();

            servicio.Visto = dto.Visto;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // PUT: api/servicios/5/confirmacion -> En proceso / Terminado
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
    }

    public class VistoDto
    {
        public bool Visto { get; set; }
    }

    public class ConfirmacionDto
    {
        public EstadoConfirmacion Confirmacion { get; set; }
    }
}