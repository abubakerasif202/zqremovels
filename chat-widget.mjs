// ZQ Removals accessible, mobile-first website receptionist.
// No API keys, agent URLs or server-side identities are sent to visitors.
(function initZqReceptionist() {
  if (typeof document === "undefined" || document.getElementById("zq-chat-launcher")) return;
  const css = `
  .zq-chat-launcher{position:fixed;bottom:24px;right:20px;z-index:9998;display:flex;align-items:center;gap:9px;border:2px solid #fff;border-radius:999px;padding:13px 19px;background:#14324f;color:#fff;box-shadow:0 8px 30px #08192955;cursor:pointer;font:700 14px/1.2 system-ui,-apple-system,sans-serif}
  .zq-chat-launcher:hover,.zq-chat-launcher:focus-visible{background:#20577d;outline:3px solid #ffcb57;outline-offset:2px}
  .zq-chat-window{position:fixed;right:20px;bottom:91px;z-index:9999;width:min(390px,calc(100vw - 24px));height:min(580px,calc(100dvh - 120px));display:flex;flex-direction:column;overflow:hidden;border:1px solid #b4c9d4;border-radius:18px;background:#fff;color:#152839;box-shadow:0 16px 55px #071b2d66;font:400 14px/1.55 system-ui,-apple-system,sans-serif}
  .zq-chat-window[hidden]{display:none!important}
  .zq-chat-head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 16px;background:#12314d;color:white}
  .zq-chat-head strong{display:block;font-size:16px;color:white}
  .zq-chat-head small{display:block;font-size:12px;color:#d7e9f3}
  .zq-chat-actions{display:flex;align-items:center;gap:4px}
  .zq-chat-iconbtn{display:grid;place-items:center;width:34px;height:34px;border:1px solid #87a0b3;border-radius:8px;background:transparent;color:white;cursor:pointer;font-size:20px}
  .zq-chat-iconbtn:hover,.zq-chat-iconbtn:focus-visible{background:#245373;outline:2px solid #ffcb57}
  .zq-chat-messages{min-height:0;flex:1;overflow-y:auto;overscroll-behavior:contain;padding:16px;background:#f6fafc}
  .zq-chat-bubble{max-width:94%;width:fit-content;margin:0 0 12px;padding:11px 13px;border-radius:13px;background:#fff;border:1px solid #dae4ea;color:#102d43;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.55}
  .zq-chat-bubble[data-role="user"]{margin-left:auto;background:#17466a;border-color:#17466a;color:#fff}
  .zq-chat-bubble[data-role="system"]{color:#4b5c6e;background:#eef3f7;font-size:13px}
  .zq-chat-foot{padding:12px;border-top:1px solid #d7e2e9;background:#fff}
  .zq-chat-form{display:flex;align-items:end;gap:8px}
  .zq-chat-input{flex:1;min-width:0;min-height:42px;max-height:130px;resize:vertical;border:1.5px solid #829aae;border-radius:10px;background:#fff;color:#122e46;padding:9px 11px;font:400 14px/1.4 system-ui}
  .zq-chat-input:focus-visible{outline:3px solid #fbbf24;outline-offset:1px}
  .zq-chat-send{min-height:42px;border:0;border-radius:10px;padding:9px 13px;background:#9d4306;color:#fff;font-weight:800;cursor:pointer}
  .zq-chat-send:disabled{background:#8e959b;cursor:not-allowed}
  .zq-chat-links{display:flex;justify-content:space-between;gap:8px;margin-top:9px}
  .zq-chat-links a{color:#114e81;font-weight:700;font-size:12px;text-decoration:underline;text-underline-offset:2px}
  .zq-chat-privacy{display:block;margin-top:7px;color:#4b6074;font-size:11px;line-height:1.35}
  .zq-chat-status{margin-top:5px;color:#243f52;font-size:12px;min-height:17px}
  @media(max-width:680px){.zq-chat-launcher{bottom:90px;right:12px;padding:12px 15px}.zq-chat-window{right:10px;bottom:146px;width:calc(100vw - 20px);height:min(570px,calc(100dvh - 160px))}}
  @media(prefers-reduced-motion:reduce){.zq-chat-launcher,.zq-chat-window{transition:none!important}}
  `;
  const style = document.createElement("style");
  style.id = "zq-chat-style";
  style.textContent = css;
  document.head.appendChild(style);

  const launcher = document.createElement("button");
  launcher.id = "zq-chat-launcher";
  launcher.className = "zq-chat-launcher";
  launcher.type = "button";
  launcher.setAttribute("aria-controls", "zq-chat-window");
  launcher.setAttribute("aria-expanded", "false");
  launcher.innerHTML = '<span aria-hidden="true">✦</span><span>Ask ZQ AI</span>';

  const panel = document.createElement("section");
  panel.id = "zq-chat-window";
  panel.className = "zq-chat-window";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Chat with ZQ Removals receptionist");
  panel.hidden = true;
  panel.innerHTML = `
    <div class="zq-chat-head">
      <div><strong>ZQ AI Receptionist</strong><small>Moving questions &amp; estimated prices</small></div>
      <div class="zq-chat-actions">
        <button type="button" class="zq-chat-iconbtn" data-chat-reset aria-label="Start a new conversation" title="New conversation">↻</button>
        <button type="button" class="zq-chat-iconbtn" data-chat-close aria-label="Close chat">×</button>
      </div>
    </div>
    <div class="zq-chat-messages" role="log" aria-live="polite" aria-relevant="additions text" aria-label="Conversation"></div>
    <div class="zq-chat-foot">
      <form class="zq-chat-form"><label for="zq-chat-message" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Your message</label><textarea id="zq-chat-message" class="zq-chat-input" rows="2" maxlength="1200" required placeholder="Ask about moving, pricing, or packing..."></textarea><button type="submit" class="zq-chat-send">Send</button></form>
      <div class="zq-chat-status" role="status" aria-live="polite"></div>
      <div class="zq-chat-links"><a href="/contact-us/#quote-form">Get a free quote</a><a href="tel:+61433819989">Call 0433 819 989</a></div>
      <small class="zq-chat-privacy">AI estimates aren't bookings. Chat history is retained for up to 24 hours to continue this conversation. Don't enter payment details.</small>
    </div>`;
  document.body.append(launcher, panel);
  const messages = panel.querySelector(".zq-chat-messages");
  const input = panel.querySelector(".zq-chat-input");
  const form = panel.querySelector(".zq-chat-form");
  const sendButton = panel.querySelector(".zq-chat-send");
  const status = panel.querySelector(".zq-chat-status");
  const close = panel.querySelector("[data-chat-close]");
  const reset = panel.querySelector("[data-chat-reset]");
  let loaded = false;
  let sending = false;

  function append(role, text) {
    const bubble = document.createElement("div");
    bubble.className = "zq-chat-bubble";
    bubble.dataset.role = role;
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }
  function greet() {
    append("assistant", "Hi! I'm the ZQ Removals AI receptionist. I can help with moving questions, packing advice and transparent estimates. Where are you moving from and to?");
  }
  function setSending(flag) {
    sending = flag;
    input.disabled = flag;
    sendButton.disabled = flag;
    status.textContent = flag ? "ZQ is typing…" : "";
  }
  async function loadHistory() {
    if (loaded) return;
    loaded = true;
    try {
      const response = await fetch("/api/ai-chat/", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error("Chat unavailable");
      const data = await response.json();
      const turns = Array.isArray(data.turns) ? data.turns : [];
      if (!turns.length) greet();
      for (const turn of turns) {
        if ((turn.role === "assistant" || turn.role === "user") && typeof turn.text === "string") append(turn.role, turn.text);
      }
    } catch {
      greet();
      append("system", "Live chat is currently unavailable. You can still request a free quote or call us using the links below.");
    }
  }
  function toggle(open) {
    panel.hidden = !open;
    launcher.setAttribute("aria-expanded", String(open));
    launcher.setAttribute("aria-label", open ? "Close ZQ AI chat" : "Open ZQ AI chat");
    if (open) { loadHistory(); input.focus(); }
    else launcher.focus();
  }
  launcher.addEventListener("click", () => toggle(panel.hidden));
  close.addEventListener("click", () => toggle(false));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !panel.hidden) toggle(false);
  });
  reset.addEventListener("click", async () => {
    if (sending) return;
    try {
      const response = await fetch("/api/ai-chat/", { method: "DELETE", credentials: "same-origin" });
      if (!response.ok) throw new Error("Reset failed");
      messages.replaceChildren();
      greet();
      input.focus();
    } catch { append("system", "Could not start a new conversation. Try again shortly."); }
  });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (sending) return;
    const message = input.value.trim();
    if (!message) return;
    append("user", message);
    input.value = "";
    setSending(true);
    try {
      const response = await fetch("/api/ai-chat/", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      const data = await response.json();
      if (!response.ok || !data.reply) throw new Error(data.error || "Unable to contact the receptionist");
      append("assistant", data.reply);
    } catch (error) {
      append("system", error.message || "AI chat unavailable. Please use our quote form or call us.");
    } finally { setSending(false); input.focus(); }
  });
  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); }
  });
})();
