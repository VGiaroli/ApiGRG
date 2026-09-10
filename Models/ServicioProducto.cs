// ============================================================
// TABLA INTERMEDIA: SERVICIO ↔ PRODUCTO
// Resuelve la relación Muchos a Muchos entre Servicio y Producto.
//
// Ejemplo:
//   Servicio "Cambio de pantalla" ↔ Producto "iPhone 14", "Samsung S23"
//   Producto "Cambio de batería" ↔ Servicio "Reparación Express", "Reparación Standard"
//
// Cada fila representa una asociación: un servicio aplicable a un producto.
// ============================================================

using System.ComponentModel.DataAnnotations;

namespace ApiGRG.Models
{
    public class ServicioProducto
    {
        [Key]
        public int ServicioProductoID { get; set; } // PK autoincremental de la fila asociación

        public int ServicioID { get; set; }         // FK → tabla Servicios (qué servicio)
        public Servicio Servicio { get; set; }      // Navegación: permite acceder al objeto Servicio completo

        public int ProductoID { get; set; }         // FK → tabla Productos (a qué producto aplica)
        public Producto Producto { get; set; }      // Navegación: permite acceder al objeto Producto completo
    }
}
