using Excalibur.Domain.Enums;

namespace Excalibur.Domain.Entities;

public class Payment : BaseEntity
{
    public string PaymentNumber { get; set; } = string.Empty;
    public Guid AccountId { get; set; }
    public decimal Amount { get; set; }
    public string CurrencyCode { get; set; } = "USD";
    public PaymentMethod PaymentMethod { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    // Reference numbers
    public string? TransactionReference { get; set; }
    public string? CheckNumber { get; set; }
    public string? BankReference { get; set; }

    // Card details (masked)
    public string? CardLastFour { get; set; }
    public string? CardType { get; set; }

    // Dates
    public DateTime PaymentDate { get; set; }
    public DateTime? ProcessedAt { get; set; }

    // Allocation tracking
    public decimal AllocatedAmount { get; set; } = 0;
    public decimal UnallocatedAmount => Amount - AllocatedAmount;

    // Notes
    public string? Notes { get; set; }

    // Navigation properties
    public virtual Account Account { get; set; } = null!;
    public virtual ICollection<PaymentAllocation> Allocations { get; set; } = new List<PaymentAllocation>();
}
