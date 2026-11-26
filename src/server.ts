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

// Work currently in progress, keyed by cache key (not a cache: entries are removed when done)
const inFlight = new Map<string, ReturnType<typeof expensiveOperation>>();

// Fix 1: a Redis failure is treated as a cache miss instead of an error
async function readCache(key: string) {
  if (!redis.isReady) return null;
  try {
    return await redis.get(key);
  } catch (err) {
    console.error("Cache read failed:", err);
    return null;
  }
}

async function writeCache(key: string, value: string) {
  if (!redis.isReady) return;
  try {
    await redis.set(key, value, { EX: TTL_SECONDS });
  } catch (err) {
    console.error("Cache write failed:", err);
  }
}

app.get("/api/data/:id", async (req, res) => {
  const id = req.params.id;
  const key = `data:${id}`;
  try {
    const cached = await readCache(key);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.type("application/json").send(cached);
      return;
    }

    // Fix 2: concurrent misses on the same key share one operation
    let pending = inFlight.get(key);
    if (!pending) {
      pending = expensiveOperation(id)
        .then(async (result) => {
          await writeCache(key, JSON.stringify(result));
          return result;
        })
        .finally(() => inFlight.delete(key));
      inFlight.set(key, pending);
    }

    const result = await pending;
    res.setHeader("X-Cache", "MISS");
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

async function main() {
  // Fix 1: connect in the background so the API starts even if Redis is down
  redis.connect().catch((err) => console.error("Redis connect failed:", err.message));
  app.listen(PORT, () => console.log(`API listening on ${PORT}`));
}

main();
