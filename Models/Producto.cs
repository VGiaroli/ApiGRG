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

        public DateTime FechaCreacion {get; set;}

        public DateTime? FechaActualizacion {get; set;}

        public ICollection<ProductoColor> ProductoColores {get; set;}

        public ICollection<ProductoCuota> ProductoCuotas {get; set;}

    }

    public enum EstadoProducto
    {
        Sellado = 1,
        Seminuevo = 2
    }
}