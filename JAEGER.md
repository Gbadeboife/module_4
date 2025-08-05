# Jaeger Tracing

This service is now instrumented with distributed tracing using Jaeger. All purchase requests and flows are traced and can be visualized in the Jaeger UI.

## How to Use

1. **Start the stack with Jaeger:**
   ```sh
   docker-compose up --build
   ```
   (Jaeger will be available at http://localhost:16686)

2. **View Traces:**
   - Open [http://localhost:16686](http://localhost:16686) in your browser.
   - Select `ticketing-app` as the service and click "Find Traces" to view request flows.

3. **How it Works:**
   - Each incoming HTTP request is traced.
   - The `/buy/:eventId` endpoint creates a child span for the ticket purchase operation.
   - Errors and important events are logged as span tags.

## Environment Variables

- `JAEGER_AGENT_HOST` (default: jaeger)
- `JAEGER_AGENT_PORT` (default: 6831)
- `JAEGER_SERVICE_NAME` (default: ticketing-app)

## Jaeger UI Ports
- UI: http://localhost:16686
- Agent: 6831/udp
- Collector: 14268

---

For more, see https://www.jaegertracing.io/docs/.
