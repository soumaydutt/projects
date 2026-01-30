using Excalibur.Domain.Enums;

namespace Excalibur.Domain.Entities;

public class ArLedgerEntry : BaseEntity
{
    public Guid AccountId { get; set; }
    public LedgerEntryType EntryType { get; set; }
    public decimal Amount { get; set; }
    public decimal RunningBalance { get; set; }
    public string CurrencyCode { get; set; } = "USD";
    public DateTime TransactionDate { get; set; }
    public string Description { get; set; } = string.Empty;

    // References
    public Guid? InvoiceId { get; set; }
    public Guid? PaymentId { get; set; }
    public string? ReferenceNumber { get; set; }

    // Navigation properties
    public virtual Account Account { get; set; } = null!;
    public virtual Invoice? Invoice { get; set; }
    public virtual Payment? Payment { get; set; }
}
