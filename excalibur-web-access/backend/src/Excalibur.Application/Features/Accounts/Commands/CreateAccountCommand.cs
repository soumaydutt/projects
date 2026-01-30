using MediatR;
using Excalibur.Application.Common.Interfaces;
using Excalibur.Application.Common.Behaviors;
using Excalibur.Domain.Entities;
using Excalibur.Domain.Enums;

namespace Excalibur.Application.Features.Accounts.Commands;

public record CreateAccountCommand : IRequest<CreateAccountResult>, ICacheInvalidator
{
    public string Name { get; init; } = string.Empty;
    public AccountType Type { get; init; }
    public string Email { get; init; } = string.Empty;
    public string? Phone { get; init; }
    public string Address1 { get; init; } = string.Empty;
    public string? Address2 { get; init; }
    public string City { get; init; } = string.Empty;
    public string State { get; init; } = string.Empty;
    public string ZipCode { get; init; } = string.Empty;
    public string Country { get; init; } = "USA";
    public decimal? CreditLimit { get; init; }

    public IEnumerable<string> CacheKeysToInvalidate => new[]
    {
        "accounts_list",
        "dashboard_kpis"
    };
}

public record CreateAccountResult(Guid Id, string AccountNumber);

public class CreateAccountCommandHandler : IRequestHandler<CreateAccountCommand, CreateAccountResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public CreateAccountCommandHandler(IApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    public async Task<CreateAccountResult> Handle(CreateAccountCommand request, CancellationToken cancellationToken)
    {
        var accountNumber = GenerateAccountNumber();

        var account = new Account
        {
            Id = Guid.NewGuid(),
            AccountNumber = accountNumber,
            Name = request.Name,
            Type = request.Type,
            Status = AccountStatus.Active,
            Email = request.Email,
            Phone = request.Phone,
            Address1 = request.Address1,
            Address2 = request.Address2,
            City = request.City,
            State = request.State,
            ZipCode = request.ZipCode,
            Country = request.Country,
            CreditLimit = request.CreditLimit ?? 1000m,
            Balance = 0m,
            CreatedAt = DateTime.UtcNow
        };

        _context.Accounts.Add(account);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(AuditActionType.Create, "Account", account.Id, account.Name, additionalInfo: $"Created account: {account.Name}");

        return new CreateAccountResult(account.Id, account.AccountNumber);
    }

    private static string GenerateAccountNumber()
    {
        return $"ACC-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
    }
}
