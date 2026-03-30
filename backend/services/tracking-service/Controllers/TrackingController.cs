using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Logistics.Data.Data;
using Logistics.Data.Models;

namespace TrackingService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TrackingController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TrackingController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/tracking/{orderId}
        [HttpGet("{orderId}")]
        public async Task<IActionResult> GetTracking(int orderId)
        {
            var events = await _context.TrackingEvents
                .Where(te => te.OrderId == orderId)
                .OrderByDescending(te => te.Timestamp)
                .ToListAsync();

            return Ok(new { orderId, events });
        }

        // POST /api/tracking
        [HttpPost]
        public async Task<IActionResult> AddTrackingEvent([FromBody] AddTrackingEventDto dto)
        {
            var trackingEvent = new TrackingEvent
            {
                OrderId = dto.OrderId,
                Status = dto.Status,
                Location = dto.Location,
                Timestamp = DateTime.UtcNow
            };

            _context.TrackingEvents.Add(trackingEvent);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetTracking), new { orderId = dto.OrderId }, trackingEvent);
        }
    }

    public class AddTrackingEventDto
    {
        public int OrderId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
    }
}
