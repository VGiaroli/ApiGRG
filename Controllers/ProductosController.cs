using System.Security.Claims;
using ApiGRG.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApiGRG.Controllers
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
                    p.StockActual.HasValue
                        ? p.Disponible && p.StockActual.Value > 0
                        : p.Disponible,
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

        [HttpGet("admin")]
        public async Task<ActionResult<IEnumerable<ProductoAdminDto>>> ObtenerProductosAdministrativos()
        {
            var productos = await _context.Productos
                .AsNoTracking()
                .Include(p => p.Categoria)
                .Include(p => p.ProductoColores)
                .Include(p => p.ProductoCuotas)
                    .ThenInclude(cuota => cuota.MedioPago)
                .OrderByDescending(p => p.FechaActualizacion ?? p.FechaCreacion)
                .ToListAsync();

            return Ok(productos.Select(ProyectarProductoAdmin).ToList());
        }

        [HttpPost]
        public async Task<ActionResult> CrearProducto(CrearProductoDto solicitud)
        {
            var validacion = await ValidarSolicitudProducto(solicitud);
            if (validacion != null)
            {
                return validacion;
            }

            var producto = new Producto
            {
                Nombre = solicitud.Nombre.Trim(),
                CategoriaID = solicitud.CategoriaID,
                Estado = solicitud.Estado,
                PrecioARS = solicitud.PrecioARS,
                PrecioUSD = solicitud.PrecioUSD,
                Disponible = solicitud.Disponible,
                SKU = NormalizarSku(solicitud.SKU),
                StockActual = null,
                StockMinimo = solicitud.StockMinimo,
                ImagenUrl = string.IsNullOrWhiteSpace(solicitud.ImagenUrl) ? null : solicitud.ImagenUrl.Trim(),
                FechaCreacion = DateTime.UtcNow,
                ProductoColores = ObtenerColores(solicitud.Colores)
                    .Select(color => new ProductoColor { Color = color })
                    .ToList(),
                ProductoCuotas = ObtenerCuotas(solicitud.Cuotas)
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
        public async Task<ActionResult<ProductoEdicionDto>> GetProducto(int id)
        {
            var producto = await _context.Productos
                .AsNoTracking()
                .Where(p => p.ProductoID == id)
                .Select(p => new ProductoEdicionDto(
                    p.ProductoID,
                    p.Nombre,
                    p.CategoriaID,
                    p.Estado,
                    p.PrecioARS,
                    p.PrecioUSD,
                    p.Disponible,
                    p.SKU,
                    p.StockMinimo,
                    p.ImagenUrl,
                    p.ProductoColores
                        .OrderBy(c => c.Color)
                        .Select(c => new ProductoEdicionColorDto(c.Color))
                        .ToList(),
                    p.ProductoCuotas
                        .OrderBy(c => c.CantidadCuotas)
                        .Select(c => new ProductoEdicionCuotaDto(
                            c.MedioPagoID,
                            c.CantidadCuotas,
                            c.MontoCuota))
                        .ToList()))
                .FirstOrDefaultAsync();

            if (producto == null)
            {
                return NotFound();
            }

            return producto;
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> EditarProducto(int id, CrearProductoDto solicitud)
        {
            var producto = await _context.Productos
                .Include(p => p.ProductoColores)
                .Include(p => p.ProductoCuotas)
                .FirstOrDefaultAsync(p => p.ProductoID == id);

            if (producto == null)
            {
                return NotFound();
            }

            var validacion = await ValidarSolicitudProducto(solicitud);
            if (validacion != null)
            {
                return validacion;
            }

            var colores = ObtenerColores(solicitud.Colores);
            var cuotas = ObtenerCuotas(solicitud.Cuotas);

            await using var transaccion = await _context.Database.BeginTransactionAsync();

            try
            {
                producto.Nombre = solicitud.Nombre.Trim();
                producto.CategoriaID = solicitud.CategoriaID;
                producto.Estado = solicitud.Estado;
                producto.PrecioARS = solicitud.PrecioARS;
                producto.PrecioUSD = solicitud.PrecioUSD;
                producto.Disponible = solicitud.Disponible;
                producto.SKU = NormalizarSku(solicitud.SKU);
                producto.StockMinimo = solicitud.StockMinimo;
                producto.ImagenUrl = string.IsNullOrWhiteSpace(solicitud.ImagenUrl) ? null : solicitud.ImagenUrl.Trim();
                producto.FechaActualizacion = DateTime.UtcNow;

                _context.ProductoColores.RemoveRange(producto.ProductoColores);
                foreach (var color in colores)
                {
                    producto.ProductoColores.Add(new ProductoColor
                    {
                        ProductoID = producto.ProductoID,
                        Color = color
                    });
                }

                _context.ProductoCuotas.RemoveRange(producto.ProductoCuotas);
                foreach (var cuota in cuotas)
                {
                    producto.ProductoCuotas.Add(new ProductoCuota
                    {
                        ProductoID = producto.ProductoID,
                        MedioPagoID = cuota.MedioPagoID,
                        CantidadCuotas = cuota.CantidadCuotas,
                        MontoCuota = cuota.MontoCuota
                    });
                }

                await _context.SaveChangesAsync();
                await transaccion.CommitAsync();
            }
            catch
            {
                await transaccion.RollbackAsync();
                throw;
            }

            return NoContent();
        }

        [HttpPatch("{id}/precios")]
        public async Task<ActionResult> ActualizarPrecios(int id, ActualizarPreciosDto solicitud)
        {
            if (solicitud.PrecioARS < 0 || solicitud.PrecioUSD < 0)
            {
                return BadRequest(new { message = "Los precios no pueden ser negativos." });
            }

            var producto = await _context.Productos.FirstOrDefaultAsync(p => p.ProductoID == id);
            if (producto == null)
            {
                return NotFound();
            }

            producto.PrecioARS = solicitud.PrecioARS;
            producto.PrecioUSD = solicitud.PrecioUSD;
            producto.FechaActualizacion = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPatch("{id}/disponibilidad")]
        public async Task<ActionResult<DisponibilidadProductoDto>> ActualizarDisponibilidad(
            int id,
            ActualizarDisponibilidadDto solicitud)
        {
            var producto = await _context.Productos.FirstOrDefaultAsync(p => p.ProductoID == id);
            if (producto == null)
            {
                return NotFound();
            }

            producto.Disponible = solicitud.Disponible;
            producto.FechaActualizacion = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new DisponibilidadProductoDto(
                producto.Disponible,
                CalcularDisponibilidadEfectiva(producto.Disponible, producto.StockActual)));
        }

        [HttpPost("{id}/movimientos-stock")]
        public async Task<ActionResult<MovimientoStockRespuestaDto>> RegistrarMovimientoStock(
            int id,
            RegistrarMovimientoStockDto solicitud)
        {
            if (!Enum.IsDefined(typeof(TipoMovimientoStock), solicitud.Tipo))
            {
                return BadRequest(new { message = "El tipo de movimiento no es válido." });
            }

            var cantidadEsDelta = solicitud.Tipo is TipoMovimientoStock.Ingreso or TipoMovimientoStock.Egreso;
            if (solicitud.Cantidad < 0 || (cantidadEsDelta && solicitud.Cantidad == 0))
            {
                return BadRequest(new { message = "La cantidad debe ser válida para el tipo de movimiento seleccionado." });
            }

            var producto = await _context.Productos.FirstOrDefaultAsync(p => p.ProductoID == id);
            if (producto == null)
            {
                return NotFound();
            }

            if (producto.StockActual == null && cantidadEsDelta)
            {
                return BadRequest(new { message = "Primero registrá una cantidad inicial para este producto." });
            }

            var cantidadAnterior = producto.StockActual;
            int cantidadNueva;

            switch (solicitud.Tipo)
            {
                case TipoMovimientoStock.Inicial:
                case TipoMovimientoStock.Ajuste:
                    cantidadNueva = solicitud.Cantidad;
                    break;
                case TipoMovimientoStock.Ingreso:
                    cantidadNueva = (producto.StockActual ?? 0) + solicitud.Cantidad;
                    break;
                case TipoMovimientoStock.Egreso:
                    cantidadNueva = (producto.StockActual ?? 0) - solicitud.Cantidad;
                    break;
                default:
                    return BadRequest(new { message = "El tipo de movimiento no es válido." });
            }

            if (cantidadNueva < 0)
            {
                return BadRequest(new { message = "El stock no puede quedar en negativo." });
            }

            var movimiento = new MovimientoStock
            {
                ProductoID = producto.ProductoID,
                Tipo = solicitud.Tipo,
                CantidadAnterior = cantidadAnterior,
                CantidadNueva = cantidadNueva,
                Diferencia = cantidadAnterior.HasValue
                    ? cantidadNueva - cantidadAnterior.Value
                    : cantidadNueva,
                Motivo = string.IsNullOrWhiteSpace(solicitud.Motivo) ? null : solicitud.Motivo.Trim(),
                FechaUtc = DateTime.UtcNow,
                UsuarioId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            };

            await using var transaccion = await _context.Database.BeginTransactionAsync();

            try
            {
                producto.StockActual = cantidadNueva;
                producto.FechaActualizacion = DateTime.UtcNow;
                _context.MovimientosStock.Add(movimiento);
                await _context.SaveChangesAsync();
                await transaccion.CommitAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                await transaccion.RollbackAsync();
                return Conflict(new { message = "El producto fue actualizado por otra persona. Recargá el inventario e intentá nuevamente." });
            }
            catch
            {
                await transaccion.RollbackAsync();
                throw;
            }

            return Ok(new MovimientoStockRespuestaDto(
                movimiento.MovimientoStockID,
                movimiento.Tipo,
                movimiento.CantidadAnterior,
                movimiento.CantidadNueva,
                movimiento.Diferencia,
                movimiento.Motivo,
                movimiento.FechaUtc,
                producto.StockMinimo,
                ObtenerEstadoStock(producto.StockActual, producto.StockMinimo),
                CalcularDisponibilidadEfectiva(producto.Disponible, producto.StockActual)));
        }

        [HttpGet("{id}/movimientos-stock")]
        public async Task<ActionResult<IEnumerable<MovimientoStockDto>>> ObtenerMovimientosStock(int id)
        {
            var productoExiste = await _context.Productos.AnyAsync(p => p.ProductoID == id);
            if (!productoExiste)
            {
                return NotFound();
            }

            var movimientos = await _context.MovimientosStock
                .AsNoTracking()
                .Where(movimiento => movimiento.ProductoID == id)
                .OrderByDescending(movimiento => movimiento.FechaUtc)
                .ThenByDescending(movimiento => movimiento.MovimientoStockID)
                .Take(50)
                .Select(movimiento => new MovimientoStockDto(
                    movimiento.MovimientoStockID,
                    movimiento.Tipo,
                    movimiento.CantidadAnterior,
                    movimiento.CantidadNueva,
                    movimiento.Diferencia,
                    movimiento.Motivo,
                    movimiento.FechaUtc))
                .ToListAsync();

            return Ok(movimientos);
        }

        private async Task<ActionResult?> ValidarSolicitudProducto(CrearProductoDto solicitud)
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

            if (solicitud.StockMinimo < 0)
            {
                return BadRequest(new { message = "El stock mínimo no puede ser negativo." });
            }

            var sku = NormalizarSku(solicitud.SKU);
            if (sku != null && sku.Length > 64)
            {
                return BadRequest(new { message = "El SKU no puede superar los 64 caracteres." });
            }

            var categoriaExiste = await _context.Categorias
                .AnyAsync(c => c.CategoriaID == solicitud.CategoriaID && !c.Eliminado);

            if (!categoriaExiste)
            {
                return BadRequest(new { message = "La categoría seleccionada no existe o está inactiva." });
            }

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

            return null;
        }

        private static List<string> ObtenerColores(List<CrearProductoColorDto>? colores)
        {
            return (colores ?? new List<CrearProductoColorDto>())
                .Select(color => color.Color?.Trim())
                .Where(color => !string.IsNullOrWhiteSpace(color))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Select(color => color!)
                .ToList();
        }

        private static List<CrearProductoCuotaDto> ObtenerCuotas(List<CrearProductoCuotaDto>? cuotas)
        {
            return cuotas ?? new List<CrearProductoCuotaDto>();
        }

        private static string? NormalizarSku(string? sku)
        {
            return string.IsNullOrWhiteSpace(sku) ? null : sku.Trim();
        }

        private static bool CalcularDisponibilidadEfectiva(bool disponible, int? stockActual)
        {
            return stockActual.HasValue ? disponible && stockActual.Value > 0 : disponible;
        }

        private static string ObtenerEstadoStock(int? stockActual, int stockMinimo)
        {
            if (!stockActual.HasValue)
            {
                return "SinRegistrar";
            }

            if (stockActual.Value == 0)
            {
                return "Agotado";
            }

            return stockActual.Value <= stockMinimo ? "Bajo" : "Normal";
        }

        private static ProductoAdminDto ProyectarProductoAdmin(Producto p)
        {
            return new ProductoAdminDto(
                p.ProductoID,
                p.CategoriaID,
                p.Categoria == null ? string.Empty : p.Categoria.NombreProducto,
                p.Nombre,
                p.Estado,
                p.PrecioARS,
                p.PrecioUSD,
                p.Disponible,
                CalcularDisponibilidadEfectiva(p.Disponible, p.StockActual),
                p.SKU,
                p.StockActual,
                p.StockMinimo,
                ObtenerEstadoStock(p.StockActual, p.StockMinimo),
                p.ImagenUrl,
                p.FechaCreacion,
                p.FechaActualizacion,
                p.ProductoColores.OrderBy(c => c.Color).Select(c => c.Color).ToList(),
                p.ProductoCuotas.OrderBy(c => c.CantidadCuotas).Select(c => new CuotaProductoDto(
                    c.CantidadCuotas,
                    c.MontoCuota,
                    c.MedioPago == null ? string.Empty : c.MedioPago.Nombre)).ToList());
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

    public sealed record ProductoAdminDto(
        int ProductoID,
        int CategoriaID,
        string Categoria,
        string Nombre,
        EstadoProducto Estado,
        decimal PrecioARS,
        decimal PrecioUSD,
        bool HabilitadoVenta,
        bool DisponibilidadEfectiva,
        string? SKU,
        int? StockActual,
        int StockMinimo,
        string EstadoStock,
        string? ImagenUrl,
        DateTime FechaCreacion,
        DateTime? FechaActualizacion,
        List<string> Colores,
        List<CuotaProductoDto> Cuotas);

    public sealed record ProductoEdicionDto(
        int ProductoID,
        string Nombre,
        int CategoriaID,
        EstadoProducto Estado,
        decimal PrecioARS,
        decimal PrecioUSD,
        bool Disponible,
        string? SKU,
        int StockMinimo,
        string? ImagenUrl,
        List<ProductoEdicionColorDto> Colores,
        List<ProductoEdicionCuotaDto> Cuotas);

    public sealed record ProductoEdicionColorDto(string Color);

    public sealed record ProductoEdicionCuotaDto(
        int MedioPagoID,
        int CantidadCuotas,
        decimal MontoCuota);

    public sealed class CrearProductoDto
    {
        public string Nombre { get; set; } = string.Empty;
        public int CategoriaID { get; set; }
        public EstadoProducto Estado { get; set; }
        public decimal PrecioARS { get; set; }
        public decimal PrecioUSD { get; set; }
        public bool Disponible { get; set; }
        public string? SKU { get; set; }
        public int StockMinimo { get; set; } = 1;
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

    public sealed class ActualizarPreciosDto
    {
        public decimal PrecioARS { get; set; }
        public decimal PrecioUSD { get; set; }
    }

    public sealed class ActualizarDisponibilidadDto
    {
        public bool Disponible { get; set; }
    }

    public sealed class RegistrarMovimientoStockDto
    {
        public TipoMovimientoStock Tipo { get; set; }
        public int Cantidad { get; set; }
        public string? Motivo { get; set; }
    }

    public sealed record DisponibilidadProductoDto(
        bool HabilitadoVenta,
        bool DisponibilidadEfectiva);

    public sealed record MovimientoStockRespuestaDto(
        int MovimientoStockID,
        TipoMovimientoStock Tipo,
        int? CantidadAnterior,
        int CantidadNueva,
        int Diferencia,
        string? Motivo,
        DateTime FechaUtc,
        int StockMinimo,
        string EstadoStock,
        bool DisponibilidadEfectiva);

    public sealed record MovimientoStockDto(
        int MovimientoStockID,
        TipoMovimientoStock Tipo,
        int? CantidadAnterior,
        int CantidadNueva,
        int Diferencia,
        string? Motivo,
        DateTime FechaUtc);
}
