using Microsoft.AspNetCore.Mvc;
using Logistics.Data.Models;
using Logistics.Data.Repositories;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AuthService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IRepository<User> _userRepository;
        private readonly IRepository<Role> _roleRepository;
        private readonly IConfiguration _configuration;

        public AuthController(IRepository<User> userRepository, IRepository<Role> roleRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _roleRepository = roleRepository;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(UserRegisterDto request)
        {
            var existingUsers = await _userRepository.FindAsync(u => u.Email == request.Email);
            if (existingUsers.Any())
            {
                return BadRequest("User already exists.");
            }

            var roleName = string.IsNullOrEmpty(request.RoleName) ? "Customer" : request.RoleName;
            var roles = await _roleRepository.FindAsync(r => r.Name == roleName);
            var role = roles.FirstOrDefault();

            if (role == null)
            {
                return BadRequest("Invalid role specified.");
            }

            var user = new User
            {
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
            };

            user.UserRoles.Add(new UserRole { User = user, Role = role });

            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();

            return Ok("User registered successfully.");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(UserLoginDto request)
        {
            var users = await _userRepository.FindAsyncWithIncludes(
                u => u.Email == request.Email,
                "UserRoles.Role");
            
            var user = users.FirstOrDefault();

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Unauthorized("Invalid email or password.");
            }

            var token = CreateToken(user);
            var primaryRole = user.UserRoles.FirstOrDefault()?.Role.Name ?? "Customer";

            return Ok(new { token, user.Email, role = primaryRole });
        }

        private string CreateToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Email, user.Email)
            };

            // Add roles to claims
            foreach (var userRole in user.UserRoles)
            {
                claims.Add(new Claim(ClaimTypes.Role, userRole.Role.Name));
            }

            var tokenKey = _configuration.GetSection("AppSettings:Token").Value;
            if (string.IsNullOrEmpty(tokenKey)) throw new Exception("Token key is missing in configuration.");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tokenKey));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.Now.AddDays(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
