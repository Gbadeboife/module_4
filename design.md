# Design Documentation

## Architecture Overview

This microservice is designed for high-concurrency, multi-event ticket sales. It uses Node.js/Express for the API, Redis for atomic ticket management, and an in-memory fallback for resilience. Metrics are exposed for Prometheus scraping. PDF receipts are generated for each successful purchase.

## Key Components

- **API Layer:** Express routes for ticket purchase and metrics.
- **Ticket Store:** Redis lists per event (`event:{eventId}:tickets`), with atomic Lua script for purchase.
- **Fallback:** In-memory store is used if Redis is unavailable, with clear logging and warnings.
- **Metrics:** Tracks tickets sold, remaining, errors, and fallback activations.
- **PDF Generation:** Each successful purchase triggers a PDF receipt (see implementation).

## Scalability & Bottlenecks

- **Redis Lua Script:** Ensures atomicity and prevents overselling under high concurrency.
- **Horizontal Scaling:** Stateless API allows for multiple instances behind a load balancer.
- **Fallback Limitations:** In-memory fallback is non-persistent and not suitable for production, but ensures demo resilience.
- **Metrics:** Prometheus endpoint allows for real-time monitoring and alerting.

## Fallback Strategy

- On Redis failure, the system logs a warning and switches to in-memory ticket pools.
- All fallback activations and errors are logged and exposed via metrics.
- The fallback store is seeded from Redis if possible, or starts empty.

## PDF Ticket Generation

- On each successful purchase, a PDF receipt is generated and returned or saved (see code for details).
- Uses `pdfkit` for fast, server-side PDF creation.

## Extensibility

- Add more events by updating the seeding script.
- Add more metrics or endpoints as needed.
- Swap in a persistent fallback (e.g., file or database) for production.

---
