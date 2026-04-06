using System.ComponentModel.DataAnnotations;

namespace Logistics.Data.Models
{
    public class Order : BaseEntity
    {
        [Required]
        public string CustomerEmail { get; set; } = string.Empty;

        public string DriverEmail { get; set; } = string.Empty;

        [Required]
        public string Origin { get; set; } = string.Empty;

        [Required]
        public string Destination { get; set; } = string.Empty;

        public decimal WeightKg { get; set; }

        public string Contents { get; set; } = string.Empty;

        public decimal Amount { get; set; }

        public string Status { get; set; } = "pending";

        public ICollection<TrackingEvent> TrackingEvents { get; set; } = new List<TrackingEvent>();
    }
}
