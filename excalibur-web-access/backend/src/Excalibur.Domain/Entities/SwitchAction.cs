using Excalibur.Domain.Enums;

namespace Excalibur.Domain.Entities;

public class SwitchAction : BaseEntity
{
    public string ActionNumber { get; set; } = string.Empty;
    public Guid ServiceId { get; set; }
    public SwitchActionType ActionType { get; set; }
    public SwitchActionStatus Status { get; set; } = SwitchActionStatus.Pending;

    // For plan changes
    public Guid? FromPricePlanId { get; set; }
    public Guid? ToPricePlanId { get; set; }

    // Request details
    public string? RequestReason { get; set; }
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public Guid RequestedById { get; set; }

    // Approval workflow
    public bool RequiresApproval { get; set; } = false;
    public Guid? ApprovedById { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovalNotes { get; set; }
    public Guid? RejectedById { get; set; }
    public DateTime? RejectedAt { get; set; }
    public string? RejectionReason { get; set; }

    // Execution
    public DateTime? ExecutedAt { get; set; }
    public string? ExecutionResult { get; set; }
    public string? ErrorMessage { get; set; }

    // Effective date
    public DateTime EffectiveDate { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Service Service { get; set; } = null!;
    public virtual PricePlan? FromPricePlan { get; set; }
    public virtual PricePlan? ToPricePlan { get; set; }
}
