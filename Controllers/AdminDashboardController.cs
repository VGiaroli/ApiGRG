using ApiGRG.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApiGRG.Controllers
{
    [ApiController]
    [Route("api/admin")]
    public class AdminDashboardController : ControllerBase
    {
        private readonly GrgContext _context;

        public AdminDashboardController(GrgContext context)
        {
            _context = context;
        }

        [HttpGet("resumen")]
        public async Task<ActionResult<AdminResumenDto>> ObtenerResumen()
        {
            var totalProductos = await _context.Productos.CountAsync();
            var productosDisponibles = await _context.Productos.CountAsync(producto =>
                producto.Disponible && (!producto.StockActual.HasValue || producto.StockActual.Value > 0));
            var productosAgotados = await _context.Productos.CountAsync(producto => producto.StockActual == 0);
            var productosStockBajo = await _context.Productos.CountAsync(producto =>
                producto.StockActual.HasValue
                && producto.StockActual.Value > 0
                && producto.StockActual.Value <= producto.StockMinimo);
            var productosSinStockRegistrado = await _context.Productos.CountAsync(producto => !producto.StockActual.HasValue);
            var solicitudesActivas = await _context.Servicios.CountAsync(servicio => !servicio.Eliminado);

            var productosRecientesBase = await _context.Productos
                .AsNoTracking()
                .Include(producto => producto.Categoria)
                .OrderByDescending(producto => producto.FechaActualizacion ?? producto.FechaCreacion)
                .Take(6)
                .Select(producto => new
                {
                    producto.ProductoID,
                    producto.Nombre,
                    Categoria = producto.Categoria == null ? string.Empty : producto.Categoria.NombreProducto,
                    Fecha = producto.FechaActualizacion ?? producto.FechaCreacion,
                    producto.Disponible,
                    producto.StockActual,
                    producto.StockMinimo
                })
                .ToListAsync();

            var productosRecientes = productosRecientesBase
                .Select(producto => new ProductoRecienteDto(
                    producto.ProductoID,
                    producto.Nombre,
                    producto.Categoria,
                    producto.Fecha,
                    producto.Disponible,
                    producto.StockActual.HasValue
                        ? producto.Disponible && producto.StockActual.Value > 0
                        : producto.Disponible,
                    producto.StockActual,
                    producto.StockMinimo,
                    ObtenerEstadoStock(producto.StockActual, producto.StockMinimo)))
                .ToList();

            return Ok(new AdminResumenDto(
                totalProductos,
                productosDisponibles,
                productosAgotados,
                productosStockBajo,
                productosSinStockRegistrado,
                solicitudesActivas,
                productosRecientes));
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
    }

    public sealed record AdminResumenDto(
        int TotalProductos,
        int ProductosDisponibles,
        int ProductosAgotados,
        int ProductosStockBajo,
        int ProductosSinStockRegistrado,
        int SolicitudesActivas,
        List<ProductoRecienteDto> ProductosRecientes);

    public sealed record ProductoRecienteDto(
        int ProductoID,
        string Nombre,
        string Categoria,
        DateTime Fecha,
        bool HabilitadoVenta,
        bool DisponibilidadEfectiva,
        int? StockActual,
        int StockMinimo,
        string EstadoStock);
}
