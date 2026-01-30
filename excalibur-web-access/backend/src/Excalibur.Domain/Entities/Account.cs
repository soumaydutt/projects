using Excalibur.Domain.Enums;

namespace Excalibur.Domain.Entities;

public class Account : BaseEntity
{
    public string AccountNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public AccountType AccountType { get; set; }
    public AccountStatus Status { get; set; } = AccountStatus.PendingActivation;

    // Contact Information
    public string PrimaryEmail { get; set; } = string.Empty;
    public string PrimaryPhone { get; set; } = string.Empty;
    public string? SecondaryEmail { get; set; }
    public string? SecondaryPhone { get; set; }

    // Address
    public string AddressLine1 { get; set; } = string.Empty;
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = "US";

    // Business specific
    public string? CompanyName { get; set; }
    public string? TaxId { get; set; }

    // KYC
    public bool KycVerified { get; set; } = false;
    public DateTime? KycVerifiedAt { get; set; }
    public string? KycDocumentType { get; set; }
    public string? KycDocumentNumber { get; set; }

    // Financial
    public decimal CreditLimit { get; set; } = 0;
    public decimal CurrentBalance { get; set; } = 0;
    public string CurrencyCode { get; set; } = "USD";

    // Billing
    public int BillingDay { get; set; } = 1;
    public bool AutoPay { get; set; } = false;
    public string? DefaultPaymentMethodId { get; set; }

    // Tags for categorization
    public string? Tags { get; set; }

    // Collections tracking
    public string? LastCollectionAction { get; set; }
    public DateTime? LastCollectionDate { get; set; }
    public DateTime? NextFollowUpDate { get; set; }
    public string? CollectionAssignee { get; set; }

    // Aliases for compatibility
    public AccountType Type
    {
        get => AccountType;
        set => AccountType = value;
    }

    public string Email
    {
        get => PrimaryEmail;
        set => PrimaryEmail = value;
    }

    public string? Phone
    {
        get => PrimaryPhone;
        set => PrimaryPhone = value ?? string.Empty;
    }

    public string Address1
    {
        get => AddressLine1;
        set => AddressLine1 = value;
    }

    public string? Address2
    {
        get => AddressLine2;
        set => AddressLine2 = value;
    }

    public string ZipCode
    {
        get => PostalCode;
        set => PostalCode = value;
    }

    public decimal Balance
    {
        get => CurrentBalance;
        set => CurrentBalance = value;
    }

    // Navigation properties
    public virtual ICollection<Subscriber> Subscribers { get; set; } = new List<Subscriber>();
    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public virtual ICollection<AccountNote> Notes { get; set; } = new List<AccountNote>();
    public virtual ICollection<AccountAttachment> Attachments { get; set; } = new List<AccountAttachment>();
    public virtual ICollection<ArLedgerEntry> ArLedger { get; set; } = new List<ArLedgerEntry>();
    public virtual ICollection<CollectionCase> CollectionCases { get; set; } = new List<CollectionCase>();
}
