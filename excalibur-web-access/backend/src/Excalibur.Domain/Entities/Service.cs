using Excalibur.Domain.Enums;

namespace Excalibur.Domain.Entities;

public class Service : BaseEntity
{
    public string ServiceNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid SubscriberId { get; set; }
    public Guid PricePlanId { get; set; }
    public ServiceType ServiceType { get; set; }
    public ServiceStatus Status { get; set; } = ServiceStatus.Pending;

    // Service specific identifiers
    public string? PhoneNumber { get; set; }
    public string? Imsi { get; set; }
    public string? MacAddress { get; set; }
    public string? IpAddress { get; set; }

    // Dates
    public DateTime? ActivatedAt { get; set; }
    public DateTime? SuspendedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public DateTime? ContractStartDate { get; set; }
    public DateTime? ContractEndDate { get; set; }

    // Plan history
    public DateTime PlanEffectiveDate { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Subscriber Subscriber { get; set; } = null!;
    public virtual PricePlan PricePlan { get; set; } = null!;
    public virtual ICollection<ServicePlanHistory> PlanHistory { get; set; } = new List<ServicePlanHistory>();
    public virtual ICollection<UsageRecord> UsageRecords { get; set; } = new List<UsageRecord>();
    public virtual ICollection<SwitchAction> SwitchActions { get; set; } = new List<SwitchAction>();
}
