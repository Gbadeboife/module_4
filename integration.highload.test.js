// High-load uniqueness integration test
// TEST_EVENT_ID (default 1), TEST_REQUESTS (default 5000), TEST_BATCH (default 500), PORT (default 3049)

const axios = require('axios');

jest.setTimeout(180000); // 3 minutes for high load

describe('High-load ticket purchase uniqueness', () => {
  it('ensures no ticket is sold more than once', async () => {
    const eventId = parseInt(process.env.TEST_EVENT_ID || '1', 10);
    const port = process.env.PORT || '3049';
    const totalRequests = parseInt(process.env.TEST_REQUESTS || '5000', 10);
    const batchSize = parseInt(process.env.TEST_BATCH || '500', 10);
    const endpoint = `http://localhost:${port}/buy/${eventId}`;

    const tickets = [];

    const buy = async () => {
      try {
        const res = await axios.post(endpoint, null, { headers: { Accept: 'application/json' }, timeout: 20000 });
        const ticket = res?.data?.data?.ticket;
        return typeof ticket === 'string' ? ticket : null;
      } catch (_err) {
        return null;
      }
    };

    for (let i = 0; i < totalRequests; i += batchSize) {
      const batchCount = Math.min(batchSize, totalRequests - i);
      const batch = Array.from({ length: batchCount }, () => buy());
      const results = await Promise.all(batch);
      for (const t of results) {
        if (t) tickets.push(t);
      }
    }

    const unique = new Set(tickets);
    expect(unique.size).toBe(tickets.length);
  });
});

