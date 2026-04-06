using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Logistics.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDriverEmail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DriverEmail",
                table: "Orders",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DriverEmail",
                table: "Orders");
        }
    }
}
