import type { Dimensions, VesselConfig, VolumeResult } from './types';

export type VesselType = 'cylindrical' | 'rectangular' | 'conical' | 'spherical';

/**
 * Validates the dimensions provided for a specific vessel type.
 * Throws an error if dimensions are missing or invalid (e.g., non-positive).
 * @param dimensions The dimensions object.
 * @param type The type of the vessel.
 * @throws {Error} If dimensions are invalid.
 */
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
    default:
      throw new Error(`Unknown vessel type: ${type}`);
  }
}

/**
 * Calculates the volume and percentage fill for a given vessel configuration and liquid height.
 * All internal calculations are performed in cubic meters.
 *
 * @param vessel The configuration of the vessel.
 * @param liquidHeight The height of the liquid in the vessel (in meters).
 * @returns An object containing the calculated volume (in cubic meters) and percentage fill.
 * @throws {Error} If the liquid height is negative or if vessel dimensions are invalid.
 */
export function calculateVolume(vessel: VesselConfig, liquidHeight: number): VolumeResult {
  validateDimensions(vessel.dimensions, vessel.type);

  if (liquidHeight < 0) {
    throw new Error(`Liquid height cannot be negative. Received: ${liquidHeight}`);
  }

  const totalHeight = vessel.dimensions.height;
  if (liquidHeight > totalHeight) {
    // If liquid height exceeds total height, cap it at total height for calculation
    // and log a warning, but don't throw an error as it might be a sensor anomaly.
    console.warn(`Warning: Liquid height (${liquidHeight}) exceeds vessel total height (${totalHeight}) for ${vessel.type} vessel. Capping at total height for calculation.`);
    liquidHeight = totalHeight;
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
        // Horizontal cylinder volume calculation
        if (liquidHeight === 0) {
          volume = 0;
        } else if (liquidHeight >= diameter) {
          volume = totalVolume;
        } else {
          const h = liquidHeight;
          // Segment area = r^2 * arccos((r-h)/r) - (r-h) * sqrt(2rh - h^2)
          // Using simpler formula: r^2 * acos(1 - h/r) - (r-h) * sqrt(h*(2r-h))
          const segmentArea = radius * radius * Math.acos(1 - h / radius) - (radius - h) * Math.sqrt(h * (2 * radius - h));
          volume = segmentArea * height;
        }
      } else {
        // Vertical cylinder volume calculation
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
      const r1 = topDiameter! / 2; // Radius at the top
      const r2 = bottomDiameter! / 2; // Radius at the bottom

      // Total volume of a frustum (cone)
      totalVolume = (PI * height / 3) * (r1 * r1 + r1 * r2 + r2 * r2);

      // Calculate radius at liquid height `h` using linear interpolation
      // r_h = r2 + (r1 - r2) * (H - h) / H, where H is total height
      const r_h = r2 + (r1 - r2) * (height - liquidHeight) / height;

      // Volume of liquid is the volume of the frustum from the bottom up to liquidHeight
      // This is equivalent to total frustum volume minus the frustum volume from liquidHeight to top
      // Or, more simply, the volume of a frustum with bottom radius r2, top radius r_h, and height liquidHeight
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
        // Volume of a spherical cap: V = (1/3) * PI * h^2 * (3r - h)
        volume = (1 / 3) * PI * liquidHeight * liquidHeight * (3 * radius - liquidHeight);
      }
      break;
    }
    default:
      // This case should ideally be caught by validateDimensions, but as a safeguard
      throw new Error(`Unsupported vessel type: ${vessel.type}`);
  }

  const percentage = totalVolume > 0 ? (volume / totalVolume) * 100 : 0;

  return {
    volume: parseFloat(volume.toFixed(6)), // Ensure consistent precision for internal calculations
    percentage: parseFloat(percentage.toFixed(2)),
  };
}

/**
 * Converts a volume from one unit to another.
 *
 * @param value The volume value to convert.
 * @param fromUnit The unit of the input value.
 * @param toUnit The desired unit for the output.
 * @returns The converted volume value.
 * @throws {Error} If an unsupported unit is provided.
 */
export function convertVolume(value: number, fromUnit: Dimensions['unit'], toUnit: Dimensions['unit']): number {
  const conversionFactors: { [key in Dimensions['unit']]: number } = {
    'cubicMeters': 1,
    'liters': 1000,
    'gallons': 264.172,
  };

  if (!(fromUnit in conversionFactors)) {
    throw new Error(`Unsupported 'fromUnit': ${fromUnit}`);
  }
  if (!(toUnit in conversionFactors)) {
    throw new Error(`Unsupported 'toUnit': ${toUnit}`);
  }

  const valueInCubicMeters = value / conversionFactors[fromUnit];
  return valueInCubicMeters * conversionFactors[toUnit];
}

/**
 * Converts a percentage value to a volume value based on a given unit.
 * This function's name is a bit misleading as it doesn't convert 'percentage' to 'volume' directly
 * without a total volume context. It primarily handles cases where the input `unit` is 'percentage'
 * and returns the value as is, or throws an error for other units.
 * It seems intended for a specific use case or might be a remnant. Consider deprecating or refining.
 *
 * @deprecated This function's utility is limited. Consider using `calculateVolume` and then `convertVolume`.
 * @param value The percentage value.
 * @param unit The unit to convert to (only 'percentage' is truly handled as a passthrough).
 * @returns The value, if unit is 'percentage'.
 * @throws {Error} If the unit is not 'percentage'.
 */
export function convertPercentage(value: number, unit: Dimensions['unit']): number {
  if (unit === 'percentage') {
    return value;
  } else {
    // This function's purpose is unclear for non-percentage units without a total volume context.
    // It's safer to throw an error or return 0 than to make an assumption.
    throw new Error(`Conversion from percentage to ${unit} requires a total volume context, which is not provided by this function.`);
  }
}
