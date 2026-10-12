using System.ComponentModel.DataAnnotations;

namespace ApiGRG.Models
{
    public class Servicio
    {
        [Key]
        public int ServicioID { get; set; }

        // ----- Datos del solicitante -----
        [Required, StringLength(60)]
        public string Nombre { get; set; }

        [Required, StringLength(60)]
        public string Apellido { get; set; }

        [Required, StringLength(20)]
        public string Numero { get; set; }

        [StringLength(8)]
        public string? Dni { get; set; }

        [StringLength(100)]
        public string? Gmail { get; set; }

        [StringLength(80)]
        public string? Localidad { get; set; }

        // ----- Datos del equipo -----
        public string? NombreDispositivo { get; set; }
        public string? Marca { get; set; }
        public string? Modelo { get; set; }
        public bool TipoArreglo { get; set; }
        public bool TipoInspeccion { get; set; }
        public string? Descripcion { get; set; }
        public DateTime FechaCreacion { get; set; }

        // Baja lógica (false = Activo, true = Inactivo), igual que en Categoria
        public bool Eliminado { get; set; }

        // Confirmación del mensaje de WhatsApp (lo pone/actualiza el admin)
        public EstadoConfirmacion Confirmacion { get; set; }
    }
}