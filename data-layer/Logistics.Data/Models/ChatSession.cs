using System.ComponentModel.DataAnnotations;

namespace Logistics.Data.Models
{
    public class ChatSession : BaseEntity
    {
        [Required]
        public string CustomerEmail { get; set; } = string.Empty;
        
        public string SupportEmail { get; set; } = string.Empty;

        public string Status { get; set; } = "open";

        public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }
}
