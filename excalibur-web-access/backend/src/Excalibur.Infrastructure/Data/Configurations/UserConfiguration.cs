using Excalibur.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Excalibur.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(256);

        builder.HasIndex(u => u.Email)
            .IsUnique();

        builder.Property(u => u.PasswordHash)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(u => u.FirstName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.LastName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.Role)
            .IsRequired();

        builder.Property(u => u.RefreshToken)
            .HasMaxLength(256);

        builder.HasIndex(u => u.TenantId);
    }
}

public class AccountConfiguration : IEntityTypeConfiguration<Account>
{
    public void Configure(EntityTypeBuilder<Account> builder)
    {
        builder.ToTable("accounts");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.AccountNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(a => a.AccountNumber)
            .IsUnique();

        builder.Property(a => a.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(a => a.PrimaryEmail)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(a => a.PrimaryPhone)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(a => a.CreditLimit)
            .HasPrecision(18, 2);

        builder.Property(a => a.CurrentBalance)
            .HasPrecision(18, 2);

        builder.HasIndex(a => a.PrimaryEmail);
        builder.HasIndex(a => a.PrimaryPhone);
        builder.HasIndex(a => a.Status);
        builder.HasIndex(a => a.TenantId);

        // Full text search index
        builder.HasIndex(a => new { a.Name, a.PrimaryEmail, a.AccountNumber });
    }
}

public class SubscriberConfiguration : IEntityTypeConfiguration<Subscriber>
{
    public void Configure(EntityTypeBuilder<Subscriber> builder)
    {
        builder.ToTable("subscribers");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.SubscriberNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(s => s.SubscriberNumber)
            .IsUnique();

        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.HasOne(s => s.Account)
            .WithMany(a => a.Subscribers)
            .HasForeignKey(s => s.AccountId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(s => s.AccountId);
        builder.HasIndex(s => s.Status);
    }
}

public class ServiceConfiguration : IEntityTypeConfiguration<Service>
{
    public void Configure(EntityTypeBuilder<Service> builder)
    {
        builder.ToTable("services");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.ServiceNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(s => s.ServiceNumber)
            .IsUnique();

        builder.Property(s => s.PhoneNumber)
            .HasMaxLength(20);

        builder.HasIndex(s => s.PhoneNumber);

        builder.HasOne(s => s.Subscriber)
            .WithMany(sub => sub.Services)
            .HasForeignKey(s => s.SubscriberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.PricePlan)
            .WithMany(p => p.Services)
            .HasForeignKey(s => s.PricePlanId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(s => s.SubscriberId);
        builder.HasIndex(s => s.Status);
    }
}

public class PricePlanConfiguration : IEntityTypeConfiguration<PricePlan>
{
    public void Configure(EntityTypeBuilder<PricePlan> builder)
    {
        builder.ToTable("price_plans");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.PlanCode)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(p => p.PlanCode)
            .IsUnique();

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.BaseMonthlyFee)
            .HasPrecision(18, 2);

        builder.Property(p => p.DiscountPercentage)
            .HasPrecision(5, 2);

        builder.Property(p => p.DiscountFixedAmount)
            .HasPrecision(18, 2);

        builder.Property(p => p.TaxPercentage)
            .HasPrecision(5, 2);

        builder.Property(p => p.EarlyTerminationFee)
            .HasPrecision(18, 2);

        builder.Property(p => p.IncludedDataGb)
            .HasPrecision(10, 2);

        builder.HasIndex(p => p.IsActive);
        builder.HasIndex(p => p.ServiceType);
    }
}
