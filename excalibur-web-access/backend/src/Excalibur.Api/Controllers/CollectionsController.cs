using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Excalibur.Application.Common.Interfaces;
using Excalibur.Application.Common.Models;
using Excalibur.Application.Features.Collections.Commands;
using Excalibur.Application.Features.Collections.Queries;
using Excalibur.Domain.Entities;
using Excalibur.Domain.Enums;

namespace Excalibur.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[EnableRateLimiting("sliding")]
public class CollectionsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditService _auditService;

    public CollectionsController(
        IMediator mediator,
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IAuditService auditService)
    {
        _mediator = mediator;
        _context = context;
        _currentUserService = currentUserService;
        _auditService = auditService;
    }

    /// <summary>
    /// Get collection queue with accounts that have overdue invoices
    /// </summary>
    [HttpGet("queue")]
    [Authorize(Roles = "Admin,Collector,BillingAgent")]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<CollectionAccountDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetQueue(
        [FromQuery] int? minDaysOverdue,
        [FromQuery] int? maxDaysOverdue,
        [FromQuery] decimal? minBalance,
        [FromQuery] decimal? maxBalance,
        [FromQuery] string? assignedTo,
        [FromQuery] bool? hasFollowUp,
        [FromQuery] string? search,
        [FromQuery] string sortBy = "DaysOverdue",
        [FromQuery] bool sortDescending = true,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new GetCollectionQueueQuery
        {
            MinDaysOverdue = minDaysOverdue,
            MaxDaysOverdue = maxDaysOverdue,
            MinBalance = minBalance,
            MaxBalance = maxBalance,
            AssignedTo = assignedTo,
            HasFollowUp = hasFollowUp,
            Search = search,
            SortBy = sortBy,
            SortDescending = sortDescending,
            Page = page,
            PageSize = pageSize
        };

        var result = await _mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<PaginatedResponse<CollectionAccountDto>>.Ok(result));
    }

    /// <summary>
    /// Record a collection action for an account
    /// </summary>
    [HttpPost("actions")]
    [Authorize(Roles = "Admin,Collector,BillingAgent")]
    [ProducesResponseType(typeof(ApiResponse<CreateCollectionActionResult>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAction(
        [FromBody] CreateCollectionActionCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<CreateCollectionActionResult>.Ok(result, "Collection action recorded successfully"));
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? priority,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _context.CollectionCases
            .Include(c => c.Account)
            .Include(c => c.AssignedTo)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(c =>
                c.Account.Name.Contains(search) ||
                c.Account.AccountNumber.Contains(search));
        }

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<CollectionCaseStatus>(status, out var caseStatus))
        {
            query = query.Where(c => c.Status == caseStatus);
        }

        if (!string.IsNullOrEmpty(priority) && Enum.TryParse<CollectionPriority>(priority, out var casePriority))
        {
            query = query.Where(c => c.Priority == casePriority);
        }

        var total = await query.CountAsync();

        var cases = await query
            .OrderByDescending(c => c.Priority)
            .ThenByDescending(c => c.TotalAmountDue)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new
            {
                c.Id,
                AccountName = c.Account.Name,
                AccountNumber = c.Account.AccountNumber,
                Status = c.Status.ToString(),
                Priority = c.Priority.ToString(),
                c.TotalAmountDue,
                c.OldestInvoiceDate,
                c.LastContactDate,
                AssignedToName = c.AssignedTo != null ? c.AssignedTo.FirstName + " " + c.AssignedTo.LastName : null,
                c.CreatedAt
            })
            .ToListAsync();

        return Ok(new { items = cases, total });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var collectionCase = await _context.CollectionCases
            .Include(c => c.Account)
            .Include(c => c.AssignedTo)
            .Include(c => c.Notes)
                .ThenInclude(n => n.CreatedByUser)
            .Include(c => c.Activities)
                .ThenInclude(a => a.PerformedBy)
            .Where(c => c.Id == id)
            .Select(c => new
            {
                c.Id,
                Account = new
                {
                    c.Account.Id,
                    c.Account.AccountNumber,
                    c.Account.Name,
                    c.Account.Email,
                    c.Account.Phone,
                    c.Account.Balance
                },
                Status = c.Status.ToString(),
                Priority = c.Priority.ToString(),
                c.TotalAmountDue,
                c.OldestInvoiceDate,
                c.LastContactDate,
                c.NextFollowUpDate,
                c.PromiseToPayDate,
                c.PromiseToPayAmount,
                AssignedTo = c.AssignedTo != null ? new
                {
                    c.AssignedTo.Id,
                    c.AssignedTo.FirstName,
                    c.AssignedTo.LastName,
                    c.AssignedTo.Email
                } : null,
                Notes = c.Notes.OrderByDescending(n => n.CreatedAt).Select(n => new
                {
                    n.Id,
                    n.Content,
                    ContactType = n.ContactType.ToString(),
                    n.CreatedAt,
                    CreatedByName = n.CreatedByUser.FirstName + " " + n.CreatedByUser.LastName
                }),
                Activities = c.Activities.OrderByDescending(a => a.PerformedAt).Select(a => new
                {
                    a.Id,
                    ActivityType = a.ActivityType.ToString(),
                    a.Description,
                    a.PerformedAt,
                    PerformedByName = a.PerformedBy.FirstName + " " + a.PerformedBy.LastName
                }),
                c.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (collectionCase == null)
            return NotFound();

        return Ok(collectionCase);
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin,Collector,BillingAgent")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest request)
    {
        var collectionCase = await _context.CollectionCases.FindAsync(id);
        if (collectionCase == null)
            return NotFound();

        var oldStatus = collectionCase.Status;

        if (Enum.TryParse<CollectionCaseStatus>(request.Status, out var newStatus))
        {
            collectionCase.Status = newStatus;

            if (newStatus == CollectionCaseStatus.Resolved)
            {
                collectionCase.ResolvedAt = DateTime.UtcNow;
            }

            // Log activity
            var activity = new CollectionCaseActivity
            {
                Id = Guid.NewGuid(),
                CollectionCaseId = id,
                ActivityType = CollectionActivityType.StatusChange,
                Description = $"Status changed from {oldStatus} to {newStatus}",
                PerformedById = _currentUserService.UserId!.Value,
                PerformedAt = DateTime.UtcNow
            };
            _context.CollectionCaseActivities.Add(activity);

            await _context.SaveChangesAsync(default);

            await _auditService.LogAsync(AuditActionType.Update, "CollectionCase", id,
                additionalInfo: $"Status changed from {oldStatus} to {newStatus}");
        }

        return Ok(new { message = "Status updated successfully" });
    }

    [HttpPost("{id}/notes")]
    [Authorize(Roles = "Admin,Collector,BillingAgent,CareAgent")]
    public async Task<IActionResult> AddNote(Guid id, [FromBody] CollectionNoteRequest request)
    {
        var collectionCase = await _context.CollectionCases.FindAsync(id);
        if (collectionCase == null)
            return NotFound();

        var note = new CollectionCaseNote
        {
            Id = Guid.NewGuid(),
            CollectionCaseId = id,
            Content = request.Content,
            ContactType = Enum.Parse<ContactType>(request.ContactType),
            CreatedById = _currentUserService.UserId!.Value,
            CreatedAt = DateTime.UtcNow
        };

        _context.CollectionCaseNotes.Add(note);

        collectionCase.LastContactDate = DateTime.UtcNow;

        // Log activity
        var activity = new CollectionCaseActivity
        {
            Id = Guid.NewGuid(),
            CollectionCaseId = id,
            ActivityType = CollectionActivityType.Note,
            Description = $"Added {request.ContactType} note",
            PerformedById = _currentUserService.UserId!.Value,
            PerformedAt = DateTime.UtcNow
        };
        _context.CollectionCaseActivities.Add(activity);

        await _context.SaveChangesAsync(default);

        return Ok(new { id = note.Id, message = "Note added successfully" });
    }

    [HttpPut("{id}/assign")]
    [Authorize(Roles = "Admin,Collector")]
    public async Task<IActionResult> Assign(Guid id, [FromBody] AssignRequest request)
    {
        var collectionCase = await _context.CollectionCases.FindAsync(id);
        if (collectionCase == null)
            return NotFound();

        collectionCase.AssignedToId = request.UserId;

        // Log activity
        var activity = new CollectionCaseActivity
        {
            Id = Guid.NewGuid(),
            CollectionCaseId = id,
            ActivityType = CollectionActivityType.Assignment,
            Description = request.UserId.HasValue ? "Case assigned" : "Case unassigned",
            PerformedById = _currentUserService.UserId!.Value,
            PerformedAt = DateTime.UtcNow
        };
        _context.CollectionCaseActivities.Add(activity);

        await _context.SaveChangesAsync(default);

        return Ok(new { message = "Assignment updated successfully" });
    }

    [HttpPut("{id}/promise-to-pay")]
    [Authorize(Roles = "Admin,Collector,BillingAgent")]
    public async Task<IActionResult> SetPromiseToPay(Guid id, [FromBody] PromiseToPayRequest request)
    {
        var collectionCase = await _context.CollectionCases.FindAsync(id);
        if (collectionCase == null)
            return NotFound();

        collectionCase.PromiseToPayDate = request.Date;
        collectionCase.PromiseToPayAmount = request.Amount;
        collectionCase.Status = CollectionCaseStatus.PaymentPlan;

        // Log activity
        var activity = new CollectionCaseActivity
        {
            Id = Guid.NewGuid(),
            CollectionCaseId = id,
            ActivityType = CollectionActivityType.PromiseToPay,
            Description = $"Promise to pay {request.Amount:C} by {request.Date:d}",
            PerformedById = _currentUserService.UserId!.Value,
            PerformedAt = DateTime.UtcNow
        };
        _context.CollectionCaseActivities.Add(activity);

        await _context.SaveChangesAsync(default);

        await _auditService.LogAsync(AuditActionType.Update, "CollectionCase", id,
            additionalInfo: $"Promise to pay set: {request.Amount:C} by {request.Date:d}");

        return Ok(new { message = "Promise to pay recorded successfully" });
    }
}

public record UpdateStatusRequest(string Status);
public record CollectionNoteRequest(string Content, string ContactType);
public record AssignRequest(Guid? UserId);
public record PromiseToPayRequest(DateTime Date, decimal Amount);
