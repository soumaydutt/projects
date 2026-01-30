namespace Excalibur.Application.Common.Models;

public class Result
{
    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public string? Error { get; }
    public List<string> Errors { get; } = new();

    protected Result(bool isSuccess, string? error)
    {
        IsSuccess = isSuccess;
        Error = error;
        if (error != null)
            Errors.Add(error);
    }

    protected Result(bool isSuccess, List<string> errors)
    {
        IsSuccess = isSuccess;
        Errors = errors;
        Error = errors.FirstOrDefault();
    }

    public static Result Success() => new(true, (string?)null);
    public static Result Failure(string error) => new(false, error);
    public static Result Failure(List<string> errors) => new(false, errors);

    public static Result<T> Success<T>(T value) => Result<T>.Success(value);
    public static Result<T> Failure<T>(string error) => Result<T>.Failure(error);
}

public class Result<T> : Result
{
    public T? Value { get; }

    private Result(T value) : base(true, (string?)null)
    {
        Value = value;
    }

    private Result(string error) : base(false, error)
    {
        Value = default;
    }

    private Result(List<string> errors) : base(false, errors)
    {
        Value = default;
    }

    public static Result<T> Success(T value) => new(value);
    public static new Result<T> Failure(string error) => new(error);
    public static new Result<T> Failure(List<string> errors) => new(errors);
}
