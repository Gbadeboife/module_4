// Integration test for high concurrency ticket purchase
// Usage: node test_load.js <eventId> <concurrency> <requests>
const axios = require('axios');
const eventId = process.argv[2] || 1;
const concurrency = parseInt(process.argv[3]) || 5000;
const requests = parseInt(process.argv[4]) || 5000;
const endpoint = `http://localhost:3049/buy/${eventId}`;

let soldTickets = new Set();
let errors = 0;
let completed = 0;

console.log(`Starting load test: eventId=${eventId}, concurrency=${concurrency}, requests=${requests}`);

function buyTicket() {
  return axios.post(endpoint)
    .then(res => {
      if (res.data && res.data.ticket) {
        if (soldTickets.has(res.data.ticket)) {
          console.error('Duplicate ticket detected:', res.data.ticket);
        }
        soldTickets.add(res.data.ticket);
      }
    })
    .catch(err => {
      errors++;
    })
    .finally(() => {
      completed++;
      if (completed % 1000 === 0) {
        console.log(`Completed: ${completed}/${requests}`);
      }
      if (completed === requests) {
        console.log('Test complete.');
        console.log('Tickets sold:', soldTickets.size);
        console.log('Errors:', errors);
        process.exit(0);
      }
    });
}

// Launch requests in batches to avoid overwhelming the system
let inFlight = 0;
let launched = 0;
function launchNext() {
  while (inFlight < concurrency && launched < requests) {
    inFlight++;
    launched++;
    buyTicket().finally(() => inFlight--);
  }
  if (launched < requests) {
    setTimeout(launchNext, 10);
  }
}
launchNext();
