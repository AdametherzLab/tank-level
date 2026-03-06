// Other imports and functions remain unchanged...

export function strappingTable(vessel: VesselConfig, options?: StrappingOptions): readonly StrappingEntry[] {
  const steps = options?.steps ?? 20;
  const unit = options?.unit ?? 'cubicMeters';
  const precision = options?.precision ?? 4;

  if (steps < 1 || steps > 10000) {
    throw new Error('Steps must be between 1 and 10000');
  }

  // Rest of function remains unchanged...
}

// Rest of file remains unchanged...