using System.Collections.Concurrent;
using Excalibur.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace Excalibur.Infrastructure.Services;

/// <summary>
/// In-memory cache implementation using IMemoryCache
/// </summary>
public class MemoryCacheService : ICacheService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<MemoryCacheService> _logger;
    private readonly ConcurrentDictionary<string, bool> _keys;
    private static readonly TimeSpan DefaultExpiration = TimeSpan.FromMinutes(5);

    public MemoryCacheService(IMemoryCache cache, ILogger<MemoryCacheService> logger)
    {
        _cache = cache;
        _logger = logger;
        _keys = new ConcurrentDictionary<string, bool>();
    }

    public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (_cache.TryGetValue(key, out T? value))
        {
            _logger.LogDebug("Cache hit for key: {CacheKey}", key);
            return Task.FromResult(value);
        }

        _logger.LogDebug("Cache miss for key: {CacheKey}", key);
        return Task.FromResult<T?>(default);
    }

    public Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var options = new MemoryCacheEntryOptions()
            .SetAbsoluteExpiration(expiration ?? DefaultExpiration)
            .SetSlidingExpiration(TimeSpan.FromMinutes(1))
            .RegisterPostEvictionCallback((evictedKey, _, reason, _) =>
            {
                _keys.TryRemove(evictedKey.ToString()!, out _);
                _logger.LogDebug("Cache entry evicted: {CacheKey}, Reason: {Reason}", evictedKey, reason);
            });

        _cache.Set(key, value, options);
        _keys.TryAdd(key, true);

        _logger.LogDebug("Cache set for key: {CacheKey}, Expiration: {Expiration}", key, expiration ?? DefaultExpiration);

        return Task.CompletedTask;
    }

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        _cache.Remove(key);
        _keys.TryRemove(key, out _);

        _logger.LogDebug("Cache removed for key: {CacheKey}", key);

        return Task.CompletedTask;
    }

    public Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var keysToRemove = _keys.Keys.Where(k => k.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)).ToList();

        foreach (var key in keysToRemove)
        {
            _cache.Remove(key);
            _keys.TryRemove(key, out _);
        }

        _logger.LogDebug("Cache removed {Count} keys with prefix: {Prefix}", keysToRemove.Count, prefix);

        return Task.CompletedTask;
    }

    public Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var exists = _cache.TryGetValue(key, out _);
        return Task.FromResult(exists);
    }

    public async Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (_cache.TryGetValue(key, out T? value) && value is not null)
        {
            _logger.LogDebug("Cache hit for key: {CacheKey}", key);
            return value;
        }

        _logger.LogDebug("Cache miss for key: {CacheKey}, creating value", key);

        value = await factory();

        await SetAsync(key, value, expiration, cancellationToken);

        return value;
    }
}
