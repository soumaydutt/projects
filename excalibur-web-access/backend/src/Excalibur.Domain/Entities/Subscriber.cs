using Excalibur.Domain.Enums;

namespace Excalibur.Domain.Entities;

public class Subscriber : BaseEntity
{
    public string SubscriberNumber { get; set; } = string.Empty;
    public Guid AccountId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public ServiceStatus Status { get; set; } = ServiceStatus.Pending;
    public DateTime? ActivatedAt { get; set; }
    public DateTime? SuspendedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? SuspensionReason { get; set; }
    public string? CancellationReason { get; set; }

    // Navigation properties
    public virtual Account Account { get; set; } = null!;
    public virtual ICollection<Service> Services { get; set; } = new List<Service>();
}
