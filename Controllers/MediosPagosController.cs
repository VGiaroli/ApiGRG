using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApiGRG.Models
{
    [ApiController]
    [Route("api/[controller]")]
    public class MediosPagosController : ControllerBase
    {
        private readonly GrgContext _context;

        public MediosPagosController(GrgContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MedioPagoListadoDto>>> MostrarMediosPago()
        {
            return await _context.MedioPagos
                .AsNoTracking()
                .OrderBy(medioPago => medioPago.Orden)
                .Select(medioPago => new MedioPagoListadoDto(
                    medioPago.MedioPagoID,
                    medioPago.Nombre,
                    medioPago.Orden))
                .ToListAsync();
        }
    }

    public sealed record MedioPagoListadoDto(
        int MedioPagoID,
        string Nombre,
        int Orden);
}
