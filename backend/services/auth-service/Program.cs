using Microsoft.EntityFrameworkCore;
using Logistics.Data.Data;
using Logistics.Data.Repositories;
using Logistics.Data.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// Configure PostgreSQL using Shared Data Layer
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register Generic Repository
builder.Services.AddScoped(typeof(IRepository<>), typeof(GenericRepository<>));

// Configure JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var tokenKey = builder.Configuration.GetSection("AppSettings:Token").Value;
        if (string.IsNullOrEmpty(tokenKey)) throw new Exception("Token key is missing in configuration.");

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tokenKey)),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

var app = builder.Build();

// Automatic database initialization/migration
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        // Check if database exists and apply migrations
        if (context.Database.GetPendingMigrations().Any())
        {
            context.Database.Migrate();
        }
        
        // Seed initial data
        DbInitializer.Initialize(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating the database.");
    }
}

// app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/auth/staff-summary", async (AppDbContext context) =>
{
    var driverRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Driver");
    var supportRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Support");

    var drivers = driverRole != null ? await context.UserRoles.Include(ur => ur.User).Where(ur => ur.RoleId == driverRole.Id).Select(ur => ur.User.Email).ToListAsync() : new List<string>();
    var support = supportRole != null ? await context.UserRoles.Include(ur => ur.User).Where(ur => ur.RoleId == supportRole.Id).Select(ur => ur.User.Email).ToListAsync() : new List<string>();

    return Results.Ok(new {
        driverCount = drivers.Count,
        drivers = drivers,
        supportCount = support.Count,
        support = support
    });
});

app.MapControllers();

app.Run();
