import httpService from "./HttpService";
// import webSocketService from "./Websocke/ws";
import dotenv from "dotenv";
import http from "http";
import createSocketServer from "./Websocket/SocketServer";
dotenv.config();
const express = new httpService();
// const wsService = new webSocketService(express.app)
export const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
export const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

const httpServer = http.createServer(express.getServer());
const wsServer = createSocketServer(httpServer);

const PORT = 3000;
httpServer.listen(PORT);
// wsService.listen(PORT);
