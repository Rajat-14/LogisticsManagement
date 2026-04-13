using Microsoft.EntityFrameworkCore;
using Logistics.Data.Data;
using Logistics.Data.Models;
using Logistics.Data.Repositories;
using Xunit;

namespace Logistics.UnitTests
{
    public class GenericRepositoryTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly GenericRepository<Order> _repository;

        public GenericRepositoryTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _repository = new GenericRepository<Order>(_context);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        [Fact]
        public async Task AddAsync_AddsEntityToContext()
        {
            // Arrange
            var order = new Order { CustomerEmail = "repo@test.com", Amount = 500 };

            // Act
            await _repository.AddAsync(order);
            await _repository.SaveChangesAsync();

            // Assert
            var orderInDb = await _context.Orders.FindAsync(order.Id);
            Assert.NotNull(orderInDb);
            Assert.Equal("repo@test.com", orderInDb.CustomerEmail);
        }

        [Fact]
        public async Task GetByIdAsync_ReturnsCorrectEntity()
        {
            // Arrange
            var order = new Order { CustomerEmail = "getbyid@test.com", Amount = 300 };
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByIdAsync(order.Id);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(order.Id, result.Id);
            Assert.Equal("getbyid@test.com", result.CustomerEmail);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsAllEntities()
        {
            // Arrange
            _context.Orders.Add(new Order { CustomerEmail = "a@test.com" });
            _context.Orders.Add(new Order { CustomerEmail = "b@test.com" });
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetAllAsync();

            // Assert
            Assert.Equal(2, result.Count());
        }

        [Fact]
        public async Task Remove_RemovesEntityFromContext()
        {
            // Arrange
            var order = new Order { CustomerEmail = "delete@test.com" };
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Act
            _repository.Remove(order);
            await _repository.SaveChangesAsync();

            // Assert
            var orderInDb = await _context.Orders.FindAsync(order.Id);
            Assert.Null(orderInDb);
        }
    }
}
