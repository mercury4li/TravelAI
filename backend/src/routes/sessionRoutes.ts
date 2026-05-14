import { Router } from "express";
import type { getConfig } from "../config.js";
import type { AnonymousSessionService } from "../modules/session/anonymousSessionService.js";
import { ensureSession } from "./sessionHelpers.js";

type Config = ReturnType<typeof getConfig>;

export default function sessionRoutes({
  config,
  sessionService
}: {
  config: Config;
  sessionService: AnonymousSessionService;
}) {
  const router = Router();

  router.get("/", (req, res) => {
    const session = ensureSession(req, res, config, sessionService);
    res.json(session);
  });

  return router;
}
