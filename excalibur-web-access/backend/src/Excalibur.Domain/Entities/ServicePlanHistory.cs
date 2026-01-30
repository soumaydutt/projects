namespace Excalibur.Domain.Entities;

public class ServicePlanHistory : BaseEntity
{
    public Guid ServiceId { get; set; }
    public Guid PricePlanId { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public string? ChangeReason { get; set; }

    // Navigation properties
    public virtual Service Service { get; set; } = null!;
    public virtual PricePlan PricePlan { get; set; } = null!;
}
