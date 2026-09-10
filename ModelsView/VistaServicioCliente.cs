// ============================================================
// VIEWMODEL / DTO PARA CLIENTE
// Vista simplificada de un servicio para el catálogo público.
//
// Diferencia con VistaServicioAdmin:
// - NO incluye: Activo, Orden, Visibilidad, Fechas (el cliente no necesita verlos)
// - SÍ incluye: PrecioOriginal y PrecioFinal (calculados por el backend)
//
// El controller calcula el precio on-the-fly:
//   PrecioOriginal = precio base (ej: $0 si no hay precio, o configurable)
//   PrecioFinal = PrecioOriginal - descuento (previene negativos)
//
// El frontend recibe ya el precio final y solo lo muestra.
// ============================================================

namespace ApiGRG.ModelsView
{
    public class VistaServicioCliente
    {
        public int ServicioID { get; set; }          // ID del servicio
        public string Nombre { get; set; }           // Nombre del servicio
        public string? Descripcion { get; set; }     // Descripción (opcional)

        public decimal PrecioOriginal { get; set; }  // Precio base antes de descuento (calculado en controller)
        public decimal PrecioFinal { get; set; }     // Precio después de aplicar descuento (calculado en controller)

        public string TipoDescuento { get; set; }    // "Porcentaje" o "MontoFijo"
        public decimal Descuento { get; set; }       // Valor del descuento

        // Nombres de productos asociados (ej: ["iPhone 14", "Samsung S23"])
        public List<string> Productos { get; set; } = new();

        // Nombres de categorías asociadas (ej: ["Marca", "Dispositivo"])
        // Se usa para agrupar servicios en el catálogo
        public List<string> Categorias { get; set; } = new();
    }
}
