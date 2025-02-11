# Ticket Scaling and Multi-Event Ticketing Microservice Challenge

## Overview

This challenge tests your ability to build a highly scalable, multi-event ticket purchasing microservice that can handle extremely high concurrency. You will design a system that can process purchases for multiple events concurrently while ensuring each ticket is sold only once, even under millions of requests per second. In addition, you'll implement robust error handling, fallback mechanisms, and real-time metrics reporting.

## Task Details

Your task is to extract the high-throughput ticket purchasing component (inspired by the original "Nordin" project) and extend it into a full-featured multi-event system. The service will:

- **Multi-Event Support:** Pre-seed a Redis store with multiple sets of tickets. Each event should have its own ticket pool (e.g., stored with keys like `event:{eventId}:tickets`).
- **API Endpoints:**
  - `POST /buy/:eventId`: Allow a user to purchase a ticket for a specific event.
  - `GET /metrics`: Expose real-time metrics (e.g., tickets sold, available tickets per event) in a format compatible with Prometheus.
- **Atomic Ticket Purchase:** Implement the purchase logic using a Redis Lua script to atomically verify and pop a ticket from the ticket pool. This ensures no duplicate ticket sales even under massive concurrent access.
- **Fallback Mechanism:** If Redis is unavailable or fails during a purchase operation, gracefully fallback to an in-memory store (with appropriate warnings and logs), ensuring the system remains responsive (for demonstration purposes only, as in-memory stores are not persistent).
- **Performance and Load Testing:** The service must be designed to handle tens of thousands of requests and be tested under a simulated load of at least 2000 concurrent connections. You should include logging of key performance metrics and purchase statistics.
- **Design Documentation:** Provide a detailed design document (`design.md`) that explains your architectural decisions, how you ensure scalability, measures to handle potential bottlenecks, and details on your fallback strategy.
- **Dockerization:** Extend the docker-compose setup to include not only Redis but also (optionally) a Prometheus container to scrape and monitor the metrics from your service.

## Requirements

1. **Technology Stack:** Use Node.js and Express for the API, and Redis for persistent ticket management.
2. **Multi-Event Architecture:** Design the system to handle multiple events concurrently. Pre-seed each event with a configurable number of tickets.
3. **Atomic Operations with Lua:** Replace simple atomic operations (like LPOP) with a Redis Lua script that handles the ticket purchase process atomically.
4. **Fallback to In-Memory Store:** Implement a fallback mechanism that activates if Redis operations fail, ensuring continued functionality with clear logging that this is a non-persistent backup.
5. **Metrics Endpoint:** Provide a `/metrics` endpoint that returns JSON data with real-time statistics (tickets sold, tickets remaining per event, errors, etc.).
6. **Robust Testing:** Write comprehensive unit tests and integration tests. The integration tests must simulate high load (>=2000 concurrent requests) and prove that no ticket is sold more than once.
7. **Logging:** Implement detailed logging for purchase operations, errors, and fallback activations.
8. **Design Document:** Include a `design.md` file that outlines your architecture, scalability considerations, and design rationale.
9. **Docker Support:** Update the docker-compose file to run Redis and optionally Prometheus. Provide clear instructions for running the entire stack.

## Deliverables

- Complete codebase with all source files and scripts.
- An updated `README.md` with setup, running instructions, and performance testing guidelines (this file).
- A `design.md` document explaining your design choices, scalability strategies, and fallback mechanisms.
- Docker-compose file supporting all necessary services (Redis, your app, and optionally Prometheus for metrics scraping).

## Getting Started

### Prerequisites

- Node.js (v14+ recommended)
- npm
- Redis (installed locally or via Docker, as per the provided docker-compose configuration)

### Setup

1. Clone the repository.
2. Install dependencies:
   npm install
3. (Optional) Copy the environment variable template:
   cp .env.example .env
4. Seed the Redis store with tickets for multiple events. You might modify the seeding script to handle multiple event keys (e.g., `event:1:tickets`, `event:2:tickets`, etc.).
5. Start the application:
   npm start

### Load Testing

Simulate high load using a tool like [autocannon](https://github.com/mcollina/autocannon) or [wrk](https://github.com/wg/wrk). For example, to simulate 2000 concurrent connections on event 1:

npx autocannon -c 2000 -d 30 http://localhost:3000/buy/1

### Metrics

Access real-time service metrics at:

http://localhost:3000/metrics

These metrics should include data on tickets sold, remaining tickets per event, and any instances where the fallback mechanism was activated.

## Evaluation Criteria

- **Correctness:** The system must ensure that no ticket is sold more than once per event even under extreme load.
- **Scalability:** The design should be able to handle high concurrency and large volumes of requests, with proven integration tests demonstrating the capability.
- **Atomicity & Resilience:** Use of Redis Lua scripting for atomic operations, with a robust fallback mechanism to handle failures gracefully.
- **Code Quality and Testing:** Write clean, well-documented code; include comprehensive unit and integration tests.
- **Logging & Metrics:** Proper logging of operations and a functional metrics endpoint suitable for Prometheus scraping.
- **Design Rationale:** The design document (`design.md`) should clearly articulate your architectural decisions, potential bottlenecks, and design solutions.

## Bonus Challenges (Optional but Encouraged)

- Enhance your docker-compose setup to include a Prometheus container for live monitoring.
- Optimize your Redis Lua script for even higher performance and lower latency.
- Integrate a distributed tracing solution (e.g., Jaeger) to track purchase request flows.

Good luck and happy coding!
