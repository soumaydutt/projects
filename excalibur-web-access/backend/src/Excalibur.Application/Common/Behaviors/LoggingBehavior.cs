using System.Diagnostics;
using MediatR;
using Microsoft.Extensions.Logging;
using Excalibur.Application.Common.Interfaces;

namespace Excalibur.Application.Common.Behaviors;

/// <summary>
/// MediatR pipeline behavior for logging requests and performance
/// </summary>
public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;
    private readonly ICurrentUserService _currentUserService;

    public LoggingBehavior(
        ILogger<LoggingBehavior<TRequest, TResponse>> logger,
        ICurrentUserService currentUserService)
    {
        _logger = logger;
        _currentUserService = currentUserService;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        var userId = _currentUserService.UserId?.ToString() ?? "Anonymous";

        _logger.LogInformation(
            "Handling {RequestName} for User {UserId}",
            requestName,
            userId);

        var stopwatch = Stopwatch.StartNew();

        try
        {
            var response = await next();

            stopwatch.Stop();

            if (stopwatch.ElapsedMilliseconds > 500)
            {
                _logger.LogWarning(
                    "Long running request: {RequestName} ({ElapsedMilliseconds}ms) for User {UserId}",
                    requestName,
                    stopwatch.ElapsedMilliseconds,
                    userId);
            }
            else
            {
                _logger.LogInformation(
                    "Handled {RequestName} in {ElapsedMilliseconds}ms",
                    requestName,
                    stopwatch.ElapsedMilliseconds);
            }

            return response;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            _logger.LogError(
                ex,
                "Error handling {RequestName} for User {UserId} after {ElapsedMilliseconds}ms",
                requestName,
                userId,
                stopwatch.ElapsedMilliseconds);

            throw;
        }
    }
}
