using FluentValidation;
using Excalibur.Application.Features.Payments.Commands;

namespace Excalibur.Application.Features.Payments.Validators;

public class CreatePaymentValidator : AbstractValidator<CreatePaymentCommand>
{
    public CreatePaymentValidator()
    {
        RuleFor(x => x.AccountId)
            .NotEmpty().WithMessage("Account is required");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Amount must be greater than zero")
            .LessThanOrEqualTo(1000000).WithMessage("Amount cannot exceed $1,000,000");

        RuleFor(x => x.Method)
            .IsInEnum().WithMessage("Invalid payment method");

        RuleFor(x => x.PaymentDate)
            .LessThanOrEqualTo(DateTime.UtcNow.AddDays(1))
            .WithMessage("Payment date cannot be in the future")
            .When(x => x.PaymentDate.HasValue);

        RuleFor(x => x.CheckNumber)
            .MaximumLength(50).WithMessage("Check number cannot exceed 50 characters")
            .When(x => !string.IsNullOrEmpty(x.CheckNumber));

        RuleFor(x => x.CardLastFour)
            .Matches(@"^\d{4}$").WithMessage("Card last four must be exactly 4 digits")
            .When(x => !string.IsNullOrEmpty(x.CardLastFour));

        RuleFor(x => x.Reference)
            .MaximumLength(100).WithMessage("Reference cannot exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.Reference));

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("Notes cannot exceed 500 characters")
            .When(x => !string.IsNullOrEmpty(x.Notes));
    }
}
