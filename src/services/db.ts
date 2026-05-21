import Dexie, { type Table } from 'dexie';
import type { TrailPoint } from '../types/aircraft';

export interface SavedTrail {
  hex: string;
  points: TrailPoint[];
  lastUpdate: number;
}

export class SkyWatchDB extends Dexie {
  trails!: Table<SavedTrail>;

  constructor() {
    super('SkyWatchDB');
    this.version(1).stores({
      trails: 'hex, lastUpdate'
    });
  }
}

export const db = new SkyWatchDB();
