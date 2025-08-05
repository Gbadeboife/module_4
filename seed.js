// Multi-Event Ticket Seeder for Redis
const redis = require('redis');

// Configurable events and ticket counts
const EVENTS = [
  { id: 1, name: 'Concert A', ticketCount: 1000 },
  { id: 2, name: 'Concert B', ticketCount: 1500 },
  { id: 3, name: 'Conference X', ticketCount: 2000 },
];

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const client = redis.createClient({ url: redisUrl });

async function seedTickets() {
  try {
    await client.connect();
    for (const event of EVENTS) {
      const ticketKey = `event:${event.id}:tickets`;
      // Remove any existing tickets for this event
      await client.del(ticketKey);
      // Create ticket IDs (could be simple numbers or objects)
      const tickets = Array.from({ length: event.ticketCount }, (_, i) => `ticket-${event.id}-${i + 1}`);
      // Push all tickets to the Redis list
      if (tickets.length > 0) {
        await client.rPush(ticketKey, tickets);
        console.log(`Seeded ${tickets.length} tickets for event ${event.id} (${event.name})`);
      }
    }
    await client.quit();
    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error during seed:', err);
    process.exit(1);
  }
}

seedTickets();
