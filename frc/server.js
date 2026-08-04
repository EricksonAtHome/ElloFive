/**
 * Lightweight ElloFive API compatible with FRC7-style /run/:model calls.
 * POST /run/:model  { "input": "..." }
 */

import express from "express";
import { generate, getHost, listModels } from "./client.js";

const app = express();
const PORT = Number(process.env.ELLOFIVE_PORT || process.env.PORT || 3000);

app.use(express.json({ limit: "1mb" }));

app.get("/health", async (_req, res) => {
  try {
    const models = await listModels();
    res.json({
      ok: true,
      runtime: "ElloFive",
      host: getHost(),
      models: models.map((m) => m.name),
    });
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message });
  }
});

app.get("/models", async (_req, res) => {
  try {
    res.json({ models: await listModels() });
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

app.post("/run/:model", async (req, res) => {
  const model = req.params.model || "ellofive";
  const input = req.body?.input ?? req.body?.prompt;
  if (!input) {
    res.status(400).json({ error: 'JSON body must include "input"' });
    return;
  }

  try {
    const result = await generate({ model, prompt: String(input) });
    res.json({
      runtime: "ElloFive",
      source: "FRC7",
      model: result.model,
      input: String(input),
      output: result.output.trim(),
      latencyMs: result.latencyMs,
      status: "success",
    });
  } catch (err) {
    res.status(502).json({ error: err.message, status: "error" });
  }
});

app.listen(PORT, () => {
  console.log(`ElloFive FRC API listening on http://127.0.0.1:${PORT}`);
  console.log(`Upstream LLM host: ${getHost()}`);
});
