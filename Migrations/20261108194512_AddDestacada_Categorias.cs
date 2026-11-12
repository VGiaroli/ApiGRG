using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiGRG.Migrations
{
    /// <inheritdoc />
    public partial class AddDestacada_Categorias : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Destacada",
                table: "Categorias",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Destacada",
                table: "Categorias");
        }
    }
}
