using Excalibur.Domain.Entities;
using Excalibur.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Excalibur.Infrastructure.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        if (await context.Users.AnyAsync()) return;

        // Seed Users
        var users = new List<User>
        {
            new()
            {
                Email = "admin@excalibur.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                FirstName = "System",
                LastName = "Administrator",
                Role = UserRole.Admin,
                IsActive = true
            },
            new()
            {
                Email = "billing@excalibur.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Billing123!"),
                FirstName = "Billing",
                LastName = "Agent",
                Role = UserRole.BillingAgent,
                IsActive = true
            },
            new()
            {
                Email = "care@excalibur.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Care123!"),
                FirstName = "Care",
                LastName = "Agent",
                Role = UserRole.CareAgent,
                IsActive = true
            },
            new()
            {
                Email = "collector@excalibur.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Collector123!"),
                FirstName = "Collections",
                LastName = "Agent",
                Role = UserRole.Collector,
                IsActive = true
            },
            new()
            {
                Email = "auditor@excalibur.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Auditor123!"),
                FirstName = "Audit",
                LastName = "User",
                Role = UserRole.ReadOnlyAuditor,
                IsActive = true
            }
        };
        context.Users.AddRange(users);

        // Seed Price Plans
        var pricePlans = new List<PricePlan>
        {
            new()
            {
                PlanCode = "MOB-BASIC-30",
                Name = "Mobile Basic 30",
                Description = "Basic mobile plan with 30GB data",
                ServiceType = ServiceType.Mobile,
                BaseMonthlyFee = 29.99m,
                TaxPercentage = 8.25m,
                IncludedMinutes = 500,
                IncludedSms = 500,
                IncludedDataGb = 30,
                IsActive = true
            },
            new()
            {
                PlanCode = "MOB-UNLIMITED",
                Name = "Mobile Unlimited",
                Description = "Unlimited mobile plan",
                ServiceType = ServiceType.Mobile,
                BaseMonthlyFee = 79.99m,
                TaxPercentage = 8.25m,
                DiscountPercentage = 10,
                IsActive = true
            },
            new()
            {
                PlanCode = "BB-100",
                Name = "Broadband 100Mbps",
                Description = "100Mbps fiber broadband",
                ServiceType = ServiceType.Broadband,
                BaseMonthlyFee = 49.99m,
                TaxPercentage = 8.25m,
                DownloadSpeedMbps = 100,
                UploadSpeedMbps = 20,
                IsActive = true
            },
            new()
            {
                PlanCode = "BB-500",
                Name = "Broadband 500Mbps",
                Description = "500Mbps fiber broadband",
                ServiceType = ServiceType.Broadband,
                BaseMonthlyFee = 79.99m,
                TaxPercentage = 8.25m,
                DownloadSpeedMbps = 500,
                UploadSpeedMbps = 100,
                IsActive = true
            },
            new()
            {
                PlanCode = "IPTV-BASIC",
                Name = "IPTV Basic",
                Description = "Basic TV package",
                ServiceType = ServiceType.IPTV,
                BaseMonthlyFee = 24.99m,
                TaxPercentage = 8.25m,
                IsActive = true
            }
        };
        context.PricePlans.AddRange(pricePlans);
        await context.SaveChangesAsync();

        // Seed sample accounts
        var random = new Random(42);
        var accounts = new List<Account>();
        var names = new[] { "John Smith", "Jane Doe", "Robert Johnson", "Emily Davis", "Michael Wilson" };
        var companies = new[] { "Acme Corp", "TechStart Inc", "Global Solutions", "Prime Services", "Digital Dynamics" };

        for (int i = 1; i <= 50; i++)
        {
            var isBusinessAccount = i % 5 == 0;
            var account = new Account
            {
                AccountNumber = $"ACC{i:D6}",
                Name = isBusinessAccount ? companies[i % companies.Length] : names[i % names.Length],
                AccountType = isBusinessAccount ? AccountType.Business : AccountType.Individual,
                Status = AccountStatus.Active,
                PrimaryEmail = $"customer{i}@example.com",
                PrimaryPhone = $"555-{random.Next(100, 999)}-{random.Next(1000, 9999)}",
                AddressLine1 = $"{random.Next(100, 9999)} Main Street",
                City = "New York",
                State = "NY",
                PostalCode = $"{random.Next(10000, 99999)}",
                Country = "US",
                CreditLimit = isBusinessAccount ? 10000m : 1000m,
                BillingDay = random.Next(1, 28),
                KycVerified = true,
                KycVerifiedAt = DateTime.UtcNow.AddDays(-random.Next(30, 365))
            };

            if (isBusinessAccount)
            {
                account.CompanyName = companies[i % companies.Length];
                account.TaxId = $"XX-{random.Next(1000000, 9999999)}";
            }

            accounts.Add(account);
        }
        context.Accounts.AddRange(accounts);
        await context.SaveChangesAsync();

        // Seed subscribers and services
        foreach (var account in accounts.Take(30))
        {
            var subscriberCount = random.Next(1, 4);
            for (int s = 0; s < subscriberCount; s++)
            {
                var subscriber = new Subscriber
                {
                    SubscriberNumber = $"SUB{account.AccountNumber.Replace("ACC", "")}-{s + 1:D2}",
                    AccountId = account.Id,
                    Name = $"Subscriber {s + 1}",
                    Email = $"sub{s + 1}_{account.PrimaryEmail}",
                    Status = ServiceStatus.Active,
                    ActivatedAt = DateTime.UtcNow.AddDays(-random.Next(30, 365))
                };
                context.Subscribers.Add(subscriber);
                await context.SaveChangesAsync();

                // Add services
                var serviceCount = random.Next(1, 3);
                for (int sv = 0; sv < serviceCount; sv++)
                {
                    var plan = pricePlans[random.Next(pricePlans.Count)];
                    var service = new Service
                    {
                        ServiceNumber = $"SVC{subscriber.SubscriberNumber.Replace("SUB", "")}-{sv + 1:D2}",
                        SubscriberId = subscriber.Id,
                        PricePlanId = plan.Id,
                        ServiceType = plan.ServiceType,
                        Status = ServiceStatus.Active,
                        ActivatedAt = subscriber.ActivatedAt,
                        PlanEffectiveDate = subscriber.ActivatedAt ?? DateTime.UtcNow
                    };

                    if (plan.ServiceType == ServiceType.Mobile)
                    {
                        service.PhoneNumber = $"555-{random.Next(100, 999)}-{random.Next(1000, 9999)}";
                    }

                    context.Services.Add(service);
                }
            }
        }
        await context.SaveChangesAsync();

        // Seed invoices for some accounts
        var invoicedAccounts = accounts.Take(20).ToList();
        foreach (var account in invoicedAccounts)
        {
            for (int m = 0; m < 3; m++)
            {
                var billingStart = DateTime.UtcNow.AddMonths(-m - 1);
                var billingEnd = DateTime.UtcNow.AddMonths(-m);
                var dueDate = billingEnd.AddDays(15);
                var invoiceAmount = random.Next(50, 300);

                var invoice = new Invoice
                {
                    InvoiceNumber = $"INV{account.AccountNumber.Replace("ACC", "")}-{DateTime.UtcNow.AddMonths(-m):yyyyMM}",
                    AccountId = account.Id,
                    Status = m == 0 ? InvoiceStatus.Issued :
                             (random.Next(100) < 70 ? InvoiceStatus.Paid : InvoiceStatus.Overdue),
                    BillingPeriodStart = billingStart,
                    BillingPeriodEnd = billingEnd,
                    IssueDate = billingEnd,
                    DueDate = dueDate,
                    SubTotal = invoiceAmount,
                    TaxAmount = Math.Round(invoiceAmount * 0.0825m, 2),
                    TotalAmount = Math.Round(invoiceAmount * 1.0825m, 2)
                };

                invoice.PaidAmount = invoice.Status == InvoiceStatus.Paid ? invoice.TotalAmount : 0;

                context.Invoices.Add(invoice);

                // Add to AR ledger
                var arEntry = new ArLedgerEntry
                {
                    AccountId = account.Id,
                    EntryType = LedgerEntryType.InvoiceDebit,
                    Amount = invoice.TotalAmount,
                    TransactionDate = invoice.IssueDate,
                    Description = $"Invoice {invoice.InvoiceNumber}"
                };
                context.ArLedgerEntries.Add(arEntry);

                // Add payment if paid
                if (invoice.Status == InvoiceStatus.Paid)
                {
                    var payment = new Payment
                    {
                        PaymentNumber = $"PAY{invoice.InvoiceNumber.Replace("INV", "")}",
                        AccountId = account.Id,
                        Amount = invoice.TotalAmount,
                        PaymentMethod = (PaymentMethod)random.Next(1, 5),
                        Status = PaymentStatus.Completed,
                        PaymentDate = dueDate.AddDays(-random.Next(1, 10)),
                        ProcessedAt = dueDate.AddDays(-random.Next(1, 10)),
                        AllocatedAmount = invoice.TotalAmount
                    };
                    context.Payments.Add(payment);
                }
            }

            // Update account balance
            var accountInvoices = context.Invoices.Local.Where(i => i.AccountId == account.Id);
            account.CurrentBalance = accountInvoices.Sum(i => i.TotalAmount - i.PaidAmount);
        }

        await context.SaveChangesAsync();

        // Seed collection cases for overdue accounts
        var overdueAccounts = accounts.Where(a => a.CurrentBalance > 100).Take(10).ToList();
        var collector = users.First(u => u.Role == UserRole.Collector);

        foreach (var account in overdueAccounts)
        {
            var collectionCase = new CollectionCase
            {
                CaseNumber = $"COL{account.AccountNumber.Replace("ACC", "")}",
                AccountId = account.Id,
                AssignedToId = collector.Id,
                Status = (CollectionCaseStatus)random.Next(1, 4),
                AgingBucket = account.CurrentBalance > 500 ? AgingBucket.Days90Plus : AgingBucket.Days31To60,
                TotalOverdueAmount = account.CurrentBalance,
                OpenedAt = DateTime.UtcNow.AddDays(-random.Next(10, 60)),
                Priority = account.CurrentBalance > 500 ? CollectionPriority.High : CollectionPriority.Medium,
                NextFollowUpAt = DateTime.UtcNow.AddDays(random.Next(1, 7))
            };
            context.CollectionCases.Add(collectionCase);
        }

        await context.SaveChangesAsync();
    }
}
