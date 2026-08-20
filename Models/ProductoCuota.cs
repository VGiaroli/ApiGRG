using System.ComponentModel.DataAnnotations;

namespace ApiGRG.Models
{
    public class ProductoCuota
    {
        [Key]
        public int ProductoCuotaID {get; set;}

        public int ProductoID {get; set;}

        public Producto Producto {get; set;}

        public int MedioPagoID {get; set;}

        public MedioPago MedioPago {get; set;}

        public int CantidadCuotas {get; set;}

        public decimal MontoCuota {get; set;}
    }
}