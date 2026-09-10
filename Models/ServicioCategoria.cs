// ============================================================
// TABLA INTERMEDIA: SERVICIO ↔ CATEGORIA
// Resuelve la relación Muchos a Muchos entre Servicio y Categoría.
//
// Ejemplo:
//   Servicio "Cambio de pantalla" ↔ Categoría "Marca", Categoría "Dispositivo"
//   Servicio "Reparación Express" ↔ Categoría "Servicio Express"
//
// Cada fila representa una clasificación: un servicio pertenece a una categoría.
// Las categorías se usan para agrupar servicios en el catálogo del cliente.
// ============================================================

using System.ComponentModel.DataAnnotations;

namespace ApiGRG.Models
{
    public class ServicioCategoria
    {
        [Key]
        public int ServicioCategoriaID { get; set; } // PK autoincremental de la fila asociación

        public int ServicioID { get; set; }          // FK → tabla Servicios (qué servicio)
        public Servicio Servicio { get; set; }       // Navegación: permite acceder al objeto Servicio completo

        public int CategoriaID { get; set; }         // FK → tabla Categorias (a qué categoría pertenece)
        public Categoria Categoria { get; set; }     // Navegación: permite acceder al objeto Categoría completo
    }
}
