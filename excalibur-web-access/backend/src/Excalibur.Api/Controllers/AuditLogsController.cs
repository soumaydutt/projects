using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Excalibur.Application.Common.Interfaces;
using Excalibur.Domain.Enums;

namespace Excalibur.Api.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize]
public class AuditLogsController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public AuditLogsController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? action,
        [FromQuery] string? entity,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _context.AuditLogs
            .Include(a => a.User)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(a =>
                (a.EntityName != null && a.EntityName.Contains(search)) ||
                (a.User != null && a.User.Email.Contains(search)) ||
                (a.Changes != null && a.Changes.Contains(search)));
        }

        if (!string.IsNullOrEmpty(action) && Enum.TryParse<AuditActionType>(action, out var actionType))
        {
            query = query.Where(a => a.ActionType == actionType);
        }

        if (!string.IsNullOrEmpty(entity))
        {
            query = query.Where(a => a.EntityType == entity);
        }

        if (dateFrom.HasValue)
        {
            query = query.Where(a => a.Timestamp >= dateFrom.Value);
        }

        if (dateTo.HasValue)
        {
            query = query.Where(a => a.Timestamp <= dateTo.Value.AddDays(1));
        }

        var total = await query.CountAsync();

        var logs = await query
            .OrderByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                a.Id,
                ActionType = a.ActionType.ToString(),
                a.EntityType,
                a.EntityId,
                a.EntityName,
                a.OldValues,
                a.NewValues,
                a.Changes,
                a.UserId,
                UserEmail = a.User != null ? a.User.Email : null,
                a.IpAddress,
                a.Timestamp
            })
            .ToListAsync();

        return Ok(new { items = logs, total });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var log = await _context.AuditLogs
            .Include(a => a.User)
            .Where(a => a.Id == id)
            .Select(a => new
            {
                a.Id,
                ActionType = a.ActionType.ToString(),
                a.EntityType,
                a.EntityId,
                a.EntityName,
                a.OldValues,
                a.NewValues,
                a.Changes,
                User = a.User != null ? new
                {
                    a.User.Id,
                    a.User.Email,
                    a.User.FirstName,
                    a.User.LastName
                } : null,
                a.IpAddress,
                a.UserAgent,
                a.Timestamp
            })
            .FirstOrDefaultAsync();

        if (log == null)
            return NotFound();

        return Ok(log);
    }

    [HttpGet("entity/{entityType}/{entityId}")]
    public async Task<IActionResult> GetByEntity(string entityType, string entityId)
    {
        Guid? entityGuid = Guid.TryParse(entityId, out var parsed) ? parsed : null;
        var logs = await _context.AuditLogs
            .Include(a => a.User)
            .Where(a => a.EntityType == entityType && a.EntityId == entityGuid)
            .OrderByDescending(a => a.Timestamp)
            .Select(a => new
            {
                a.Id,
                ActionType = a.ActionType.ToString(),
                a.EntityType,
                a.EntityId,
                a.EntityName,
                a.Changes,
                UserEmail = a.User != null ? a.User.Email : null,
                a.Timestamp
            })
            .ToListAsync();

        return Ok(logs);
    }

    [HttpGet("user/{userId}")]
    [Authorize(Roles = "Admin,ReadOnlyAuditor")]
    public async Task<IActionResult> GetByUser(Guid userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _context.AuditLogs
            .Include(a => a.User)
            .Where(a => a.UserId == userId);

        var total = await query.CountAsync();

        var logs = await query
            .OrderByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                a.Id,
                ActionType = a.ActionType.ToString(),
                a.EntityType,
                a.EntityId,
                a.EntityName,
                a.Changes,
                a.IpAddress,
                a.Timestamp
            })
            .ToListAsync();

        return Ok(new { items = logs, total });
    }

    [HttpGet("statistics")]
    [Authorize(Roles = "Admin,ReadOnlyAuditor")]
    public async Task<IActionResult> GetStatistics([FromQuery] int days = 30)
    {
        var startDate = DateTime.UtcNow.AddDays(-days);

        var actionCounts = await _context.AuditLogs
            .Where(a => a.Timestamp >= startDate)
            .GroupBy(a => a.ActionType)
            .Select(g => new
            {
                Action = g.Key.ToString(),
                Count = g.Count()
            })
            .ToListAsync();

        var entityCounts = await _context.AuditLogs
            .Where(a => a.Timestamp >= startDate)
            .GroupBy(a => a.EntityType)
            .Select(g => new
            {
                Entity = g.Key,
                Count = g.Count()
            })
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToListAsync();

        var dailyActivity = await _context.AuditLogs
            .Where(a => a.Timestamp >= startDate)
            .GroupBy(a => a.Timestamp.Date)
            .Select(g => new
            {
                Date = g.Key,
                Count = g.Count()
            })
            .OrderBy(x => x.Date)
            .ToListAsync();

        var topUsers = await _context.AuditLogs
            .Include(a => a.User)
            .Where(a => a.Timestamp >= startDate && a.User != null)
            .GroupBy(a => new { a.UserId, Email = a.User!.Email })
            .Select(g => new
            {
                UserId = g.Key.UserId,
                Email = g.Key.Email,
                Count = g.Count()
            })
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToListAsync();

        return Ok(new
        {
            actionCounts,
            entityCounts,
            dailyActivity,
            topUsers
        });
    }
}
