using Excalibur.Domain.Enums;

namespace Excalibur.Domain.Entities;

public class CollectionCaseActivity : BaseEntity
{
    public Guid CollectionCaseId { get; set; }
    public CollectionActivityType ActivityType { get; set; }
    public string Description { get; set; } = string.Empty;
    public CollectionCaseStatus? PreviousStatus { get; set; }
    public CollectionCaseStatus? NewStatus { get; set; }
    public Guid PerformedById { get; set; }
    public DateTime PerformedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual CollectionCase CollectionCase { get; set; } = null!;
    public virtual User PerformedBy { get; set; } = null!;
}
