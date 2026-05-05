

using FluentValidation;
using Application.DTOs;

namespace Application.Validators;


using FluentValidation;
using System.Text.RegularExpressions;

public class IngestLogValidator : AbstractValidator<IngestLogRequest>
{
    public IngestLogValidator()
    {
        RuleFor(x => x.StatusCode)
            .InclusiveBetween(100, 599);

        RuleFor(x => x.ResponseTimeMs)
            .InclusiveBetween(0, 300000);

        RuleFor(x => x.Endpoint)
            .NotEmpty()
            .MaximumLength(2048)
            .Must(BeSafeEndpoint)
            .WithMessage("Unsafe or invalid endpoint.");

        RuleFor(x => x.Timestamp)
            .LessThanOrEqualTo(DateTime.UtcNow.AddMinutes(5));
    }

    private bool BeValidMethod(string method)
    {
        var allowed = new[] { "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS" };
        return allowed.Contains(method.ToUpper());
    }

    private bool BeSafeEndpoint(string endpoint)
    {
        if (endpoint.StartsWith("javascript:", StringComparison.OrdinalIgnoreCase))
            return false;

        if (endpoint.StartsWith("file:", StringComparison.OrdinalIgnoreCase))
            return false;

        if (Uri.TryCreate(endpoint, UriKind.Absolute, out var uri))
        {
            var host = uri.Host.ToLower();

            if (host == "localhost" || host.StartsWith("127.") || host.StartsWith("10.") ||
                host.StartsWith("192.168.") || host.StartsWith("169.254."))
                return false;
        }

        return true;
    }
}