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

    it('should retrieve saved config by ID', async () => {
        // Create config
        const createReq = new Request('http://localhost/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Retrieval Test Tank',
                vessel: {
                    type: 'rectangular',
                    dimensions: { length: 5, width: 3, height: 2 }
                }
            })
        });

        const createRes = await app.request(createReq);
        const savedConfig = await createRes.json();
        
        // Retrieve by ID
        const getReq = new Request(`http://localhost/api/config/${savedConfig.id}`);
        const getRes = await app.request(getReq);
        expect(getRes.status).toBe(200);
        
        const config = await getRes.json();
        expect(config.id).toBe(savedConfig.id);
        expect(config.name).toBe('Retrieval Test Tank');
    });

    it('should update existing config', async () => {
        // Create config
        const createReq = new Request('http://localhost/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Update Test Tank',
                vessel: {
                    type: 'spherical',
                    dimensions: { diameter: 4 }
                }
            })
        });

        const createRes = await app.request(createReq);
        const savedConfig = await createRes.json();
        
        // Update config
        const updateReq = new Request(`http://localhost/api/config/${savedConfig.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name: 'Updated Tank',
                vessel: {
                    type: 'cylindrical',
                    dimensions: { diameter: 3, height: 8 }
                }
            })
        });

        const updateRes = await app.request(updateReq);
        expect(updateRes.status).toBe(200);
        
        const updatedConfig = await updateRes.json();
        expect(updatedConfig.name).toBe('Updated Tank');
        expect(updatedConfig.vessel.dimensions.diameter).toBe(3);
    });

    it('should delete config', async () => {
        // Create config
        const createReq = new Request('http://localhost/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Delete Test Tank',
                vessel: {
                    type: 'conical',
                    dimensions: { topDiameter: 2, bottomDiameter: 4, height: 6 }
                }
            })
        });

        const createRes = await app.request(createReq);
        const savedConfig = await createRes.json();
        
        // Delete config
        const deleteReq = new Request(`http://localhost/api/config/${savedConfig.id}`, {
            method: 'DELETE'
        });

        const deleteRes = await app.request(deleteReq);
        expect(deleteRes.status).toBe(200);
        
        // Verify deletion
        const getReq = new Request(`http://localhost/api/config/${savedConfig.id}`);
        const getRes = await app.request(getReq);
        expect(getRes.status).toBe(404);
    });
});