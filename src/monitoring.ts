import { calculateVolume, convertVolume } from './index';
import type { VesselConfig, StrappingOptions, StrappingEntry, FillRateInput, FillRateResult, AlarmConfig, AlarmResult, TankReading, InventoryEntry, InventoryResult, Unit } from './types';

/**
 * Generates a strapping table (also known as a calibration chart) for a given vessel.
 * This table maps liquid height to volume and percentage fill.
 *
 * @param vessel The configuration of the vessel.
 * @param options Options for generating the table, including number of steps, unit, and precision.
 * @returns An array of StrappingEntry objects, each containing height, volume, and percentage.
 * @throws {Error} If `steps` is out of the valid range (1-10000).
 */
export function strappingTable(vessel: VesselConfig, options?: StrappingOptions): readonly StrappingEntry[] {
  const steps = options?.steps ?? 20;
  const unit = options?.unit ?? 'cubicMeters';
  const precision = options?.precision ?? 4;

  if (steps < 1 || steps > 10000) {
    throw new Error(`Invalid steps value: ${steps}. Steps must be between 1 and 10000.`);
  }

  const table: StrappingEntry[] = [];
  const totalHeight = vessel.dimensions.height;

  // Calculate total volume once for percentage calculation
  let totalVolume: number;
  try {
    totalVolume = calculateVolume(vessel, totalHeight).volume;
  } catch (error: any) {
    throw new Error(`Failed to calculate total volume for strapping table: ${error.message}`);
  }

  for (let i = 0; i <= steps; i++) {
    const height = (i / steps) * totalHeight;
    let volumeResult;
    try {
      volumeResult = calculateVolume(vessel, height);
    } catch (error: any) {
      // Log the error but try to continue if possible, or rethrow if critical
      console.warn(`Warning: Failed to calculate volume for height ${height} in strapping table. Error: ${error.message}`);
      volumeResult = { volume: 0, percentage: 0 }; // Fallback
    }

    const volumeInTargetUnit = convertVolume(volumeResult.volume, 'cubicMeters', unit);
    const percentage = totalVolume > 0 ? (volumeResult.volume / totalVolume) * 100 : 0;

    table.push({
      height: parseFloat(height.toFixed(precision)),
      volume: parseFloat(volumeInTargetUnit.toFixed(precision)),
      percentage: parseFloat(percentage.toFixed(precision)),
    });
  }

  return table;
}

/**
 * Calculates the fill or drain rate of a vessel based on two height readings over time.
 *
 * @param input The FillRateInput object containing vessel config, heights, and time.
 * @returns A FillRateResult object with rates, direction, and time to full/empty.
 * @throws {Error} If `timeMinutes` is not positive.
 * @throws {Error} If vessel total volume calculation fails.
 */
export function fillRate(input: FillRateInput): FillRateResult {
  const { vessel, heightBefore, heightAfter, timeMinutes } = input;

  if (timeMinutes <= 0) {
    throw new Error(`Invalid timeMinutes: ${timeMinutes}. Must be a positive number.`);
  }

  const totalHeight = vessel.dimensions.height;
  let totalVolume: number;
  try {
    totalVolume = calculateVolume(vessel, totalHeight).volume;
  } catch (error: any) {
    throw new Error(`Failed to calculate total volume for fill rate: ${error.message}`);
  }

  if (totalVolume === 0) {
    console.warn('Warning: Vessel has zero total volume, fill rate calculations may be inaccurate.');
    return {
      ratePerMinute: 0,
      ratePerHour: 0,
      direction: 'stable',
      volumeChange: 0,
      minutesToFull: null,
      minutesToEmpty: null,
      percentBefore: 0,
      percentAfter: 0,
    };
  }

  let volumeBefore: number, volumeAfter: number;
  try {
    volumeBefore = calculateVolume(vessel, heightBefore).volume;
    volumeAfter = calculateVolume(vessel, heightAfter).volume;
  } catch (error: any) {
    throw new Error(`Failed to calculate volume for fill rate at height ${heightBefore} or ${heightAfter}: ${error.message}`);
  }

  const volumeChange = volumeAfter - volumeBefore;
  const ratePerMinute = volumeChange / timeMinutes;
  const ratePerHour = ratePerMinute * 60;

  let direction: FillRateResult['direction'] = 'stable';
  if (volumeChange > 0) {
    direction = 'filling';
  } else if (volumeChange < 0) {
    direction = 'draining';
  }

  const remainingVolume = totalVolume - volumeAfter;
  const minutesToFull = ratePerMinute > 0 ? remainingVolume / ratePerMinute : null;

  const currentVolume = volumeAfter;
  const minutesToEmpty = ratePerMinute < 0 ? currentVolume / Math.abs(ratePerMinute) : null;

  const percentBefore = (volumeBefore / totalVolume) * 100;
  const percentAfter = (volumeAfter / totalVolume) * 100;

  return {
    ratePerMinute,
    ratePerHour,
    direction,
    volumeChange,
    minutesToFull: minutesToFull !== null && minutesToFull >= 0 ? minutesToFull : null,
    minutesToEmpty: minutesToEmpty !== null && minutesToEmpty >= 0 ? minutesToEmpty : null,
    percentBefore,
    percentAfter,
  };
}

