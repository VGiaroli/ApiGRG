using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiGRG.Migrations
{
    /// <inheritdoc />
    public partial class AddMiembros : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MiembroEquipos",
                columns: table => new
                {
                    MiembroEquipoID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreCompleto = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Cargo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ImagenUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EtiquetasJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MiembroEquipos", x => x.MiembroEquipoID);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MiembroEquipos");
        }
    }
}
