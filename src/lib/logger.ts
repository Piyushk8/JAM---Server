import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",

  redact: {
    paths: [
      "password",
      "token",
      "req.headers.authorization"
    ],
    remove: true
  },

  transport: {
    target: "pino-pretty",
    options: {
      colorize: !isProd,              // colors in dev, clean in prod
      translateTime: "HH:MM:ss",
      singleLine: false,
      ignore: "pid,hostname",
      messageFormat: "{msg} {reqId}"
    }
  }
});

export default logger;
