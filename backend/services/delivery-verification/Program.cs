using Microsoft.EntityFrameworkCore;
using Logistics.Data.Data;
using Logistics.Data.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

app.MapPost("/api/delivery/verify/{id}", async (int id, AppDbContext context) =>
{
    var order = await context.Orders.FindAsync(id);
    if (order == null) return Results.NotFound("Order not found.");

    order.Status = "delivered";
    
    // Create tracking event
    var te = new TrackingEvent
    {
        OrderId = order.Id,
        Status = "Delivered",
        Location = order.Destination,
        Timestamp = DateTime.UtcNow
    };
    context.TrackingEvents.Add(te);

    await context.SaveChangesAsync();

    return Results.Ok(new { message = $"Order {id} verified as delivered." });
});

app.MapControllers();
app.Run();
