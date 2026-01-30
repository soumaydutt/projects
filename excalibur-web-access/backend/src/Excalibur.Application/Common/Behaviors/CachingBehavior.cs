using MediatR;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace Excalibur.Application.Common.Behaviors;

/// <summary>
/// Marker interface for cacheable queries
/// </summary>
public interface ICacheableQuery
{
    string CacheKey { get; }
    TimeSpan? CacheDuration { get; }
}

/// <summary>
/// MediatR pipeline behavior for caching query results
/// </summary>
public class CachingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<CachingBehavior<TRequest, TResponse>> _logger;
    private static readonly TimeSpan DefaultCacheDuration = TimeSpan.FromMinutes(5);

    public CachingBehavior(IMemoryCache cache, ILogger<CachingBehavior<TRequest, TResponse>> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (request is not ICacheableQuery cacheableQuery)
        {
            return await next();
        }

        var cacheKey = cacheableQuery.CacheKey;

        if (_cache.TryGetValue(cacheKey, out TResponse? cachedResponse) && cachedResponse is not null)
        {
            _logger.LogDebug("Cache hit for {CacheKey}", cacheKey);
            return cachedResponse;
        }

        _logger.LogDebug("Cache miss for {CacheKey}", cacheKey);

        var response = await next();

        var cacheOptions = new MemoryCacheEntryOptions()
            .SetAbsoluteExpiration(cacheableQuery.CacheDuration ?? DefaultCacheDuration)
            .SetSlidingExpiration(TimeSpan.FromMinutes(1));

        _cache.Set(cacheKey, response, cacheOptions);

        return response;
    }
}

/// <summary>
/// Marker interface for commands that should invalidate cache
/// </summary>
public interface ICacheInvalidator
{
    IEnumerable<string> CacheKeysToInvalidate { get; }
}

/// <summary>
/// MediatR pipeline behavior for invalidating cache after commands
/// </summary>
public class CacheInvalidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<CacheInvalidationBehavior<TRequest, TResponse>> _logger;

    public CacheInvalidationBehavior(IMemoryCache cache, ILogger<CacheInvalidationBehavior<TRequest, TResponse>> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var response = await next();

        if (request is ICacheInvalidator invalidator)
        {
            foreach (var key in invalidator.CacheKeysToInvalidate)
            {
                _cache.Remove(key);
                _logger.LogDebug("Invalidated cache key: {CacheKey}", key);
            }
        }

        return response;
    }
}
