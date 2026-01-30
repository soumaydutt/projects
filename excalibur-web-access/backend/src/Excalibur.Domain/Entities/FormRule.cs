namespace Excalibur.Domain.Entities;

public class FormRule : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string FormType { get; set; } = string.Empty; // Account, Service, SwitchAction, etc.
    public string RuleDefinition { get; set; } = string.Empty; // JSON rules
    public int Priority { get; set; } = 100;
    public bool IsActive { get; set; } = true;

    // Conditions (JSON)
    // Example: [{"field": "planType", "operator": "==", "value": "Prepaid"}]
    public string Conditions { get; set; } = "[]";

    // Actions (JSON)
    // Example: [{"type": "disable", "target": "creditLimit"}, {"type": "require", "target": "reason"}]
    public string Actions { get; set; } = "[]";
}
