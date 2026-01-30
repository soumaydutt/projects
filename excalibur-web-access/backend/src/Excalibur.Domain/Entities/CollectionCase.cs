using Excalibur.Domain.Enums;

namespace Excalibur.Domain.Entities;

public class CollectionCase : BaseEntity
{
    public string CaseNumber { get; set; } = string.Empty;
    public Guid AccountId { get; set; }
    public Guid? AssignedToId { get; set; }
    public CollectionCaseStatus Status { get; set; } = CollectionCaseStatus.New;
    public AgingBucket AgingBucket { get; set; }
    public CollectionPriority Priority { get; set; } = CollectionPriority.Medium;

    // Amounts
    public decimal TotalOverdueAmount { get; set; }
    public decimal TotalAmountDue { get; set; }
    public decimal OldestOverdueDays { get; set; }
    public string CurrencyCode { get; set; } = "USD";

    // Dates
    public DateTime OpenedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime? LastContactAt { get; set; }
    public DateTime? LastContactDate { get; set; }
    public DateTime? NextFollowUpAt { get; set; }
    public DateTime? NextFollowUpDate { get; set; }
    public DateTime? OldestInvoiceDate { get; set; }

    // Promise to Pay
    public DateTime? PromiseToPayDate { get; set; }
    public decimal? PromiseToPayAmount { get; set; }
    public bool PromiseBroken { get; set; } = false;

    // Priority and escalation
    public bool IsEscalated { get; set; } = false;
    public DateTime? EscalatedAt { get; set; }
    public string? EscalationReason { get; set; }

    // Resolution
    public string? ResolutionNotes { get; set; }

    // Navigation properties
    public virtual Account Account { get; set; } = null!;
    public virtual User? AssignedTo { get; set; }
    public virtual ICollection<CollectionCaseNote> CaseNotes { get; set; } = new List<CollectionCaseNote>();
    public virtual ICollection<CollectionCaseNote> Notes { get; set; } = new List<CollectionCaseNote>();
    public virtual ICollection<CollectionCaseActivity> Activities { get; set; } = new List<CollectionCaseActivity>();
}
