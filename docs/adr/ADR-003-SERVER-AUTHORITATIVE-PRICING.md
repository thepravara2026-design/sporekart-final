# ADR-003: Server-Authoritative Pricing and Inventory Validation

## Status
Accepted

## Context
E-commerce applications are susceptible to price tampering attacks if unit prices or total amounts supplied by frontend client payloads are trusted.

## Decision
Client payloads are permitted to send only variant IDs and requested quantities (`variantId`, `quantity`). The `OrderApplicationService` interacts with `CatalogApplicationService.validateAndGetVariant()` to query the authoritative unit price, product title, and stock availability directly from the server database. Frontend unit prices are completely ignored.

## Consequences
- **Positive**: 100% prevention of price manipulation attacks, guaranteed inventory consistency.
- **Negative**: Requires a database lookup during order creation.
