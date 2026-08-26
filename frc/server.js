/**
 * Elloten UI + Ello5 model API gateway.
 *
 * Hosts (see docs/domains.md):
 *   ai.ello5.com      → Elloten (chat UX)
 *   api.ello5.com     → REST
 *   ft.svr.ello5.com  → runtime (proxied separately)
 *
 * Elloten = web UX tool. Ello5 = AI model / mode.
 */

import express from "express";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chat, generate, getHost, listModels } from "./client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const WEB_ROOT = path.join(ROOT, "web");
const MEMORY_BIN = path.join(ROOT, "bin", "ellofive-memory");

/** Auto-save user ask + AI reply into local memory (optional GitHub sync). */
function autoLearn(ask, reply, source = "api") {
  if (!ask) return;
  try {
    spawnSync(
      "bash",
      [
        MEMORY_BIN,
        "learn",
        "--ask",
        String(ask).slice(0, 4000),
        "--reply",
        String(reply || "").slice(0, 4000),
        "--source",
        source,
      ],
      { timeout: 20_000, encoding: "utf8" }
    );
  } catch {
    // never fail the chat path because of memory
  }
}

function memoryContextBlock() {
  try {
    const out = spawnSync("bash", [MEMORY_BIN, "context"], {
      timeout: 10_000,
      encoding: "utf8",
    });
    if (out.status === 0 && out.stdout) return String(out.stdout).trim();
  } catch {
    /* ignore */
  }
  return "";
}

const app = express();
const PORT = Number(process.env.ELLOFIVE_PORT || process.env.PORT || 3000);
const DEFAULT_MODEL = process.env.ELLO5_MODEL || process.env.ELLOFIVE_MODEL || "ellofive";

const DOMAIN = process.env.ELLO5_DOMAIN || "ello5.com";
const UI_HOST = process.env.ELLO5_UI_HOST || `ai.${DOMAIN}`;
const API_HOST = process.env.ELLO5_API_HOST || `api.${DOMAIN}`;
const RUNTIME_HOST = process.env.ELLO5_RUNTIME_HOST || `ft.svr.${DOMAIN}`;

function parseCorsOrigins() {
  const raw = process.env.ELLO5_CORS_ORIGINS || "";
  const listed = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const defaults = [
    `https://${UI_HOST}`,
    `https://${DOMAIN}`,
    `http://${UI_HOST}`,
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3080",
    "http://localhost:3080",
  ];
  return new Set([...defaults, ...listed]);
}

const CORS_ORIGINS = parseCorsOrigins();

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (CORS_ORIGINS.has(origin)) return true;
  try {
    const { hostname } = new URL(origin);
    return hostname === DOMAIN || hostname.endsWith(`.${DOMAIN}`);
  } catch {
    return false;
  }
}

app.use(express.json({ limit: "2mb" }));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

app.get("/health", async (_req, res) => {
  try {
    const models = await listModels();
    res.json({
      ok: true,
      product: "Elloten",
      model: "Ello5",
      mode: "Ello5",
      runtimeProduct: "ElloFive",
      note: "Elloten is the UX; Ello5 is the AI model",
      hosts: {
        ui: UI_HOST,
        api: API_HOST,
        runtime: RUNTIME_HOST,
        domain: DOMAIN,
      },
      runtime: getHost(),
      models: models.map((m) => m.name),
    });
  } catch (err) {
    res.status(503).json({
      ok: false,
      product: "Elloten",
      model: "Ello5",
      mode: "Ello5",
      error: err.message,
    });
  }
});

app.get("/v1/hosts", (_req, res) => {
  res.json({
    product: "Elloten",
    model: "Ello5",
    mode: "Ello5",
    domain: DOMAIN,
    ui: UI_HOST,
    api: API_HOST,
    runtime: RUNTIME_HOST,
    note: "Elloten UX on ello5.com — Ello5 is the AI model",
  });
});

