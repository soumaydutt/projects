using Excalibur.Domain.Enums;

namespace Excalibur.Domain.Entities;

public class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UserId { get; set; }
    public string? UserEmail { get; set; }
    public AuditActionType ActionType { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string? EntityName { get; set; }
    public string? OldValues { get; set; } // JSON
    public string? NewValues { get; set; } // JSON
    public string? Changes { get; set; } // JSON diff
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? CorrelationId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? AdditionalInfo { get; set; } // JSON for extra context
    public Guid? TenantId { get; set; }

    // Navigation properties
    public virtual User? User { get; set; }
}
