using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Logistics.Data.Data;
using Logistics.Data.Models;

namespace OrderService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrdersController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/orders?email=...
        [HttpGet]
        public async Task<IActionResult> GetOrders([FromQuery] string email)
        {
            var orders = await _context.Orders
                .Where(o => o.CustomerEmail == email)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
            return Ok(orders);
        }

        // GET /api/orders/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrder(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound();
            return Ok(order);
        }

        // POST /api/orders
        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto dto)
        {
            var order = new Order
            {
                CustomerEmail = dto.CustomerEmail,
                Origin = dto.Origin,
                Destination = dto.Destination,
                WeightKg = dto.WeightKg,
                Contents = dto.Contents,
                Amount = dto.Amount,
                Status = "pending"
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, order);
        }

        // PUT /api/orders/{id}/pay
        [HttpPut("{id}/pay")]
        public async Task<IActionResult> PayOrder(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound();

            order.Status = "paid";
            order.UpdatedAt = DateTime.UtcNow;

            // Create initial tracking event
            _context.TrackingEvents.Add(new TrackingEvent
            {
                OrderId = order.Id,
                Status = "Order Placed & Paid",
                Location = "System",
                Timestamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return Ok(order);
        }
    }

    public class CreateOrderDto
    {
        public string CustomerEmail { get; set; } = string.Empty;
        public string Origin { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public decimal WeightKg { get; set; }
        public string Contents { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }
}
