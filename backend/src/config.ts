export function getConfig() {
  const nodeEnv = process.env.NODE_ENV ?? "development";

  return {
    port: Number(process.env.PORT ?? 3000),
    backendMode: process.env.BACKEND_MODE ?? "mock",
    providerMode: process.env.PROVIDER_MODE ?? "mock",
    persistenceMode: process.env.PERSISTENCE_MODE ?? "memory",
    cookie: {
      name: "travelai_anon_id",
      maxAgeMs: 30 * 24 * 60 * 60 * 1000,
      secure: nodeEnv === "production",
      sameSite: "lax" as const,
      httpOnly: true
    }
  };
}
