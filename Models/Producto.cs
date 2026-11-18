using System.ComponentModel.DataAnnotations;

namespace ApiGRG.Models
{
    public class Producto
    {
        [Key]
        public int ProductoID {get; set;}

        public int CategoriaID {get; set;}

        public Categoria Categoria {get; set;}

        public string Nombre {get; set;}

        public EstadoProducto Estado {get; set;}

        public decimal PrecioARS {get; set;}

        public decimal PrecioUSD {get; set;}

        public bool Disponible {get; set;}

        public string? SKU { get; set; }

        public int? StockActual { get; set; }

        public int StockMinimo { get; set; } = 1;

        [Timestamp]
        public byte[] RowVersion { get; set; } = Array.Empty<byte>();

        public string? ImagenUrl { get; set; }

        public DateTime FechaCreacion {get; set;}

        public DateTime? FechaActualizacion {get; set;}

        public ICollection<ProductoColor> ProductoColores {get; set;}

        public ICollection<ProductoCuota> ProductoCuotas {get; set;}

        public ICollection<MovimientoStock> MovimientosStock { get; set; } = new List<MovimientoStock>();

    }

    public enum EstadoProducto
    {
        Sellado = 1,
        Seminuevo = 2
    }
}
