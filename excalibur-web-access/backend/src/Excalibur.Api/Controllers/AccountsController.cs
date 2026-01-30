using Excalibur.Application.Common.Interfaces;
using Excalibur.Application.Common.Models;
using Excalibur.Domain.Entities;
using Excalibur.Domain.Enums;
using Excalibur.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Excalibur.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AccountsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public AccountsController(ApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAccounts([FromQuery] AccountFilterRequest filter)
    {
        var query = _context.Accounts.AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(a =>
                a.AccountNumber.ToLower().Contains(search) ||
                a.Name.ToLower().Contains(search) ||
                a.PrimaryEmail.ToLower().Contains(search) ||
                a.PrimaryPhone.Contains(search));
        }

        if (filter.Status.HasValue)
            query = query.Where(a => a.Status == filter.Status.Value);

        if (filter.AccountType.HasValue)
            query = query.Where(a => a.AccountType == filter.AccountType.Value);

        if (filter.MinBalance.HasValue)
            query = query.Where(a => a.CurrentBalance >= filter.MinBalance.Value);

        if (filter.MaxBalance.HasValue)
            query = query.Where(a => a.CurrentBalance <= filter.MaxBalance.Value);

        // Apply sorting
        query = filter.SortBy?.ToLower() switch
        {
            "name" => filter.SortDescending ? query.OrderByDescending(a => a.Name) : query.OrderBy(a => a.Name),
            "balance" => filter.SortDescending ? query.OrderByDescending(a => a.CurrentBalance) : query.OrderBy(a => a.CurrentBalance),
            "createdat" => filter.SortDescending ? query.OrderByDescending(a => a.CreatedAt) : query.OrderBy(a => a.CreatedAt),
            _ => query.OrderByDescending(a => a.CreatedAt)
        };

        var result = await PaginatedList<AccountDto>.CreateAsync(
            query.Select(a => new AccountDto
            {
                Id = a.Id,
                AccountNumber = a.AccountNumber,
                Name = a.Name,
                AccountType = a.AccountType.ToString(),
                Status = a.Status.ToString(),
                PrimaryEmail = a.PrimaryEmail,
                PrimaryPhone = a.PrimaryPhone,
                CurrentBalance = a.CurrentBalance,
                CreditLimit = a.CreditLimit,
                City = a.City,
                State = a.State,
                SubscriberCount = a.Subscribers.Count,
                CreatedAt = a.CreatedAt
            }),
            filter.Page,
            filter.PageSize);

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAccount(Guid id)
    {
        var account = await _context.Accounts
            .Include(a => a.Subscribers)
                .ThenInclude(s => s.Services)
                    .ThenInclude(svc => svc.PricePlan)
            .Include(a => a.Notes.OrderByDescending(n => n.CreatedAt).Take(10))
            .FirstOrDefaultAsync(a => a.Id == id);

        if (account == null)
            return NotFound();

        return Ok(MapToDetailDto(account));
    }

    [HttpGet("{id}/360")]
    public async Task<IActionResult> GetAccount360(Guid id)
    {
        var account = await _context.Accounts
            .Include(a => a.Subscribers)
                .ThenInclude(s => s.Services)
                    .ThenInclude(svc => svc.PricePlan)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (account == null)
            return NotFound();

        var invoices = await _context.Invoices
            .Where(i => i.AccountId == id)
            .OrderByDescending(i => i.IssueDate)
            .Take(10)
            .ToListAsync();

        var payments = await _context.Payments
            .Where(p => p.AccountId == id)
            .OrderByDescending(p => p.PaymentDate)
            .Take(10)
            .ToListAsync();

        var collectionCases = await _context.CollectionCases
            .Where(c => c.AccountId == id && c.Status != CollectionCaseStatus.Closed)
            .ToListAsync();

        return Ok(new Account360Dto
        {
            Account = MapToDetailDto(account),
            Summary = new AccountSummaryDto
            {
                TotalBalance = account.CurrentBalance,
                TotalServices = account.Subscribers.SelectMany(s => s.Services).Count(),
                ActiveServices = account.Subscribers.SelectMany(s => s.Services).Count(svc => svc.Status == ServiceStatus.Active),
                OpenInvoices = invoices.Count(i => i.Status != InvoiceStatus.Paid && i.Status != InvoiceStatus.Cancelled),
                LastPaymentDate = payments.FirstOrDefault()?.PaymentDate,
                LastPaymentAmount = payments.FirstOrDefault()?.Amount,
                OpenCollectionCases = collectionCases.Count
            },
            RecentInvoices = invoices.Select(i => new InvoiceSummaryDto
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                Status = i.Status.ToString(),
                TotalAmount = i.TotalAmount,
                BalanceDue = i.BalanceDue,
                IssueDate = i.IssueDate,
                DueDate = i.DueDate
            }).ToList(),
            RecentPayments = payments.Select(p => new PaymentSummaryDto
            {
                Id = p.Id,
                PaymentNumber = p.PaymentNumber,
                Amount = p.Amount,
                Status = p.Status.ToString(),
                PaymentMethod = p.PaymentMethod.ToString(),
                PaymentDate = p.PaymentDate
            }).ToList()
        });
    }

    [HttpPost]
    [Authorize(Policy = "CareAccess")]
    public async Task<IActionResult> CreateAccount([FromBody] CreateAccountRequest request)
    {
        var accountNumber = await GenerateAccountNumber();

        var account = new Account
        {
            AccountNumber = accountNumber,
            Name = request.Name,
            AccountType = request.AccountType,
            Status = AccountStatus.PendingActivation,
            PrimaryEmail = request.PrimaryEmail,
            PrimaryPhone = request.PrimaryPhone,
            SecondaryEmail = request.SecondaryEmail,
            SecondaryPhone = request.SecondaryPhone,
            AddressLine1 = request.AddressLine1,
            AddressLine2 = request.AddressLine2,
            City = request.City,
            State = request.State,
            PostalCode = request.PostalCode,
            Country = request.Country,
            CompanyName = request.CompanyName,
            TaxId = request.TaxId,
            CreditLimit = request.CreditLimit,
            BillingDay = request.BillingDay
        };

        _context.Accounts.Add(account);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            AuditActionType.Create,
            "Account",
            account.Id,
            account.AccountNumber,
            newValues: account);

        return CreatedAtAction(nameof(GetAccount), new { id = account.Id }, MapToDetailDto(account));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "CareAccess")]
    public async Task<IActionResult> UpdateAccount(Guid id, [FromBody] UpdateAccountRequest request)
    {
        var account = await _context.Accounts.FindAsync(id);
        if (account == null)
            return NotFound();

        var oldValues = new { account.Name, account.Status, account.CreditLimit };

        account.Name = request.Name ?? account.Name;
        account.PrimaryEmail = request.PrimaryEmail ?? account.PrimaryEmail;
        account.PrimaryPhone = request.PrimaryPhone ?? account.PrimaryPhone;
        account.AddressLine1 = request.AddressLine1 ?? account.AddressLine1;
        account.City = request.City ?? account.City;
        account.State = request.State ?? account.State;
        account.PostalCode = request.PostalCode ?? account.PostalCode;

        if (request.Status.HasValue)
            account.Status = request.Status.Value;

        if (request.CreditLimit.HasValue)
            account.CreditLimit = request.CreditLimit.Value;

        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            AuditActionType.Update,
            "Account",
            account.Id,
            account.AccountNumber,
            oldValues,
            new { account.Name, account.Status, account.CreditLimit });

        return Ok(MapToDetailDto(account));
    }

    [HttpPost("{id}/notes")]
    [Authorize(Policy = "CareAccess")]
    public async Task<IActionResult> AddNote(Guid id, [FromBody] AddNoteRequest request)
    {
        var account = await _context.Accounts.FindAsync(id);
        if (account == null)
            return NotFound();

        var note = new AccountNote
        {
            AccountId = id,
            Note = request.Note,
            Category = request.Category ?? "General",
            IsImportant = request.IsImportant
        };

        _context.AccountNotes.Add(note);
        await _context.SaveChangesAsync();

        return Ok(note);
    }

    private async Task<string> GenerateAccountNumber()
    {
        var lastAccount = await _context.Accounts
            .OrderByDescending(a => a.AccountNumber)
            .FirstOrDefaultAsync();

        if (lastAccount == null)
            return "ACC000001";

        var lastNumber = int.Parse(lastAccount.AccountNumber.Replace("ACC", ""));
        return $"ACC{lastNumber + 1:D6}";
    }

    private static AccountDetailDto MapToDetailDto(Account account) => new()
    {
        Id = account.Id,
        AccountNumber = account.AccountNumber,
        Name = account.Name,
        AccountType = account.AccountType.ToString(),
        Status = account.Status.ToString(),
        PrimaryEmail = account.PrimaryEmail,
        PrimaryPhone = account.PrimaryPhone,
        SecondaryEmail = account.SecondaryEmail,
        SecondaryPhone = account.SecondaryPhone,
        AddressLine1 = account.AddressLine1,
        AddressLine2 = account.AddressLine2,
        City = account.City,
        State = account.State,
        PostalCode = account.PostalCode,
        Country = account.Country,
        CompanyName = account.CompanyName,
        CurrentBalance = account.CurrentBalance,
        CreditLimit = account.CreditLimit,
        BillingDay = account.BillingDay,
        KycVerified = account.KycVerified,
        CreatedAt = account.CreatedAt,
        Subscribers = account.Subscribers.Select(s => new SubscriberDto
        {
            Id = s.Id,
            SubscriberNumber = s.SubscriberNumber,
            Name = s.Name,
            Status = s.Status.ToString(),
            Services = s.Services.Select(svc => new ServiceDto
            {
                Id = svc.Id,
                ServiceNumber = svc.ServiceNumber,
                ServiceType = svc.ServiceType.ToString(),
                Status = svc.Status.ToString(),
                PhoneNumber = svc.PhoneNumber,
                PlanName = svc.PricePlan?.Name
            }).ToList()
        }).ToList()
    };
}

