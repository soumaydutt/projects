namespace Excalibur.Domain.Entities;

public class AccountAttachment : BaseEntity
{
    public Guid AccountId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = "General";

    // Navigation properties
    public virtual Account Account { get; set; } = null!;
}
