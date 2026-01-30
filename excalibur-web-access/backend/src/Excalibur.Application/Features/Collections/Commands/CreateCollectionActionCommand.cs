using MediatR;
using Microsoft.EntityFrameworkCore;
using Excalibur.Application.Common.Interfaces;
using Excalibur.Application.Common.Behaviors;
using Excalibur.Application.Common.Exceptions;
using Excalibur.Domain.Entities;
using Excalibur.Domain.Enums;

namespace Excalibur.Application.Features.Collections.Commands;

public record CreateCollectionActionCommand : IRequest<CreateCollectionActionResult>, ICacheInvalidator
{
    public Guid AccountId { get; init; }
    public CollectionActionType ActionType { get; init; }
    public string Notes { get; init; } = string.Empty;
    public DateTime? FollowUpDate { get; init; }
    public decimal? PromisedAmount { get; init; }
    public DateTime? PromisedDate { get; init; }
    public string? ContactMethod { get; init; }
    public string? ContactedPerson { get; init; }

    public IEnumerable<string> CacheKeysToInvalidate => new[]
    {
        "collections_list",
        "dashboard_kpis",
        $"account_{AccountId}_collections"
    };
}

public record CreateCollectionActionResult(Guid Id, string ActionType, DateTime CreatedAt);

public class CreateCollectionActionCommandHandler : IRequestHandler<CreateCollectionActionCommand, CreateCollectionActionResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly ICurrentUserService _currentUserService;

    public CreateCollectionActionCommandHandler(
        IApplicationDbContext context,
        IAuditService auditService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _auditService = auditService;
        _currentUserService = currentUserService;
    }

    public async Task<CreateCollectionActionResult> Handle(CreateCollectionActionCommand request, CancellationToken cancellationToken)
    {
        var account = await _context.Accounts
            .FirstOrDefaultAsync(a => a.Id == request.AccountId, cancellationToken);

        if (account == null)
        {
            throw new NotFoundException("Account", request.AccountId);
        }

        // Validate promise-to-pay requirements
        if (request.ActionType == CollectionActionType.PromiseToPay)
        {
            if (!request.PromisedAmount.HasValue || request.PromisedAmount <= 0)
            {
                throw new BusinessRuleException("Promise to pay requires a positive promised amount.");
            }

            if (!request.PromisedDate.HasValue)
            {
                throw new BusinessRuleException("Promise to pay requires a promised date.");
            }

            if (request.PromisedDate <= DateTime.UtcNow)
            {
                throw new BusinessRuleException("Promised date must be in the future.");
            }
        }

        var action = new CollectionAction
        {
            Id = Guid.NewGuid(),
            AccountId = request.AccountId,
            ActionType = request.ActionType,
            Notes = request.Notes,
            FollowUpDate = request.FollowUpDate,
            PromisedAmount = request.PromisedAmount,
            PromisedDate = request.PromisedDate,
            ContactMethod = request.ContactMethod,
            ContactedPerson = request.ContactedPerson,
            PerformedBy = _currentUserService.UserId?.ToString() ?? "system",
            PerformedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        _context.CollectionActions.Add(action);

        // Update account collection status based on action type
        account.LastCollectionAction = request.ActionType.ToString();
        account.LastCollectionDate = DateTime.UtcNow;

        if (request.FollowUpDate.HasValue)
        {
            account.NextFollowUpDate = request.FollowUpDate;
        }

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            AuditActionType.Create,
            "CollectionAction",
            action.Id,
            $"{request.ActionType}",
            additionalInfo: $"Collection action '{request.ActionType}' recorded for account {account.AccountNumber}");

        return new CreateCollectionActionResult(action.Id, request.ActionType.ToString(), action.PerformedAt);
    }
}
