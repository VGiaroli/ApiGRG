using System.ComponentModel.DataAnnotations;

namespace ApiGRG.Models
{
    public class Categoria
    {
        [Key]
        public int CategoriaID { get; set; }

        public string NombreProducto { get; set; }

        public string? Descripcion { get; set; }
        public string? ImagenUrl { get; set; }

        public bool Eliminado { get; set; }

        public ICollection<Producto>? Productos { get; set; } = new List<Producto>();
    }
}
