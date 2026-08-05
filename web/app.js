/**
 * Elloten — chat UX for the Ello5 model.
 * Layout cues: ChatGPT sidebar + Claude reading + Lovable polish.
 */

const statusEl = document.getElementById("status");
const statusDot = document.getElementById("status-dot");
const modelLabel = document.getElementById("model-label");
const threadEl = document.getElementById("thread");
const threadWrap = document.getElementById("thread-wrap");
const welcome = document.getElementById("welcome");
const composer = document.getElementById("composer");
const promptEl = document.getElementById("prompt");
const modelEl = document.getElementById("model");
const sendBtn = document.getElementById("send");
const chatList = document.getElementById("chat-list");
const newChatBtn = document.getElementById("new-chat");
const toggleRail = document.getElementById("toggle-rail");
const railBackdrop = document.getElementById("rail-backdrop");
const suggestions = document.getElementById("suggestions");

/** @type {{ id: string, title: string, messages: {role:string,content:string}[] }[]} */
let chats = [];
let activeId = null;

function apiBase() {
  const fromMeta = window.ELLO5_API_ORIGIN;
  if (fromMeta) return String(fromMeta).replace(/\/$/, "");
  return "";
}

function uid() {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function modelDisplayName(value = modelEl.value) {
  if (value === "ellofive-fast") return "Ello5 · Fast";
  if (value === "models5") return "Ello5 · models5";
  return "Ello5";
}

function setStatus(state, text) {
  statusEl.dataset.state = state;
  statusEl.textContent = text;
  if (statusDot) statusDot.dataset.state = state;
}

function closeRail() {
  document.body.querySelector(".app")?.classList.remove("rail-open");
  if (railBackdrop) railBackdrop.hidden = true;
}

function openRail() {
  document.body.querySelector(".app")?.classList.add("rail-open");
  if (railBackdrop) railBackdrop.hidden = false;
}

function autosize() {
  promptEl.style.height = "auto";
  promptEl.style.height = `${Math.min(promptEl.scrollHeight, 144)}px`;
}

function ensureActiveChat() {
  if (activeId && chats.find((c) => c.id === activeId)) {
    return chats.find((c) => c.id === activeId);
  }
  const chat = { id: uid(), title: "New chat", messages: [] };
  chats.unshift(chat);
  activeId = chat.id;
  renderChatList();
  return chat;
}

function renderChatList(filter = "") {
  const q = filter.trim().toLowerCase();
  chatList.innerHTML = "";
  for (const chat of chats) {
    const title = chat.title || "New chat";
    if (q && !title.toLowerCase().includes(q)) continue;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `chat-item${chat.id === activeId ? " active" : ""}`;
    btn.textContent = title;
    btn.addEventListener("click", () => {
      activeId = chat.id;
      renderChatList(document.getElementById("chat-search")?.value || "");
      renderThread();
      closeRail();
    });
    chatList.appendChild(btn);
  }
}

function showWelcome(show) {
  welcome.hidden = !show;
  threadWrap.hidden = show;
}

function appendMessageNode(role, text, pending = false) {
  const wrap = document.createElement("article");
  wrap.className = `msg ${role}${pending ? " pending" : ""}`;
  const who = role === "user" ? "You" : "Ello5";
  const avatar = role === "user" ? "You" : "E5";
  wrap.innerHTML = `
    <div class="avatar" aria-hidden="true">${avatar}</div>
    <div class="content">
      <div class="msg-meta">${who}</div>
      <div class="body"></div>
    </div>`;
  wrap.querySelector(".body").textContent = text;
  threadEl.appendChild(wrap);
  threadWrap.scrollTop = threadWrap.scrollHeight;
  return wrap;
}

function renderThread() {
  const chat = chats.find((c) => c.id === activeId);
  threadEl.innerHTML = "";
  if (!chat || chat.messages.length === 0) {
    showWelcome(true);
    return;
  }
  showWelcome(false);
  for (const m of chat.messages) {
    appendMessageNode(m.role === "user" ? "user" : "assistant", m.content);
  }
}

async function refreshHealth() {
  try {
    const res = await fetch(`${apiBase()}/health`);
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "down");
    setStatus("ok", "Online");
    const ah = document.getElementById("api-host");
    if (ah && data.hosts?.api) ah.textContent = data.hosts.api;
  } catch {
    setStatus("down", "Offline");
  }
}

async function sendMessage(text) {
  const chat = ensureActiveChat();
  if (chat.messages.length === 0) {
    chat.title = text.slice(0, 42) + (text.length > 42 ? "…" : "");
    renderChatList();
  }

  chat.messages.push({ role: "user", content: text });
  showWelcome(false);
  appendMessageNode("user", text);
  const pending = appendMessageNode("assistant", "Ello5 is thinking", true);
  sendBtn.disabled = true;
  if (modelLabel) modelLabel.textContent = modelDisplayName();

  try {
    const res = await fetch(`${apiBase()}/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelEl.value || "ellofive",
        messages: chat.messages,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    const out = data.output || data.message?.content || "";
    chat.messages.push({ role: "assistant", content: out });
    pending.classList.remove("pending");
    pending.querySelector(".body").textContent = out || "(empty response)";
  } catch (err) {
    pending.classList.remove("pending");
    pending.querySelector(".body").textContent = `Error: ${err.message}`;
    chat.messages.pop();
  } finally {
    sendBtn.disabled = false;
    threadWrap.scrollTop = threadWrap.scrollHeight;
  }
}

function startNewChat() {
  const chat = { id: uid(), title: "New chat", messages: [] };
  chats.unshift(chat);
  activeId = chat.id;
  renderChatList();
  renderThread();
  promptEl.focus();
  closeRail();
}

composer.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = promptEl.value.trim();
  if (!text || sendBtn.disabled) return;
  promptEl.value = "";
  autosize();
  sendMessage(text);
});

promptEl.addEventListener("input", autosize);

promptEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    composer.requestSubmit();
  }
});

modelEl.addEventListener("change", () => {
  if (modelLabel) modelLabel.textContent = modelDisplayName();
});

newChatBtn?.addEventListener("click", startNewChat);

toggleRail?.addEventListener("click", () => {
  const app = document.body.querySelector(".app");
  if (app?.classList.contains("rail-open")) closeRail();
  else openRail();
});

railBackdrop?.addEventListener("click", closeRail);

suggestions?.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-prompt]");
  if (!btn) return;
  sendMessage(btn.dataset.prompt);
});

document.getElementById("chat-search")?.addEventListener("input", (e) => {
  renderChatList(e.target.value);
});

document.getElementById("share-btn")?.addEventListener("click", async () => {
  const url = window.location.href;
  try {
    await navigator.clipboard.writeText(url);
    const prev = statusEl.textContent;
    setStatus(statusEl.dataset.state || "ok", "Link copied");
    setTimeout(() => setStatus(statusEl.dataset.state || "ok", prev === "Link copied" ? "Online" : prev), 1500);
  } catch {
    /* ignore */
  }
});

document.getElementById("attach-btn")?.addEventListener("click", () => {
  promptEl.focus();
});

startNewChat();
refreshHealth();
setInterval(refreshHealth, 30000);
autosize();
