import type { VesselConfig } from './types';
import type { VesselType } from './vessels';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

/** A saved tank configuration with metadata */
export interface SavedTankConfig {
  readonly id: string;
  readonly name: string;
  readonly vessel: VesselConfig;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly tags: readonly string[];
  readonly description: string;
}

/** Input for saving a new tank configuration */
export interface SaveConfigInput {
  readonly name: string;
  readonly vessel: VesselConfig;
  readonly tags?: readonly string[];
  readonly description?: string;
}

/** Options for filtering the config list */
export interface ListConfigOptions {
  readonly tag?: string;
  readonly type?: VesselType;
  readonly nameContains?: string;
}

interface StoreData {
  configs: SavedTankConfig[];
}

function generateId(): string {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Simple fallback
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

/**
 * Persistent store for tank configurations.
 * Saves configurations to a JSON file so they survive restarts.
 *
 * @example
 * 
 * const store = new TankConfigStore('./my-tanks.json');
 * const saved = store.save({ name: 'Main Tank', vessel: { type: 'cylindrical', dimensions: { diameter: 2, height: 10 }, orientation: 'vertical' } });
 * const loaded = store.load(saved.id);
 * 
 */
export class TankConfigStore {
  private readonly filePath: string;
  private data: StoreData;

  constructor(filePath: string = './tank-configs.json') {
    this.filePath = filePath;
    this.data = this.readStore();
  }

  private readStore(): StoreData {
    try {
      if (existsSync(this.filePath)) {
        const raw = readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.configs)) {
          return parsed as StoreData;
        }
      }
    } catch {
      // Corrupted file — start fresh
    }
    return { configs: [] };
  }

  private writeStore(): void {
    const dir = dirname(this.filePath);
    if (dir && dir !== '.' && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  /**
   * Save a new tank configuration.
   * @throws {Error} If a config with the same name already exists.
   */
  save(input: SaveConfigInput): SavedTankConfig {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Tank configuration name cannot be empty.');
    }

    const existing = this.data.configs.find(c => c.name === input.name);
    if (existing) {
      throw new Error(`A configuration named "${input.name}" already exists (id: ${existing.id}).`);
    }

    const now = new Date().toISOString();
    const config: SavedTankConfig = {
      id: generateId(),
      name: input.name.trim(),
      vessel: input.vessel,
      createdAt: now,
      updatedAt: now,
      tags: input.tags ? [...input.tags] : [],
      description: input.description ?? '',
    };

    this.data.configs.push(config);
    this.writeStore();
    return config;
  }

  /**
   * Load a tank configuration by its ID.
   * @returns The configuration, or null if not found.
   */
  load(id: string): SavedTankConfig | null {
    return this.data.configs.find(c => c.id === id) ?? null;
  }

  /**
   * Load a tank configuration by its name.
   * @returns The configuration, or null if not found.
   */
  loadByName(name: string): SavedTankConfig | null {
    return this.data.configs.find(c => c.name === name) ?? null;
  }

  /**
   * List all saved configurations, optionally filtered.
   */
  list(options?: ListConfigOptions): readonly SavedTankConfig[] {
    let results = this.data.configs;

    if (options?.tag) {
      results = results.filter(c => c.tags.includes(options.tag!));
    }
    if (options?.type) {
      results = results.filter(c => c.vessel.type === options.type);
    }
    if (options?.nameContains) {
      const search = options.nameContains.toLowerCase();
      results = results.filter(c => c.name.toLowerCase().includes(search));
    }

    return results;
  }

  /**
   * Update an existing configuration by ID.
   * @returns The updated configuration, or null if not found.
   */
  update(id: string, input: Partial<SaveConfigInput>): SavedTankConfig | null {
    const index = this.data.configs.findIndex(c => c.id === id);
    if (index === -1) return null;

    const existing = this.data.configs[index];

    // Check name uniqueness if name is being changed
    if (input.name && input.name !== existing.name) {
      const nameConflict = this.data.configs.find(c => c.name === input.name && c.id !== id);
      if (nameConflict) {
        throw new Error(`A configuration named "${input.name}" already exists (id: ${nameConflict.id}).`);
      }
    }

    const updated: SavedTankConfig = {
      ...existing,
      name: input.name?.trim() ?? existing.name,
      vessel: input.vessel ?? existing.vessel,
      tags: input.tags ? [...input.tags] : existing.tags,
      description: input.description ?? existing.description,
      updatedAt: new Date().toISOString(),
    };

    this.data.configs[index] = updated;
    this.writeStore();
    return updated;
  }

  /**
   * Delete a configuration by ID.
   * @returns true if deleted, false if not found.
   */
  delete(id: string): boolean {
    const index = this.data.configs.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.data.configs.splice(index, 1);
    this.writeStore();
    return true;
  }

  /**
   * Remove all saved configurations.
   */
  clear(): void {
    this.data.configs = [];
    this.writeStore();
  }

  /**
   * Get the number of saved configurations.
   */
  get count(): number {
    return this.data.configs.length;
  }
}