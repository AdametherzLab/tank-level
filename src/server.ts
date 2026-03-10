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

export default app;