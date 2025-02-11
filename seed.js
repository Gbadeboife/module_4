const redis = require("redis");

// Number of tickets to seed; default is 100000, or can be passed as a command line argument
const numTickets = parseInt(process.argv[2]) || 100000;

// Use environment variable for Redis URL if provided; otherwise default to localhost
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const client = redis.createClient({ url: redisUrl });

async function seedTickets() {
  try {
    await client.connect();
    // Clear existing tickets if any
    await client.del("tickets");
    console.log(`Seeding ${numTickets} tickets into Redis...`);
    let tickets = [];
    for (let i = 1; i <= numTickets; i++) {
      tickets.push(`ticket-${i}`);
    }
    // Push all tickets into the 'tickets' list
    await client.rPush("tickets", tickets);
    console.log(`Seeded ${numTickets} tickets.`);
    process.exit(0);
  } catch (err) {
    console.error("Error during seed:", err);
    process.exit(1);
  }
}

seedTickets();
