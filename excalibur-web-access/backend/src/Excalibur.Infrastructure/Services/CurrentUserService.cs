using Excalibur.Application.Common.Interfaces;
using Excalibur.Domain.Enums;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Excalibur.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? UserId
    {
        get
        {
            var userId = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            return userId != null ? Guid.Parse(userId) : null;
        }
    }

    public string? Email => _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Email);

    public UserRole? Role
    {
        get
        {
            var role = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Role);
            return role != null && Enum.TryParse<UserRole>(role, out var userRole) ? userRole : null;
        }
    }

    public Guid? TenantId
    {
        get
        {
            var tenantId = _httpContextAccessor.HttpContext?.User?.FindFirstValue("TenantId");
            return tenantId != null ? Guid.Parse(tenantId) : null;
        }
    }

    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
}
