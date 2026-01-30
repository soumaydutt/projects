using FluentValidation;
using Excalibur.Application.Features.Accounts.Commands;

namespace Excalibur.Application.Features.Accounts.Validators;

public class UpdateAccountValidator : AbstractValidator<UpdateAccountCommand>
{
    public UpdateAccountValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Account ID is required");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(200).WithMessage("Name cannot exceed 200 characters")
            .Matches(@"^[\w\s\.\-\&\,\']+$").WithMessage("Name contains invalid characters");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email address")
            .MaximumLength(256).WithMessage("Email cannot exceed 256 characters");

        RuleFor(x => x.Phone)
            .Matches(@"^[\d\s\-\(\)\+\.]+$").WithMessage("Invalid phone number format")
            .MaximumLength(20).WithMessage("Phone cannot exceed 20 characters")
            .When(x => !string.IsNullOrEmpty(x.Phone));

        RuleFor(x => x.Address1)
            .MaximumLength(200).WithMessage("Address cannot exceed 200 characters")
            .When(x => !string.IsNullOrEmpty(x.Address1));

        RuleFor(x => x.Address2)
            .MaximumLength(200).WithMessage("Address line 2 cannot exceed 200 characters")
            .When(x => !string.IsNullOrEmpty(x.Address2));

        RuleFor(x => x.City)
            .MaximumLength(100).WithMessage("City cannot exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.City));

        RuleFor(x => x.State)
            .MaximumLength(50).WithMessage("State cannot exceed 50 characters")
            .When(x => !string.IsNullOrEmpty(x.State));

        RuleFor(x => x.ZipCode)
            .Matches(@"^\d{5}(-\d{4})?$").WithMessage("Invalid ZIP code format")
            .When(x => !string.IsNullOrEmpty(x.ZipCode));

        RuleFor(x => x.CreditLimit)
            .GreaterThanOrEqualTo(0).WithMessage("Credit limit cannot be negative")
            .LessThanOrEqualTo(1000000).WithMessage("Credit limit cannot exceed $1,000,000")
            .When(x => x.CreditLimit.HasValue);
    }
}
