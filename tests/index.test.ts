import { describe, it, expect } from "bun:test";
import { calculateVolume, convertVolume, convertPercentage, strappingTable, fillRate, tankAlarms, tankInventory } from "../src/index";
import type { VesselConfig } from "../src/index";

describe("calculateVolume", () => {
  it("should calculate volume for vertical cylindrical vessel", () => {
    const config: VesselConfig = {
      type: "cylindrical",
      dimensions: { diameter: 2, height: 10 },
      orientation: "vertical",
    };
    const result = calculateVolume(config, 5);
    expect(result.volume).toBeCloseTo(15.708, 2);
    expect(result.percentage).toBe(50);
  });

  it("should calculate volume for horizontal cylindrical vessel", () => {
    const config: VesselConfig = {
      type: "cylindrical",
      dimensions: { diameter: 2, height: 10 },
      orientation: "horizontal",
    };
    const result = calculateVolume(config, 1);
    expect(result.volume).toBeCloseTo(15.71, 2);
    expect(result.percentage).toBeCloseTo(50, 2);
  });

  it("should calculate volume for rectangular vessel", () => {
    const config: VesselConfig = {
      type: "rectangular",
      dimensions: { length: 5, width: 3, height: 10 },
    };
    const result = calculateVolume(config, 4);
    expect(result.volume).toBe(60);
    expect(result.percentage).toBe(40);
  });

  it("should calculate volume for conical vessel", () => {
    const config: VesselConfig = {
      type: "conical",
      dimensions: { topDiameter: 2, bottomDiameter: 4, height: 10 },
    };
    const result = calculateVolume(config, 5);
    expect(result.volume).toBeCloseTo(48.43, 2);
    // Conical: half height != 50% because wider at bottom
    expect(result.percentage).toBeCloseTo(66.07, 1);
  });

  it("should throw error for negative liquid height", () => {
    const config: VesselConfig = {
      type: "rectangular",
      dimensions: { length: 5, width: 3, height: 10 },
    };
    expect(() => calculateVolume(config, -1)).toThrow("Liquid height cannot be negative");
  });

  it("should cap volume at total height when liquid height exceeds vessel", () => {
    const config: VesselConfig = {
      type: "rectangular",
      dimensions: { length: 5, width: 3, height: 10 },
    };
    const result = calculateVolume(config, 15);
    expect(result.volume).toBe(150);
    expect(result.percentage).toBe(100);
  });

  it("should handle zero height", () => {
    const config: VesselConfig = {
      type: "cylindrical",
      dimensions: { diameter: 2, height: 10 },
      orientation: "vertical",
    };
    const result = calculateVolume(config, 0);
    expect(result.volume).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it("should use radius when diameter not provided for cylinder", () => {
    const config: VesselConfig = {
      type: "cylindrical",
      dimensions: { radius: 1, height: 10 },
      orientation: "vertical",
    };
    const result = calculateVolume(config, 5);
    expect(result.volume).toBeCloseTo(15.708, 2);
  });
});

describe("spherical vessel", () => {
  const sphere: VesselConfig = {
    type: "spherical",
    dimensions: { diameter: 2 },
  };

  it("should calculate 0% at height 0", () => {
    const result = calculateVolume(sphere, 0);
    expect(result.volume).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it("should calculate 100% at full diameter", () => {
    const result = calculateVolume(sphere, 2);
    expect(result.percentage).toBe(100);
    // Total volume of sphere with r=1: (4/3) * pi * 1^3 = 4.189
    expect(result.volume).toBeCloseTo(4.189, 2);
  });

  it("should calculate 50% at half diameter", () => {
    const result = calculateVolume(sphere, 1);
    expect(result.percentage).toBeCloseTo(50, 1);
  });

  it("should work with radius instead of diameter", () => {
    const config: VesselConfig = {
      type: "spherical",
      dimensions: { radius: 1 },
    };
    const result = calculateVolume(config, 2);
    expect(result.percentage).toBe(100);
    expect(result.volume).toBeCloseTo(4.189, 2);
  });

  it("should throw without diameter or radius", () => {
    const config: VesselConfig = {
      type: "spherical",
      dimensions: { height: 2 },
    };
    expect(() => calculateVolume(config, 1)).toThrow("Spherical vessel requires diameter or radius");
  });
});

describe("convertVolume", () => {
  it("should convert liters to gallons", () => {
    const result = convertVolume(10, "liters", "gallons");
    expect(result).toBeCloseTo(2.64, 2);
  });

  it("should convert gallons to liters", () => {
    const result = convertVolume(5, "gallons", "liters");
    expect(result).toBeCloseTo(18.93, 2);
  });

  it("should return same value when units are identical", () => {
    const result = convertVolume(100, "liters", "liters");
    expect(result).toBe(100);
  });

  it("should convert cubic meters to liters", () => {
    const result = convertVolume(1, "cubicMeters", "liters");
    expect(result).toBe(1000);
  });

  it("should convert cubic meters to gallons", () => {
    const result = convertVolume(1, "cubicMeters", "gallons");
    expect(result).toBeCloseTo(264.172, 2);
  });
});

describe("convertPercentage", () => {
  it("should convert percentage to liters", () => {
    const result = convertPercentage(50, "liters");
    expect(result).toBe(50);
  });

  it("should return same value when unit is percentage", () => {
    const result = convertPercentage(75, "percentage");
    expect(result).toBe(75);
  });
});

describe("strappingTable", () => {
  const cylinder: VesselConfig = {
    type: "cylindrical",
    dimensions: { diameter: 2, height: 10 },
    orientation: "vertical",
  };

  it("should generate correct number of entries", () => {
    const table = strappingTable(cylinder, { steps: 10 });
    expect(table.length).toBe(11); // 0 to 10 inclusive
  });

  it("should start at 0% and end at 100%", () => {
    const table = strappingTable(cylinder, { steps: 10 });
    expect(table[0].height).toBe(0);
    expect(table[0].percentage).toBe(0);
    expect(table[10].percentage).toBeCloseTo(100, 1);
  });

  it("should increase monotonically", () => {
    const table = strappingTable(cylinder, { steps: 20 });
    for (let i = 1; i < table.length; i++) {
      expect(table[i].volume).toBeGreaterThanOrEqual(table[i - 1].volume);
    }
  });

  it("should convert to liters", () => {
    const table = strappingTable(cylinder, { steps: 5, unit: "liters" });
    // Last entry: full cylinder volume in liters (pi * 1^2 * 10 = 31.416 m3 -> 31416 liters)
    expect(table[table.length - 1].volume).toBeGreaterThan(100);
  });

  it("should throw for steps < 1", () => {
    expect(() => strappingTable(cylinder, { steps: 0 })).toThrow("Steps must be between 1 and 10000");
  });

  it("should work for spherical vessels", () => {
    const sphere: VesselConfig = {
      type: "spherical",
      dimensions: { diameter: 2 },
    };
    const table = strappingTable(sphere, { steps: 10 });
    expect(table.length).toBe(11);
    expect(table[0].percentage).toBe(0);
    expect(table[10].percentage).toBeCloseTo(100, 1);
  });

  it("should handle max steps", () => {
    const table = strappingTable(cylinder, { steps: 10000 });
    expect(table.length).toBe(10001);
  });

  it("should throw for steps > 10000", () => {
    expect(() => strappingTable(cylinder, { steps: 10001 })).toThrow("Steps must be between 1 and 10000");
  });

  it("should respect precision option", () => {
    const table = strappingTable(cylinder, { steps: 1, precision: 2 });
    expect(table[1].volume.toString()).toMatch(/^\d+\.?\d{0,2}$/);
  });
});

describe("fillRate", () => {
  const tank: VesselConfig = {
    type: "rectangular",
    dimensions: { length: 10, width: 5, height: 10 },
  };

  it("should detect filling", () => {
    const result = fillRate({
      vessel: tank,
      heightBefore: 2,
      heightAfter: 4,
      timeMinutes: 60,
    });
    expect(result.direction).toBe("filling");
    expect(result.volumeChange).toBe(100); // 10*5*(4-2)
    expect(result.ratePerMinute).toBeCloseTo(1.667, 2);
    expect(result.ratePerHour).toBe(100);
  });

  it("should detect draining", () => {
    const result = fillRate({
      vessel: tank,
      heightBefore: 8,
      heightAfter: 4,
      timeMinutes: 60,
    });
    expect(result.direction).toBe("draining");
    expect(result.volumeChange).toBe(-200);
    expect(result.ratePerMinute).toBeCloseTo(-3.333, 2);
  });

  it("should detect stable", () => {
    const result = fillRate({
      vessel: tank,
      heightBefore: 5,
      heightAfter: 5,
      timeMinutes: 60,
    });
    expect(result.direction).toBe("stable");
    expect(result.volumeChange).toBe(0);
    expect(result.ratePerMinute).toBe(0);
  });

  it("should calculate time to full when filling", () => {
    const result = fillRate({
      vessel: tank,
      heightBefore: 2,
      heightAfter: 4,
      timeMinutes: 60,
    });
    // Current volume: 10*5*4 = 200, Total: 500, Remaining: 300
    // Rate: 100 per hour, so 3 hours to fill
    expect(result.minutesToFull).toBe(180);
    expect(result.minutesToEmpty).toBeNull();
  });

  it("should calculate time to empty when draining", () => {
    const result = fillRate({
      vessel: tank,
      heightBefore: 8,
      heightAfter: 6,
      timeMinutes: 60,
    });
    // Current volume: 10*5*6 = 300, Rate: -100 per hour
    expect(result.minutesToEmpty).toBe(180);
    expect(result.minutesToFull).toBeNull();
  });

  it("should throw for non-positive time", () => {
    expect(() =>
      fillRate({
        vessel: tank,
        heightBefore: 2,
        heightAfter: 4,
        timeMinutes: 0,
      })
    ).toThrow("timeMinutes");

    expect(() =>
      fillRate({
        vessel: tank,
        heightBefore: 2,
        heightAfter: 4,
        timeMinutes: -10,
      })
    ).toThrow("timeMinutes");
  });

  it("should calculate percentages correctly", () => {
    const result = fillRate({
      vessel: tank,
      heightBefore: 2,
      heightAfter: 4,
      timeMinutes: 60,
    });
    expect(result.percentBefore).toBe(20);
    expect(result.percentAfter).toBe(40);
  });
});

describe("tankAlarms", () => {
  const tank: VesselConfig = {
    type: "rectangular",
    dimensions: { length: 10, width: 5, height: 10 },
  };

  const alarmConfig = {
    highHigh: 90,
    high: 80,
    low: 20,
    lowLow: 10,
  };

  it("should return normal when no alarms triggered", () => {
    const result = tankAlarms(tank, 5, alarmConfig);
    expect(result.status).toBe("normal");
    expect(result.activeAlarms).toHaveLength(0);
    expect(result.isAlarmed).toBe(false);
    expect(result.percentage).toBe(50);
  });

  it("should trigger high alarm", () => {
    const result = tankAlarms(tank, 8.1, alarmConfig);
    expect(result.status).toBe("high");
    expect(result.activeAlarms).toContain("high");
    expect(result.isAlarmed).toBe(true);
  });

  it("should trigger high-high alarm", () => {
    const result = tankAlarms(tank, 9.1, alarmConfig);
    expect(result.status).toBe("high-high");
    expect(result.activeAlarms).toContain("high-high");
    expect(result.isAlarmed).toBe(true);
  });

  it("should trigger low alarm", () => {
    const result = tankAlarms(tank, 1.9, alarmConfig);
    expect(result.status).toBe("low");
    expect(result.activeAlarms).toContain("low");
    expect(result.isAlarmed).toBe(true);
  });

  it("should trigger low-low alarm", () => {
    const result = tankAlarms(tank, 0.9, alarmConfig);
    expect(result.status).toBe("low-low");
    expect(result.activeAlarms).toContain("low-low");
    expect(result.isAlarmed).toBe(true);
  });

  it("should prioritize high-high over high", () => {
    const result = tankAlarms(tank, 9.5, alarmConfig);
    expect(result.status).toBe("high-high");
    expect(result.activeAlarms).toEqual(["high-high"]);
  });

  it("should prioritize low-low over low", () => {
    const result = tankAlarms(tank, 0.5, alarmConfig);
    expect(result.status).toBe("low-low");
    expect(result.activeAlarms).toEqual(["low-low"]);
  });

  it("should throw for negative liquid height", () => {
    expect(() => tankAlarms(tank, -1, alarmConfig)).toThrow("Liquid height cannot be negative");
  });

  it("should handle partial alarm config", () => {
    const partialConfig = { high: 90 };
    const result = tankAlarms(tank, 9.5, partialConfig);
    expect(result.status).toBe("high");
  });

  it("should handle empty alarm config", () => {
    const result = tankAlarms(tank, 5, {});
    expect(result.status).toBe("normal");
    expect(result.activeAlarms).toHaveLength(0);
  });
});

describe("tankInventory", () => {
  const tank1: VesselConfig = {
    type: "rectangular",
    dimensions: { length: 10, width: 5, height: 10 },
  };

  const tank2: VesselConfig = {
    type: "cylindrical",
    dimensions: { diameter: 2, height: 10 },
    orientation: "vertical",
  };

  it("should calculate inventory for single tank", () => {
    const readings = [
      { name: "Tank-A", vessel: tank1, liquidHeight: 5 },
    ];
    const result = tankInventory(readings);
    expect(result.count).toBe(1);
    expect(result.totalVolume).toBe(250); // 10*5*5
    expect(result.averagePercentage).toBe(50);
    expect(result.tanks[0].volume).toBe(250);
    expect(result.tanks[0].percentage).toBe(50);
  });

  it("should calculate inventory for multiple tanks", () => {
    const readings = [
      { name: "Tank-A", vessel: tank1, liquidHeight: 10 }, // 100%
      { name: "Tank-B", vessel: tank2, liquidHeight: 5 }, // 50%
    ];
    const result = tankInventory(readings);
    expect(result.count).toBe(2);
    // Tank1: 500 m3, Tank2: ~15.708 m3
    expect(result.totalVolume).toBeCloseTo(515.708, 2);
    // Average: (100 + 50) / 2 = 75%
    expect(result.averagePercentage).toBe(75);
  });

  it("should convert to target unit", () => {
    const readings = [
      { name: "Tank-A", vessel: tank1, liquidHeight: 5 },
    ];
    const result = tankInventory(readings, "liters");
    expect(result.unit).toBe("liters");
    expect(result.totalVolume).toBe(250000); // 250 m3 = 250000 liters
    expect(result.tanks[0].volume).toBe(250000);
  });

  it("should handle empty readings array", () => {
    const result = tankInventory([]);
    expect(result.count).toBe(0);
    expect(result.totalVolume).toBe(0);
    expect(result.averagePercentage).toBe(0);
    expect(result.tanks).toHaveLength(0);
  });

  it("should respect precision parameter", () => {
    const readings = [
      { name: "Tank-A", vessel: tank2, liquidHeight: 5 },
    ];
    const result = tankInventory(readings, "cubicMeters", 2);
    expect(result.tanks[0].volume.toString()).toMatch(/^\d+\.?\d{0,2}$/);
  });

  it("should preserve tank names in entries", () => {
    const readings = [
      { name: "Storage-01", vessel: tank1, liquidHeight: 5 },
      { name: "Storage-02", vessel: tank2, liquidHeight: 5 },
    ];
    const result = tankInventory(readings);
    expect(result.tanks[0].name).toBe("Storage-01");
    expect(result.tanks[1].name).toBe("Storage-02");
  });
});
