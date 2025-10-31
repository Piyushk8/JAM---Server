import { Socket } from "socket.io";
import { parseCookiesWithQs } from "./cookieParser";
import jwt from "jsonwebtoken";

export default function authMiddleware(socket: Socket, next) {
  try {
    const rawCookie = socket.handshake.headers.cookie;

    if (!rawCookie) return next(new Error("No cookies found"));

    const parsed = parseCookiesWithQs(rawCookie);

    const { token } = parsed;
    if (!token) throw new Error("No token in cookies");

    const { userId, username } = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      username: string;
    };
    socket.data.userId = userId;
    socket.data.username = username;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    next(new Error("Authentication error"));
  }
}
