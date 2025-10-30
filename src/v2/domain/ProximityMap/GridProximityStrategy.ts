import { User } from "../types/types";

export interface ProximityStrategy {
  computeNearbyUsers(users: Map<string, User>): Map<string, Set<string>>;
}

const CELL_SIZE = 150; 

export class GridProximityStrategy implements ProximityStrategy {
  computeNearbyUsers(users: Map<string, User>): Map<string, Set<string>> {
    const proximityMap = new Map<string, Set<string>>();

    for (const [id1, u1] of users.entries()) {
      const nearby = new Set<string>();
      for (const [id2, u2] of users.entries()) {
        if (id1 === id2) continue;
        const dx = u1.x - u2.x;
        const dy = u1.y - u2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= CELL_SIZE) nearby.add(id2);
      }
      proximityMap.set(id1, nearby);
    }

    return proximityMap;
  }
}
