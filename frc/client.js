/**
 * ElloFive / Ollama HTTP client
 */

const DEFAULT_HOST = process.env.ELLOFIVE_HOST || process.env.OLLAMA_HOST || "http://127.0.0.1:11434";

export function getHost() {
  return DEFAULT_HOST.replace(/\/$/, "");
}

export async function listModels(host = getHost()) {
  const res = await fetch(`${host}/api/tags`);
  if (!res.ok) {
    throw new Error(`ElloFive list failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return data.models || [];
}

export async function generate({
  model = "ellofive",
  prompt,
  host = getHost(),
  stream = false,
  options = {},
} = {}) {
  if (!prompt) throw new Error("prompt is required");

  const started = Date.now();
  const res = await fetch(`${host}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream,
      options,
    }),
  });

  if (!res.ok) {
    throw new Error(`ElloFive generate failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return {
    model,
    output: data.response ?? "",
    latencyMs: Date.now() - started,
    done: Boolean(data.done),
    raw: data,
  };
}

export async function chat({
  model = "ellofive",
  messages,
  host = getHost(),
  stream = false,
} = {}) {
  const res = await fetch(`${host}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream }),
  });

  if (!res.ok) {
    throw new Error(`ElloFive chat failed (${res.status}): ${await res.text()}`);
  }

  return res.json();
}
