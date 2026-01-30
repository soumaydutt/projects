using MediatR;
using Microsoft.EntityFrameworkCore;
using Excalibur.Application.Common.Interfaces;
using Excalibur.Application.Common.Models;
using Excalibur.Application.Common.Behaviors;
using Excalibur.Domain.Enums;

namespace Excalibur.Application.Features.Invoices.Queries;

public record GetInvoicesQuery : IRequest<PaginatedResponse<InvoiceDto>>, ICacheableQuery
{
    public Guid? AccountId { get; init; }
    public InvoiceStatus? Status { get; init; }
    public DateTime? FromDate { get; init; }
    public DateTime? ToDate { get; init; }
    public bool? Overdue { get; init; }
    public string? Search { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 10;

    public string CacheKey => $"invoices_list_{AccountId}_{Status}_{FromDate:yyyyMMdd}_{ToDate:yyyyMMdd}_{Overdue}_{Search}_{Page}_{PageSize}";
    public TimeSpan? CacheDuration => TimeSpan.FromMinutes(2);
}

public record InvoiceDto
{
    public Guid Id { get; init; }
    public string InvoiceNumber { get; init; } = string.Empty;
    public Guid AccountId { get; init; }
    public string AccountName { get; init; } = string.Empty;
    public string AccountNumber { get; init; } = string.Empty;
    public DateTime InvoiceDate { get; init; }
    public DateTime DueDate { get; init; }
    public decimal Amount { get; init; }
    public decimal AmountPaid { get; init; }
    public decimal Balance { get; init; }
    public string Status { get; init; } = string.Empty;
    public int DaysOverdue { get; init; }
    public DateTime CreatedAt { get; init; }
}

public class GetInvoicesQueryHandler : IRequestHandler<GetInvoicesQuery, PaginatedResponse<InvoiceDto>>
{
    private readonly IApplicationDbContext _context;

    public GetInvoicesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResponse<InvoiceDto>> Handle(GetInvoicesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Invoices
            .Include(i => i.Account)
            .AsNoTracking();

        // Apply filters
        if (request.AccountId.HasValue)
        {
            query = query.Where(i => i.AccountId == request.AccountId.Value);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(i => i.Status == request.Status.Value);
        }

        if (request.FromDate.HasValue)
        {
            query = query.Where(i => i.InvoiceDate >= request.FromDate.Value);
        }

        if (request.ToDate.HasValue)
        {
            query = query.Where(i => i.InvoiceDate <= request.ToDate.Value);
        }

        if (request.Overdue == true)
        {
            query = query.Where(i => i.DueDate < DateTime.UtcNow && i.Balance > 0);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var searchLower = request.Search.ToLower();
            query = query.Where(i =>
                i.InvoiceNumber.ToLower().Contains(searchLower) ||
                i.Account.Name.ToLower().Contains(searchLower) ||
                i.Account.AccountNumber.ToLower().Contains(searchLower));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(i => i.InvoiceDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(i => new InvoiceDto
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                AccountId = i.AccountId,
                AccountName = i.Account.Name,
                AccountNumber = i.Account.AccountNumber,
                InvoiceDate = i.InvoiceDate,
                DueDate = i.DueDate,
                Amount = i.Amount,
                AmountPaid = i.AmountPaid,
                Balance = i.Balance,
                Status = i.Status.ToString(),
                DaysOverdue = i.DueDate < DateTime.UtcNow && i.Balance > 0
                    ? (int)(DateTime.UtcNow - i.DueDate).TotalDays
                    : 0,
                CreatedAt = i.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return PaginatedResponse<InvoiceDto>.Create(items, request.Page, request.PageSize, totalCount);
    }
}
