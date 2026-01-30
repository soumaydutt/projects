using MediatR;
using Microsoft.EntityFrameworkCore;
using Excalibur.Application.Common.Interfaces;
using Excalibur.Application.Common.Behaviors;
using Excalibur.Application.Common.Exceptions;
using Excalibur.Domain.Entities;
using Excalibur.Domain.Enums;

namespace Excalibur.Application.Features.Invoices.Commands;

public record CreateInvoiceCommand : IRequest<CreateInvoiceResult>, ICacheInvalidator
{
    public Guid AccountId { get; init; }
    public DateTime? InvoiceDate { get; init; }
    public DateTime? DueDate { get; init; }
    public List<InvoiceLineItemDto> LineItems { get; init; } = new();
    public string? Notes { get; init; }

    public IEnumerable<string> CacheKeysToInvalidate => new[]
    {
        "invoices_list",
        "dashboard_kpis",
        $"account_{AccountId}"
    };
}

public record InvoiceLineItemDto
{
    public string Description { get; init; } = string.Empty;
    public decimal Quantity { get; init; }
    public decimal UnitPrice { get; init; }
    public string? ServiceCode { get; init; }
}

public record CreateInvoiceResult(Guid Id, string InvoiceNumber, decimal Amount);

public class CreateInvoiceCommandHandler : IRequestHandler<CreateInvoiceCommand, CreateInvoiceResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public CreateInvoiceCommandHandler(IApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    public async Task<CreateInvoiceResult> Handle(CreateInvoiceCommand request, CancellationToken cancellationToken)
    {
        var account = await _context.Accounts
            .FirstOrDefaultAsync(a => a.Id == request.AccountId, cancellationToken);

        if (account == null)
        {
            throw new NotFoundException("Account", request.AccountId);
        }

        if (account.Status != AccountStatus.Active)
        {
            throw new BusinessRuleException($"Cannot create invoice for account in {account.Status} status.");
        }

        var invoiceNumber = GenerateInvoiceNumber();
        var invoiceDate = request.InvoiceDate ?? DateTime.UtcNow;
        var dueDate = request.DueDate ?? invoiceDate.AddDays(30);

        if (dueDate < invoiceDate)
        {
            throw new BusinessRuleException("Due date cannot be before invoice date.");
        }

        var invoice = new Invoice
        {
            Id = Guid.NewGuid(),
            InvoiceNumber = invoiceNumber,
            AccountId = request.AccountId,
            InvoiceDate = invoiceDate,
            DueDate = dueDate,
            Notes = request.Notes,
            Status = InvoiceStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        decimal totalAmount = 0;

        foreach (var lineItemDto in request.LineItems)
        {
            var lineAmount = lineItemDto.Quantity * lineItemDto.UnitPrice;

            var lineItem = new InvoiceLineItem
            {
                Id = Guid.NewGuid(),
                InvoiceId = invoice.Id,
                Description = lineItemDto.Description,
                Quantity = lineItemDto.Quantity,
                UnitPrice = lineItemDto.UnitPrice,
                Amount = lineAmount,
                ChargeType = ChargeType.BaseFee,
                CreatedAt = DateTime.UtcNow
            };

            _context.InvoiceLineItems.Add(lineItem);
            totalAmount += lineAmount;
        }

        invoice.Amount = totalAmount;
        invoice.Balance = totalAmount;
        invoice.AmountPaid = 0;

        _context.Invoices.Add(invoice);

        // Update account balance
        account.Balance += totalAmount;

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            AuditActionType.Create,
            "Invoice",
            invoice.Id,
            invoiceNumber,
            additionalInfo: $"Invoice {invoiceNumber} created for {totalAmount:C} for account {account.AccountNumber}");

        return new CreateInvoiceResult(invoice.Id, invoiceNumber, totalAmount);
    }

    private static string GenerateInvoiceNumber()
    {
        return $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
    }
}
