#!/usr/bin/env node
/**
 * ElloFive FRC CLI — run .frcl scripts against the local ElloFive LLM
 *
 * Usage:
 *   node frc/cli.js examples/hello.frcl
 *   ellofive frc examples/hello.frcl
 *   node frc/cli.js --prompt "Hello" --model ellofive
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { executeScript, runFRCL } from "./executor.js";
import { generate, getHost, listModels } from "./client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printHelp() {
  console.log(`ElloFive FRC CLI

Usage:
  ellofive-frc <file.frcl>
  ellofive-frc --prompt "text" [--model ellofive]
  ellofive-frc --list

Runs FRC7 FRCL scripts with real local inference via ElloFive (Ollama).
Host: ${getHost()}
`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    printHelp();
    process.exit(args.length === 0 ? 1 : 0);
  }

  if (args.includes("--list")) {
    const models = await listModels();
    console.log("ElloFive models:");
    for (const m of models) {
      console.log(`  - ${m.name}`);
    }
    return;
  }

  const promptIdx = args.indexOf("--prompt");
  if (promptIdx !== -1) {
    const prompt = args[promptIdx + 1];
    const modelIdx = args.indexOf("--model");
    const model = modelIdx !== -1 ? args[modelIdx + 1] : "ellofive";
    const result = await generate({ model, prompt });
    console.log(result.output.trim());
    console.log(`\n[${result.latencyMs}ms · ${result.model}]`);
    return;
  }

  const file = args.find((a) => !a.startsWith("--"));
  if (!file) {
    printHelp();
    process.exit(1);
  }

  const resolved = path.isAbsolute(file)
    ? file
    : path.resolve(process.cwd(), file);

  if (!fs.existsSync(resolved)) {
    // also try relative to repo root
    const alt = path.resolve(__dirname, "..", file);
    if (!fs.existsSync(alt)) {
      console.error(`File not found: ${file}`);
      process.exit(1);
    }
    const script = fs.readFileSync(alt, "utf8");
    await runFRCL(script);
    return;
  }

  const script = fs.readFileSync(resolved, "utf8");
  await executeScript(script);
}

main().catch((err) => {
  console.error(`ElloFive FRC error: ${err.message}`);
  process.exit(1);
});
