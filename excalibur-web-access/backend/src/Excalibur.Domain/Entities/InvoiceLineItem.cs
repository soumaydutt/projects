using Excalibur.Domain.Enums;

namespace Excalibur.Domain.Entities;

public class InvoiceLineItem : BaseEntity
{
    public Guid InvoiceId { get; set; }
    public Guid? ServiceId { get; set; }
    public ChargeType ChargeType { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
    public string CurrencyCode { get; set; } = "USD";

    // Period for recurring charges
    public DateTime? PeriodStart { get; set; }
    public DateTime? PeriodEnd { get; set; }

    // For proration
    public bool IsProrated { get; set; } = false;
    public int? ProratedDays { get; set; }
    public int? TotalDays { get; set; }

    // Reference to price plan
    public Guid? PricePlanId { get; set; }

    // Navigation properties
    public virtual Invoice Invoice { get; set; } = null!;
    public virtual Service? Service { get; set; }
    public virtual PricePlan? PricePlan { get; set; }
}
