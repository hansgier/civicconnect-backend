import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { z } from 'zod';
import { validate } from '../../src/middleware/validate.middleware';

const testApp = express();
testApp.use(express.json());

// Global error handler for the test app to catch ValidationError
testApp.use((err: any, _req: any, res: any, _next: any) => {
  if (err.statusCode === 422) {
    return res.status(422).json({ message: err.message, errors: err.errors });
  }
  res.status(err.statusCode || 500).json({ message: err.message });
});

const schema = z.object({
  name: z.string().min(3),
  age: z.number().int().positive(),
});

testApp.post('/test-validate', validate({ body: schema }), (_req, res) => {
  res.status(200).json({ message: 'Valid' });
});

describe('Validate Middleware', () => {
  it('should pass valid request bodies', async () => {
    const response = await request(testApp)
      .post('/test-validate')
      .send({ name: 'John Doe', age: 30 });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Valid');
  });

  it('should reject invalid bodies with field-level errors', async () => {
    const response = await request(testApp)
      .post('/test-validate')
      .send({ name: 'Jo', age: -5 });

    expect(response.status).toBe(422);
    // Adjust expectation based on actual error structure from validate middleware
    expect(response.body.errors).toBeDefined();
    const errors = response.body.errors;
    expect(errors.some((e: any) => e.field === 'name')).toBe(true);
    expect(errors.some((e: any) => e.field === 'age')).toBe(true);
  });
});
