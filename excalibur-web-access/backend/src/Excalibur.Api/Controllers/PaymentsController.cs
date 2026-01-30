using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Excalibur.Application.Common.Interfaces;
using Excalibur.Domain.Entities;
using Excalibur.Domain.Enums;

namespace Excalibur.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public PaymentsController(IApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? method,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _context.Payments
            .Include(p => p.Account)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(p =>
                p.Account.Name.Contains(search) ||
                p.Account.AccountNumber.Contains(search) ||
                (p.TransactionReference != null && p.TransactionReference.Contains(search)));
        }

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<PaymentStatus>(status, out var paymentStatus))
        {
            query = query.Where(p => p.Status == paymentStatus);
        }

        if (!string.IsNullOrEmpty(method) && Enum.TryParse<PaymentMethod>(method, out var paymentMethod))
        {
            query = query.Where(p => p.PaymentMethod == paymentMethod);
        }

        if (dateFrom.HasValue)
        {
            query = query.Where(p => p.PaymentDate >= dateFrom.Value);
        }

        if (dateTo.HasValue)
        {
            query = query.Where(p => p.PaymentDate <= dateTo.Value);
        }

        var total = await query.CountAsync();

        var payments = await query
            .OrderByDescending(p => p.PaymentDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new
            {
                p.Id,
                AccountName = p.Account.Name,
                AccountNumber = p.Account.AccountNumber,
                p.PaymentDate,
                p.Amount,
                Method = p.PaymentMethod.ToString(),
                p.TransactionReference,
                Status = p.Status.ToString()
            })
            .ToListAsync();

        return Ok(new { items = payments, total });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var payment = await _context.Payments
            .Include(p => p.Account)
            .Include(p => p.Allocations)
                .ThenInclude(a => a.Invoice)
            .Where(p => p.Id == id)
            .Select(p => new
            {
                p.Id,
                Account = new
                {
                    p.Account.Id,
                    p.Account.AccountNumber,
                    p.Account.Name
                },
                p.PaymentDate,
                p.Amount,
                Method = p.PaymentMethod.ToString(),
                p.TransactionReference,
                p.CheckNumber,
                p.CardLastFour,
                Status = p.Status.ToString(),
                p.Notes,
                Allocations = p.Allocations.Select(a => new
                {
                    a.Id,
                    InvoiceNumber = a.Invoice.InvoiceNumber,
                    a.Amount,
                    a.AllocationDate
                }),
                p.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (payment == null)
            return NotFound();

        return Ok(payment);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,BillingAgent,CareAgent")]
    public async Task<IActionResult> Create([FromBody] CreatePaymentRequest request)
    {
        var account = await _context.Accounts.FindAsync(request.AccountId);
        if (account == null)
            return BadRequest("Account not found");

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            AccountId = request.AccountId,
            Amount = request.Amount,
            PaymentNumber = $"PMT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}",
            PaymentMethod = Enum.Parse<PaymentMethod>(request.Method),
            PaymentDate = request.PaymentDate ?? DateTime.UtcNow,
            TransactionReference = request.Reference,
            CheckNumber = request.CheckNumber,
            CardLastFour = request.CardLastFour,
            Notes = request.Notes,
            Status = PaymentStatus.Completed,
            CreatedAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);

        // Auto-allocate to oldest unpaid invoices if requested
        if (request.AutoAllocate)
        {
            var unpaidInvoices = await _context.Invoices
                .Where(i => i.AccountId == request.AccountId && i.Balance > 0)
                .OrderBy(i => i.DueDate)
                .ToListAsync();

            var remainingAmount = request.Amount;
            foreach (var invoice in unpaidInvoices)
            {
                if (remainingAmount <= 0) break;

                var allocationAmount = Math.Min(remainingAmount, invoice.Balance);

                var allocation = new PaymentAllocation
                {
                    Id = Guid.NewGuid(),
                    PaymentId = payment.Id,
                    InvoiceId = invoice.Id,
                    Amount = allocationAmount,
                    AllocationDate = DateTime.UtcNow
                };

                _context.PaymentAllocations.Add(allocation);

                invoice.AmountPaid += allocationAmount;
                invoice.Balance -= allocationAmount;
                if (invoice.Balance <= 0)
                {
                    invoice.Status = InvoiceStatus.Paid;
                }
                else
                {
                    invoice.Status = InvoiceStatus.PartiallyPaid;
                }

                remainingAmount -= allocationAmount;
            }
        }

        // Update account balance
        account.Balance -= request.Amount;

        await _context.SaveChangesAsync(default);

        await _auditService.LogAsync(AuditActionType.Create, "Payment", payment.Id,
            additionalInfo: $"Payment of {request.Amount:C} recorded");

        return Ok(new { id = payment.Id, message = "Payment recorded successfully" });
    }

    [HttpPost("{id}/refund")]
    [Authorize(Roles = "Admin,BillingAgent")]
    public async Task<IActionResult> Refund(Guid id, [FromBody] RefundRequest request)
    {
        var payment = await _context.Payments
            .Include(p => p.Account)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment == null)
            return NotFound();

        if (payment.Status == PaymentStatus.Refunded)
            return BadRequest("Payment has already been refunded");

        if (request.Amount > payment.Amount)
            return BadRequest("Refund amount cannot exceed payment amount");

        payment.Status = PaymentStatus.Refunded;
        payment.Account.Balance += request.Amount;

        await _context.SaveChangesAsync(default);

        await _auditService.LogAsync(AuditActionType.Update, "Payment", payment.Id,
            additionalInfo: $"Payment refunded: {request.Amount:C}");

        return Ok(new { message = "Payment refunded successfully" });
    }
}

public record CreatePaymentRequest(
    Guid AccountId,
    decimal Amount,
    string Method,
    DateTime? PaymentDate,
    string? Reference,
    string? CheckNumber,
    string? CardLastFour,
    string? Notes,
    bool AutoAllocate = true
);

public record RefundRequest(decimal Amount, string Reason);
