import { ProximityStrategy } from "../domain/ProximityMap/GridProximityStrategy";
import { ProximityRepository } from "../domain/types/RepoTypes";
import { User } from "../domain/types/types";

export class ProximityService {
  constructor(
    private strategy: ProximityStrategy,
    private repo: ProximityRepository
  ) {}

  updateProximity(roomId: string, users: Map<string, User>) {
    const proximityMap = this.strategy.computeNearbyUsers(users);
    this.repo.setProximityMap(roomId, proximityMap);
  }

  getNearbyUsers(roomId: string, userId: string) {
    return this.repo.getNearbyUsers(roomId, userId);
  }
}
