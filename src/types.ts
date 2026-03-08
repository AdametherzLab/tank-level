import type { VesselType } from './vessels';

export interface Dimensions {
  readonly length?: number;
  readonly width?: number;
  readonly height: number;
  readonly diameter?: number;
  readonly radius?: number;
  readonly topDiameter?: number;
  readonly bottomDiameter?: number;
  readonly majorDiameter?: number;
  readonly minorDiameter?: number;
}

export interface VesselConfig {
  readonly type: VesselType;
  readonly dimensions: Dimensions;
  readonly orientation?: 'vertical' | 'horizontal';
}

export interface VolumeResult {
  readonly volume: number;
  readonly percentage: number;
}

export type Unit = 'liters' | 'gallons' | 'cubicMeters' | 'percentage';

export interface ConversionOptions {
  readonly fromUnit?: Unit;
  readonly toUnit?: Unit;
  readonly precision?: number;
}

export interface TankLevelConfig {
  readonly defaultUnit?: Unit;
  readonly precision?: number;
}

export interface CalculationInput {
  readonly vessel: VesselConfig;
  readonly liquidHeight: number;
  readonly unit?: Unit;
}

export interface CalculationResult {
  readonly volume: number;
  readonly percentage: number;
  readonly unit: Unit;
}

export interface StrappingEntry {
  readonly height: number;
  readonly volume: number;
  readonly percentage: number;
}

export interface StrappingOptions {
  readonly steps?: number;
  readonly unit?: Unit;
  readonly precision?: number;
}

export interface FillRateInput {
  readonly vessel: VesselConfig;
  readonly heightBefore: number;
  readonly heightAfter: number;
  readonly timeMinutes: number;
}

export interface FillRateResult {
  readonly ratePerMinute: number;
  readonly ratePerHour: number;
  readonly direction: 'filling' | 'draining' | 'stable';
  readonly volumeChange: number;
  readonly minutesToFull: number | null;
  readonly minutesToEmpty: number | null;
  readonly percentBefore: number;
  readonly percentAfter: number;
}

export interface AlarmConfig {
  readonly highHigh?: number;
  readonly high?: number;
  readonly low?: number;
  readonly lowLow?: number;
}

export type AlarmStatus = 'normal' | 'high' | 'high-high' | 'low' | 'low-low';

export interface AlarmResult {
  readonly status: AlarmStatus;
  readonly percentage: number;
  readonly activeAlarms: readonly AlarmStatus[];
  readonly isAlarmed: boolean;
}

export interface TankReading {
  readonly name: string;
  readonly vessel: VesselConfig;
  readonly liquidHeight: number;
  readonly unit?: Unit;
}

export interface InventoryEntry {
  readonly name: string;
  readonly volume: number;
  readonly percentage: number;
  readonly unit: Unit;
}

export interface InventoryResult {
  readonly tanks: readonly InventoryEntry[];
  readonly totalVolume: number;
  readonly averagePercentage: number;
  readonly count: number;
  readonly unit: Unit;
}
