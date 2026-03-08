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
    expect(result.percentage).toBeCloseTo(66.07, 1);
  });

  it("should calculate volume for elliptical vessel", () => {
    const config: VesselConfig = {
      type: "elliptical",
      dimensions: { majorDiameter: 4, minorDiameter: 2, length: 10 },
    };

    // Test empty
    let result = calculateVolume(config, 0);
    expect(result.volume).toBe(0);
    expect(result.percentage).toBe(0);

    // Test full
    result = calculateVolume(config, 2);
    expect(result.volume).toBeCloseTo(Math.PI * 2 * 1 * 10, 2); // π * majorRadius * minorRadius * length
    expect(result.percentage).toBe(100);

    // Test half full
    result = calculateVolume(config, 1);
    const expectedVolume = (Math.PI * 2 * 10) / 2; // Half of total volume
    expect(result.volume).toBeCloseTo(expectedVolume, 2);
    expect(result.percentage).toBeCloseTo(50, 1);

    // Test partial fill
    result = calculateVolume(config, 0.5);
    const major = 2; // majorRadius
    const minor = 1; // minorRadius
    const h = 0.5;
    const term1 = major * minor * Math.acos((minor - h) / minor);
    const term2Part = 2 * minor * h - h * h;
    const term2 = major * (minor - h) * Math.sqrt(term2Part) / minor;
    const expected = (term1 - term2) * 10;
    expect(result.volume).toBeCloseTo(expected, 2);
  });

  // Existing tests remain unchanged...
});

// Rest of test file remains unchanged...
