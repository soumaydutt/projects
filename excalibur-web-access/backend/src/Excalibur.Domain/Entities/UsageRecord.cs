namespace Excalibur.Domain.Entities;

public class UsageRecord : BaseEntity
{
    public Guid ServiceId { get; set; }
    public string UsageType { get; set; } = string.Empty; // Voice, SMS, Data
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty; // Minutes, Messages, MB
    public DateTime UsageDate { get; set; }
    public DateTime UsageStartTime { get; set; }
    public DateTime UsageEndTime { get; set; }

    // For voice calls
    public string? CalledNumber { get; set; }
    public int? DurationSeconds { get; set; }

    // Rating
    public bool IsRated { get; set; } = false;
    public decimal? RatedAmount { get; set; }
    public Guid? InvoiceLineItemId { get; set; }

    // Navigation properties
    public virtual Service Service { get; set; } = null!;
}
