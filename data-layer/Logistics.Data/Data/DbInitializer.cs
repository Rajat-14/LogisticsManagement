using Microsoft.EntityFrameworkCore;
using Logistics.Data.Models;

namespace Logistics.Data.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            context.Database.EnsureCreated();

            if (context.Roles.Any())
            {
                return; // DB has been seeded
            }

            var roles = new Role[]
            {
                new Role { Name = "Customer", Description = "Web Portal User" },
                new Role { Name = "Driver", Description = "Logistics Driver" },
                new Role { Name = "Manager", Description = "System Manager" },
                new Role { Name = "Support", Description = "Support Staff" }
            };

            context.Roles.AddRange(roles);
            context.SaveChanges();

            var manageOrdersPermission = new Permission { Name = "ManageOrders", Description = "Can manage all orders" };
            context.Permissions.Add(manageOrdersPermission);
            context.SaveChanges();

            // Associate Role with Permission
            context.RolePermissions.Add(new RolePermission 
            { 
                Role = roles.First(r => r.Name == "Manager"), 
                Permission = manageOrdersPermission 
            });
            
            context.SaveChanges();
        }
    }
}
