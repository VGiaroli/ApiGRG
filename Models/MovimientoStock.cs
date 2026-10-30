using System.ComponentModel.DataAnnotations;

namespace ApiGRG.Models
{
    public enum TipoMovimientoStock
    {
        Inicial = 1,
        Ingreso = 2,
        Egreso = 3,
        Ajuste = 4
    }

    public class MovimientoStock
    {
        [Key]
        public int MovimientoStockID { get; set; }

        public int ProductoID { get; set; }

        public Producto Producto { get; set; } = null!;

        public TipoMovimientoStock Tipo { get; set; }

        public int? CantidadAnterior { get; set; }

        public int CantidadNueva { get; set; }

        public int Diferencia { get; set; }

        [StringLength(500)]
        public string? Motivo { get; set; }

        public DateTime FechaUtc { get; set; }

        [StringLength(450)]
        public string? UsuarioId { get; set; }
    }
}
