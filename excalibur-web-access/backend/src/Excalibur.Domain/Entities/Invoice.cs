using Excalibur.Domain.Enums;

namespace Excalibur.Domain.Entities;

public class Invoice : BaseEntity
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public Guid AccountId { get; set; }
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;

    // Billing period
    public DateTime BillingPeriodStart { get; set; }
    public DateTime BillingPeriodEnd { get; set; }
    public DateTime IssueDate { get; set; }
    public DateTime DueDate { get; set; }

    // Amounts
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; } = 0;
    public decimal BalanceDue => TotalAmount - PaidAmount;
    public string CurrencyCode { get; set; } = "USD";

    // Payment tracking
    public DateTime? PaidAt { get; set; }
    public DateTime? OverdueAt { get; set; }

    // Notes
    public string? Notes { get; set; }

    // Aliases for compatibility
    public DateTime InvoiceDate
    {
        get => IssueDate;
        set => IssueDate = value;
    }

    public decimal Subtotal
    {
        get => SubTotal;
        set => SubTotal = value;
    }

    public decimal Amount
    {
        get => TotalAmount;
        set => TotalAmount = value;
    }

    public decimal Total
    {
        get => TotalAmount;
        set => TotalAmount = value;
    }

    public decimal AmountPaid
    {
        get => PaidAmount;
        set => PaidAmount = value;
    }

    public decimal Balance
    {
        get => BalanceDue;
        set => PaidAmount = TotalAmount - value;
    }

    // Navigation properties
    public virtual Account Account { get; set; } = null!;
    public virtual ICollection<InvoiceLineItem> LineItems { get; set; } = new List<InvoiceLineItem>();
    public virtual ICollection<PaymentAllocation> PaymentAllocations { get; set; } = new List<PaymentAllocation>();
}
