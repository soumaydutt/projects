using Excalibur.Domain.Entities;

namespace Excalibur.Application.Common.Interfaces;

public interface IRatingEngine
{
    Task<RatingResult> CalculateChargesAsync(
        Service service,
        DateTime billingPeriodStart,
        DateTime billingPeriodEnd,
        IEnumerable<UsageRecord>? usageRecords = null,
        CancellationToken cancellationToken = default);

    Task<decimal> CalculateProratedAmountAsync(
        PricePlan plan,
        DateTime activationDate,
        DateTime billingPeriodStart,
        DateTime billingPeriodEnd,
        bool isActivation = true,
        CancellationToken cancellationToken = default);
}

public class RatingResult
{
    public decimal BaseFee { get; set; }
    public decimal UsageCharges { get; set; }
    public decimal Discounts { get; set; }
    public decimal Taxes { get; set; }
    public decimal TotalAmount { get; set; }
    public List<RatingLineItem> LineItems { get; set; } = new();
    public bool IsProrated { get; set; }
    public int? ProratedDays { get; set; }
    public int? TotalDays { get; set; }
}

public class RatingLineItem
{
    public string Description { get; set; } = string.Empty;
    public string ChargeType { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
}
