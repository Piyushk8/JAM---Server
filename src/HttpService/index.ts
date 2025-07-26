import { Application } from "express";
import express from "express";
import cors from "cors";
import { AccessToken } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "mykey";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "mysecret";

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

    this.app.get("/getToken", async(req, res) => {
      const { room, identity } = req.query;
        console.log(room,identity)
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

      const token = await accessToken.toJwt()
      console.log("token",token)
      return res.json({
        token,
        success:true,
        message:'fetched token successfully'
      })
    });
  };
}
