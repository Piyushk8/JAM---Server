import httpService from './HttpService';
import webSocketService from './Websocke/ws';
import dotenv from "dotenv";
dotenv.config();
const express = new httpService()
const wsService = new webSocketService(express.app)
export const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
export const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;


const PORT =  3000;
wsService.listen(PORT);
