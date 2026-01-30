using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Excalibur.Application.Common.Interfaces;
using Excalibur.Domain.Entities;
using Excalibur.Domain.Enums;

namespace Excalibur.Api.Controllers;

[ApiController]
[Route("api/price-plans")]
[Authorize]
public class PricePlansController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public PricePlansController(IApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? type,
        [FromQuery] bool includeInactive = false)
    {
        var query = _context.PricePlans.AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(p => p.IsActive);
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(p =>
                p.Name.Contains(search) ||
                p.Code.Contains(search));
        }

        if (!string.IsNullOrEmpty(type) && Enum.TryParse<ServiceType>(type, out var serviceType))
        {
            query = query.Where(p => p.ServiceType == serviceType);
        }

        var plans = await query
            .OrderBy(p => p.ServiceType)
            .ThenBy(p => p.Name)
            .Select(p => new
            {
                p.Id,
                p.Code,
                p.Name,
                p.Description,
                ServiceType = p.ServiceType.ToString(),
                p.MonthlyRate,
                p.SetupFee,
                p.IsActive,
                p.EffectiveFrom,
                p.EffectiveTo
            })
            .ToListAsync();

        return Ok(plans);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var plan = await _context.PricePlans
            .Where(p => p.Id == id)
            .Select(p => new
            {
                p.Id,
                p.Code,
                p.Name,
                p.Description,
                ServiceType = p.ServiceType.ToString(),
                p.MonthlyRate,
                p.SetupFee,
                p.IsActive,
                p.EffectiveFrom,
                p.EffectiveTo,
                p.RateCardJson,
                p.CreatedAt,
                p.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (plan == null)
            return NotFound();

        return Ok(plan);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreatePricePlanRequest request)
    {
        // Check if code already exists
        var codeExists = await _context.PricePlans.AnyAsync(p => p.Code == request.Code);
        if (codeExists)
            return BadRequest("A price plan with this code already exists");

        var plan = new PricePlan
        {
            Id = Guid.NewGuid(),
            Code = request.Code,
            Name = request.Name,
            Description = request.Description,
            ServiceType = Enum.Parse<ServiceType>(request.ServiceType),
            MonthlyRate = request.MonthlyRate,
            SetupFee = request.SetupFee,
            IsActive = request.IsActive,
            EffectiveFrom = request.EffectiveFrom ?? DateTime.UtcNow,
            EffectiveTo = request.EffectiveTo,
            RateCardJson = request.RateCardJson,
            CreatedAt = DateTime.UtcNow
        };

        _context.PricePlans.Add(plan);
        await _context.SaveChangesAsync(default);

        await _auditService.LogAsync(AuditActionType.Create, "PricePlan", plan.Id, plan.Name,
            additionalInfo: $"Created price plan: {plan.Name}");

        return Ok(new { id = plan.Id, message = "Price plan created successfully" });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePricePlanRequest request)
    {
        var plan = await _context.PricePlans.FindAsync(id);
        if (plan == null)
            return NotFound();

        // Check if new code conflicts with another plan
        if (request.Code != plan.Code)
        {
            var codeExists = await _context.PricePlans.AnyAsync(p => p.Code == request.Code && p.Id != id);
            if (codeExists)
                return BadRequest("A price plan with this code already exists");
        }

        plan.Code = request.Code;
        plan.Name = request.Name;
        plan.Description = request.Description;
        plan.ServiceType = Enum.Parse<ServiceType>(request.ServiceType);
        plan.MonthlyRate = request.MonthlyRate;
        plan.SetupFee = request.SetupFee;
        plan.IsActive = request.IsActive;
        plan.EffectiveFrom = request.EffectiveFrom;
        plan.EffectiveTo = request.EffectiveTo;
        plan.RateCardJson = request.RateCardJson;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(default);

        await _auditService.LogAsync(AuditActionType.Update, "PricePlan", plan.Id, plan.Name,
            additionalInfo: $"Updated price plan: {plan.Name}");

        return Ok(new { message = "Price plan updated successfully" });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var plan = await _context.PricePlans.FindAsync(id);
        if (plan == null)
            return NotFound();

        // Check if plan is in use
        var inUse = await _context.Services.AnyAsync(s => s.PricePlanId == id);
        if (inUse)
            return BadRequest("Cannot delete a price plan that is in use. Deactivate it instead.");

        _context.PricePlans.Remove(plan);
        await _context.SaveChangesAsync(default);

        await _auditService.LogAsync(AuditActionType.Delete, "PricePlan", plan.Id, plan.Name,
            additionalInfo: $"Deleted price plan: {plan.Name}");

        return Ok(new { message = "Price plan deleted successfully" });
    }

    [HttpPost("{id}/deactivate")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var plan = await _context.PricePlans.FindAsync(id);
        if (plan == null)
            return NotFound();

        plan.IsActive = false;
        plan.EffectiveTo = DateTime.UtcNow;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(default);

        await _auditService.LogAsync(AuditActionType.Update, "PricePlan", plan.Id, plan.Name,
            additionalInfo: $"Deactivated price plan: {plan.Name}");

        return Ok(new { message = "Price plan deactivated successfully" });
    }

    [HttpPost("{id}/activate")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Activate(Guid id)
    {
        var plan = await _context.PricePlans.FindAsync(id);
        if (plan == null)
            return NotFound();

        plan.IsActive = true;
        plan.EffectiveTo = null;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(default);

        await _auditService.LogAsync(AuditActionType.Update, "PricePlan", plan.Id, plan.Name,
            additionalInfo: $"Activated price plan: {plan.Name}");

        return Ok(new { message = "Price plan activated successfully" });
    }
}

public record CreatePricePlanRequest(
    string Code,
    string Name,
    string? Description,
    string ServiceType,
    decimal MonthlyRate,
    decimal SetupFee,
    bool IsActive,
    DateTime? EffectiveFrom,
    DateTime? EffectiveTo,
    string? RateCardJson
);

public record UpdatePricePlanRequest(
    string Code,
    string Name,
    string? Description,
    string ServiceType,
    decimal MonthlyRate,
    decimal SetupFee,
    bool IsActive,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo,
    string? RateCardJson
);
