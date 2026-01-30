using Excalibur.Domain.Enums;
using Excalibur.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Excalibur.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DashboardController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("kpis")]
    public async Task<IActionResult> GetKpis()
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1);

        var totalAr = await _context.Accounts.SumAsync(a => a.CurrentBalance);

        var overdueInvoices = await _context.Invoices
            .Where(i => i.Status == InvoiceStatus.Overdue)
            .SumAsync(i => i.BalanceDue);

        var collectionsCount = await _context.CollectionCases
            .Where(c => c.Status != CollectionCaseStatus.Closed)
            .CountAsync();

        var monthlyRevenue = await _context.Payments
            .Where(p => p.PaymentDate >= startOfMonth && p.Status == PaymentStatus.Completed)
            .SumAsync(p => p.Amount);

        var activeSubscribers = await _context.Subscribers
            .Where(s => s.Status == ServiceStatus.Active)
            .CountAsync();

        var activeServices = await _context.Services
            .Where(s => s.Status == ServiceStatus.Active)
            .CountAsync();

        return Ok(new DashboardKpisDto
        {
            TotalAr = totalAr,
            OverdueAr = overdueInvoices,
            CollectionsQueueCount = collectionsCount,
            MonthlyRevenue = monthlyRevenue,
            ActiveSubscribers = activeSubscribers,
            ActiveServices = activeServices
        });
    }

    [HttpGet("ar-aging")]
    public async Task<IActionResult> GetArAging()
    {
        var now = DateTime.UtcNow;

        var invoices = await _context.Invoices
            .Where(i => i.Status == InvoiceStatus.Issued || i.Status == InvoiceStatus.Overdue)
            .Select(i => new { i.DueDate, i.BalanceDue })
            .ToListAsync();

        var current = invoices.Where(i => i.DueDate >= now).Sum(i => i.BalanceDue);
        var days1To30 = invoices.Where(i => i.DueDate < now && i.DueDate >= now.AddDays(-30)).Sum(i => i.BalanceDue);
        var days31To60 = invoices.Where(i => i.DueDate < now.AddDays(-30) && i.DueDate >= now.AddDays(-60)).Sum(i => i.BalanceDue);
        var days61To90 = invoices.Where(i => i.DueDate < now.AddDays(-60) && i.DueDate >= now.AddDays(-90)).Sum(i => i.BalanceDue);
        var days90Plus = invoices.Where(i => i.DueDate < now.AddDays(-90)).Sum(i => i.BalanceDue);

        return Ok(new List<ArAgingDto>
        {
            new() { Bucket = "Current", Amount = current },
            new() { Bucket = "1-30 Days", Amount = days1To30 },
            new() { Bucket = "31-60 Days", Amount = days31To60 },
            new() { Bucket = "61-90 Days", Amount = days61To90 },
            new() { Bucket = "90+ Days", Amount = days90Plus }
        });
    }

    [HttpGet("payments-trend")]
    public async Task<IActionResult> GetPaymentsTrend()
    {
        var now = DateTime.UtcNow;
        var startDate = now.AddMonths(-6);

        var payments = await _context.Payments
            .Where(p => p.PaymentDate >= startDate && p.Status == PaymentStatus.Completed)
            .GroupBy(p => new { p.PaymentDate.Year, p.PaymentDate.Month })
            .Select(g => new PaymentTrendDto
            {
                Month = $"{g.Key.Year}-{g.Key.Month:D2}",
                Amount = g.Sum(p => p.Amount),
                Count = g.Count()
            })
            .OrderBy(x => x.Month)
            .ToListAsync();

        return Ok(payments);
    }

    [HttpGet("recent-activities")]
    public async Task<IActionResult> GetRecentActivities()
    {
        var activities = await _context.AuditLogs
            .OrderByDescending(a => a.Timestamp)
            .Take(20)
            .Select(a => new ActivityDto
            {
                Id = a.Id,
                ActionType = a.ActionType.ToString(),
                EntityType = a.EntityType,
                EntityName = a.EntityName,
                UserEmail = a.UserEmail,
                Timestamp = a.Timestamp
            })
            .ToListAsync();

        return Ok(activities);
    }
}

public class DashboardKpisDto
{
    public decimal TotalAr { get; set; }
    public decimal OverdueAr { get; set; }
    public int CollectionsQueueCount { get; set; }
    public decimal MonthlyRevenue { get; set; }
    public int ActiveSubscribers { get; set; }
    public int ActiveServices { get; set; }
}

public class ArAgingDto
{
    public string Bucket { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class PaymentTrendDto
{
    public string Month { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int Count { get; set; }
}

public class ActivityDto
{
    public Guid Id { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string? EntityName { get; set; }
    public string? UserEmail { get; set; }
    public DateTime Timestamp { get; set; }
}
