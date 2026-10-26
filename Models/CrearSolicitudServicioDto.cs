using System.ComponentModel.DataAnnotations;

namespace ApiGRG.Models
{
    public class CrearSolicitudServicioDto
    {
        [Required(ErrorMessage = "El nombre es obligatorio."), StringLength(60)]
        public string Nombre { get; set; }

        [Required(ErrorMessage = "El apellido es obligatorio."), StringLength(60)]
        public string Apellido { get; set; }

        [Required(ErrorMessage = "El teléfono es obligatorio."), StringLength(20)]
        public string Numero { get; set; }

        [RegularExpression(@"^\d{7,8}$", ErrorMessage = "El DNI tiene 7 u 8 números, sin puntos.")]
        public string? Dni { get; set; }

        [StringLength(100)]
        [RegularExpression(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", ErrorMessage = "El email no es válido.")]
        public string? Email { get; set; }

        [StringLength(80)]
        public string? Localidad { get; set; }

        public string? Marca { get; set; }
        public string? Modelo { get; set; }
        public bool TipoArreglo { get; set; }
        public bool TipoInspeccion { get; set; }
        public string? Descripcion { get; set; }
    }
}