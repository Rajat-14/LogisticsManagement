using Microsoft.EntityFrameworkCore;
using Logistics.Data.Data;
using Logistics.Data.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

app.MapGet("/api/routes", async (AppDbContext context, HttpContext httpContext) =>
{
    var email = httpContext.Request.Query["email"].ToString();
    if (string.IsNullOrEmpty(email)) return Results.BadRequest("Email required.");

    var assignedOrders = await context.Orders
        .Where(o => o.DriverEmail == email && o.Status != "delivered")
        .OrderBy(o => o.Id)
        .ToListAsync();

    return Results.Ok(assignedOrders);
});

app.MapControllers();
app.Run();
