import type { Dimensions, VesselConfig, VolumeResult } from './types';

export type VesselType = 'cylindrical' | 'rectangular' | 'conical' | 'spherical' | 'elliptical';

function validateDimensions(dimensions: Dimensions, type: VesselType): void {
  const checkPositive = (value: number | undefined, name: string) => {
    if (value !== undefined && value <= 0) {
      throw new Error(`${type} vessel ${name} must be positive. Received: ${value}`);
    }
  };

  switch (type) {
    case 'cylindrical':
      if (dimensions.diameter == null && dimensions.radius == null) {
        throw new Error('Cylindrical vessel requires diameter or radius.');
      }
      checkPositive(dimensions.diameter, 'diameter');
      checkPositive(dimensions.radius, 'radius');
      if (dimensions.height == null) {
        throw new Error('Cylindrical vessel requires height.');
      }
      checkPositive(dimensions.height, 'height');
      break;
    case 'rectangular':
      if (dimensions.length == null || dimensions.width == null || dimensions.height == null) {
        throw new Error('Rectangular vessel requires length, width, and height.');
      }
      checkPositive(dimensions.length, 'length');
      checkPositive(dimensions.width, 'width');
      checkPositive(dimensions.height, 'height');
      break;
    case 'conical':
      if (dimensions.topDiameter == null || dimensions.bottomDiameter == null || dimensions.height == null) {
        throw new Error('Conical vessel requires topDiameter, bottomDiameter, and height.');
      }
      checkPositive(dimensions.topDiameter, 'topDiameter');
      checkPositive(dimensions.bottomDiameter, 'bottomDiameter');
      checkPositive(dimensions.height, 'height');
      break;
    case 'spherical':
      if (dimensions.diameter == null && dimensions.radius == null) {
        throw new Error('Spherical vessel requires diameter or radius.');
      }
      checkPositive(dimensions.diameter, 'diameter');
      checkPositive(dimensions.radius, 'radius');
      break;
    case 'elliptical':
      if (dimensions.majorDiameter == null || dimensions.minorDiameter == null || dimensions.length == null) {
        throw new Error('Elliptical vessel requires majorDiameter, minorDiameter, and length.');
      }
      checkPositive(dimensions.majorDiameter, 'majorDiameter');
      checkPositive(dimensions.minorDiameter, 'minorDiameter');
      checkPositive(dimensions.length, 'length');
      break;
    default:
      throw new Error(`Unknown vessel type: ${type}`);
  }
}

export function calculateVolume(vessel: VesselConfig, liquidHeight: number): VolumeResult {
  validateDimensions(vessel.dimensions, vessel.type);

  if (liquidHeight < 0) {
    throw new Error(`Liquid height cannot be negative. Received: ${liquidHeight}`);
  }

  let maxLiquidHeight: number;
  switch (vessel.type) {
    case 'cylindrical': {
      const diameter = vessel.dimensions.diameter ?? (vessel.dimensions.radius! * 2);
      maxLiquidHeight = vessel.orientation === 'horizontal' ? diameter : vessel.dimensions.height!;
      break;
    }
    case 'rectangular':
      maxLiquidHeight = vessel.dimensions.height!;
      break;
    case 'conical':
      maxLiquidHeight = vessel.dimensions.height!;
      break;
    case 'spherical': {
      const diameter = vessel.dimensions.diameter ?? (vessel.dimensions.radius! * 2);
      maxLiquidHeight = diameter;
      break;
    }
    case 'elliptical':
      maxLiquidHeight = vessel.dimensions.minorDiameter!;
      break;
    default:
      throw new Error(`Unsupported vessel type: ${vessel.type}`);
  }

  if (liquidHeight > maxLiquidHeight) {
    console.warn(`Warning: Liquid height (${liquidHeight}) exceeds vessel maximum (${maxLiquidHeight}) for ${vessel.type} vessel. Capping at maximum for calculation.`);
    liquidHeight = maxLiquidHeight;
  }

  let volume = 0;
  let totalVolume = 0;
  const PI = Math.PI;

  switch (vessel.type) {
    case 'cylindrical': {
      const diameter = vessel.dimensions.diameter ?? (vessel.dimensions.radius! * 2);
      const radius = diameter / 2;
      const height = vessel.dimensions.height;
      totalVolume = PI * radius * radius * height;

      if (vessel.orientation === 'horizontal') {
        if (liquidHeight === 0) {
          volume = 0;
        } else if (liquidHeight >= diameter) {
          volume = totalVolume;
        } else {
          const h = liquidHeight;
          const segmentArea = radius * radius * Math.acos(1 - h / radius) - (radius - h) * Math.sqrt(h * (2 * radius - h));
          volume = segmentArea * height;
        }
      } else {
        volume = PI * radius * radius * liquidHeight;
      }
      break;
    }
    case 'rectangular': {
      const { length, width, height } = vessel.dimensions;
      totalVolume = length! * width! * height;
      volume = length! * width! * liquidHeight;
      break;
    }
    case 'conical': {
      const { topDiameter, bottomDiameter, height } = vessel.dimensions;
      const r1 = topDiameter! / 2;
      const r2 = bottomDiameter! / 2;
      totalVolume = (PI * height / 3) * (r1 * r1 + r1 * r2 + r2 * r2);
      const r_h = r2 + (r1 - r2) * (height - liquidHeight) / height;
      volume = (PI * liquidHeight / 3) * (r2 * r2 + r2 * r_h + r_h * r_h);
      break;
    }
    case 'spherical': {
      const diameter = vessel.dimensions.diameter ?? (vessel.dimensions.radius! * 2);
      const radius = diameter / 2;
      totalVolume = (4 / 3) * PI * radius * radius * radius;

      if (liquidHeight === 0) {
        volume = 0;
      } else if (liquidHeight >= diameter) {
        volume = totalVolume;
      } else {
        volume = (1 / 3) * PI * liquidHeight * liquidHeight * (3 * radius - liquidHeight);
      }
      break;
    }
    case 'elliptical': {
      const major = vessel.dimensions.majorDiameter! / 2;
      const minor = vessel.dimensions.minorDiameter! / 2;
      const length = vessel.dimensions.length!;
      totalVolume = PI * major * minor * length;

      if (liquidHeight <= 0) {
        volume = 0;
      } else if (liquidHeight >= vessel.dimensions.minorDiameter!) {
        volume = totalVolume;
      } else {
        const h = liquidHeight;
        const term1 = major * minor * Math.acos((minor - h) / minor);
        const term2Part = 2 * minor * h - h * h;
        
        if (term2Part < 0) {
          volume = totalVolume;
        } else {
          const term2 = major * (minor - h) * Math.sqrt(term2Part) / minor;
          volume = (term1 - term2) * length;
        }
      }
      break;
    }
    default:
      throw new Error(`Unsupported vessel type: ${vessel.type}`);
  }

  const percentage = totalVolume > 0 ? (volume / totalVolume) * 100 : 0;

  return {
    volume: parseFloat(volume.toFixed(6)),
    percentage: parseFloat(percentage.toFixed(2)),
  };
}

export function convertVolume(value: number, fromUnit: Unit, toUnit: Unit): number {
  const conversionFactors = {
    'cubicMeters': 1,
    'liters': 1000,
    'gallons': 264.172,
    'percentage': NaN
  } as const;

  if (fromUnit === 'percentage' || toUnit === 'percentage') {
    throw new Error('Percentage conversion requires total volume context');
  }

  const valueInCubicMeters = value / conversionFactors[fromUnit];
  return valueInCubicMeters * conversionFactors[toUnit];
}
