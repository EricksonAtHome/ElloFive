/**
 * FRC7-compatible FRCL executor backed by ElloFive (Ollama).
 * Supports the FRCL patterns used in EricksonAtHome/FRC7 demos.
 */

import { generate, getHost } from "./client.js";

const MODEL_ALIASES = {
  models5: "models5",
  ellofive: "ellofive",
  "llama3.2:1b": "llama3.2:1b",
};

function stripQuotes(value) {
  if (!value) return value;
  return value.replace(/^["']|["']$/g, "");
}

function resolveModel(name) {
  const key = stripQuotes(String(name || "ellofive").trim());
  return MODEL_ALIASES[key] || key || "ellofive";
}

/**
 * Parse a minimal FRCL script into structured steps.
 */
export function parseFrcl(script) {
  const lines = String(script || "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  const context = {
    env: "prod",
    model: "ellofive",
    input: null,
    network: {},
    docker: null,
    prints: false,
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("set env")) {
      context.env = stripQuotes(line.match(/["'](.+?)["']/)?.[1] || "prod");
      continue;
    }

    if (line.startsWith("use model")) {
      const m = line.match(/use model\s+(.+)$/);
      context.model = resolveModel(m?.[1]);
      continue;
    }

    if (line.startsWith("input ")) {
      context.input = line.match(/input\s+["'](.+?)["']/)?.[1] ?? null;
      continue;
    }

    if (line.startsWith("run model")) {
      const named = line.match(/run model\s+(\S+)/);
      if (named?.[1] && named[1] !== "{") {
        context.model = resolveModel(named[1]);
      }
      const inline = line.match(/input\s+["'](.+?)["']/);
      if (inline?.[1]) context.input = inline[1];
      continue;
    }

    if (line.startsWith("print")) {
      context.prints = true;
      continue;
    }

    if (line.startsWith("network ")) {
      const name = line.split(/\s+/)[1];
      const cfg = {};
      let j = i + 1;
      while (j < lines.length && !lines[j].includes("}")) {
        const parts = lines[j].split(/\s+/);
        if (parts.length >= 2) cfg[parts[0]] = stripQuotes(parts[1]);
        j++;
      }
      context.network[name] = cfg;
      i = j;
      continue;
    }

    if (line.startsWith("docker ")) {
      const cfg = { name: stripQuotes(line.match(/["'](.+?)["']/)?.[1]) };
      let j = i + 1;
      while (j < lines.length && !lines[j].includes("}")) {
        const parts = lines[j].split(/\s+/);
        if (parts.length >= 2) cfg[parts[0]] = stripQuotes(parts[1]);
        j++;
      }
      context.docker = cfg;
      i = j;
    }
  }

  return context;
}

export async function executeScript(script, { host = getHost() } = {}) {
  const ctx = parseFrcl(script);
  const model = resolveModel(ctx.model);
  const prompt = ctx.input || "Hello from ElloFive / FRC7";

  console.log(`[ENV  ] ${ctx.env}`);
  console.log(`[AI   ] Loading model: ${model}`);
  console.log(`[HOST ] ${host}`);
  console.log(`[EXEC ] Running inference...`);

  const result = await generate({ model, prompt, host });

  const payload = {
    runtime: "ElloFive",
    source: "FRC7-FRCL",
    env: ctx.env,
    model: result.model,
    input: prompt,
    output: result.output.trim(),
    latencyMs: result.latencyMs,
    network: ctx.network,
    docker: ctx.docker,
  };

  console.log("");
  console.log(" OUTPUT ");
  console.log(payload.output);
  console.log("");
  console.log(`latency: ${payload.latencyMs}ms`);

  return payload;
}

export async function runFRCL(script, options) {
  return executeScript(script, options);
}
