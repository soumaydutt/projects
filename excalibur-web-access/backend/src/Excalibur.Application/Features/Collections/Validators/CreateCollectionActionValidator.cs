using FluentValidation;
using Excalibur.Application.Features.Collections.Commands;
using Excalibur.Domain.Enums;

namespace Excalibur.Application.Features.Collections.Validators;

public class CreateCollectionActionValidator : AbstractValidator<CreateCollectionActionCommand>
{
    public CreateCollectionActionValidator()
    {
        RuleFor(x => x.AccountId)
            .NotEmpty().WithMessage("Account is required");

        RuleFor(x => x.ActionType)
            .IsInEnum().WithMessage("Invalid collection action type");

        RuleFor(x => x.Notes)
            .NotEmpty().WithMessage("Notes are required")
            .MaximumLength(2000).WithMessage("Notes cannot exceed 2000 characters");

        RuleFor(x => x.FollowUpDate)
            .GreaterThan(DateTime.UtcNow).WithMessage("Follow-up date must be in the future")
            .LessThanOrEqualTo(DateTime.UtcNow.AddYears(1)).WithMessage("Follow-up date cannot be more than 1 year in the future")
            .When(x => x.FollowUpDate.HasValue);

        // Promise to Pay validations
        RuleFor(x => x.PromisedAmount)
            .NotNull().WithMessage("Promised amount is required for Promise to Pay actions")
            .GreaterThan(0).WithMessage("Promised amount must be greater than zero")
            .LessThanOrEqualTo(1000000).WithMessage("Promised amount cannot exceed $1,000,000")
            .When(x => x.ActionType == CollectionActionType.PromiseToPay);

        RuleFor(x => x.PromisedDate)
            .NotNull().WithMessage("Promised date is required for Promise to Pay actions")
            .GreaterThan(DateTime.UtcNow).WithMessage("Promised date must be in the future")
            .LessThanOrEqualTo(DateTime.UtcNow.AddMonths(6)).WithMessage("Promised date cannot be more than 6 months in the future")
            .When(x => x.ActionType == CollectionActionType.PromiseToPay);

        RuleFor(x => x.ContactMethod)
            .NotEmpty().WithMessage("Contact method is required for contact-related actions")
            .MaximumLength(50).WithMessage("Contact method cannot exceed 50 characters")
            .When(x => IsContactAction(x.ActionType));

        RuleFor(x => x.ContactedPerson)
            .MaximumLength(100).WithMessage("Contacted person cannot exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.ContactedPerson));
    }

    private static bool IsContactAction(CollectionActionType actionType)
    {
        return actionType is CollectionActionType.PhoneCall
            or CollectionActionType.Email
            or CollectionActionType.Letter
            or CollectionActionType.SMS;
    }
}
