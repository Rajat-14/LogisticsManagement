using Microsoft.EntityFrameworkCore;
using Logistics.Data.Data;
using Logistics.Data.Repositories;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped(typeof(IRepository<>), typeof(GenericRepository<>));

var app = builder.Build();

// Auto-migrate
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.Migrate();
}

app.MapGet("/api/orders/all", async (AppDbContext context) =>
{
    var allOrders = await context.Orders
        .OrderByDescending(o => o.CreatedAt)
        .ToListAsync();
    return Results.Ok(allOrders);
});

app.MapPost("/api/orders/{id}/assign", async (int id, HttpContext httpContext, AppDbContext context) =>
{
    using var reader = new StreamReader(httpContext.Request.Body);
    var bodyStr = await reader.ReadToEndAsync();
    
    try {
        var body = System.Text.Json.JsonDocument.Parse(bodyStr);
        var driverEmail = body.RootElement.GetProperty("driverEmail").GetString();

        var order = await context.Orders.FindAsync(id);
        if (order == null) return Results.NotFound("Order not found");

        order.DriverEmail = driverEmail ?? "";
        order.Status = "assigned";
        order.UpdatedAt = DateTime.UtcNow;

        var te = new Logistics.Data.Models.TrackingEvent {
            OrderId = id,
            Status = "Assigned",
            Location = "Dispatch",
            Timestamp = DateTime.UtcNow
        };
        context.TrackingEvents.Add(te);

        await context.SaveChangesAsync();
        return Results.Ok(order);
    } catch {
        return Results.BadRequest();
    }
});

app.MapControllers();
app.Run();
