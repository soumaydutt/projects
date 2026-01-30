using Excalibur.Application.Common.Interfaces;
using Excalibur.Domain.Entities;
using Excalibur.Infrastructure.Data.Interceptors;
using Microsoft.EntityFrameworkCore;

namespace Excalibur.Infrastructure.Data;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly AuditableEntityInterceptor _auditableEntityInterceptor;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        AuditableEntityInterceptor auditableEntityInterceptor)
        : base(options)
    {
        _auditableEntityInterceptor = auditableEntityInterceptor;
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Subscriber> Subscribers => Set<Subscriber>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<PricePlan> PricePlans => Set<PricePlan>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceLineItem> InvoiceLineItems => Set<InvoiceLineItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<PaymentAllocation> PaymentAllocations => Set<PaymentAllocation>();
    public DbSet<ArLedgerEntry> ArLedgerEntries => Set<ArLedgerEntry>();
    public DbSet<CollectionCase> CollectionCases => Set<CollectionCase>();
    public DbSet<CollectionCaseNote> CollectionCaseNotes => Set<CollectionCaseNote>();
    public DbSet<CollectionCaseActivity> CollectionCaseActivities => Set<CollectionCaseActivity>();
    public DbSet<CollectionAction> CollectionActions => Set<CollectionAction>();
    public DbSet<SwitchAction> SwitchActions => Set<SwitchAction>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<UsageRecord> UsageRecords => Set<UsageRecord>();
    public DbSet<AccountNote> AccountNotes => Set<AccountNote>();
    public DbSet<AccountAttachment> AccountAttachments => Set<AccountAttachment>();
    public DbSet<ServicePlanHistory> ServicePlanHistories => Set<ServicePlanHistory>();
    public DbSet<FormRule> FormRules => Set<FormRule>();

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.AddInterceptors(_auditableEntityInterceptor);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasDefaultSchema("excalibur");

        // Apply all configurations from assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        // Configure row version for optimistic concurrency using PostgreSQL xmin
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            var rowVersionProperty = entityType.FindProperty("RowVersion");
            if (rowVersionProperty != null)
            {
                modelBuilder.Entity(entityType.ClrType)
                    .Property("RowVersion")
                    .HasColumnName("xmin")
                    .HasColumnType("xid")
                    .ValueGeneratedOnAddOrUpdate()
                    .IsConcurrencyToken();
            }
        }

        // Global query filters for soft delete and multi-tenancy
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                var parameter = System.Linq.Expressions.Expression.Parameter(entityType.ClrType, "e");
                var property = System.Linq.Expressions.Expression.Property(parameter, "IsDeleted");
                var filter = System.Linq.Expressions.Expression.Lambda(
                    System.Linq.Expressions.Expression.Equal(property, System.Linq.Expressions.Expression.Constant(false)),
                    parameter);
                modelBuilder.Entity(entityType.ClrType).HasQueryFilter(filter);
            }
        }
    }
}
