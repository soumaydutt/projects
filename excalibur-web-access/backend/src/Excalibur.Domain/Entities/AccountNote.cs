namespace Excalibur.Domain.Entities;

public class AccountNote : BaseEntity
{
    public Guid AccountId { get; set; }
    public string Note { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public bool IsImportant { get; set; } = false;
    public bool IsInternal { get; set; } = true;

    // Navigation properties
    public virtual Account Account { get; set; } = null!;
}
