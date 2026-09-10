// ============================================================
// VIEWMODEL / DTO PARA ADMIN
// Vista simplificada de un servicio para el panel de administración.
//
// ¿Por qué existe este ViewModel?
// - El modelo Servicio tiene colecciones de navegación (ServicioProductos, ServicioCategorias)
// - El frontend admin solo necesita los NOMBRES de productos y categorías (no objetos complejos)
// - Este ViewModel "aplana" la data: convierte colecciones en List<string>
// - El controller proyecta Servicio → VistaServicioAdmin antes de enviar al frontend
//
// Incluye todos los campos de admin: Activo, Orden, Visibilidad, Fechas
// (el frontend admin necesita estos campos para gestionar el servicio)
// ============================================================

namespace ApiGRG.ModelsView
{
    public class VistaServicioAdmin
    {
        public int ServicioID { get; set; }          // ID del servicio
        public string Nombre { get; set; }           // Nombre del servicio
        public string? Descripcion { get; set; }     // Descripción (opcional)
        public decimal Descuento { get; set; }       // Valor del descuento
        public string TipoDescuento { get; set; }    // "Porcentaje" o "MontoFijo" (convertido del enum)
        public bool Activo { get; set; }             // Estado: activo/inactivo
        public int Orden { get; set; }               // Orden de aparición
        public bool Visibilidad { get; set; }        // Visible/oculto al cliente
        public DateTime FechaCreacion { get; set; }  // Fecha de alta
        public DateTime? FechaActualizacion { get; set; } // Fecha de última edición

        // Nombres de los productos asociados (ej: ["iPhone 14", "Samsung S23"])
        public List<string> Productos { get; set; } = new();

        // Nombres de las categorías asociadas (ej: ["Marca", "Dispositivo"])
        public List<string> Categorias { get; set; } = new();
    }
}
