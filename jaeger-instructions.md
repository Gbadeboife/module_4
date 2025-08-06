# Jaeger Distributed Tracing Setup

## What Was Added
- Jaeger tracing is now integrated using OpenTelemetry in `tracing.js` and initialized in `server.js`.
- Jaeger service is included in `docker-compose.yml`.

## How to Use

1. **Start all services (including Jaeger):**
   ```sh
   docker-compose up --build
   ```
2. **Access the Jaeger UI:**
   - Open [http://localhost:16686/](http://localhost:16686/) in your browser.
   - Select `ticketing-service` to view traces.
3. **How it works:**
   - All HTTP requests to your Express app are traced and sent to Jaeger.
   - You can view request flows, timing, and distributed traces in the Jaeger UI.

## Environment Variables
- By default, the Jaeger exporter sends traces to `http://jaeger:14268/api/traces` (the default in Docker Compose).
- You can override with `JAEGER_ENDPOINT` if needed.

## References
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [OpenTelemetry Node.js](https://opentelemetry.io/docs/instrumentation/js/)

---

**You can now track and visualize distributed traces for all API requests in your ticketing microservice!**
