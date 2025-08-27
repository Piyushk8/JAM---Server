import { Application } from "express";
import express from "express";
import cors from "cors";
import { AccessToken } from "livekit-server-sdk";
import dotenv from "dotenv";
import { LIVEKIT_API_KEY, LIVEKIT_API_SECRET } from "../index";
import { mainRouter } from "./Routers";
dotenv.config();

export default class httpService {
  public app: Application;
  constructor() {
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());
    this.initializeApi();
  }
  public initializeApi = () => {
    this.app.get("/", (req, res) => {
      res.send("hiii");
    });
    this.app.use("/api/v1",mainRouter)

    this.app.get("/getToken", async (req, res) => {
      const { room, identity } = req.query;
      if (!room || !identity)
        return res.status(400).json({
          success: false,
          message: "no room or identity provided",
        });
      // fecthing a access token for the room we just created
      const accessToken = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
        identity: identity as string,
      });
      // setting some permissions for the room
      accessToken.addGrant({
        roomJoin: true,
        room: room as string,
        canPublish: true,
        canSubscribe: true,
      });

      const token = await accessToken.toJwt();
      return res.json({
        token,
        success: true,
        message: "fetched token successfully",
      });
    });
    // this.app.post("/createRoom", (req, res) => {
    //   const { creator } = req.body;
    // });
    // this.app.get("/joinRoom", (req, res) => {
    //     try {
          
    //           const { roomId, username } = req.body;
              
    //           const userId = socket.id;
    //           console.log("jooining", userId, roomId);

    //           roomManager.ensureRoom(roomId);

    //           const user: User = {
    //             id: userId,
    //             username,
    //             x:22,
    //             y:10,
    //             socketId: socket.id,
    //             roomId,
    //             isAudioEnabled: false,
    //             isVideoEnabled: false,
    //           };

    //           roomManager.addUserToRoom(roomId, user);
    //           roomManager.setNearbyUsers(roomId, userId, new Set());
    //           roomManager.setUser(userId, user);

    //           socket.join(roomId);

    //           this.spatial.addOrMove(roomId, user);

    //           const roomUsers = Array.from(
    //             roomManager.getRoomUsers(roomId).values()
    //           );
    //           console.log("roomUsers",roomUsers)
    //           socket.emit("room-users", roomUsers);

    //           socket.to(roomId).emit("user-joined", user);
    //           console.log(
    //             "after",
    //             roomManager.getRoomsMap(),
    //             roomManager.getUsersMap()
    //           );

            
          
    //     } catch (error) {
          
    //     }


    // });
  };

  public getServer = () => {
    return this.app;
  };
}
