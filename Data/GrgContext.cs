using Microsoft.EntityFrameworkCore;

namespace ApiGRG.Models;

public class GrgContext : DbContext
{
    public GrgContext(DbContextOptions<GrgContext> options)
        : base(options)
    {
        
    }

    public DbSet<Categoria> Categorias {get; set;}

    public DbSet<Producto> Productos {get; set;}

    public DbSet<ProductoColor> ProductoColores {get; set;}

    public DbSet<ProductoCuota> ProductoCuotas {get; set;}

    public DbSet<MedioPago> MedioPagos {get; set;}
}