// Ticket routes module

const express = require('express');
const PDFDocument = require('pdfkit');
const router = express.Router();

// Input validation middleware for eventId
function validateEventId(req, res, next) {
  const eventId = req.params.eventId;
  if (!/^[0-9]+$/.test(eventId)) {
    return res.status(400).json({ error: true, message: 'Invalid eventId', data: null });
  }
  next();
}

// Helper to generate PDF receipt as a Buffer
function generateTicketPDF(ticket, eventId) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks = [];
    doc.text('Ticket Receipt', { align: 'center', underline: true });
    doc.moveDown();
    doc.text(`Event ID: ${eventId}`);
    doc.text(`Ticket: ${ticket}`);
    doc.text(`Date: ${new Date().toLocaleString()}`);
    doc.end();
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}


module.exports = (popTicket, fallbackActive, metrics) => {
  // POST /buy/:eventId - purchase a ticket for a specific event (returns JSON)
  router.post('/buy/:eventId', validateEventId, async (req, res, next) => {
    const eventId = req.params.eventId;
    try {
      const ticket = await popTicket(eventId);
      if (ticket) {
        // Return ticket info as JSON
        return res.json({
          error: false,
          message: 'Ticket purchased successfully!',
          data: { ticket, fallback: fallbackActive() }
        });
      } else {
        return res.status(404).json({ error: true, message: 'No tickets available', data: { fallback: fallbackActive() } });
      }
    } catch (error) {
      metrics.errors++;
      return next(error);
    }
  });

  // GET /ticket/:eventId - get a PDF receipt for the most recent ticket purchase (for demo)
  router.get('/ticket/:eventId', validateEventId, async (req, res, next) => {
    const eventId = req.params.eventId;
    // For demo: generate a sample PDF (in real use, would lookup ticket info)
    const ticket = `ticket-${eventId}-demo`;
    try {
      const pdfBuffer = await generateTicketPDF(ticket, eventId);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="ticket-${eventId}.pdf"`
      });
      return res.send(pdfBuffer);
    } catch (error) {
      return next(error);
    }
  });

  // GET /metrics - Prometheus-compatible metrics endpoint
  router.get('/metrics', (req, res) => {
    let output = '';
    for (const eventId in metrics.ticketsSold) {
      output += `tickets_sold{eventId=\"${eventId}\"} ${metrics.ticketsSold[eventId]}\n`;
    }
    for (const eventId in metrics.ticketsRemaining) {
      output += `tickets_remaining{eventId=\"${eventId}\"} ${metrics.ticketsRemaining[eventId]}\n`;
    }
    output += `fallback_activations ${metrics.fallbackActivations}\n`;
    output += `errors ${metrics.errors}\n`;
    res.type('text/plain').send(output);
  });

  return router;
};
