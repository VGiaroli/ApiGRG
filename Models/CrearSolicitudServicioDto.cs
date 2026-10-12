namespace ApiGRG.Models
{
    public class CrearSolicitudServicioDto
    {
        public string Nombre { get; set; }
        public string Apellido { get; set; }
        public string Numero { get; set; }
        public string? Dni { get; set; }
        public string? Email { get; set; }
        public string? Localidad { get; set; }
        public string? NombreDispositivo { get; set; }
        public string? Marca { get; set; }
        public string? Modelo { get; set; }
        public bool TipoArreglo { get; set; }
        public bool TipoInspeccion { get; set; }
        public string? Descripcion { get; set; }
    }
}
