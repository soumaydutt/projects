using FluentValidation;
using Excalibur.Application.Features.Accounts.Commands;

namespace Excalibur.Application.Features.Accounts.Validators;

public class CreateAccountValidator : AbstractValidator<CreateAccountCommand>
{
    public CreateAccountValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Account name is required")
            .MaximumLength(200).WithMessage("Account name cannot exceed 200 characters");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Invalid account type");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format")
            .MaximumLength(256).WithMessage("Email cannot exceed 256 characters");

        RuleFor(x => x.Phone)
            .MaximumLength(20).WithMessage("Phone number cannot exceed 20 characters")
            .Matches(@"^[\d\s\-+()]*$").WithMessage("Invalid phone number format")
            .When(x => !string.IsNullOrEmpty(x.Phone));

        RuleFor(x => x.Address1)
            .NotEmpty().WithMessage("Address is required")
            .MaximumLength(200).WithMessage("Address cannot exceed 200 characters");

        RuleFor(x => x.Address2)
            .MaximumLength(200).WithMessage("Address line 2 cannot exceed 200 characters")
            .When(x => !string.IsNullOrEmpty(x.Address2));

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("City is required")
            .MaximumLength(100).WithMessage("City cannot exceed 100 characters");

        RuleFor(x => x.State)
            .NotEmpty().WithMessage("State is required")
            .MaximumLength(50).WithMessage("State cannot exceed 50 characters");

        RuleFor(x => x.ZipCode)
            .NotEmpty().WithMessage("ZIP code is required")
            .Matches(@"^\d{5}(-\d{4})?$").WithMessage("Invalid ZIP code format");

        RuleFor(x => x.CreditLimit)
            .GreaterThanOrEqualTo(0).WithMessage("Credit limit cannot be negative")
            .When(x => x.CreditLimit.HasValue);
    }
}
