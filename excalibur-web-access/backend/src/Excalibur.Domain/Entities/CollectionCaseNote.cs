using Excalibur.Domain.Enums;

namespace Excalibur.Domain.Entities;

public class CollectionCaseNote : BaseEntity
{
    public Guid CollectionCaseId { get; set; }
    public string Note { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public ContactType ContactType { get; set; }
    public bool IsInternal { get; set; } = true;
    public Guid CreatedById { get; set; }

    // Navigation properties
    public virtual CollectionCase CollectionCase { get; set; } = null!;
    public virtual User CreatedByUser { get; set; } = null!;
}
