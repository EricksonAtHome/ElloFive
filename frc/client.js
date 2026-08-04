/**
 * ElloFive / Ollama HTTP client
 * Prefers /api/chat so Modelfile SYSTEM prompts are applied correctly.
 */

const DEFAULT_HOST =
  process.env.ELLOFIVE_HOST || process.env.OLLAMA_HOST || "http://127.0.0.1:11434";

export function getHost() {
  return DEFAULT_HOST.replace(/\/$/, "");
}

async function readError(res) {
  try {
    return await res.text();
  } catch {
    return res.statusText || "unknown error";
  }
}

export async function ensureRuntime(host = getHost(), { timeoutMs = 2500 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${host}/api/tags`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`runtime unhealthy (${res.status})`);
    return true;
  } catch (err) {
    throw new Error(
      `ElloFive runtime not reachable at ${host}. Start it with: ellofive serve\n(${err.message})`,
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function listModels(host = getHost()) {
  await ensureRuntime(host);
  const res = await fetch(`${host}/api/tags`);
  if (!res.ok) {
    throw new Error(`ElloFive list failed (${res.status}): ${await readError(res)}`);
  }
  const data = await res.json();
  return data.models || [];
}

export async function hasModel(name, host = getHost()) {
  const models = await listModels(host);
  const needle = String(name).toLowerCase();
  return models.some((m) => String(m.name || "").toLowerCase().startsWith(needle));
}

/**
 * Generate a completion using chat API (better instruction following).
 */
export async function generate({
  model = "ellofive",
  prompt,
  host = getHost(),
  stream = false,
  options = {},
  system,
} = {}) {
  if (!prompt) throw new Error("prompt is required");
  await ensureRuntime(host);

  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: String(prompt) });

  const started = Date.now();
  const res = await fetch(`${host}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream,
      options: {
        temperature: 0.55,
        ...options,
      },
    }),
  });

  if (!res.ok) {
    // Fallback to /api/generate for older runtimes
    const gen = await fetch(`${host}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false, options }),
    });
    if (!gen.ok) {
      throw new Error(`ElloFive generate failed (${res.status}): ${await readError(res)}`);
    }
    const data = await gen.json();
    return {
      model,
      output: data.response ?? "",
      latencyMs: Date.now() - started,
      done: Boolean(data.done),
      raw: data,
      mode: "generate",
    };
  }

  const data = await res.json();
  const output = data.message?.content ?? data.response ?? "";
  return {
    model,
    output,
    latencyMs: Date.now() - started,
    done: Boolean(data.done),
    raw: data,
    mode: "chat",
  };
}

export async function chat({
  model = "ellofive",
  messages,
  host = getHost(),
  stream = false,
  options = {},
} = {}) {
  await ensureRuntime(host);
  const res = await fetch(`${host}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream, options }),
  });

  if (!res.ok) {
    throw new Error(`ElloFive chat failed (${res.status}): ${await readError(res)}`);
  }

  return res.json();
}
