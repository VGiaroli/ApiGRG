// ============================================================
// DBCONTEXT - CONEXIÓN A BASE DE DATOS
// Registra todas las entidades (tablas) que Entity Framework maneja.
//
// Para el módulo Servicios se registraron 3 DbSets:
//   1. Servicios          → tabla principal de servicios
//   2. ServicioProductos  → tabla intermedia N:N Servicio↔Producto
//   3. ServicioCategorias → tabla intermedia N:N Servicio↔Categoría
//
// Las tablas se crean automáticamente con la migración:
//   dotnet ef migrations add AgregarModuloServicios
// ============================================================

using Microsoft.EntityFrameworkCore;

namespace ApiGRG.Models;

public class GrgContext : DbContext
{
    public GrgContext(DbContextOptions<GrgContext> options)
        : base(options)
    {

    }

    // ========== ENTIDADES EXISTENTES ==========

    public DbSet<Categoria> Categorias { get; set; }              // Tabla de categorías de productos

    public DbSet<Producto> Productos { get; set; }                // Tabla de productos

    public DbSet<ProductoColor> ProductoColores { get; set; }    // Colores asociados a productos

    public DbSet<ProductoCuota> ProductoCuotas { get; set; }    // Cuotas de pago de productos

    public DbSet<MedioPago> MedioPagos { get; set; }            // Medios de pago aceptados

    // ========== MÓDULO SERVICIOS (nuevos) ==========

    public DbSet<Servicio> Servicios { get; set; }               // Tabla principal de servicios

    public DbSet<ServicioProducto> ServicioProductos { get; set; }  // Tabla intermedia Servicio↔Producto

    public DbSet<ServicioCategoria> ServicioCategorias { get; set; } // Tabla intermedia Servicio↔Categoría
}
