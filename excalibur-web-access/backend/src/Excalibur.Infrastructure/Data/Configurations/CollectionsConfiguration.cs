using Excalibur.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Excalibur.Infrastructure.Data.Configurations;

public class CollectionCaseConfiguration : IEntityTypeConfiguration<CollectionCase>
{
    public void Configure(EntityTypeBuilder<CollectionCase> builder)
    {
        builder.ToTable("collection_cases");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.CaseNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(c => c.CaseNumber)
            .IsUnique();

        builder.Property(c => c.TotalOverdueAmount).HasPrecision(18, 2);
        builder.Property(c => c.PromiseToPayAmount).HasPrecision(18, 2);

        builder.HasOne(c => c.Account)
            .WithMany(a => a.CollectionCases)
            .HasForeignKey(c => c.AccountId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.AssignedTo)
            .WithMany(u => u.AssignedCases)
            .HasForeignKey(c => c.AssignedToId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(c => c.AccountId);
        builder.HasIndex(c => c.Status);
        builder.HasIndex(c => c.AssignedToId);
        builder.HasIndex(c => c.AgingBucket);
        builder.HasIndex(c => c.NextFollowUpAt);
    }
}

public class CollectionCaseNoteConfiguration : IEntityTypeConfiguration<CollectionCaseNote>
{
    public void Configure(EntityTypeBuilder<CollectionCaseNote> builder)
    {
        builder.ToTable("collection_case_notes");

        builder.HasKey(n => n.Id);

        builder.Property(n => n.Note)
            .IsRequired()
            .HasMaxLength(4000);

        builder.HasOne(n => n.CollectionCase)
            .WithMany(c => c.CaseNotes)
            .HasForeignKey(n => n.CollectionCaseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(n => n.CollectionCaseId);
    }
}

public class CollectionCaseActivityConfiguration : IEntityTypeConfiguration<CollectionCaseActivity>
{
    public void Configure(EntityTypeBuilder<CollectionCaseActivity> builder)
    {
        builder.ToTable("collection_case_activities");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.ActivityType)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(a => a.Description)
            .HasMaxLength(1000);

        builder.HasOne(a => a.CollectionCase)
            .WithMany(c => c.Activities)
            .HasForeignKey(a => a.CollectionCaseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(a => a.CollectionCaseId);
    }
}

public class SwitchActionConfiguration : IEntityTypeConfiguration<SwitchAction>
{
    public void Configure(EntityTypeBuilder<SwitchAction> builder)
    {
        builder.ToTable("switch_actions");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.ActionNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(s => s.ActionNumber)
            .IsUnique();

        builder.HasOne(s => s.Service)
            .WithMany(svc => svc.SwitchActions)
            .HasForeignKey(s => s.ServiceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.FromPricePlan)
            .WithMany()
            .HasForeignKey(s => s.FromPricePlanId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(s => s.ToPricePlan)
            .WithMany()
            .HasForeignKey(s => s.ToPricePlanId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(s => s.ServiceId);
        builder.HasIndex(s => s.Status);
        builder.HasIndex(s => s.RequestedAt);
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("audit_logs");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.EntityType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.IpAddress).HasMaxLength(50);
        builder.Property(a => a.CorrelationId).HasMaxLength(50);

        builder.HasOne(a => a.User)
            .WithMany(u => u.AuditLogs)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(a => a.UserId);
        builder.HasIndex(a => a.EntityType);
        builder.HasIndex(a => a.EntityId);
        builder.HasIndex(a => a.Timestamp);
        builder.HasIndex(a => a.CorrelationId);
        builder.HasIndex(a => a.ActionType);
    }
}
