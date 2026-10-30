using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ApiGRG.Models;

public class GrgContext : IdentityDbContext<ApplicationUser>
{
    public GrgContext(DbContextOptions<GrgContext> options)
        : base(options)
    {
        
    }

    public DbSet<Categoria> Categorias {get; set;}

    public DbSet<Producto> Productos {get; set;}
public DbSet<Servicio> Servicios { get; set; }

    public DbSet<ProductoColor> ProductoColores {get; set;}

    public DbSet<ProductoCuota> ProductoCuotas {get; set;}

    public DbSet<MedioPago> MedioPagos {get; set;}

    public DbSet<MovimientoStock> MovimientosStock { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Producto>()
            .Property(producto => producto.RowVersion)
            .IsRowVersion()
            .IsConcurrencyToken();

        modelBuilder.Entity<MovimientoStock>()
            .Property(movimiento => movimiento.Tipo)
            .HasConversion<int>();

        modelBuilder.Entity<MovimientoStock>()
            .HasOne(movimiento => movimiento.Producto)
            .WithMany(producto => producto.MovimientosStock)
            .HasForeignKey(movimiento => movimiento.ProductoID)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MovimientoStock>()
            .Property(movimiento => movimiento.UsuarioId)
            .HasMaxLength(450);

        modelBuilder.Entity<MovimientoStock>()
            .Property(movimiento => movimiento.Motivo)
            .HasMaxLength(500);
    }
}
