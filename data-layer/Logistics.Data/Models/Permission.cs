using System.ComponentModel.DataAnnotations;

namespace Logistics.Data.Models
{
    public class Permission : BaseEntity
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    }
}
