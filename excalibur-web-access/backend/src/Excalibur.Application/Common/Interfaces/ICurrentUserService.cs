using Excalibur.Domain.Enums;

namespace Excalibur.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    UserRole? Role { get; }
    Guid? TenantId { get; }
    bool IsAuthenticated { get; }
}
