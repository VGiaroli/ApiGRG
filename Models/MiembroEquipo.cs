namespace ApiGRG.Models
{
    public class MiembroEquipo
    {
        public int MiembroEquipoID { get; set; }
        public string NombreCompleto { get; set; } = string.Empty;
        public string Cargo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public string ImagenUrl { get; set; } = string.Empty;

        // Guardaremos las etiquetas como JSON en la base de datos para simplificar la estructura
        public string EtiquetasJson { get; set; } = "[]";
        public bool Activo { get; set; } = true;
    }
}