app.get("/models", async (_req, res) => {
  try {
    res.json({ mode: "Ello5", models: await listModels() });
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

app.get("/v1/models", async (_req, res) => {
  try {
    res.json({ mode: "Ello5", models: await listModels() });
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

/** FRC7-compatible: POST /run/:model { input } */
app.post("/run/:model", async (req, res) => {
  const model = req.params.model || DEFAULT_MODEL;
  const input = req.body?.input ?? req.body?.prompt;
  if (!input) {
    res.status(400).json({ error: 'JSON body must include "input"' });
    return;
  }

  try {
    const result = await generate({ model, prompt: String(input) });
    res.json({
      mode: "Ello5",
      runtime: "ElloFive",
      source: "FRC7",
      model: result.model,
      input: String(input),
      output: result.output.trim(),
      latencyMs: result.latencyMs,
      status: "success",
    });
  } catch (err) {
    res.status(502).json({ error: err.message, status: "error", mode: "Ello5" });
  }
});

/**
 * Ello5 AI mode chat
 * POST /v1/chat  { message | prompt | messages, model? }
 */
app.post("/v1/chat", async (req, res) => {
  const model = req.body?.model || DEFAULT_MODEL;
  let messages = req.body?.messages;
  let userText = "";

  if (!Array.isArray(messages) || messages.length === 0) {
    const text = req.body?.message ?? req.body?.prompt ?? req.body?.input;
    if (!text) {
      res.status(400).json({
        error: 'Provide "message", "prompt", or "messages"',
        mode: "Ello5",
      });
      return;
    }
    userText = String(text);
    messages = [{ role: "user", content: userText }];
  } else {
    const lastUser = [...messages].reverse().find((m) => m?.role === "user");
    userText = String(lastUser?.content || "");
  }

  // Inject local knowledge base so Elloten chats learn from prior asks/tasks
  const mem = memoryContextBlock();
  if (mem) {
    messages = [
      {
        role: "system",
        content: `${mem}\n\nUse this local memory when relevant. Prefer privacy-first, local answers.`,
      },
      ...messages,
    ];
  }

  try {
    const data = await chat({ model, messages });
    const output = String(data.message?.content ?? data.response ?? "").trim();
    autoLearn(userText, output, "api");
    res.json({
      mode: "Ello5",
      model,
      output,
      message: data.message || { role: "assistant", content: output },
      learned: true,
      status: "success",
    });
  } catch (err) {
    res.status(502).json({ error: err.message, status: "error", mode: "Ello5" });
  }
});

/**
 * Explicit task learn endpoint (agent / SA tools)
 * POST /v1/memory/task  { goal, result?, source? }
 */
app.post("/v1/memory/task", (req, res) => {
  const goal = req.body?.goal ?? req.body?.task ?? req.body?.prompt;
  if (!goal) {
    res.status(400).json({ error: 'Provide "goal"', status: "error" });
    return;
  }
  const result = req.body?.result ?? req.body?.output ?? "";
  const source = req.body?.source || "api-task";
  try {
    const out = spawnSync(
      "bash",
      [
        MEMORY_BIN,
        "task",
        "--goal",
        String(goal).slice(0, 4000),
        "--result",
        String(result).slice(0, 4000),
        "--source",
        String(source),
      ],
      { timeout: 30_000, encoding: "utf8" }
    );
    res.json({
      status: "success",
      learned: out.status === 0,
      output: String(out.stdout || "").trim(),
    });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

/** Manual sync to GitHub */
app.post("/v1/memory/sync", (req, res) => {
  try {
    const msg = req.body?.message || "chore(memory): sync via Elloten API";
    const out = spawnSync("bash", [MEMORY_BIN, "sync", "--message", String(msg)], {
      timeout: 120_000,
      encoding: "utf8",
    });
    res.json({
      status: out.status === 0 ? "success" : "error",
      output: String(out.stdout || out.stderr || "").trim(),
    });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

app.use(express.static(WEB_ROOT, { index: "index.html", extensions: ["html"] }));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/v1") || req.path.startsWith("/run") || req.path.startsWith("/models") || req.path.startsWith("/health")) {
    next();
    return;
  }
  res.sendFile(path.join(WEB_ROOT, "index.html"), (err) => {
    if (err) next(err);
  });
});

app.listen(PORT, () => {
  console.log(`Elloten (Ello5 model) on http://127.0.0.1:${PORT}`);
  console.log(`  UI host      : ${UI_HOST}  (Elloten)`);
  console.log(`  API host     : ${API_HOST}`);
  console.log(`  Runtime host : ${RUNTIME_HOST}  (upstream ${getHost()})`);
  console.log(`  Model        : Ello5`);
});
