#!/usr/bin/env node
/**
 * Ello5 Agent Loop — BabyAGI / AgentGPT-style planner for local Ello5 (Ollama).
 * Inspired by AgentGPT + KwaiAgents; runs fully offline against Ollama OpenAI API.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const HOST = (process.env.ELLOFIVE_HOST || process.env.OLLAMA_HOST || "http://127.0.0.1:11434").replace(
  /\/$/,
  "",
);
const MODEL = process.env.ELLO5_AGENT_MODEL || process.env.ELLO5_MODEL || "ellofive-fast";
const MAX_ITERS = Number(process.env.ELLO5_AGENT_MAX_ITERS || 4);

async function chat(messages, { temperature = 0.3 } = {}) {
  const res = await fetch(`${HOST}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, temperature, stream: false }),
  });
  if (!res.ok) {
    throw new Error(`Ello5 chat failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return String(data.choices?.[0]?.message?.content || "").trim();
}

function parseTaskList(text) {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/^\s*[-*\d.)]+\s*/, "").trim())
    .filter(Boolean);
  return lines.slice(0, 6);
}

async function plan(goal) {
  const text = await chat([
    {
      role: "system",
      content:
        "You are Ello5 Agent planner. Break the goal into 3-5 short concrete tasks. Reply with a numbered list only. No tools needed beyond reasoning.",
    },
    { role: "user", content: `Goal: ${goal}` },
  ]);
  return parseTaskList(text);
}

async function executeTask(goal, task, prior) {
  return chat([
    {
      role: "system",
      content:
        "You are Ello5 Agent executor. Complete the given task for the goal. Be concise and practical. Prefer local/privacy-first advice.",
    },
    {
      role: "user",
      content: `Goal: ${goal}\nTask: ${task}\nPrior results:\n${prior || "(none)"}`,
    },
  ]);
}

async function conclude(goal, results) {
  return chat([
    {
      role: "system",
      content: "You are Ello5 Agent. Summarize results into a final answer for the user.",
    },
    {
      role: "user",
      content: `Goal: ${goal}\nResults:\n${results.map((r, i) => `${i + 1}. ${r.task}\n${r.output}`).join("\n\n")}`,
    },
  ]);
}

async function main() {
  const goal = process.argv.slice(2).join(" ").trim();
  if (!goal || goal === "-h" || goal === "--help") {
    console.log(`Usage: node integrations/ello5-agent/agent.js "<goal>"
Env: ELLOFIVE_HOST ELLO5_AGENT_MODEL ELLO5_AGENT_MAX_ITERS`);
    process.exit(goal ? 0 : 1);
  }

  console.log(`Ello5 Agent  model=${MODEL}  host=${HOST}`);
  console.log(`Goal: ${goal}\n`);

  const tasks = await plan(goal);
  console.log("Plan:");
  tasks.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
  console.log("");

  const results = [];
  const limit = Math.min(tasks.length, MAX_ITERS);
  for (let i = 0; i < limit; i++) {
    const task = tasks[i];
    console.log(`→ Task ${i + 1}/${limit}: ${task}`);
    const prior = results.map((r) => `- ${r.task}: ${r.output.slice(0, 200)}`).join("\n");
    const output = await executeTask(goal, task, prior);
    results.push({ task, output });
    console.log(output.slice(0, 600) + (output.length > 600 ? "…" : ""));
    console.log("");
  }

  const summary = await conclude(goal, results);
  console.log("=== Final ===");
  console.log(summary);

  const outDir = path.join(ROOT, "memory", "agent-runs");
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(outDir, `${stamp}.md`);
  fs.writeFileSync(
    file,
    `# Ello5 Agent run\n\n**Goal:** ${goal}\n**Model:** ${MODEL}\n\n## Plan\n${tasks.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\n## Results\n${results
      .map((r) => `### ${r.task}\n${r.output}\n`)
      .join("\n")}\n## Final\n${summary}\n`,
  );
  console.log(`\nSaved: ${file}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
