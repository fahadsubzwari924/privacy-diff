import express from "express";
import { env } from "./env.js";
import { loadTrackerMap } from "./tracker-map-loader.js";

const app = express();
app.use(express.json());

// Load tracker map once at startup
// TODO (Spec 03): Pass trackerMap to crawler endpoints for diff analysis
loadTrackerMap();

app.get("/health", (req: express.Request, res: express.Response): void => {
  res.json({ ok: true });
});

app.listen(env.port, (): void => {
  console.warn(`crawler listening on port ${env.port}`);
});
