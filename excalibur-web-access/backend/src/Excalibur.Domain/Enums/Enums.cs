namespace Excalibur.Domain.Enums;

public enum UserRole
{
    Admin = 1,
    BillingAgent = 2,
    CareAgent = 3,
    Collector = 4,
    ReadOnlyAuditor = 5
}

public enum AccountType
{
    Individual = 1,
    Business = 2
}

public enum AccountStatus
{
    Active = 1,
    Suspended = 2,
    Closed = 3,
    PendingActivation = 4
}

public enum ServiceType
{
    Mobile = 1,
    Broadband = 2,
    IPTV = 3,
    VoIP = 4,
    Bundle = 5
}

public enum ServiceStatus
{
    Pending = 1,
    Active = 2,
    Suspended = 3,
    Cancelled = 4
}

public enum InvoiceStatus
{
    Draft = 1,
    Pending = 2,
    Issued = 3,
    Paid = 4,
    PartiallyPaid = 5,
    Overdue = 6,
    WrittenOff = 7,
    Voided = 8,
    Cancelled = 9
}

public enum PaymentMethod
{
    Cash = 1,
    CreditCard = 2,
    DebitCard = 3,
    BankTransfer = 4,
    Check = 5,
    OnlinePayment = 6
}

public enum PaymentStatus
{
    Pending = 1,
    Completed = 2,
    Failed = 3,
    Refunded = 4,
    Cancelled = 5
}

public enum CollectionCaseStatus
{
    New = 1,
    Contacted = 2,
    PromiseToPay = 3,
    PaymentPlan = 4,
    BrokenPromise = 5,
    Escalated = 6,
    Resolved = 7,
    Closed = 8
}

public enum AgingBucket
{
    Current = 0,
    Days1To30 = 1,
    Days31To60 = 2,
    Days61To90 = 3,
    Days90Plus = 4
}

public enum SwitchActionType
{
    Activate = 1,
    Suspend = 2,
    Resume = 3,
    ChangePlan = 4,
    Cancel = 5
}

public enum SwitchActionStatus
{
    Pending = 1,
    InProgress = 2,
    Completed = 3,
    Failed = 4,
    RequiresApproval = 5,
    Approved = 6,
    Rejected = 7
}

public enum AuditActionType
{
    Create = 1,
    Update = 2,
    Delete = 3,
    Login = 4,
    Logout = 5,
    PasswordChange = 6,
    StatusChange = 7,
    PaymentPosted = 8,
    InvoiceGenerated = 9,
    ServiceProvisioned = 10
}

public enum ChargeType
{
    BaseFee = 1,
    UsageCharge = 2,
    Discount = 3,
    Tax = 4,
    OneTimeCharge = 5,
    Credit = 6,
    LateFee = 7
}

public enum BillingCycleType
{
    Monthly = 1,
    Quarterly = 3,
    Yearly = 12
}

public enum LedgerEntryType
{
    InvoiceDebit = 1,
    PaymentCredit = 2,
    Adjustment = 3,
    WriteOff = 4,
    Refund = 5
}

public enum CollectionActionType
{
    PhoneCall = 1,
    Email = 2,
    Letter = 3,
    SMS = 4,
    PromiseToPay = 5,
    PaymentPlan = 6,
    Escalation = 7,
    SendToAgency = 8,
    LegalAction = 9,
    WriteOff = 10,
    AccountReview = 11,
    DisputeResolution = 12
}

public enum CollectionPriority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public enum ContactType
{
    PhoneCall = 1,
    Email = 2,
    Letter = 3,
    SMS = 4,
    InPerson = 5,
    Voicemail = 6,
    Other = 7
}

public enum CollectionActivityType
{
    Note = 1,
    StatusChange = 2,
    Assignment = 3,
    PromiseToPay = 4,
    PaymentReceived = 5,
    Escalation = 6,
    FollowUpScheduled = 7,
    DocumentAttached = 8
}
