using System.Text.Json.Serialization;

namespace ApiGRG.Models
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum EstadoConfirmacion
    {
        Pendiente = 0,
        Enviado = 1,
        Confirmado = 2,
        NoRecibido = 3
    }
}