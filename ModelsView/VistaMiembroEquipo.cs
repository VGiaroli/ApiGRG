namespace ApiGRG.ModelsView
{
    public class VistaMiembroEquipo
    {
        public int MiembroEquipoID { get; set; }
        public string NombreCompleto { get; set; } = string.Empty;
        public string Cargo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public List<string> Etiquetas { get; set; } = new List<string>();
        public IFormFile? Imagen { get; set; }
        public bool Activo { get; set; } = true;
    }
}