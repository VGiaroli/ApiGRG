using System.ComponentModel.DataAnnotations;

namespace ApiGRG.Models
{
    public class MedioPago
    {
        [Key]
        public int MedioPagoID {get; set;}

        public string Nombre{get; set;}

        public int Orden {get; set;}

    }
}