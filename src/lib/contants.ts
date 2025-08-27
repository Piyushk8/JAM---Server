// config.ts
import dotenv from "dotenv";
dotenv.config();
export const TICK_RATE = 10; // 10Hz -> every 100ms
export const CELL_SIZE = 200; // tune to ~ your proximity threshold
export const PROXIMITY_THRESHOLD = 150; // px
export const CHAT_RANGE = 200; // px
export const AUDIO_FALLOFF_END = 400; // px
export const FRONTEND_URL = process.env.FRONTEND_URL;
