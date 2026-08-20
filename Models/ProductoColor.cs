using System.ComponentModel.DataAnnotations;

namespace ApiGRG.Models
{
    public class ProductoColor
    {
        [Key]
        public int ProductoColorID {get; set;}

        public int ProductoID {get; set;}

        public Producto Producto {get; set;}

        public string Color {get; set;}
    }
}