// DTOs
public class AccountFilterRequest : PaginatedRequest
{
    public AccountStatus? Status { get; set; }
    public AccountType? AccountType { get; set; }
    public decimal? MinBalance { get; set; }
    public decimal? MaxBalance { get; set; }
}

public class AccountDto
{
    public Guid Id { get; set; }
    public string AccountNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string AccountType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string PrimaryEmail { get; set; } = string.Empty;
    public string PrimaryPhone { get; set; } = string.Empty;
    public decimal CurrentBalance { get; set; }
    public decimal CreditLimit { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public int SubscriberCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AccountDetailDto : AccountDto
{
    public string? SecondaryEmail { get; set; }
    public string? SecondaryPhone { get; set; }
    public string AddressLine1 { get; set; } = string.Empty;
    public string? AddressLine2 { get; set; }
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public int BillingDay { get; set; }
    public bool KycVerified { get; set; }
    public List<SubscriberDto> Subscribers { get; set; } = new();
}

public class SubscriberDto
{
    public Guid Id { get; set; }
    public string SubscriberNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public List<ServiceDto> Services { get; set; } = new();
}

public class ServiceDto
{
    public Guid Id { get; set; }
    public string ServiceNumber { get; set; } = string.Empty;
    public string ServiceType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? PlanName { get; set; }
}

public class Account360Dto
{
    public AccountDetailDto Account { get; set; } = null!;
    public AccountSummaryDto Summary { get; set; } = null!;
    public List<InvoiceSummaryDto> RecentInvoices { get; set; } = new();
    public List<PaymentSummaryDto> RecentPayments { get; set; } = new();
}

public class AccountSummaryDto
{
    public decimal TotalBalance { get; set; }
    public int TotalServices { get; set; }
    public int ActiveServices { get; set; }
    public int OpenInvoices { get; set; }
    public DateTime? LastPaymentDate { get; set; }
    public decimal? LastPaymentAmount { get; set; }
    public int OpenCollectionCases { get; set; }
}

public class InvoiceSummaryDto
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal BalanceDue { get; set; }
    public DateTime IssueDate { get; set; }
    public DateTime DueDate { get; set; }
}

public class PaymentSummaryDto
{
    public Guid Id { get; set; }
    public string PaymentNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
}

public record CreateAccountRequest(
    string Name,
    AccountType AccountType,
    string PrimaryEmail,
    string PrimaryPhone,
    string? SecondaryEmail,
    string? SecondaryPhone,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string PostalCode,
    string Country,
    string? CompanyName,
    string? TaxId,
    decimal CreditLimit,
    int BillingDay);

public record UpdateAccountRequest(
    string? Name,
    string? PrimaryEmail,
    string? PrimaryPhone,
    string? AddressLine1,
    string? City,
    string? State,
    string? PostalCode,
    AccountStatus? Status,
    decimal? CreditLimit);

public record AddNoteRequest(string Note, string? Category, bool IsImportant);
