using Excalibur.Application.Common.Interfaces;
using Excalibur.Domain.Entities;
using Excalibur.Domain.Enums;
using Excalibur.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using System.Text.Json;

namespace Excalibur.Infrastructure.Services;

public class AuditService : IAuditService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditService(
        ApplicationDbContext context,
        ICurrentUserService currentUserService,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _currentUserService = currentUserService;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(
        AuditActionType actionType,
        string entityType,
        Guid? entityId,
        string? entityName = null,
        object? oldValues = null,
        object? newValues = null,
        string? additionalInfo = null,
        CancellationToken cancellationToken = default)
    {
        var auditLog = new AuditLog
        {
            UserId = _currentUserService.UserId,
            UserEmail = _currentUserService.Email,
            ActionType = actionType,
            EntityType = entityType,
            EntityId = entityId,
            EntityName = entityName,
            OldValues = oldValues != null ? JsonSerializer.Serialize(oldValues) : null,
            NewValues = newValues != null ? JsonSerializer.Serialize(newValues) : null,
            IpAddress = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString(),
            UserAgent = _httpContextAccessor.HttpContext?.Request?.Headers["User-Agent"].ToString(),
            CorrelationId = _httpContextAccessor.HttpContext?.Items["CorrelationId"]?.ToString(),
            AdditionalInfo = additionalInfo,
            TenantId = _currentUserService.TenantId,
            Timestamp = DateTime.UtcNow
        };

        // Calculate changes/diff
        if (oldValues != null && newValues != null)
        {
            auditLog.Changes = CalculateChanges(oldValues, newValues);
        }

        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static string? CalculateChanges(object oldValues, object newValues)
    {
        try
        {
            var oldDict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(
                JsonSerializer.Serialize(oldValues));
            var newDict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(
                JsonSerializer.Serialize(newValues));

            if (oldDict == null || newDict == null) return null;

            var changes = new List<object>();
            foreach (var key in newDict.Keys)
            {
                if (!oldDict.TryGetValue(key, out var oldValue) ||
                    oldValue.ToString() != newDict[key].ToString())
                {
                    changes.Add(new
                    {
                        Field = key,
                        OldValue = oldDict.TryGetValue(key, out var ov) ? ov.ToString() : null,
                        NewValue = newDict[key].ToString()
                    });
                }
            }

            return changes.Count > 0 ? JsonSerializer.Serialize(changes) : null;
        }
        catch
        {
            return null;
        }
    }
}
