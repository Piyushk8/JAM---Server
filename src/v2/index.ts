
const inMemoryRoomRepo = new InMemoryRoomRepo();
const inMemoryAwayUserRepo = new InMemoryAwayRepo();
// let InMemoryUserRepo = new inMemoryUs()

const strategy = new GridProximityStrategy();
const proximityRepo = new InMemoryProximityRepo();

export const roomService = new RoomService(
  inMemoryRoomRepo,
  inMemoryAwayUserRepo
);
export const proximityService = new ProximityService(strategy, proximityRepo);

// src/v1/index.ts
import express from "express";
import http from "http";
import { InMemoryRoomRepo } from "./adapters/runtime/InMemoryRoomRepo/room";
import { InMemoryAwayRepo } from "./adapters/runtime/InMemoryRoomRepo/InMemoryAwayUserRepo/user";
import { GridProximityStrategy } from "./domain/ProximityMap/GridProximityStrategy";
import { InMemoryProximityRepo } from "./adapters/runtime/InMemoryProximityRepo/proximityRepo";
import { RoomService } from "./services/RoomServices";
import { ProximityService } from "./services/ProximityServices";
import { createSocketServer } from "./Server/Socket/SocketServer";

const app = express();
const httpServer = http.createServer(app);

createSocketServer(httpServer);

httpServer.listen(3000, () => {
  console.log("Server listening on port 3000");
});
