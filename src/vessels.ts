import type { Dimensions, VesselConfig, VolumeResult } from './types';

export type VesselType = 'cylindrical' | 'rectangular' | 'conical' | 'spherical';

function validateDimensions(dimensions: Dimensions, type: VesselType): void {
  if (type === 'cylindrical') {
    if (dimensions.diameter == null && dimensions.radius == null) {
      throw new Error('Cylindrical vessel requires diameter or radius');
    }
    if (dimensions.diameter != null && dimensions.diameter <= 0) {
      throw new Error('Cylindrical vessel diameter must be positive');
    }
    if (dimensions.radius != null && dimensions.radius <= 0) {
      throw new Error('Cylindrical vessel radius must be positive');
    }
    if (dimensions.height == null) {
      throw new Error('Cylindrical vessel requires height');
    }
    if (dimensions.height <= 0) {
      throw new Error('Cylindrical vessel height must be positive');
    }
  } else if (type === 'rectangular') {
    if (dimensions.length == null || dimensions.width == null || dimensions.height == null) {
      throw new Error('Rectangular vessel requires length, width, and height');
    }
    if (dimensions.length <= 0 || dimensions.width <= 0 || dimensions.height <= 0) {
      throw new Error('Rectangular vessel dimensions must be positive');
    }
  } else if (type === 'conical') {
    if (dimensions.topDiameter == null || dimensions.bottomDiameter == null || dimensions.height == null) {
      throw new Error('Conical vessel requires topDiameter, bottomDiameter, and height');
    }
    if (dimensions.topDiameter <= 0 || dimensions.bottomDiameter <= 0 || dimensions.height <= 0) {
      throw new Error('Conical vessel dimensions must be positive');
    }
  } else if (type === 'spherical') {
    if (dimensions.diameter == null && dimensions.radius == null) {
      throw new Error('Spherical vessel requires diameter or radius');
    }
    if (dimensions.diameter != null && dimensions.diameter <= 0) {
      throw new Error('Spherical vessel diameter must be positive');
    }
    if (dimensions.radius != null && dimensions.radius <= 0) {
      throw new Error('Spherical vessel radius must be positive');
    }
  }
}

// Rest of file remains unchanged...