/**
 * Checks the current liquid level against predefined alarm thresholds.
 *
 * @param vessel The vessel configuration.
 * @param liquidHeight The current liquid height in the vessel.
 * @param alarmConfig The alarm thresholds (high-high, high, low, low-low) as percentages.
 * @returns An AlarmResult object indicating the current alarm status.
 * @throws {Error} If `liquidHeight` is negative or exceeds vessel height.
 * @throws {Error} If vessel total volume calculation fails.
 */
export function tankAlarms(vessel: VesselConfig, liquidHeight: number, alarmConfig: AlarmConfig): AlarmResult {
  const totalHeight = vessel.dimensions.height;

  if (liquidHeight < 0) {
    throw new Error(`Liquid height cannot be negative: ${liquidHeight}.`);
  }
  if (liquidHeight > totalHeight) {
    console.warn(`Warning: Liquid height (${liquidHeight}) exceeds vessel total height (${totalHeight}).`);
  }

  let currentVolumeResult;
  try {
    currentVolumeResult = calculateVolume(vessel, liquidHeight);
  } catch (error: any) {
    throw new Error(`Failed to calculate volume for alarm check at height ${liquidHeight}: ${error.message}`);
  }

  const percentage = currentVolumeResult.percentage;
  const activeAlarms: AlarmStatus[] = [];
  let status: AlarmStatus = 'normal';

  if (alarmConfig.highHigh !== undefined && percentage >= alarmConfig.highHigh) {
    activeAlarms.push('high-high');
    status = 'high-high';
  } else if (alarmConfig.high !== undefined && percentage >= alarmConfig.high) {
    activeAlarms.push('high');
    status = 'high';
  } else if (alarmConfig.lowLow !== undefined && percentage <= alarmConfig.lowLow) {
    activeAlarms.push('low-low');
    status = 'low-low';
  } else if (alarmConfig.low !== undefined && percentage <= alarmConfig.low) {
    activeAlarms.push('low');
    status = 'low';
  }

  return {
    status,
    percentage: parseFloat(percentage.toFixed(2)),
    activeAlarms,
    isAlarmed: activeAlarms.length > 0,
  };
}

/**
 * Calculates the total inventory and average fill percentage for multiple tanks.
 *
 * @param readings An array of TankReading objects, each representing a tank's current state.
 * @param targetUnit The unit to convert all volumes to for the total and individual entries.
 * @param precision The number of decimal places for volume and percentage.
 * @returns An InventoryResult object with total volume, average percentage, and individual tank entries.
 * @throws {Error} If any tank reading fails volume calculation.
 */
export function tankInventory(readings: readonly TankReading[], targetUnit: Unit = 'cubicMeters', precision: number = 4): InventoryResult {
  let totalVolume = 0;
  let totalPercentage = 0;
  const tanks: InventoryEntry[] = [];

  if (readings.length === 0) {
    return {
      tanks: [],
      totalVolume: 0,
      averagePercentage: 0,
      count: 0,
      unit: targetUnit,
    };
  }

  for (const reading of readings) {
    const { name, vessel, liquidHeight, unit: inputUnit = 'cubicMeters' } = reading;

    let volumeResult;
    try {
      volumeResult = calculateVolume(vessel, liquidHeight);
    } catch (error: any) {
      throw new Error(`Failed to calculate volume for tank '${name}' at height ${liquidHeight}: ${error.message}`);
    }

    const volumeInTargetUnit = convertVolume(volumeResult.volume, 'cubicMeters', targetUnit);

    tanks.push({
      name,
      volume: parseFloat(volumeInTargetUnit.toFixed(precision)),
      percentage: parseFloat(volumeResult.percentage.toFixed(precision)),
      unit: targetUnit,
    });

    totalVolume += volumeInTargetUnit;
    totalPercentage += volumeResult.percentage;
  }

  const averagePercentage = totalPercentage / readings.length;

  return {
    tanks,
    totalVolume: parseFloat(totalVolume.toFixed(precision)),
    averagePercentage: parseFloat(averagePercentage.toFixed(precision)),
    count: readings.length,
    unit: targetUnit,
  };
}
