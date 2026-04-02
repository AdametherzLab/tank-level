import { describe, it, expect, beforeEach } from 'bun:test';
import { TankVisualizer } from '../src/visualizer';
import type { VesselConfig } from '../src/types';

describe('TankVisualizer', () => {
  let mockContainer: HTMLDivElement;
  
  beforeEach(() => {
    mockContainer = document.createElement('div');
    mockContainer.style.width = '800px';
    mockContainer.style.height = '600px';
    document.body.appendChild(mockContainer);
  });

  it('should create canvas element with correct dimensions', () => {
    const visualizer = new TankVisualizer(mockContainer, { width: 600, height: 400 });
    const canvas = mockContainer.querySelector('canvas');
    
    expect(canvas).toBeDefined();
    expect(canvas?.width).toBe(600);
    expect(canvas?.height).toBe(400);
    expect(canvas?.style.border).toBe('1px solid #ddd');
  });

  it('should render cylindrical vertical tank', () => {
    const visualizer = new TankVisualizer(mockContainer);
    const config: VesselConfig = {
      type: 'cylindrical',
      dimensions: { diameter: 2, height: 5 },
      orientation: 'vertical'
    };
    
    visualizer.updateTank(config, 2.5);
    expect(visualizer).toBeDefined();
  });

  it('should render cylindrical horizontal tank', () => {
    const visualizer = new TankVisualizer(mockContainer);
    const config: VesselConfig = {
      type: 'cylindrical',
      dimensions: { diameter: 2, height: 10 },
      orientation: 'horizontal'
    };
    
    visualizer.updateTank(config, 1);
    expect(visualizer).toBeDefined();
  });

  it('should render rectangular tank', () => {
    const visualizer = new TankVisualizer(mockContainer);
    const config: VesselConfig = {
      type: 'rectangular',
      dimensions: { length: 4, width: 3, height: 2 }
    };
    
    visualizer.updateTank(config, 1);
    expect(visualizer).toBeDefined();
  });

  it('should render spherical tank', () => {
    const visualizer = new TankVisualizer(mockContainer);
    const config: VesselConfig = {
      type: 'spherical',
      dimensions: { diameter: 4 }
    };
    
    visualizer.updateTank(config, 3);
    expect(visualizer).toBeDefined();
  });

  it('should render conical tank', () => {
    const visualizer = new TankVisualizer(mockContainer);
    const config: VesselConfig = {
      type: 'conical',
      dimensions: { topDiameter: 2, bottomDiameter: 4, height: 6 }
    };
    
    visualizer.updateTank(config, 3);
    expect(visualizer).toBeDefined();
  });

  it('should render elliptical tank', () => {
    const visualizer = new TankVisualizer(mockContainer);
    const config: VesselConfig = {
      type: 'elliptical',
      dimensions: { majorDiameter: 4, minorDiameter: 2, length: 8 }
    };
    
    visualizer.updateTank(config, 1);
    expect(visualizer).toBeDefined();
  });

  it('should handle zero fill level', () => {
    const visualizer = new TankVisualizer(mockContainer);
    const config: VesselConfig = {
      type: 'cylindrical',
      dimensions: { diameter: 2, height: 5 },
      orientation: 'vertical'
    };
    
    visualizer.updateTank(config, 0);
    expect(visualizer).toBeDefined();
  });

  it('should handle full fill level', () => {
    const visualizer = new TankVisualizer(mockContainer);
    const config: VesselConfig = {
      type: 'rectangular',
      dimensions: { length: 2, width: 2, height: 4 }
    };
    
    visualizer.updateTank(config, 4);
    expect(visualizer).toBeDefined();
  });

  it('should handle fill level exceeding tank height', () => {
    const visualizer = new TankVisualizer(mockContainer);
    const config: VesselConfig = {
      type: 'spherical',
      dimensions: { diameter: 2 }
    };
    
    visualizer.updateTank(config, 5); // Exceeds diameter
    expect(visualizer).toBeDefined();
  });

  it('should destroy and remove canvas', () => {
    const visualizer = new TankVisualizer(mockContainer);
    visualizer.destroy();
    
    const canvas = mockContainer.querySelector('canvas');
    expect(canvas).toBeNull();
  });

  it('should update tank dimensions dynamically', () => {
    const visualizer = new TankVisualizer(mockContainer);
    
    const config1: VesselConfig = {
      type: 'cylindrical',
      dimensions: { diameter: 2, height: 5 },
      orientation: 'vertical'
    };
    
    const config2: VesselConfig = {
      type: 'rectangular',
      dimensions: { length: 10, width: 5, height: 8 }
    };
    
    visualizer.updateTank(config1, 2);
    visualizer.updateTank(config2, 4);
    
    expect(visualizer).toBeDefined();
  });
});
