using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Excalibur.Application.Common.Interfaces;
using Excalibur.Application.Common.Models;
using Excalibur.Application.Features.Invoices.Commands;
using Excalibur.Application.Features.Invoices.Queries;
using Excalibur.Domain.Enums;

namespace Excalibur.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[EnableRateLimiting("sliding")]
public class InvoicesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IApplicationDbContext _context;

    public InvoicesController(IMediator mediator, IApplicationDbContext context)
    {
        _mediator = mediator;
        _context = context;
    }

    /// <summary>
    /// Get paginated list of invoices with optional filters
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponse<InvoiceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? accountId,
        [FromQuery] string? status,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] bool? overdue,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        InvoiceStatus? invoiceStatus = null;
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<InvoiceStatus>(status, out var parsedStatus))
        {
            invoiceStatus = parsedStatus;
        }

        var query = new GetInvoicesQuery
        {
            AccountId = accountId,
            Status = invoiceStatus,
            FromDate = fromDate,
            ToDate = toDate,
            Overdue = overdue,
            Search = search,
            Page = page,
            PageSize = pageSize
        };

        var result = await _mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<PaginatedResponse<InvoiceDto>>.Ok(result));
    }

    /// <summary>
    /// Create a new invoice
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,BillingAgent")]
    [ProducesResponseType(typeof(ApiResponse<CreateInvoiceResult>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateInvoiceCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<CreateInvoiceResult>.Ok(result, "Invoice created successfully"));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Account)
            .Include(i => i.LineItems)
                .ThenInclude(li => li.Service)
            .Where(i => i.Id == id)
            .Select(i => new
            {
                i.Id,
                i.InvoiceNumber,
                Account = new
                {
                    i.Account.Id,
                    i.Account.AccountNumber,
                    i.Account.Name,
                    i.Account.Email
                },
                i.BillingPeriodStart,
                i.BillingPeriodEnd,
                i.IssueDate,
                i.DueDate,
                i.Subtotal,
                i.TaxAmount,
                i.Total,
                i.AmountPaid,
                i.Balance,
                Status = i.Status.ToString(),
                LineItems = i.LineItems.Select(li => new
                {
                    li.Id,
                    li.Description,
                    ServiceName = li.Service != null ? li.Service.Name : null,
                    li.Quantity,
                    li.UnitPrice,
                    li.Amount,
                    ChargeType = li.ChargeType.ToString()
                }),
                i.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (invoice == null)
            return NotFound();

        return Ok(invoice);
    }

    [HttpPost("{id}/void")]
    [Authorize(Roles = "Admin,BillingAgent")]
    public async Task<IActionResult> VoidInvoice(Guid id, [FromBody] VoidInvoiceRequest request)
    {
        var invoice = await _context.Invoices.FindAsync(id);
        if (invoice == null)
            return NotFound();

        if (invoice.Status == InvoiceStatus.Paid)
            return BadRequest("Cannot void a paid invoice");

        invoice.Status = InvoiceStatus.Voided;

        await _context.SaveChangesAsync(default);

        return Ok(new { message = "Invoice voided successfully" });
    }

    [HttpPost("{id}/regenerate")]
    [Authorize(Roles = "Admin,BillingAgent")]
    public async Task<IActionResult> RegenerateInvoice(Guid id)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Account)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null)
            return NotFound();

        if (invoice.Status != InvoiceStatus.Draft)
            return BadRequest("Can only regenerate draft invoices");

        // In a real implementation, this would recalculate all line items
        return Ok(new { message = "Invoice regenerated successfully" });
    }
}

public record VoidInvoiceRequest(string Reason);
