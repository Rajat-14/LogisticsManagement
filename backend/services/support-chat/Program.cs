using Microsoft.EntityFrameworkCore;
using Logistics.Data.Data;
using Logistics.Data.Models;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();
app.UseCors();

// Create new session or return existing active session for customer
app.MapPost("/api/chat/session", async (AppDbContext context, HttpContext httpContext) =>
{
    var email = httpContext.Request.Query["email"].ToString();
    if (string.IsNullOrEmpty(email)) return Results.BadRequest("Customer email required.");

    var existing = await context.ChatSessions
        .Include(s => s.Messages)
        .FirstOrDefaultAsync(s => s.CustomerEmail == email && s.Status == "open");
        
    if (existing != null) return Results.Ok(existing);

    var supportRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Support");
    if (supportRole == null) return Results.Problem("Support role not found.");

    var supportUsers = await context.UserRoles
        .Include(ur => ur.User)
        .Where(ur => ur.RoleId == supportRole.Id)
        .Select(ur => ur.User.Email)
        .ToListAsync();

    string assignee = "support@logistics.com"; // default fallback
    if (supportUsers.Any())
    {
        var random = new Random();
        assignee = supportUsers[random.Next(supportUsers.Count)];
    }

    var newSession = new ChatSession
    {
        CustomerEmail = email,
        SupportEmail = assignee,
        Status = "open"
    };

    context.ChatSessions.Add(newSession);
    await context.SaveChangesAsync();

    return Results.Ok(newSession);
});

// Post message to session
app.MapPost("/api/chat/session/{id}/message", async (int id, AppDbContext context, HttpContext httpContext) =>
{
    using var reader = new StreamReader(httpContext.Request.Body);
    var content = await reader.ReadToEndAsync();
    
    try {
        var body = System.Text.Json.JsonDocument.Parse(content);
        var sender = body.RootElement.GetProperty("senderEmail").GetString();
        var msg = body.RootElement.GetProperty("content").GetString();

        var session = await context.ChatSessions.FindAsync(id);
        if (session == null) return Results.NotFound();

        var chatMessage = new ChatMessage {
            ChatSessionId = id,
            SenderEmail = sender ?? "unknown",
            Content = msg ?? ""
        };
        context.ChatMessages.Add(chatMessage);
        await context.SaveChangesAsync();

        return Results.Ok(chatMessage);
    } catch {
        return Results.BadRequest();
    }
});

// Get session details and messages
app.MapGet("/api/chat/session/{id}", async (int id, AppDbContext context) =>
{
    var session = await context.ChatSessions
        .Include(s => s.Messages.OrderBy(m => m.CreatedAt))
        .FirstOrDefaultAsync(s => s.Id == id);
    if (session == null) return Results.NotFound();
    
    return Results.Ok(session);
});

// Get all open sessions for a support staff
app.MapGet("/api/chat/support/{email}", async (string email, AppDbContext context) =>
{
    var activeTickets = await context.ChatSessions
        .Include(s => s.Messages.OrderBy(m => m.CreatedAt))
        .Where(s => s.SupportEmail == email && s.Status == "open")
        .ToListAsync();
    return Results.Ok(activeTickets);
});

// Provide access to order details for support
app.MapGet("/api/chat/customer-orders/{email}", async (string email, AppDbContext context) =>
{
    var orders = await context.Orders
        .Where(o => o.CustomerEmail == email)
        .OrderByDescending(o => o.CreatedAt)
        .ToListAsync();
    return Results.Ok(orders);
});

app.MapControllers();
app.Run();
