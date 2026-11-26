import express from "express";
import { createClient } from "redis";
import { createHash } from "crypto";
import os from "os";

const PORT = Number(process.env.PORT ?? 3000);
const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const TTL_SECONDS = 60;

const redis = createClient({ url: REDIS_URL });
redis.on("error", (err) => console.error("Redis error:", err.message));

async function expensiveOperation(id: string) {
  // Simulated slow database query
  await new Promise((resolve) => setTimeout(resolve, 500));
  // CPU-bound work so load can drive the autoscaler
  let hash = id;
  for (let i = 0; i < 20000; i++) {
    hash = createHash("sha256").update(hash).digest("hex");
  }
  return { id, hash, computedAt: new Date().toISOString() };
}

const app = express();

app.use((_req, res, next) => {
  res.setHeader("X-Served-By", os.hostname());
  next();
});

app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/data/:id", async (req, res) => {
  const key = `data:${req.params.id}`;
  try {
    const cached = await redis.get(key);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.type("application/json").send(cached);
      return;
    }
    const result = await expensiveOperation(req.params.id);
    await redis.set(key, JSON.stringify(result), { EX: TTL_SECONDS });
    res.setHeader("X-Cache", "MISS");
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

async function main() {
  await redis.connect();
  app.listen(PORT, () => console.log(`API listening on ${PORT}`));
}

main();
