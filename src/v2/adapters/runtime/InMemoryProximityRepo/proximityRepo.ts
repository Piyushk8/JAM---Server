// /adapters/runtime/InMemoryProximityRepo.ts

import { ProximityRepository } from "../../../domain/types/RepoTypes";

export class InMemoryProximityRepo implements ProximityRepository {
  private proximityMaps = new Map<string, Map<string, Set<string>>>();

  setProximityMap(roomId: string, map: Map<string, Set<string>>) {
    this.proximityMaps.set(roomId, map);
  }

  getProximityMap(roomId: string) {
    return this.proximityMaps.get(roomId);
  }

  getNearbyUsers(roomId: string, userId: string) {
    return this.proximityMaps.get(roomId)?.get(userId);
  }
}
