#!/usr/bin/env node
/**
 * Blackeye CLI — terminal-only (no browser / no web UI).
 * Token auth, token management, interactive shell.
 *
 * Usage:
 *   blackeye <command>
 *   SA blackeye <command>
 */
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const ROOT = path.resolve(__dirname, "..");
const DB_PATH = path.join(ROOT, "tokens.json");
const ENV_PATH = path.join(ROOT, ".env.local");
const SESSION_PATH = path.join(ROOT, ".blackeye-session.json");

function initDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, "{}\n", "utf8");
  }
}

function readDB() {
  initDB();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8") || "{}");
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function generateToken(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

function mask(token) {
  if (!token || token.length < 12) return "****";
  return `${token.slice(0, 6)}…${token.slice(-4)}`;
}

function readEnv() {
  const out = {};
  if (!fs.existsSync(ENV_PATH)) return out;
  for (const line of fs.readFileSync(ENV_PATH, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

function readSession() {
  if (!fs.existsSync(SESSION_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(SESSION_PATH, "utf8"));
  } catch {
    return null;
  }
}

function writeSession(session) {
  fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2) + "\n", "utf8");
}

function clearSession() {
  if (fs.existsSync(SESSION_PATH)) fs.unlinkSync(SESSION_PATH);
}

function banner() {
  console.log(`
╔══════════════════════════════════════╗
║         Blackeye CLI  (terminal)     ║
║   token auth · no browser required   ║
╚══════════════════════════════════════╝
`);
}

function help() {
  banner();
  console.log(`Usage:
  blackeye status
  blackeye token create [--password <pw>] [--no-prompt]
  blackeye token list
  blackeye token delete <token>
  blackeye auth <token> [--password <pw>]
  blackeye whoami
  blackeye logout
  blackeye shell                 Interactive CLI (REPL)
  blackeye version

Also:
  SA blackeye <command...>
  SA list

Notes:
  • All commands run in the terminal — nothing opens a webpage.
  • WalletConnect UI lives in the Next.js app; use CLI for tokens/auth.
  • Tokens file: ${DB_PATH}
`);
}

function cmdStatus() {
  banner();
  const db = readDB();
  const env = readEnv();
  const session = readSession();
  const count = Object.keys(db).length;
  const projectId = env.NEXT_PUBLIC_PROJECT_ID || "(not set)";
  console.log("Root      :", ROOT);
  console.log("Tokens    :", count, `(${DB_PATH})`);
  console.log("Project ID:", projectId === "your_walletconnect_project_id" ? "(placeholder — set in .env.local)" : mask(projectId));
  console.log("Session   :", session ? `logged in as ${mask(session.token)}` : "not logged in");
  console.log("Mode      : CLI only (no web server started)");
}

function ask(rl, q) {
  return new Promise((resolve) => rl.question(q, resolve));
}

async function cmdTokenCreate(args) {
  let password = null;
  let noPrompt = args.includes("--no-prompt");
  const pi = args.indexOf("--password");
  if (pi >= 0) password = args[pi + 1] || null;

  if (password === null && !noPrompt && process.stdin.isTTY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await ask(rl, "Password for this token (Enter to skip): ");
    rl.close();
    if (answer.trim()) password = answer.trim();
  }

  const token = generateToken();
  const db = readDB();
  db[token] = {
    password: password,
    createdAt: new Date().toISOString(),
  };
  writeDB(db);

  console.log("\n=========================================");
  console.log("         NEW TOKEN GENERATED");
  console.log("=========================================");
  console.log("TOKEN   :", token);
  console.log("PASSWORD:", password || "None");
  console.log("=========================================\n");
  console.log("Login in CLI: blackeye auth", token.slice(0, 12) + "…");
}

function cmdTokenList() {
  const db = readDB();
  const keys = Object.keys(db);
  if (!keys.length) {
    console.log("No tokens. Create one: blackeye token create");
    return;
  }
  console.log(`\n${keys.length} token(s):\n`);
  for (const [i, tok] of keys.entries()) {
    const row = db[tok];
    console.log(`${i + 1}. ${mask(tok)}`);
    console.log(`   created : ${row.createdAt || "?"}`);
    console.log(`   password: ${row.password ? "yes" : "no"}`);
  }
  console.log("");
}

function cmdTokenDelete(token) {
  if (!token) {
    console.error("Usage: blackeye token delete <token>");
    process.exit(1);
  }
  const db = readDB();
  if (!db[token]) {
    // allow prefix match if unique
    const matches = Object.keys(db).filter((k) => k.startsWith(token));
    if (matches.length === 1) token = matches[0];
    else {
      console.error("Token not found.");
      process.exit(1);
    }
  }
  delete db[token];
  writeDB(db);
  const session = readSession();
  if (session && session.token === token) clearSession();
  console.log("Deleted token", mask(token));
}

function resolveToken(input) {
  const db = readDB();
  if (db[input]) return input;
  const matches = Object.keys(db).filter((k) => k.startsWith(input));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    console.error("Ambiguous token prefix; provide more characters.");
    process.exit(1);
  }
  return null;
}

async function cmdAuth(args) {
  const tokenArg = args.find((a) => !a.startsWith("--"));
  if (!tokenArg) {
    console.error("Usage: blackeye auth <token> [--password <pw>]");
    process.exit(1);
  }
  let password = null;
  const pi = args.indexOf("--password");
  if (pi >= 0) password = args[pi + 1] || null;

  const token = resolveToken(tokenArg);
  if (!token) {
    console.error("Auth failed: unknown token.");
    process.exit(1);
  }
  const row = readDB()[token];
  if (row.password) {
    if (password === null && process.stdin.isTTY) {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      password = (await ask(rl, "Password: ")).trim();
      rl.close();
    }
    if (password !== row.password) {
      console.error("Auth failed: bad password.");
      process.exit(1);
    }
  }

  writeSession({
    token,
    authenticatedAt: new Date().toISOString(),
  });
  console.log("\n✓ Authenticated (CLI session)");
  console.log("  token :", mask(token));
  console.log("  since :", new Date().toISOString());
  console.log("\nRun: blackeye whoami | blackeye shell | blackeye logout\n");
}

function cmdWhoami() {
  const session = readSession();
  if (!session) {
    console.log("Not logged in. Use: blackeye auth <token>");
    return;
  }
  console.log("Logged in");
  console.log("  token :", mask(session.token));
  console.log("  since :", session.authenticatedAt);
}

function cmdLogout() {
  clearSession();
  console.log("Logged out.");
}

async function cmdShell() {
  banner();
  const session = readSession();
  console.log(session ? `Session: ${mask(session.token)}` : "Session: (guest — use auth <token>)");
  console.log("Type help for commands. Ctrl+C or exit to quit.\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "blackeye> " });
  rl.prompt();
  rl.on("line", async (line) => {
    const raw = line.trim();
    if (!raw) {
      rl.prompt();
      return;
    }
    if (raw === "exit" || raw === "quit") {
      rl.close();
      return;
    }
    try {
      await dispatch(raw.split(/\s+/));
    } catch (err) {
      console.error(err.message || err);
    }
    rl.prompt();
  });
  rl.on("close", () => {
    console.log("bye");
    process.exit(0);
  });
}

async function dispatch(argv) {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case "help":
    case "-h":
    case "--help":
      help();
      break;
    case "version":
    case "-v":
      console.log("blackeye-cli 1.0.0 (BlackeyE3.1)");
      break;
    case "status":
      cmdStatus();
      break;
    case "token":
      if (rest[0] === "create") await cmdTokenCreate(rest.slice(1));
      else if (rest[0] === "list") cmdTokenList();
      else if (rest[0] === "delete") cmdTokenDelete(rest[1]);
      else {
        console.log("Usage: blackeye token create|list|delete");
      }
      break;
    case "auth":
    case "login":
      await cmdAuth(rest);
      break;
    case "whoami":
      cmdWhoami();
      break;
    case "logout":
      cmdLogout();
      break;
    case "shell":
    case "repl":
      await cmdShell();
      break;
    case "create":
      // compat with legacy: pig create token
      if (rest[0] === "token") await cmdTokenCreate(rest.slice(1));
      else help();
      break;
    case "delete":
      if (rest[0] === "token") cmdTokenDelete(rest[1]);
      else help();
      break;
    default:
      console.error(`Unknown command: ${cmd}`);
      help();
      process.exitCode = 1;
  }
}

async function main() {
  process.chdir(ROOT);
  const argv = process.argv.slice(2);
  if (!argv.length) {
    help();
    return;
  }
  await dispatch(argv);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
