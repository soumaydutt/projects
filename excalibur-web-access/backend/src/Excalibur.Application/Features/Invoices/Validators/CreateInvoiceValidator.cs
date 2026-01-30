using FluentValidation;
using Excalibur.Application.Features.Invoices.Commands;

namespace Excalibur.Application.Features.Invoices.Validators;

public class CreateInvoiceValidator : AbstractValidator<CreateInvoiceCommand>
{
    public CreateInvoiceValidator()
    {
        RuleFor(x => x.AccountId)
            .NotEmpty().WithMessage("Account is required");

        RuleFor(x => x.InvoiceDate)
            .LessThanOrEqualTo(DateTime.UtcNow.AddDays(1))
            .WithMessage("Invoice date cannot be in the future")
            .When(x => x.InvoiceDate.HasValue);

        RuleFor(x => x.DueDate)
            .GreaterThanOrEqualTo(x => x.InvoiceDate ?? DateTime.UtcNow)
            .WithMessage("Due date must be on or after the invoice date")
            .When(x => x.DueDate.HasValue);

        RuleFor(x => x.LineItems)
            .NotEmpty().WithMessage("At least one line item is required")
            .Must(items => items.Count <= 100).WithMessage("Cannot exceed 100 line items per invoice");

        RuleForEach(x => x.LineItems).SetValidator(new InvoiceLineItemValidator());

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Notes cannot exceed 1000 characters")
            .When(x => !string.IsNullOrEmpty(x.Notes));
    }
}

public class InvoiceLineItemValidator : AbstractValidator<InvoiceLineItemDto>
{
    public InvoiceLineItemValidator()
    {
        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Line item description is required")
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than zero")
            .LessThanOrEqualTo(10000).WithMessage("Quantity cannot exceed 10,000");

        RuleFor(x => x.UnitPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Unit price cannot be negative")
            .LessThanOrEqualTo(1000000).WithMessage("Unit price cannot exceed $1,000,000");

        RuleFor(x => x.ServiceCode)
            .MaximumLength(50).WithMessage("Service code cannot exceed 50 characters")
            .Matches(@"^[A-Z0-9\-]+$").WithMessage("Service code can only contain uppercase letters, numbers, and hyphens")
            .When(x => !string.IsNullOrEmpty(x.ServiceCode));
    }
}
