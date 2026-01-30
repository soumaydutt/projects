namespace Excalibur.Domain.Entities;

public class PaymentAllocation : BaseEntity
{
    public Guid PaymentId { get; set; }
    public Guid InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public DateTime AllocationDate { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }

    // Navigation properties
    public virtual Payment Payment { get; set; } = null!;
    public virtual Invoice Invoice { get; set; } = null!;
}
