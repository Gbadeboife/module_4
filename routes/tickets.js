
// --- Ticket Routes Module ---
// Handles ticket purchase, PDF generation, and metrics endpoints

const express = require('express');
const PDFDocument = require('pdfkit');
const router = express.Router();

// Input validation middleware for eventId
// Ensures eventId is a numeric string
function validateEventId(req, res, next) {
  const eventId = req.params.eventId;
  if (!/^[0-9]+$/.test(eventId)) {
    return res.status(400).json({ error: true, message: 'Invalid eventId', data: null });
  }
  next();
}

// Helper to generate PDF receipt as a Buffer
// Returns a Promise that resolves to a PDF Buffer
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



module.exports = (popTicket, fallbackActive, metrics, tracer, opentracing) => {
  // --- Purchase Ticket Endpoint ---
  // POST /buy/:eventId - purchase a ticket for a specific event (returns JSON)
  // Returns: { error, message, data }
  router.post('/buy/:eventId', validateEventId, async (req, res, next) => {
    const eventId = req.params.eventId;
    // Start a child span for the purchase operation (Jaeger)
    const parentSpan = req.span || (tracer && tracer.startSpan('HTTP POST /buy/:eventId'));
    const span = tracer ? tracer.startSpan('purchase_ticket', { childOf: parentSpan }) : null;
    try {
      if (span) span.setTag('event.id', eventId);
      const ticket = await popTicket(eventId);
      if (ticket) {
        if (span) span.log({ event: 'ticket_purchased', ticket });
        // Return ticket info as JSON
        if (span) span.finish();
        if (parentSpan && parentSpan !== req.span) parentSpan.finish();
        return res.json({
          error: false,
          message: 'Ticket purchased successfully!',
          data: { ticket, fallback: fallbackActive() }
        });
      } else {
        // No tickets available
        if (span) span.setTag(opentracing.Tags.ERROR, true);
        if (span) span.log({ event: 'sold_out' });
        if (span) span.finish();
        if (parentSpan && parentSpan !== req.span) parentSpan.finish();
        return res.status(404).json({ error: true, message: 'No tickets available', data: { fallback: fallbackActive() } });
      }
    } catch (error) {
      // Error handling: increment error metric and log to tracing
      metrics.errors++;
      if (span) span.setTag(opentracing.Tags.ERROR, true);
      if (span) span.log({ event: 'error', message: error.message });
      if (span) span.finish();
      if (parentSpan && parentSpan !== req.span) parentSpan.finish();
      return next(error);
    }
  });

  // --- PDF Ticket Endpoint ---
  // GET /ticket/:eventId - get a PDF receipt for the most recent ticket purchase (for demo)
  router.get('/ticket/:eventId', validateEventId, async (req, res, next) => {
    const eventId = req.params.eventId;
    // For demo: generate a sample PDF (in real use, would lookup ticket info)
    const ticket = `ticket-${eventId}-demo`;
    try {
      // Generate PDF buffer for the ticket
      const pdfBuffer = await generateTicketPDF(ticket, eventId);
      // Set headers and send PDF
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="ticket-${eventId}.pdf"`
      });
      return res.send(pdfBuffer);
    } catch (error) {
      return next(error);
    }
  });

  // --- Metrics Endpoint ---
  // GET /metrics - Prometheus-compatible metrics endpoint
  router.get('/metrics', (req, res) => {
    // Output Prometheus metrics as plain text
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
