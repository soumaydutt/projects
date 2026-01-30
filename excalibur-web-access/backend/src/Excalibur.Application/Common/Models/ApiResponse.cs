namespace Excalibur.Application.Common.Models;

/// <summary>
/// Standardized API response wrapper
/// </summary>
public class ApiResponse<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public string? Message { get; init; }
    public IEnumerable<string>? Errors { get; init; }
    public Dictionary<string, object>? Metadata { get; init; }

    public static ApiResponse<T> Ok(T data, string? message = null) => new()
    {
        Success = true,
        Data = data,
        Message = message
    };

    public static ApiResponse<T> Ok(T data, Dictionary<string, object> metadata) => new()
    {
        Success = true,
        Data = data,
        Metadata = metadata
    };

    public static ApiResponse<T> Fail(string message) => new()
    {
        Success = false,
        Message = message
    };

    public static ApiResponse<T> Fail(IEnumerable<string> errors) => new()
    {
        Success = false,
        Errors = errors
    };

    public static ApiResponse<T> Fail(string message, IEnumerable<string> errors) => new()
    {
        Success = false,
        Message = message,
        Errors = errors
    };
}

/// <summary>
/// Non-generic API response for operations without return data
/// </summary>
public class ApiResponse
{
    public bool Success { get; init; }
    public string? Message { get; init; }
    public IEnumerable<string>? Errors { get; init; }

    public static ApiResponse Ok(string? message = null) => new()
    {
        Success = true,
        Message = message
    };

    public static ApiResponse Fail(string message) => new()
    {
        Success = false,
        Message = message
    };

    public static ApiResponse Fail(IEnumerable<string> errors) => new()
    {
        Success = false,
        Errors = errors
    };
}

/// <summary>
/// Paginated response wrapper
/// </summary>
public class PaginatedResponse<T>
{
    public IEnumerable<T> Items { get; init; } = Enumerable.Empty<T>();
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalCount { get; init; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPreviousPage => Page > 1;
    public bool HasNextPage => Page < TotalPages;

    public static PaginatedResponse<T> Create(IEnumerable<T> items, int page, int pageSize, int totalCount)
    {
        return new PaginatedResponse<T>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }
}
