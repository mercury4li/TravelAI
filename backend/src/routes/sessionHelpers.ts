import type { Request, Response } from "express";
import type { getConfig } from "../config.js";
import type { AnonymousSessionService, SessionResult } from "../modules/session/anonymousSessionService.js";

type Config = ReturnType<typeof getConfig>;

export function ensureSession(req: Request, res: Response, config: Config, sessionService: AnonymousSessionService) {
  const session = sessionService.getOrCreate(req.cookies?.[config.cookie.name]);
  setSessionCookie(res, config, session);
  return session;
}

export function setSessionCookie(res: Response, config: Config, session: SessionResult) {
  res.cookie(config.cookie.name, session.anonymousUserId, {
    httpOnly: config.cookie.httpOnly,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    path: "/",
    maxAge: config.cookie.maxAgeMs
  });
}
