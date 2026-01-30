using Excalibur.Domain.Enums;

namespace Excalibur.Domain.Entities;

public class PricePlan : BaseEntity
{
    public string PlanCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ServiceType ServiceType { get; set; }
    public bool IsActive { get; set; } = true;

    // Pricing
    public decimal BaseMonthlyFee { get; set; }
    public decimal SetupFee { get; set; }
    public string CurrencyCode { get; set; } = "USD";

    // Rate card for complex pricing
    public string? RateCardJson { get; set; }

    // Alias properties for compatibility
    public string Code
    {
        get => PlanCode;
        set => PlanCode = value;
    }

    public decimal MonthlyRate
    {
        get => BaseMonthlyFee;
        set => BaseMonthlyFee = value;
    }

    // Usage charges (JSON stored)
    public string? UsageTiers { get; set; } // JSON: [{from: 0, to: 100, rate: 0.05}, {from: 100, to: null, rate: 0.03}]

    // Discounts
    public decimal DiscountPercentage { get; set; } = 0;
    public decimal DiscountFixedAmount { get; set; } = 0;

    // Tax
    public decimal TaxPercentage { get; set; } = 0;

    // Proration
    public bool ProrateOnActivation { get; set; } = true;
    public bool ProrateOnCancellation { get; set; } = true;

    // Contract
    public int? ContractMonths { get; set; }
    public decimal? EarlyTerminationFee { get; set; }

    // Included allowances
    public int? IncludedMinutes { get; set; }
    public int? IncludedSms { get; set; }
    public decimal? IncludedDataGb { get; set; }

    // Speed limits for broadband
    public int? DownloadSpeedMbps { get; set; }
    public int? UploadSpeedMbps { get; set; }

    // Validity
    public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow;
    public DateTime? EffectiveTo { get; set; }

    // Navigation properties
    public virtual ICollection<Service> Services { get; set; } = new List<Service>();
}
