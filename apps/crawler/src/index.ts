import express from "express";
import { env } from "./env.js";

const app = express();
app.use(express.json());

app.get("/health", (req: express.Request, res: express.Response): void => {
  res.json({ ok: true });
});

app.listen(env.port, (): void => {
  console.warn(`crawler listening on port ${env.port}`);
});
