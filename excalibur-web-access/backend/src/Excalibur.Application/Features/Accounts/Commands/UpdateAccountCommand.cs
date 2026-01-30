using MediatR;
using Microsoft.EntityFrameworkCore;
using Excalibur.Application.Common.Interfaces;
using Excalibur.Application.Common.Behaviors;
using Excalibur.Application.Common.Exceptions;

namespace Excalibur.Application.Features.Accounts.Commands;

public record UpdateAccountCommand : IRequest<Unit>, ICacheInvalidator
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? Phone { get; init; }
    public string? Address1 { get; init; }
    public string? Address2 { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public string? ZipCode { get; init; }
    public decimal? CreditLimit { get; init; }

    public IEnumerable<string> CacheKeysToInvalidate => new[]
    {
        "accounts_list",
        $"account_{Id}"
    };
}

public class UpdateAccountCommandHandler : IRequestHandler<UpdateAccountCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public UpdateAccountCommandHandler(IApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    public async Task<Unit> Handle(UpdateAccountCommand request, CancellationToken cancellationToken)
    {
        var account = await _context.Accounts
            .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);

        if (account == null)
        {
            throw new NotFoundException("Account", request.Id);
        }

        var changes = new List<string>();

        if (account.Name != request.Name)
        {
            changes.Add($"Name: {account.Name} -> {request.Name}");
            account.Name = request.Name;
        }

        if (account.Email != request.Email)
        {
            changes.Add($"Email: {account.Email} -> {request.Email}");
            account.Email = request.Email;
        }

        if (account.Phone != request.Phone)
        {
            account.Phone = request.Phone;
        }

        if (!string.IsNullOrEmpty(request.Address1) && account.Address1 != request.Address1)
        {
            account.Address1 = request.Address1;
        }

        if (request.Address2 != null && account.Address2 != request.Address2)
        {
            account.Address2 = request.Address2;
        }

        if (!string.IsNullOrEmpty(request.City) && account.City != request.City)
        {
            account.City = request.City;
        }

        if (!string.IsNullOrEmpty(request.State) && account.State != request.State)
        {
            account.State = request.State;
        }

        if (!string.IsNullOrEmpty(request.ZipCode) && account.ZipCode != request.ZipCode)
        {
            account.ZipCode = request.ZipCode;
        }

        if (request.CreditLimit.HasValue && account.CreditLimit != request.CreditLimit.Value)
        {
            changes.Add($"Credit Limit: {account.CreditLimit} -> {request.CreditLimit.Value}");
            account.CreditLimit = request.CreditLimit.Value;
        }

        account.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        if (changes.Count > 0)
        {
            await _auditService.LogAsync(Domain.Enums.AuditActionType.Update, "Account", account.Id, account.Name, additionalInfo: string.Join("; ", changes));
        }

        return Unit.Value;
    }
}
