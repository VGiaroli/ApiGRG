// ============================================================
// MODELO SERVICIO
// Representa un servicio ofrecido a los clientes.
// Ej: "Cambio de pantalla", "Reparación de batería", "Cambio de batería"
//
// Relaciones:
//   - N:N con Producto → tabla intermedia ServicioProducto
//   - N:N con Categoria → tabla intermedia ServicioCategoria
//
// El descuento puede ser porcentaje (ej: 15%) o monto fijo (ej: $500)
// El precio NO se almacena en este modelo, se calcula on-the-fly en el controller
// ============================================================

using System.ComponentModel.DataAnnotations;

namespace ApiGRG.Models
{
    public class Servicio
    {
        [Key]
        public int ServicioID { get; set; }       // PK autoincremental, identificador único del servicio

        public string Nombre { get; set; }        // Nombre del servicio (obligatorio, ej: "Cambio de pantalla")

        public string? Descripcion { get; set; }  // Descripción opcional del servicio

        public decimal Descuento { get; set; }    // Valor del descuento. Si TipoDescuento=Porcentaje → es un % (0-100). Si TipoDescuento=MontoFijo → es un monto ($)

        public TipoDescuento TipoDescuento { get; set; } // Define cómo se aplica el descuento (enum: Porcentaje=1, MontoFijo=2)

        public bool Activo { get; set; } = true;  // true = servicio habilitado, false = deshabilitado (no aparece en admin ni catálogo)

        public int Orden { get; set; }            // Orden de aparición en el catálogo (menor número = primero)

        public bool Visibilidad { get; set; } = true; // true = visible al cliente, false = oculto (solo se ve en admin)

        public DateTime FechaCreacion { get; set; }      // Fecha de alta del servicio (se setea automáticamente en POST)

        public DateTime? FechaActualizacion { get; set; } // Fecha de última modificación (se setea en PUT, null si nunca se editó)

        // Relación N:N con Productos a través de la tabla intermedia ServicioProducto
        // Permite asociar un servicio a múltiples productos
        public ICollection<ServicioProducto>? ServicioProductos { get; set; } = new List<ServicioProducto>();

        // Relación N:N con Categorías a través de la tabla intermedia ServicioCategoria
        // Permite clasificar un servicio en múltiples categorías (ej: "Marca", "Dispositivo")
        public ICollection<ServicioCategoria>? ServicioCategorias { get; set; } = new List<ServicioCategoria>();
    }

    // Enum que define el tipo de descuento aplicable al servicio
    public enum TipoDescuento
    {
        Porcentaje = 1,  // Descuento porcentual (ej: 15 → se calcula: precio * 15 / 100)
        MontoFijo = 2    // Descuento en monto fijo (ej: 500 → se resta directo: precio - 500)
    }
}
