using Excalibur.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Excalibur.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Account> Accounts { get; }
    DbSet<Subscriber> Subscribers { get; }
    DbSet<Service> Services { get; }
    DbSet<PricePlan> PricePlans { get; }
    DbSet<Invoice> Invoices { get; }
    DbSet<InvoiceLineItem> InvoiceLineItems { get; }
    DbSet<Payment> Payments { get; }
    DbSet<PaymentAllocation> PaymentAllocations { get; }
    DbSet<ArLedgerEntry> ArLedgerEntries { get; }
    DbSet<CollectionCase> CollectionCases { get; }
    DbSet<CollectionCaseNote> CollectionCaseNotes { get; }
    DbSet<CollectionCaseActivity> CollectionCaseActivities { get; }
    DbSet<CollectionAction> CollectionActions { get; }
    DbSet<SwitchAction> SwitchActions { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<UsageRecord> UsageRecords { get; }
    DbSet<AccountNote> AccountNotes { get; }
    DbSet<AccountAttachment> AccountAttachments { get; }
    DbSet<ServicePlanHistory> ServicePlanHistories { get; }
    DbSet<FormRule> FormRules { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
