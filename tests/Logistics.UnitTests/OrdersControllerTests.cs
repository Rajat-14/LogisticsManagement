using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Logistics.Data.Data;
using Logistics.Data.Models;
using OrderService.Controllers;
using Xunit;

namespace Logistics.UnitTests
{
    public class OrdersControllerTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly OrdersController _controller;

        public OrdersControllerTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _controller = new OrdersController(_context);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        [Fact]
        public async Task GetOrders_ReturnsOrdersForSpecificEmail()
        {
            // Arrange
            var email = "test@example.com";
            _context.Orders.Add(new Order { CustomerEmail = email, Origin = "A", Destination = "B", Amount = 100 });
            _context.Orders.Add(new Order { CustomerEmail = "other@example.com", Origin = "C", Destination = "D", Amount = 200 });
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetOrders(email);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var orders = Assert.IsAssignableFrom<IEnumerable<Order>>(okResult.Value);
            Assert.Single(orders);
            Assert.Equal(email, orders.First().CustomerEmail);
        }

        [Fact]
        public async Task CreateOrder_AddsOrderToDatabase()
        {
            // Arrange
            var dto = new CreateOrderDto
            {
                CustomerEmail = "new@example.com",
                Origin = "Origin",
                Destination = "Dest",
                WeightKg = 10.5m,
                Contents = "Books",
                Amount = 50.0m
            };

            // Act
            var result = await _controller.CreateOrder(dto);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result);
            var returnedOrder = Assert.IsType<Order>(createdResult.Value);
            Assert.Equal(dto.CustomerEmail, returnedOrder.CustomerEmail);
            Assert.Equal("pending", returnedOrder.Status);
            
            var orderInDb = await _context.Orders.FindAsync(returnedOrder.Id);
            Assert.NotNull(orderInDb);
            Assert.Equal(dto.CustomerEmail, orderInDb.CustomerEmail);
        }

        [Fact]
        public async Task PayOrder_UpdatesStatusAndAddsTrackingEvent()
        {
            // Arrange
            var order = new Order { CustomerEmail = "test@example.com", Status = "pending", Amount = 100 };
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.PayOrder(order.Id);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var updatedOrder = Assert.IsType<Order>(okResult.Value);
            Assert.Equal("paid", updatedOrder.Status);

            var trackingEvent = await _context.TrackingEvents.FirstOrDefaultAsync(e => e.OrderId == order.Id);
            Assert.NotNull(trackingEvent);
            Assert.Equal("Order Placed & Paid", trackingEvent.Status);
        }

        [Fact]
        public async Task GetOrder_ReturnsOrder_WhenOrderExists()
        {
            // Arrange
            var order = new Order { CustomerEmail = "found@test.com", Origin = "X", Destination = "Y", Amount = 50 };
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetOrder(order.Id);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedOrder = Assert.IsType<Order>(okResult.Value);
            Assert.Equal(order.Id, returnedOrder.Id);
            Assert.Equal("found@test.com", returnedOrder.CustomerEmail);
        }

        [Fact]
        public async Task GetOrder_ReturnsNotFound_WhenOrderDoesNotExist()
        {
            // Act
            var result = await _controller.GetOrder(999);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }
    }
}
