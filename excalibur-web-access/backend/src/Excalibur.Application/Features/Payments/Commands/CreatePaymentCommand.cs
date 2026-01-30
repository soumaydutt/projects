using MediatR;
using Microsoft.EntityFrameworkCore;
using Excalibur.Application.Common.Interfaces;
using Excalibur.Application.Common.Behaviors;
using Excalibur.Application.Common.Exceptions;
using Excalibur.Domain.Entities;
using Excalibur.Domain.Enums;

namespace Excalibur.Application.Features.Payments.Commands;

public record CreatePaymentCommand : IRequest<CreatePaymentResult>, ICacheInvalidator
{
    public Guid AccountId { get; init; }
    public decimal Amount { get; init; }
    public PaymentMethod Method { get; init; }
    public DateTime? PaymentDate { get; init; }
    public string? Reference { get; init; }
    public string? CheckNumber { get; init; }
    public string? CardLastFour { get; init; }
    public string? Notes { get; init; }
    public bool AutoAllocate { get; init; } = true;

    public IEnumerable<string> CacheKeysToInvalidate => new[]
    {
        "payments_list",
        "dashboard_kpis",
        $"account_{AccountId}"
    };
}

public record CreatePaymentResult(Guid Id, decimal AllocatedAmount, int InvoicesAllocated);

public class CreatePaymentCommandHandler : IRequestHandler<CreatePaymentCommand, CreatePaymentResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public CreatePaymentCommandHandler(IApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    public async Task<CreatePaymentResult> Handle(CreatePaymentCommand request, CancellationToken cancellationToken)
    {
        var account = await _context.Accounts
            .FirstOrDefaultAsync(a => a.Id == request.AccountId, cancellationToken);

        if (account == null)
        {
            throw new NotFoundException("Account", request.AccountId);
        }

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            PaymentNumber = $"PMT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}",
            AccountId = request.AccountId,
            Amount = request.Amount,
            PaymentMethod = request.Method,
            PaymentDate = request.PaymentDate ?? DateTime.UtcNow,
            TransactionReference = request.Reference,
            CheckNumber = request.CheckNumber,
            CardLastFour = request.CardLastFour,
            Notes = request.Notes,
            Status = PaymentStatus.Completed,
            CreatedAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);

        decimal allocatedAmount = 0;
        int invoicesAllocated = 0;

        // Auto-allocate to oldest unpaid invoices
        if (request.AutoAllocate)
        {
            var unpaidInvoices = await _context.Invoices
                .Where(i => i.AccountId == request.AccountId && i.Balance > 0)
                .OrderBy(i => i.DueDate)
                .ToListAsync(cancellationToken);

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
                invoice.Status = invoice.Balance <= 0 ? InvoiceStatus.Paid : InvoiceStatus.PartiallyPaid;

                remainingAmount -= allocationAmount;
                allocatedAmount += allocationAmount;
                invoicesAllocated++;
            }
        }

        // Update account balance
        account.Balance -= request.Amount;

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            AuditActionType.Create,
            "Payment",
            payment.Id,
            $"Payment #{payment.Id}",
            additionalInfo: $"Payment of {request.Amount:C} recorded for account {account.AccountNumber}");

        return new CreatePaymentResult(payment.Id, allocatedAmount, invoicesAllocated);
    }
}
