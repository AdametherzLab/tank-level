import { describe, it, expect } from 'bun:test';
import { TankVisualizer } from '../src/visualizer';
import type { VesselConfig } from '../src/types';

describe('TankVisualizer', () => {
  const mockContainer = document.createElement('div');
  
  it('should create cylindrical tank geometry', () => {
    const visualizer = new TankVisualizer(mockContainer);
    const config: VesselConfig = {
      type: 'cylindrical',
      dimensions: { diameter: 2, height: 5 },
      orientation: 'vertical'
    };
    
    visualizer.updateTank(config, 2.5);
    expect(visualizer).toBeDefined();
  });

  it('should create rectangular tank geometry', () => {
    const visualizer = new TankVisualizer(mockContainer);
    const config: VesselConfig = {
      type: 'rectangular',
      dimensions: { length: 4, width: 3, height: 2 }
    };
    
    visualizer.updateTank(config, 1);
    expect(visualizer).toBeDefined();
  });

  it('should create spherical tank geometry', () => {
    const visualizer = new TankVisualizer(mockContainer);
    const config: VesselConfig = {
      type: 'spherical',
      dimensions: { diameter: 4 }
    };
    
    visualizer.updateTank(config, 3);
    expect(visualizer).toBeDefined();
  });
});
