// Basic Jest test for /buy/:eventId and /metrics endpoints
const request = require('supertest');
const express = require('express');
let app;

beforeAll(() => {
  app = require('./server');
});

describe('API Endpoints', () => {
  // Ensure at least one ticket is purchased before checking metrics
  beforeAll(async () => {
    await request(app).post('/buy/1');
  });

  it('should return metrics with tickets_sold', async () => {
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('tickets_sold');
  });

  it('should handle ticket purchase', async () => {
    const res = await request(app).post('/buy/1');
    expect([200,404]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('message');
    // If successful, should have ticket in data
    if (!res.body.error) {
      expect(res.body.data).toHaveProperty('ticket');
    }
  });

  it('should return a PDF for /ticket/:eventId', async () => {
    const res = await request(app).get('/ticket/1');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('ticket-1.pdf');
    expect(res.body).toBeInstanceOf(Buffer);
  });

  afterAll(() => {
    if (app && app.close) app.close();
  });
});
