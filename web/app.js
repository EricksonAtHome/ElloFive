/**
 * Ello5 AI mode UI — talks to same-origin API (api.ello5.com or local :3000).
 * Ello5 is only an AI mode.
 */

const statusEl = document.getElementById("status");
const threadEl = document.getElementById("thread");
const composer = document.getElementById("composer");
const promptEl = document.getElementById("prompt");
const modelEl = document.getElementById("model");
const sendBtn = document.getElementById("send");
const hero = document.getElementById("hero");
const chat = document.getElementById("chat");
const startBtn = document.getElementById("start-chat");

const history = [];

function apiBase() {
  // Same origin when served by ellofive api; override for split hosts.
  const fromMeta = window.ELLO5_API_ORIGIN;
  if (fromMeta) return fromMeta.replace(/\/$/, "");
  return "";
}

function setStatus(state, text) {
  statusEl.dataset.state = state;
  statusEl.textContent = text;
}

async function refreshHealth() {
  try {
    const res = await fetch(`${apiBase()}/health`);
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "down");
    setStatus("ok", "online");
    if (data.hosts) {
      const rh = document.getElementById("runtime-host");
      const ah = document.getElementById("api-host");
      if (rh && data.hosts.runtime) rh.textContent = data.hosts.runtime;
      if (ah && data.hosts.api) ah.textContent = data.hosts.api;
      const pill = document.getElementById("host-pill");
      if (pill) {
        pill.textContent = `${data.hosts.ui || "ai"} · ${data.hosts.api || "api"} · ${data.hosts.runtime || "ft.svr"}`;
      }
    }
    if (Array.isArray(data.models) && data.models.length) {
      const names = data.models.map((n) => String(n).split(":")[0]);
      for (const opt of modelEl.options) {
        if (names.some((n) => n === opt.value || n.startsWith(opt.value))) {
          /* keep */
        }
      }
    }
  } catch {
    setStatus("down", "offline");
  }
}

function openChat() {
  hero.hidden = true;
  chat.hidden = false;
  promptEl.focus();
}

function appendMessage(role, text, pending = false) {
  const wrap = document.createElement("article");
  wrap.className = `msg ${role}${pending ? " pending" : ""}`;
  wrap.innerHTML = `<div class="role">${role === "user" ? "You" : "Ello5"}</div><div class="body"></div>`;
  wrap.querySelector(".body").textContent = text;
  threadEl.appendChild(wrap);
  threadEl.scrollTop = threadEl.scrollHeight;
  return wrap;
}

async function sendMessage(text) {
  history.push({ role: "user", content: text });
  appendMessage("user", text);
  const pending = appendMessage("assistant", "thinking…", true);
  sendBtn.disabled = true;

  try {
    const res = await fetch(`${apiBase()}/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelEl.value || "ellofive",
        messages: history,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    const out = data.output || data.message?.content || "";
    history.push({ role: "assistant", content: out });
    pending.classList.remove("pending");
    pending.querySelector(".body").textContent = out || "(empty response)";
  } catch (err) {
    pending.classList.remove("pending");
    pending.querySelector(".body").textContent = `Error: ${err.message}`;
    history.pop();
  } finally {
    sendBtn.disabled = false;
    threadEl.scrollTop = threadEl.scrollHeight;
  }
}

startBtn?.addEventListener("click", openChat);

composer.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = promptEl.value.trim();
  if (!text || sendBtn.disabled) return;
  if (chat.hidden) openChat();
  promptEl.value = "";
  sendMessage(text);
});

promptEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    composer.requestSubmit();
  }
});

refreshHealth();
setInterval(refreshHealth, 30000);
