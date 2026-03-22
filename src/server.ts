import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { TankConfigStore } from './storage';
import { calculateVolume } from './vessels';
import type { VesselConfig, SaveConfigInput } from './types';

const app = new Hono();

// Serve static files from public directory
app.use('/*', serveStatic({ root: './public' }));

// API endpoint to calculate volume
app.post('/api/calculate', async (c) => {
  const data = await c.req.json<{ vessel: VesselConfig; liquidHeight: number }>();
  try {
    const result = calculateVolume(data.vessel, data.liquidHeight);
    return c.json({
      volume: result.volume,
      percentage: result.percentage,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// Initialize TankConfigStore
const tankStore = new TankConfigStore();

// API endpoints for configurations
app.post('/api/config', async (c) => {
  const input = await c.req.json<SaveConfigInput>();
  try {
    const saved = tankStore.save(input);
    return c.json(saved);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

app.get('/api/config', (c) => {
  const configs = tankStore.list();
  return c.json(configs);
});

app.get('/api/config/:id', (c) => {
  const id = c.req.param('id');
  const config = tankStore.load(id);
  if (config) {
    return c.json(config);
  } else {
    return c.json({ error: `Configuration with id ${id} not found` }, 404);
  }
});

app.put('/api/config/:id', async (c) => {
  const id = c.req.param('id');
  const input = await c.req.json<Partial<SaveConfigInput>>();
  try {
    const updated = tankStore.update(id, input);
    if (updated) {
      return c.json(updated);
    } else {
      return c.json({ error: `Configuration with id ${id} not found` }, 404);
    }
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

app.delete('/api/config/:id', (c) => {
  const id = c.req.param('id');
  const deleted = tankStore.delete(id);
  if (deleted) {
    return c.json({ success: true });
  } else {
    return c.json({ error: `Configuration with id ${id} not found` }, 404);
  }
});

export default app;