using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiGRG.Migrations
{
    /// <inheritdoc />
    public partial class Creacion_Modelos_DbContext_Configuraciones : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Categorias",
                columns: table => new
                {
                    CategoriaID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreProducto = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Eliminado = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categorias", x => x.CategoriaID);
                });

            migrationBuilder.CreateTable(
                name: "MedioPagos",
                columns: table => new
                {
                    MedioPagoID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Orden = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedioPagos", x => x.MedioPagoID);
                });

            migrationBuilder.CreateTable(
                name: "Productos",
                columns: table => new
                {
                    ProductoID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CategoriaID = table.Column<int>(type: "int", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Estado = table.Column<int>(type: "int", nullable: false),
                    PrecioARS = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PrecioUSD = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Disponible = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Productos", x => x.ProductoID);
                    table.ForeignKey(
                        name: "FK_Productos_Categorias_CategoriaID",
                        column: x => x.CategoriaID,
                        principalTable: "Categorias",
                        principalColumn: "CategoriaID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProductoColores",
                columns: table => new
                {
                    ProductoColorID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProductoID = table.Column<int>(type: "int", nullable: false),
                    Color = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductoColores", x => x.ProductoColorID);
                    table.ForeignKey(
                        name: "FK_ProductoColores_Productos_ProductoID",
                        column: x => x.ProductoID,
                        principalTable: "Productos",
                        principalColumn: "ProductoID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProductoCuotas",
                columns: table => new
                {
                    ProductoCuotaID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProductoID = table.Column<int>(type: "int", nullable: false),
                    MedioPagoID = table.Column<int>(type: "int", nullable: false),
                    CantidadCuotas = table.Column<int>(type: "int", nullable: false),
                    MontoCuota = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductoCuotas", x => x.ProductoCuotaID);
                    table.ForeignKey(
                        name: "FK_ProductoCuotas_MedioPagos_MedioPagoID",
                        column: x => x.MedioPagoID,
                        principalTable: "MedioPagos",
                        principalColumn: "MedioPagoID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductoCuotas_Productos_ProductoID",
                        column: x => x.ProductoID,
                        principalTable: "Productos",
                        principalColumn: "ProductoID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductoColores_ProductoID",
                table: "ProductoColores",
                column: "ProductoID");

            migrationBuilder.CreateIndex(
                name: "IX_ProductoCuotas_MedioPagoID",
                table: "ProductoCuotas",
                column: "MedioPagoID");

            migrationBuilder.CreateIndex(
                name: "IX_ProductoCuotas_ProductoID",
                table: "ProductoCuotas",
                column: "ProductoID");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_CategoriaID",
                table: "Productos",
                column: "CategoriaID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductoColores");

            migrationBuilder.DropTable(
                name: "ProductoCuotas");

            migrationBuilder.DropTable(
                name: "MedioPagos");

            migrationBuilder.DropTable(
                name: "Productos");

            migrationBuilder.DropTable(
                name: "Categorias");
        }
    }
}
