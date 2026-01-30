using MediatR;
using Microsoft.EntityFrameworkCore;
using Excalibur.Application.Common.Interfaces;
using Excalibur.Application.Common.Models;
using Excalibur.Domain.Enums;

namespace Excalibur.Application.Features.Accounts.Queries;

public record GetAccountsQuery : IRequest<PaginatedResponse<AccountDto>>
{
    public string? Search { get; init; }
    public AccountStatus? Status { get; init; }
    public AccountType? Type { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 10;
}

public record AccountDto
{
    public Guid Id { get; init; }
    public string AccountNumber { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Type { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? Phone { get; init; }
    public string City { get; init; } = string.Empty;
    public string State { get; init; } = string.Empty;
    public decimal Balance { get; init; }
    public DateTime CreatedAt { get; init; }
}

public class GetAccountsQueryHandler : IRequestHandler<GetAccountsQuery, PaginatedResponse<AccountDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAccountsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResponse<AccountDto>> Handle(GetAccountsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Accounts.AsNoTracking();

        // Apply filters
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var searchLower = request.Search.ToLower();
            query = query.Where(a =>
                a.Name.ToLower().Contains(searchLower) ||
                a.AccountNumber.ToLower().Contains(searchLower) ||
                a.Email.ToLower().Contains(searchLower));
        }

        if (request.Status.HasValue)
        {
            query = query.Where(a => a.Status == request.Status.Value);
        }

        if (request.Type.HasValue)
        {
            query = query.Where(a => a.Type == request.Type.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(a => new AccountDto
            {
                Id = a.Id,
                AccountNumber = a.AccountNumber,
                Name = a.Name,
                Type = a.Type.ToString(),
                Status = a.Status.ToString(),
                Email = a.Email,
                Phone = a.Phone,
                City = a.City,
                State = a.State,
                Balance = a.Balance,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return PaginatedResponse<AccountDto>.Create(items, request.Page, request.PageSize, totalCount);
    }
}
