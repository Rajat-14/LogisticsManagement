using System.ComponentModel.DataAnnotations;

namespace Logistics.Data.Models
{
    public enum UserRole
    {
        Customer,
        Driver,
        Manager,
        SupportStaff
    }

    public class User : BaseEntity
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        public UserRole Role { get; set; }
    }
}
