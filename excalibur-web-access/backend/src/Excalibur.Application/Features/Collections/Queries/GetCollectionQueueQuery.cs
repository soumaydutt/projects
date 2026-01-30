using MediatR;
using Microsoft.EntityFrameworkCore;
using Excalibur.Application.Common.Interfaces;
using Excalibur.Application.Common.Models;
using Excalibur.Application.Common.Behaviors;
using Excalibur.Domain.Enums;

namespace Excalibur.Application.Features.Collections.Queries;

public record GetCollectionQueueQuery : IRequest<PaginatedResponse<CollectionAccountDto>>, ICacheableQuery
{
    public int? MinDaysOverdue { get; init; }
    public int? MaxDaysOverdue { get; init; }
    public decimal? MinBalance { get; init; }
    public decimal? MaxBalance { get; init; }
    public string? AssignedTo { get; init; }
    public bool? HasFollowUp { get; init; }
    public string? Search { get; init; }
    public string SortBy { get; init; } = "DaysOverdue";
    public bool SortDescending { get; init; } = true;
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;

    public string CacheKey => $"collection_queue_{MinDaysOverdue}_{MaxDaysOverdue}_{MinBalance}_{MaxBalance}_{AssignedTo}_{HasFollowUp}_{Search}_{SortBy}_{SortDescending}_{Page}_{PageSize}";
    public TimeSpan? CacheDuration => TimeSpan.FromMinutes(1);
}

public record CollectionAccountDto
{
    public Guid AccountId { get; init; }
    public string AccountNumber { get; init; } = string.Empty;
    public string AccountName { get; init; } = string.Empty;
    public decimal TotalBalance { get; init; }
    public decimal OverdueAmount { get; init; }
    public int DaysOverdue { get; init; }
    public DateTime? OldestInvoiceDate { get; init; }
    public int OverdueInvoiceCount { get; init; }
    public string? LastAction { get; init; }
    public DateTime? LastActionDate { get; init; }
    public DateTime? NextFollowUp { get; init; }
    public string? AssignedTo { get; init; }
    public string RiskLevel { get; init; } = string.Empty;
}

public class GetCollectionQueueQueryHandler : IRequestHandler<GetCollectionQueueQuery, PaginatedResponse<CollectionAccountDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCollectionQueueQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResponse<CollectionAccountDto>> Handle(GetCollectionQueueQuery request, CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow.Date;

        // Get accounts with overdue invoices
        var query = _context.Accounts
            .AsNoTracking()
            .Where(a => a.Status == AccountStatus.Active && a.Balance > 0)
            .Select(a => new
            {
                Account = a,
                OverdueInvoices = a.Invoices.Where(i => i.DueDate < today && i.Balance > 0).ToList()
            })
            .Where(x => x.OverdueInvoices.Any());

        // Apply filters
        var filteredQuery = query.Select(x => new CollectionAccountDto
        {
            AccountId = x.Account.Id,
            AccountNumber = x.Account.AccountNumber,
            AccountName = x.Account.Name,
            TotalBalance = x.Account.Balance,
            OverdueAmount = x.OverdueInvoices.Sum(i => i.Balance),
            DaysOverdue = x.OverdueInvoices.Any()
                ? (int)(today - x.OverdueInvoices.Min(i => i.DueDate)).TotalDays
                : 0,
            OldestInvoiceDate = x.OverdueInvoices.Any()
                ? x.OverdueInvoices.Min(i => i.DueDate)
                : null,
            OverdueInvoiceCount = x.OverdueInvoices.Count,
            LastAction = x.Account.LastCollectionAction,
            LastActionDate = x.Account.LastCollectionDate,
            NextFollowUp = x.Account.NextFollowUpDate,
            AssignedTo = x.Account.CollectionAssignee,
            RiskLevel = CalculateRiskLevel(
                (int)(today - x.OverdueInvoices.Min(i => i.DueDate)).TotalDays,
                x.OverdueInvoices.Sum(i => i.Balance))
        });

        // Apply additional filters
        if (request.MinDaysOverdue.HasValue)
        {
            filteredQuery = filteredQuery.Where(x => x.DaysOverdue >= request.MinDaysOverdue.Value);
        }

        if (request.MaxDaysOverdue.HasValue)
        {
            filteredQuery = filteredQuery.Where(x => x.DaysOverdue <= request.MaxDaysOverdue.Value);
        }

        if (request.MinBalance.HasValue)
        {
            filteredQuery = filteredQuery.Where(x => x.OverdueAmount >= request.MinBalance.Value);
        }

        if (request.MaxBalance.HasValue)
        {
            filteredQuery = filteredQuery.Where(x => x.OverdueAmount <= request.MaxBalance.Value);
        }

        if (!string.IsNullOrEmpty(request.AssignedTo))
        {
            filteredQuery = filteredQuery.Where(x => x.AssignedTo == request.AssignedTo);
        }

        if (request.HasFollowUp == true)
        {
            filteredQuery = filteredQuery.Where(x => x.NextFollowUp != null && x.NextFollowUp <= today.AddDays(7));
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var searchLower = request.Search.ToLower();
            filteredQuery = filteredQuery.Where(x =>
                x.AccountName.ToLower().Contains(searchLower) ||
                x.AccountNumber.ToLower().Contains(searchLower));
        }

        // Get total count before pagination
        var totalCount = await filteredQuery.CountAsync(cancellationToken);

        // Apply sorting
        filteredQuery = request.SortBy.ToLower() switch
        {
            "daysoverdue" => request.SortDescending
                ? filteredQuery.OrderByDescending(x => x.DaysOverdue)
                : filteredQuery.OrderBy(x => x.DaysOverdue),
            "balance" or "overdueamount" => request.SortDescending
                ? filteredQuery.OrderByDescending(x => x.OverdueAmount)
                : filteredQuery.OrderBy(x => x.OverdueAmount),
            "accountname" => request.SortDescending
                ? filteredQuery.OrderByDescending(x => x.AccountName)
                : filteredQuery.OrderBy(x => x.AccountName),
            "nextfollowup" => request.SortDescending
                ? filteredQuery.OrderByDescending(x => x.NextFollowUp)
                : filteredQuery.OrderBy(x => x.NextFollowUp),
            _ => filteredQuery.OrderByDescending(x => x.DaysOverdue)
        };

        // Apply pagination
        var items = await filteredQuery
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        return PaginatedResponse<CollectionAccountDto>.Create(items, request.Page, request.PageSize, totalCount);
    }

    private static string CalculateRiskLevel(int daysOverdue, decimal overdueAmount)
    {
        // Risk scoring based on days overdue and amount
        var daysScore = daysOverdue switch
        {
            <= 30 => 1,
            <= 60 => 2,
            <= 90 => 3,
            _ => 4
        };

        var amountScore = overdueAmount switch
        {
            <= 100 => 1,
            <= 500 => 2,
            <= 1000 => 3,
            _ => 4
        };

        var totalScore = daysScore + amountScore;

        return totalScore switch
        {
            <= 3 => "Low",
            <= 5 => "Medium",
            <= 7 => "High",
            _ => "Critical"
        };
    }
}
