using System.Text.Json.Serialization;

namespace ApiGRG.Models
{
    // Estado de la entrega del servicio
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum EstadoConfirmacion
    {
        EnProceso = 0,
        Terminado = 1
    }
}