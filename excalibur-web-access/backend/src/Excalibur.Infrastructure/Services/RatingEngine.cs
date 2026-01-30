using Excalibur.Application.Common.Interfaces;
using Excalibur.Domain.Entities;
using System.Text.Json;

namespace Excalibur.Infrastructure.Services;

public class RatingEngine : IRatingEngine
{
    public Task<RatingResult> CalculateChargesAsync(
        Service service,
        DateTime billingPeriodStart,
        DateTime billingPeriodEnd,
        IEnumerable<UsageRecord>? usageRecords = null,
        CancellationToken cancellationToken = default)
    {
        var plan = service.PricePlan;
        var result = new RatingResult();

        // Calculate base fee
        var baseFee = plan.BaseMonthlyFee;

        // Check for proration on activation
        if (plan.ProrateOnActivation && service.ActivatedAt.HasValue &&
            service.ActivatedAt.Value > billingPeriodStart &&
            service.ActivatedAt.Value <= billingPeriodEnd)
        {
            var totalDays = (billingPeriodEnd - billingPeriodStart).Days;
            var activeDays = (billingPeriodEnd - service.ActivatedAt.Value).Days;
            baseFee = Math.Round(plan.BaseMonthlyFee * activeDays / totalDays, 2);
            result.IsProrated = true;
            result.ProratedDays = activeDays;
            result.TotalDays = totalDays;
        }

        result.LineItems.Add(new RatingLineItem
        {
            Description = $"{plan.Name} - Monthly Fee",
            ChargeType = "BaseFee",
            Quantity = 1,
            UnitPrice = baseFee,
            Amount = baseFee
        });
        result.BaseFee = baseFee;

        // Calculate usage charges
        if (usageRecords != null && !string.IsNullOrEmpty(plan.UsageTiers))
        {
            var usageCharges = CalculateUsageCharges(plan, usageRecords.ToList());
            result.UsageCharges = usageCharges;

            if (usageCharges > 0)
            {
                result.LineItems.Add(new RatingLineItem
                {
                    Description = "Usage Charges",
                    ChargeType = "UsageCharge",
                    Quantity = 1,
                    UnitPrice = usageCharges,
                    Amount = usageCharges
                });
            }
        }

        // Calculate discounts
        var subtotal = result.BaseFee + result.UsageCharges;
        var discount = 0m;

        if (plan.DiscountPercentage > 0)
        {
            discount = Math.Round(subtotal * plan.DiscountPercentage / 100, 2);
        }
        else if (plan.DiscountFixedAmount > 0)
        {
            discount = plan.DiscountFixedAmount;
        }

        if (discount > 0)
        {
            result.Discounts = discount;
            result.LineItems.Add(new RatingLineItem
            {
                Description = "Discount",
                ChargeType = "Discount",
                Quantity = 1,
                UnitPrice = -discount,
                Amount = -discount
            });
        }

        // Calculate taxes
        var taxableAmount = subtotal - discount;
        if (plan.TaxPercentage > 0)
        {
            result.Taxes = Math.Round(taxableAmount * plan.TaxPercentage / 100, 2);
            result.LineItems.Add(new RatingLineItem
            {
                Description = $"Tax ({plan.TaxPercentage}%)",
                ChargeType = "Tax",
                Quantity = 1,
                UnitPrice = result.Taxes,
                Amount = result.Taxes
            });
        }

        result.TotalAmount = taxableAmount + result.Taxes;

        return Task.FromResult(result);
    }

    public Task<decimal> CalculateProratedAmountAsync(
        PricePlan plan,
        DateTime activationDate,
        DateTime billingPeriodStart,
        DateTime billingPeriodEnd,
        bool isActivation = true,
        CancellationToken cancellationToken = default)
    {
        var totalDays = (billingPeriodEnd - billingPeriodStart).Days;

        if (isActivation)
        {
            var activeDays = (billingPeriodEnd - activationDate).Days;
            return Task.FromResult(Math.Round(plan.BaseMonthlyFee * activeDays / totalDays, 2));
        }
        else
        {
            var activeDays = (activationDate - billingPeriodStart).Days;
            return Task.FromResult(Math.Round(plan.BaseMonthlyFee * activeDays / totalDays, 2));
        }
    }

    private static decimal CalculateUsageCharges(PricePlan plan, List<UsageRecord> usageRecords)
    {
        try
        {
            var tiers = JsonSerializer.Deserialize<List<UsageTier>>(plan.UsageTiers!);
            if (tiers == null || tiers.Count == 0) return 0;

            var totalUsage = usageRecords.Sum(u => u.Quantity);
            var totalCharge = 0m;
            var remainingUsage = totalUsage;

            foreach (var tier in tiers.OrderBy(t => t.From))
            {
                if (remainingUsage <= 0) break;

                var tierUsage = tier.To.HasValue
                    ? Math.Min(remainingUsage, tier.To.Value - tier.From)
                    : remainingUsage;

                totalCharge += tierUsage * tier.Rate;
                remainingUsage -= tierUsage;
            }

            return Math.Round(totalCharge, 2);
        }
        catch
        {
            return 0;
        }
    }

    private class UsageTier
    {
        public decimal From { get; set; }
        public decimal? To { get; set; }
        public decimal Rate { get; set; }
    }
}
