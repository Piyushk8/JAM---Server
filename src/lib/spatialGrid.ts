// spatialGrid.ts
import { User } from "../types/type";

type CellKey = string;

export class SpatialGrid {
  private cellSize: number;
  // roomId -> cellKey -> Set<userId>
  private grid: Map<string, Map<CellKey, Set<string>>> = new Map();
  // userId -> cellKey
  private userCells: Map<string, CellKey> = new Map();

  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }

  private key(x: number, y: number): CellKey {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx}:${cy}`;
  }

  /** Ensure room map exists */
  private ensureRoom(roomId: string) {
    if (!this.grid.has(roomId)) this.grid.set(roomId, new Map());
  }

  addOrMove(roomId: string, user: User) {
    this.ensureRoom(roomId);
    const newKey = this.key(user.x, user.y);
    const oldKey = this.userCells.get(user.id);

    if (oldKey === newKey) return; // same cell, nothing to do

    // Remove from old
    if (oldKey) {
      const oldCell = this.grid.get(roomId)!.get(oldKey);
      oldCell?.delete(user.id);
      if (oldCell && oldCell.size === 0) {
        this.grid.get(roomId)!.delete(oldKey);
      }
    }

    // Add to new
    const roomGrid = this.grid.get(roomId)!;
    if (!roomGrid.has(newKey)) roomGrid.set(newKey, new Set());
    roomGrid.get(newKey)!.add(user.id);

    this.userCells.set(user.id, newKey);
  }

  remove(roomId: string, userId: string) {
    const key = this.userCells.get(userId);
    if (!key) return;
    const roomGrid = this.grid.get(roomId);
    if (!roomGrid) return;

    const cellSet = roomGrid.get(key);
    cellSet?.delete(userId);
    if (cellSet && cellSet.size === 0) roomGrid.delete(key);

    this.userCells.delete(userId);
  }

  /** Return nearby userIds by looking at same & adjacent cells */
  getNearby(roomId: string, user: User, radiusCells = 1): string[] {
    const roomGrid = this.grid.get(roomId);
    if (!roomGrid) return [];

    const cx = Math.floor(user.x / this.cellSize);
    const cy = Math.floor(user.y / this.cellSize);
    const result: Set<string> = new Set();

    for (let dx = -radiusCells; dx <= radiusCells; dx++) {
      for (let dy = -radiusCells; dy <= radiusCells; dy++) {
        const key = `${cx + dx}:${cy + dy}`;
        const cell = roomGrid.get(key);
        if (!cell) continue;
        for (const id of cell) result.add(id);
      }
    }

    result.delete(user.id);
    return Array.from(result);
  }
}

// proximity.ts
export function diffSets<T>(prev: Set<T>, next: Set<T>) {
  const entered: T[] = [];
  const left: T[] = [];

  for (const n of next) {
    if (!prev.has(n)) entered.push(n);
  }
  for (const p of prev) {
    if (!next.has(p)) left.push(p);
  }
  return { entered, left };
}

