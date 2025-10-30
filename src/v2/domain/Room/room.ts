// /domain/room.ts
import { User as Player } from "../types";

export class Room {
  private players: Map<string, Player> = new Map();

  constructor(public readonly id: string) {}

  addPlayer(player: Player) {
    this.players.set(player.id, player);
  }

  movePlayer(id: string, x: number, y: number) {
    const player = this.players.get(id);
    if (!player) throw new Error("Player not found");
    player.x = x;
    player.y = y;
  }

  getState() {
    return Array.from(this.players.values());
  }
}
