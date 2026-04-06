using System.ComponentModel.DataAnnotations;

namespace Logistics.Data.Models
{
    public class ChatMessage : BaseEntity
    {
        public int ChatSessionId { get; set; }
        public ChatSession? ChatSession { get; set; }

        [Required]
        public string SenderEmail { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;
    }
}
