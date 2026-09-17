# ADR-002: Standardized API Response and Production-Safe Error Structure

## Status
Accepted

## Context
Client applications (React frontend, mobile apps) need a predictable, uniform JSON structure for handling API responses and error messages across all endpoints, along with request tracing capabilities.

## Decision
All REST API endpoints will return responses wrapping the `ApiResponse<T>` contract.

### Success Response Specification:
```json
{
  "success": true,
  "data": {},
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Error Response Specification:
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product was not found",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

Every incoming request passes through `RequestIdFilter` which injects/generates a unique `X-Request-ID` header and populates SLF4J MDC context for structured logging. Stack traces are strictly masked in production (`GlobalExceptionHandler`).

## Consequences
- **Positive**: Consistent frontend error handling, instant end-to-end request tracing across logs, zero stack trace leakage to external clients.
- **Negative**: Adds a thin wrapper around API response payloads.
