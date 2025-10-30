// /adapters/runtime/InMemoryAwayRepo.ts

import {
  AwayUserRepository,
  AwayUsers,
} from "../../../../domain/types/RepoTypes";

/**
 * This handles IN Memory data of Away users in the room
 * Away user - user who have just disconnected within buffer time for disconenctions to allow reconnections due to refresh, lags, etc
 * 
 */

export class InMemoryAwayRepo implements AwayUserRepository {
  private awayUsers = new Map<string, AwayUsers>();

  setAwayUser(roomId: string, userId: string): void {
    this.awayUsers.set(userId, { userId, roomId, awaySince: Date.now() });
  }

  removeAwayUser(userId: string): void {
    this.awayUsers.delete(userId);
  }

  getAwayUser(userId: string): AwayUsers | undefined {
    return this.awayUsers.get(userId);
  }
}
