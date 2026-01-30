using Excalibur.Domain.Enums;

namespace Excalibur.Application.Common.Interfaces;

public interface IAuditService
{
    Task LogAsync(
        AuditActionType actionType,
        string entityType,
        Guid? entityId,
        string? entityName = null,
        object? oldValues = null,
        object? newValues = null,
        string? additionalInfo = null,
        CancellationToken cancellationToken = default);
}
