import { describe, it, expect } from 'bun:test';
import app from '../src/server';
import type { VesselConfig } from '../src/types';

describe('Server API', () => {
    it('should calculate cylinder volume', async () => {
        const vessel: VesselConfig = {
            type: 'cylindrical',
            dimensions: { diameter: 2, height: 10 },
            orientation: 'vertical'
        };
        
        const req = new Request('http://localhost/api/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vessel, liquidHeight: 5 })
        });

        const res = await app.request(req);
        expect(res.status).toBe(200);
        
        const data = await res.json();
        expect(data.volume).toBeCloseTo(15.70796);
        expect(data.percentage).toBe(50);
    });

    it('should validate input format', async () => {
        const req = new Request('http://localhost/api/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invalid: 'data' })
        });

        const res = await app.request(req);
        expect(res.status).toBe(400);
    });

    it('should handle config storage', async () => {
        const configReq = new Request('http://localhost/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Tank',
                vessel: {
                    type: 'cylindrical',
                    dimensions: { diameter: 2, height: 5 }
                }
            })
        });

        const createRes = await app.request(configReq);
        expect(createRes.status).toBe(200);

        const listReq = new Request('http://localhost/api/config');
        const listRes = await app.request(listReq);
        expect(listRes.status).toBe(200);
        expect((await listRes.json()).length).toBe(1);
    });
});