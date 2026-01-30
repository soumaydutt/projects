using System.Diagnostics;
using System.Text;

namespace Excalibur.Api.Middleware;

/// <summary>
/// Middleware for detailed request/response logging
/// </summary>
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;
    private readonly IHostEnvironment _env;

    private static readonly HashSet<string> SensitiveHeaders = new(StringComparer.OrdinalIgnoreCase)
    {
        "Authorization",
        "Cookie",
        "X-Api-Key",
        "X-Auth-Token"
    };

    private static readonly HashSet<string> SensitiveFields = new(StringComparer.OrdinalIgnoreCase)
    {
        "password",
        "secret",
        "token",
        "apikey",
        "api_key",
        "credit_card",
        "creditcard",
        "ssn",
        "social_security"
    };

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Items["CorrelationId"]?.ToString() ?? Guid.NewGuid().ToString();
        var stopwatch = Stopwatch.StartNew();

        // Log request
        await LogRequest(context, correlationId);

        // Capture original response body stream
        var originalBodyStream = context.Response.Body;

        using var responseBody = new MemoryStream();
        context.Response.Body = responseBody;

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();

            // Log response
            await LogResponse(context, correlationId, stopwatch.ElapsedMilliseconds);

            // Copy the response body to the original stream
            responseBody.Seek(0, SeekOrigin.Begin);
            await responseBody.CopyToAsync(originalBodyStream);
        }
    }

    private async Task LogRequest(HttpContext context, string correlationId)
    {
        var request = context.Request;

        var logData = new
        {
            CorrelationId = correlationId,
            Method = request.Method,
            Path = request.Path.Value,
            QueryString = request.QueryString.HasValue ? MaskSensitiveQueryParams(request.QueryString.Value) : null,
            Headers = GetSafeHeaders(request.Headers),
            ContentType = request.ContentType,
            ContentLength = request.ContentLength,
            ClientIp = GetClientIp(context),
            UserAgent = request.Headers.UserAgent.ToString(),
            UserId = context.User?.Identity?.Name
        };

        if (_env.IsDevelopment() && request.ContentLength > 0 && request.ContentLength < 10000)
        {
            request.EnableBuffering();
            var body = await ReadRequestBody(request);
            _logger.LogInformation("Request: {@Request}, Body: {Body}", logData, MaskSensitiveFields(body));
            request.Body.Position = 0;
        }
        else
        {
            _logger.LogInformation("Request: {@Request}", logData);
        }
    }

    private async Task LogResponse(HttpContext context, string correlationId, long elapsedMs)
    {
        var response = context.Response;

        var logData = new
        {
            CorrelationId = correlationId,
            StatusCode = response.StatusCode,
            ContentType = response.ContentType,
            ContentLength = response.ContentLength,
            ElapsedMs = elapsedMs
        };

        var logLevel = response.StatusCode switch
        {
            >= 500 => LogLevel.Error,
            >= 400 => LogLevel.Warning,
            _ => LogLevel.Information
        };

        if (_env.IsDevelopment() && response.StatusCode >= 400)
        {
            response.Body.Seek(0, SeekOrigin.Begin);
            var body = await new StreamReader(response.Body).ReadToEndAsync();
            response.Body.Seek(0, SeekOrigin.Begin);
            _logger.Log(logLevel, "Response: {@Response}, Body: {Body}", logData, body);
        }
        else
        {
            _logger.Log(logLevel, "Response: {@Response}", logData);
        }
    }

    private static async Task<string> ReadRequestBody(HttpRequest request)
    {
        request.Body.Position = 0;
        using var reader = new StreamReader(request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true);
        return await reader.ReadToEndAsync();
    }

    private static Dictionary<string, string> GetSafeHeaders(IHeaderDictionary headers)
    {
        var safeHeaders = new Dictionary<string, string>();

        foreach (var header in headers)
        {
            if (SensitiveHeaders.Contains(header.Key))
            {
                safeHeaders[header.Key] = "[REDACTED]";
            }
            else
            {
                safeHeaders[header.Key] = header.Value.ToString();
            }
        }

        return safeHeaders;
    }

    private static string? MaskSensitiveQueryParams(string? queryString)
    {
        if (string.IsNullOrEmpty(queryString))
            return queryString;

        var parts = queryString.TrimStart('?').Split('&');
        var maskedParts = parts.Select(part =>
        {
            var keyValue = part.Split('=', 2);
            if (keyValue.Length == 2 && SensitiveFields.Contains(keyValue[0]))
            {
                return $"{keyValue[0]}=[REDACTED]";
            }
            return part;
        });

        return "?" + string.Join("&", maskedParts);
    }

    private static string MaskSensitiveFields(string body)
    {
        if (string.IsNullOrEmpty(body))
            return body;

        foreach (var field in SensitiveFields)
        {
            // Simple regex-like replacement for JSON fields
            var pattern = $"\"{field}\"\\s*:\\s*\"[^\"]*\"";
            body = System.Text.RegularExpressions.Regex.Replace(
                body,
                pattern,
                $"\"{field}\":\"[REDACTED]\"",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        }

        return body;
    }

    private static string GetClientIp(HttpContext context)
    {
        // Check for forwarded headers (behind proxy/load balancer)
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            return forwardedFor.Split(',').First().Trim();
        }

        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}
