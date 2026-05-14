import { Router } from "express";
import { getConfig } from "../config.js";
import { nowIso } from "../shared/time.js";

const router = Router();

router.get("/", (_req, res) => {
  const config = getConfig();

  res.json({
    ok: true,
    status: "ok",
    service: "travelai-backend",
    backendMode: config.backendMode,
    providerMode: config.providerMode,
    persistenceMode: config.persistenceMode,
    time: nowIso()
  });
});

export default router;
