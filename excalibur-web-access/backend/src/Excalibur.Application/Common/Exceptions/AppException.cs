namespace Excalibur.Application.Common.Exceptions;

/// <summary>
/// Base exception for application-level errors
/// </summary>
public class AppException : Exception
{
    public string Code { get; }
    public int StatusCode { get; }

    public AppException(string message, string code = "APP_ERROR", int statusCode = 400)
        : base(message)
    {
        Code = code;
        StatusCode = statusCode;
    }

    public AppException(string message, Exception innerException, string code = "APP_ERROR", int statusCode = 400)
        : base(message, innerException)
    {
        Code = code;
        StatusCode = statusCode;
    }
}

/// <summary>
/// Exception thrown when a requested resource is not found
/// </summary>
public class NotFoundException : AppException
{
    public NotFoundException(string resourceName, object key)
        : base($"{resourceName} with key '{key}' was not found.", "NOT_FOUND", 404)
    {
    }

    public NotFoundException(string message)
        : base(message, "NOT_FOUND", 404)
    {
    }
}

/// <summary>
/// Exception thrown when validation fails
/// </summary>
public class ValidationException : AppException
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationException()
        : base("One or more validation errors occurred.", "VALIDATION_ERROR", 400)
    {
        Errors = new Dictionary<string, string[]>();
    }

    public ValidationException(IEnumerable<FluentValidation.Results.ValidationFailure> failures)
        : this()
    {
        Errors = failures
            .GroupBy(e => e.PropertyName, e => e.ErrorMessage)
            .ToDictionary(g => g.Key, g => g.ToArray());
    }

    public ValidationException(string propertyName, string errorMessage)
        : this()
    {
        Errors = new Dictionary<string, string[]>
        {
            { propertyName, new[] { errorMessage } }
        };
    }
}

/// <summary>
/// Exception thrown when user is not authorized
/// </summary>
public class UnauthorizedException : AppException
{
    public UnauthorizedException(string message = "You are not authorized to perform this action.")
        : base(message, "UNAUTHORIZED", 401)
    {
    }
}

/// <summary>
/// Exception thrown when user doesn't have required permissions
/// </summary>
public class ForbiddenException : AppException
{
    public ForbiddenException(string message = "You do not have permission to perform this action.")
        : base(message, "FORBIDDEN", 403)
    {
    }
}

/// <summary>
/// Exception thrown when there's a conflict with existing data
/// </summary>
public class ConflictException : AppException
{
    public ConflictException(string message)
        : base(message, "CONFLICT", 409)
    {
    }
}

/// <summary>
/// Exception thrown when a business rule is violated
/// </summary>
public class BusinessRuleException : AppException
{
    public BusinessRuleException(string message)
        : base(message, "BUSINESS_RULE_VIOLATION", 422)
    {
    }
}
