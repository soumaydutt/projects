using Excalibur.Domain.Enums;

namespace Excalibur.Domain.Entities;

public class CollectionAction : BaseEntity
{
    public Guid AccountId { get; set; }
    public CollectionActionType ActionType { get; set; }
    public string Notes { get; set; } = string.Empty;
    public DateTime? FollowUpDate { get; set; }
    public decimal? PromisedAmount { get; set; }
    public DateTime? PromisedDate { get; set; }
    public string? ContactMethod { get; set; }
    public string? ContactedPerson { get; set; }
    public string PerformedBy { get; set; } = string.Empty;
    public DateTime PerformedAt { get; set; }

    // Promise tracking
    public bool? PromiseKept { get; set; }
    public DateTime? PromiseEvaluatedAt { get; set; }

    // Navigation
    public virtual Account Account { get; set; } = null!;
}
