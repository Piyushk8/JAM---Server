import { ProximityUser, Room, User } from "../types/type";

// Proximity settings
export const PROXIMITY_THRESHOLD = 150; // Distance for audio/video connection
export const CHAT_RANGE = 200; // Distance for seeing chat messages
export const AUDIO_FALLOFF_START = 100; // Distance where audio starts to fade
export const AUDIO_FALLOFF_END = 200; // Distance where audio becomes silent
export const TILE_SIZE = 32;
// Helper functions
export const calculateDistance = (user1: User, user2: User): number => {
  return Math.sqrt(
    Math.pow(user1.x - user2.x, 2) + Math.pow(user1.y - user2.y, 2)
  );
};

export const getUsersInProximity = (
  currentUser: User,
  roomUsers: User[],
  threshold: number = PROXIMITY_THRESHOLD
): ProximityUser[] => {
  const nearbyUsers: ProximityUser[] = [];
  roomUsers.forEach((user) => {
    if (user.id !== currentUser.id) {
      const distance = calculateDistance(currentUser, user);
      if (distance <= threshold) {
        nearbyUsers.push({
          ...user,
          distance,
        });
      }
    }
  });
  return nearbyUsers;
};

export const calculateAudioLevel = (distance: number): number => {
  if (distance <= AUDIO_FALLOFF_START) return 1.0;
  if (distance >= AUDIO_FALLOFF_END) return 0.0;

  // Linear falloff between start and end
  const falloffRange = AUDIO_FALLOFF_END - AUDIO_FALLOFF_START;
  const distanceInRange = distance - AUDIO_FALLOFF_START;
  return 1.0 - distanceInRange / falloffRange;
};

export function distance(a: User, b: User) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
