# ADR-001: Adoption of Modular Monolith Architecture

## Status
Accepted

## Context
Sporekart requires a maintainable, high-performance e-commerce and certified training platform. Introducing microservices prematurely adds significant operational complexity (distributed tracing, network latency, multi-repo synchronization, deployment overhead).

## Decision
We adopt a **Modular Monolith** architecture pattern in Java 21 + Spring Boot 3.3+.
The backend is structured into 14 explicit bounded contexts (`identity`, `customer`, `catalog`, `cart`, `order`, `payment`, `shipping`, `training`, `media`, `content`, `support`, `admin`, `analytics`, `shared`).
Each context maintains strict internal sub-packages (`api`, `application`, `domain`, `infrastructure`). Inter-module communication occurs exclusively via public application services or Spring `ApplicationEvent` domain events. Cross-module direct JPA repository access is forbidden.

## Consequences
- **Positive**: Simplified single-artifact deployment, rapid local development, zero network RPC latency between domain contexts, enforced module boundaries validated via ArchUnit tests.
- **Negative**: Requires discipline to prevent developers from bypassing package boundaries.
