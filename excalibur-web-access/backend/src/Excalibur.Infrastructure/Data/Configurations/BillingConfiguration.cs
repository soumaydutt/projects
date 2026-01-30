using Excalibur.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Excalibur.Infrastructure.Data.Configurations;

public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.ToTable("invoices");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.InvoiceNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(i => i.InvoiceNumber)
            .IsUnique();

        builder.Property(i => i.SubTotal).HasPrecision(18, 2);
        builder.Property(i => i.TaxAmount).HasPrecision(18, 2);
        builder.Property(i => i.DiscountAmount).HasPrecision(18, 2);
        builder.Property(i => i.TotalAmount).HasPrecision(18, 2);
        builder.Property(i => i.PaidAmount).HasPrecision(18, 2);

        builder.HasOne(i => i.Account)
            .WithMany(a => a.Invoices)
            .HasForeignKey(i => i.AccountId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(i => i.AccountId);
        builder.HasIndex(i => i.Status);
        builder.HasIndex(i => i.DueDate);
        builder.HasIndex(i => i.IssueDate);
    }
}

public class InvoiceLineItemConfiguration : IEntityTypeConfiguration<InvoiceLineItem>
{
    public void Configure(EntityTypeBuilder<InvoiceLineItem> builder)
    {
        builder.ToTable("invoice_line_items");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Description)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(i => i.Quantity).HasPrecision(18, 4);
        builder.Property(i => i.UnitPrice).HasPrecision(18, 4);
        builder.Property(i => i.Amount).HasPrecision(18, 2);

        builder.HasOne(i => i.Invoice)
            .WithMany(inv => inv.LineItems)
            .HasForeignKey(i => i.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.Service)
            .WithMany()
            .HasForeignKey(i => i.ServiceId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(i => i.InvoiceId);
    }
}

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("payments");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.PaymentNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(p => p.PaymentNumber)
            .IsUnique();

        builder.Property(p => p.Amount).HasPrecision(18, 2);
        builder.Property(p => p.AllocatedAmount).HasPrecision(18, 2);

        builder.Property(p => p.TransactionReference).HasMaxLength(100);
        builder.Property(p => p.CardLastFour).HasMaxLength(4);

        builder.HasOne(p => p.Account)
            .WithMany(a => a.Payments)
            .HasForeignKey(p => p.AccountId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(p => p.AccountId);
        builder.HasIndex(p => p.Status);
        builder.HasIndex(p => p.PaymentDate);
    }
}

public class PaymentAllocationConfiguration : IEntityTypeConfiguration<PaymentAllocation>
{
    public void Configure(EntityTypeBuilder<PaymentAllocation> builder)
    {
        builder.ToTable("payment_allocations");

        builder.HasKey(pa => pa.Id);

        builder.Property(pa => pa.Amount).HasPrecision(18, 2);

        builder.HasOne(pa => pa.Payment)
            .WithMany(p => p.Allocations)
            .HasForeignKey(pa => pa.PaymentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pa => pa.Invoice)
            .WithMany(i => i.PaymentAllocations)
            .HasForeignKey(pa => pa.InvoiceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(pa => pa.PaymentId);
        builder.HasIndex(pa => pa.InvoiceId);
    }
}

public class ArLedgerEntryConfiguration : IEntityTypeConfiguration<ArLedgerEntry>
{
    public void Configure(EntityTypeBuilder<ArLedgerEntry> builder)
    {
        builder.ToTable("ar_ledger_entries");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Amount).HasPrecision(18, 2);
        builder.Property(e => e.RunningBalance).HasPrecision(18, 2);
        builder.Property(e => e.Description).HasMaxLength(500);

        builder.HasOne(e => e.Account)
            .WithMany(a => a.ArLedger)
            .HasForeignKey(e => e.AccountId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Invoice)
            .WithMany()
            .HasForeignKey(e => e.InvoiceId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Payment)
            .WithMany()
            .HasForeignKey(e => e.PaymentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(e => e.AccountId);
        builder.HasIndex(e => e.TransactionDate);
    }
}
