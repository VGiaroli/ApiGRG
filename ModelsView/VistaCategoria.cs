namespace ApiGRG.ModelsView
{
    public class VistaCategoria
    {
        public int CategoriaID {get; set;}
        public string NombreProducto { get; set; }  = "";
        public string? Descripcion { get; set; }
        public bool Eliminado { get; set; }
        public IFormFile? Imagen { get; set; }   // la imagen es opcional
    }
}