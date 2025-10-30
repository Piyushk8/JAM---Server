import { AwayUserRepository, RoomRepository } from "../domain/types/RepoTypes";
import { User } from "../domain/types/types";

export class RoomService {
  constructor(
    private roomRepo: RoomRepository,
    private awayRepo: AwayUserRepository
  ) {}

  joinRoom(roomId: string, user: User) {
    this.roomRepo.addUserToRoom(roomId, user);
  }

  leaveRoom(roomId: string, userId: string) {
    this.roomRepo.deleteUserFromRoom(userId, roomId);
    this.awayRepo.removeAwayUser(userId);
  }

  markUserAway(roomId: string, userId: string) {
    this.awayRepo.setAwayUser(roomId, userId);
  }

  reconnectUser(roomId: string, userId: string) {
    this.awayRepo.removeAwayUser(userId);
    // could add logic to emit events or update proximity
  }
}
