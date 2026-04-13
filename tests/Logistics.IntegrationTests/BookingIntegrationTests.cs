using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Logistics.Data.Data;
using Logistics.Data.Models;
using OrderService.Controllers;
using Xunit;

namespace Logistics.IntegrationTests
{
    public class BookingIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        public BookingIntegrationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Testing");
            });
        }

        [Fact]
        public async Task PostOrder_CreatesOrderAndReturnsSuccess()
        {
            // Arrange
            var client = _factory.CreateClient();
            var bookingDto = new CreateOrderDto
            {
                CustomerEmail = "integration@test.com",
                Origin = "New York",
                Destination = "Los Angeles",
                WeightKg = 15.0m,
                Contents = "Electronics",
                Amount = 150.0m
            };

            // Act
            var response = await client.PostAsJsonAsync("/api/orders", bookingDto);

            // Assert
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            
            var returnedOrder = await response.Content.ReadFromJsonAsync<Order>();
            Assert.NotNull(returnedOrder);
            Assert.Equal(bookingDto.CustomerEmail, returnedOrder.CustomerEmail);
            Assert.Equal("pending", returnedOrder.Status);

            // Verify it exists in the DB
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var orderInDb = await db.Orders.FindAsync(returnedOrder.Id);
                Assert.NotNull(orderInDb);
                Assert.Equal("New York", orderInDb.Origin);
            }
        }
    }
}
