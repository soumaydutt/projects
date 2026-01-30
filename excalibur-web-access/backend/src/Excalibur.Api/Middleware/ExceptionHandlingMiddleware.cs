using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Excalibur.Application.Common.Exceptions;

namespace Excalibur.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var correlationId = context.Items["CorrelationId"]?.ToString() ?? Guid.NewGuid().ToString();

        // Log with appropriate level based on exception type
        LogException(exception, correlationId);

        context.Response.ContentType = "application/problem+json";

        var problemDetails = CreateProblemDetails(exception, correlationId);

        context.Response.StatusCode = problemDetails.Status ?? 500;

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = _env.IsDevelopment()
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, options));
    }

    private void LogException(Exception exception, string correlationId)
    {
        var logLevel = exception switch
        {
            NotFoundException => LogLevel.Warning,
            ValidationException => LogLevel.Warning,
            UnauthorizedException => LogLevel.Warning,
            ForbiddenException => LogLevel.Warning,
            BusinessRuleException => LogLevel.Warning,
            ConflictException => LogLevel.Warning,
            _ => LogLevel.Error
        };

        _logger.Log(logLevel, exception,
            "Exception occurred. CorrelationId: {CorrelationId}, Type: {ExceptionType}, Message: {Message}",
            correlationId, exception.GetType().Name, exception.Message);
    }

    private ProblemDetails CreateProblemDetails(Exception exception, string correlationId)
    {
        var problemDetails = exception switch
        {
            ValidationException validationEx => new ValidationProblemDetails(validationEx.Errors)
            {
                Status = validationEx.StatusCode,
                Title = "Validation Error",
                Detail = validationEx.Message,
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1"
            },
            NotFoundException notFoundEx => new ProblemDetails
            {
                Status = notFoundEx.StatusCode,
                Title = "Resource Not Found",
                Detail = notFoundEx.Message,
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.4"
            },
            UnauthorizedException unauthorizedEx => new ProblemDetails
            {
                Status = unauthorizedEx.StatusCode,
                Title = "Unauthorized",
                Detail = unauthorizedEx.Message,
                Type = "https://tools.ietf.org/html/rfc7235#section-3.1"
            },
            ForbiddenException forbiddenEx => new ProblemDetails
            {
                Status = forbiddenEx.StatusCode,
                Title = "Forbidden",
                Detail = forbiddenEx.Message,
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.3"
            },
            ConflictException conflictEx => new ProblemDetails
            {
                Status = conflictEx.StatusCode,
                Title = "Conflict",
                Detail = conflictEx.Message,
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.8"
            },
            BusinessRuleException businessEx => new ProblemDetails
            {
                Status = businessEx.StatusCode,
                Title = "Business Rule Violation",
                Detail = businessEx.Message,
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1"
            },
            AppException appEx => new ProblemDetails
            {
                Status = appEx.StatusCode,
                Title = "Application Error",
                Detail = appEx.Message
            },
            UnauthorizedAccessException => new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Unauthorized",
                Detail = exception.Message,
                Type = "https://tools.ietf.org/html/rfc7235#section-3.1"
            },
            ArgumentException => new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Bad Request",
                Detail = exception.Message,
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1"
            },
            KeyNotFoundException => new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Not Found",
                Detail = exception.Message,
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.4"
            },
            OperationCanceledException => new ProblemDetails
            {
                Status = StatusCodes.Status499ClientClosedRequest,
                Title = "Request Cancelled",
                Detail = "The request was cancelled by the client."
            },
            _ => new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Internal Server Error",
                Detail = _env.IsDevelopment() ? exception.Message : "An unexpected error occurred.",
                Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1"
            }
        };

        problemDetails.Extensions["correlationId"] = correlationId;
        problemDetails.Extensions["timestamp"] = DateTime.UtcNow.ToString("O");

        if (_env.IsDevelopment() && exception is not AppException)
        {
            problemDetails.Extensions["stackTrace"] = exception.StackTrace;
        }

        return problemDetails;
    }
}

public class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers["X-Correlation-ID"].FirstOrDefault()
            ?? Guid.NewGuid().ToString();

        context.Items["CorrelationId"] = correlationId;
        context.Response.Headers["X-Correlation-ID"] = correlationId;

        using (Serilog.Context.LogContext.PushProperty("CorrelationId", correlationId))
        {
            await _next(context);
        }
    }
}
