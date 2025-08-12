// --- Modularized Imports ---
require('./tracing'); // Jaeger tracing initialization
const express = require("express");
const redis = require("redis");
const fs = require("fs");


// --- App Setup ---
const app = express();
const port = process.env.PORT || 3049;
app.use(express.json());

// Serve ticket.html at root route
const path = require('path');
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'ticket.html'));
});


// --- Middleware for Structured Request Timing Logs ---
app.use((req, res, next) => {
  const startHr = process.hrtime.bigint();
  res.on('finish', () => {
    const endHr = process.hrtime.bigint();
    const durationMs = Number(endHr - startHr) / 1_000_000;
    const logEntry = {
      ts: new Date().toISOString(),
      level: 'info',
      msg: 'request_completed',
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    };
    console.log(JSON.stringify(logEntry));
  });
  next();
});


// --- In-memory Fallback Store (non-persistent, for demo only) ---
const inMemoryTickets = {};
let fallbackActive = false;
let fallbackActivations = 0;
const metrics = {
  ticketsSold: {},
  ticketsRemaining: {},
  fallbackActivations: 0,
  errors: 0,
};

// --- Helper: Initialize in-memory store from Redis if possible ---
async function initializeFallbackFromRedis() {
  try {
    const keys = await client.keys('event:*:tickets');
    for (const key of keys) {
      const eventId = key.split(':')[1];
      const tickets = await client.lRange(key, 0, -1);
      inMemoryTickets[eventId] = tickets;
      metrics.ticketsRemaining[eventId] = tickets.length;
      console.warn(`Fallback: Loaded ${tickets.length} tickets for event ${eventId} from Redis into memory.`);
    }
  } catch (err) {
    console.warn('Fallback: Could not initialize in-memory tickets from Redis.', err);
  }
}

// --- Load Lua script for atomic ticket purchase ---
const luaScript = fs.readFileSync(path.join(__dirname, "lua_ticket_pop.lua"), "utf8");

// --- Redis Client Setup ---
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const client = redis.createClient({ url: redisUrl });

client.on('error', (err) => {
  console.error('Redis client error:', err);
});

(async () => {
  try {
    await client.connect();
    console.log(JSON.stringify({ ts: new Date().toISOString(), level: 'info', msg: 'redis_connected', url: redisUrl }));
    fallbackActive = false;
  } catch (err) {
    console.error('Redis initial connection failed, enabling fallback.', err);
    fallbackActive = true;
    fallbackActivations++;
    metrics.fallbackActivations = fallbackActivations;
    // Do not attempt to copy from Redis if not connected; will try later if it becomes healthy
  }
})();

// Periodic health check to auto-recover from fallback when Redis is healthy
setInterval(async () => {
  if (!fallbackActive) return;
  try {
    if (!client.isOpen) {
      await client.connect();
    } else {
      await client.ping();
    }
    // If we reach here, Redis is healthy again
    console.warn('Redis is healthy again; exiting fallback mode.');
    fallbackActive = false;
  } catch (_err) {
    // still unhealthy; remain in fallback
  }
}, 5000);

// --- Helper: Pop Ticket (Redis or Fallback) ---
async function popTicket(eventId) {
  const ticketKey = `event:${eventId}:tickets`;
  if (!fallbackActive) {
    try {
      // Use Lua script for atomic pop
      const ticket = await client.eval(luaScript, {
        keys: [ticketKey],
        arguments: [],
      });
      if (ticket) {
        metrics.ticketsSold[eventId] = (metrics.ticketsSold[eventId] || 0) + 1;
        metrics.ticketsRemaining[eventId] = await client.lLen(ticketKey);
      } else {
        metrics.ticketsRemaining[eventId] = 0;
      }
      return ticket;
    } catch (err) {
      console.error("Redis error, switching to fallback:", err);
      fallbackActive = true;
      fallbackActivations++;
      metrics.fallbackActivations = fallbackActivations;
      metrics.errors++;
      // Initialize fallback from Redis only if client is currently open
      if (client.isOpen) {
        await initializeFallbackFromRedis();
      }
    }
  }
  // Fallback: in-memory store
  if (!inMemoryTickets[eventId]) {
    inMemoryTickets[eventId] = [];
    metrics.ticketsRemaining[eventId] = 0;
  }
  const ticket = inMemoryTickets[eventId].shift();
  if (ticket) {
    metrics.ticketsSold[eventId] = (metrics.ticketsSold[eventId] || 0) + 1;
    metrics.ticketsRemaining[eventId] = inMemoryTickets[eventId].length;
  }
  return ticket;
}


// --- Modularized Ticket Routes ---
const ticketsRouter = require('./routes/tickets')(
  popTicket,
  () => fallbackActive,
  metrics
);
app.use('/', ticketsRouter);

// --- Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: true, message: 'Internal Server Error', data: null });
});


// --- Start Server only if run directly ---
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

// Export app for testing
module.exports = app;
