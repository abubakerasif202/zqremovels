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
  .zq-chat-enquiry{position:absolute;inset:60px 0 0;z-index:2;overflow:auto;background:#fff;padding:16px}
  .zq-chat-enquiry[hidden],.zq-chat-review[hidden],.zq-chat-fields[hidden]{display:none!important}
  .zq-chat-enquiry h3{margin:4px 0 8px;font-size:19px;color:#142f45}
  .zq-chat-enquiry p{margin:4px 0 14px;font-size:13px;color:#3a5064}
  .zq-chat-fields{display:grid;gap:10px}
  .zq-chat-field{display:grid;gap:4px;font-size:13px;font-weight:700;color:#243d53}
  .zq-chat-field input,.zq-chat-field select,.zq-chat-field textarea{display:block;width:100%;min-width:0;padding:9px 10px;border:1.5px solid #738da1;border-radius:8px;background:white;color:#102b41;font:400 14px/1.3 system-ui}
  .zq-chat-field input:focus-visible,.zq-chat-field select:focus-visible,.zq-chat-field textarea:focus-visible{outline:3px solid #ffcb57;outline-offset:1px}
  .zq-chat-enquiry-controls[hidden]{display:none!important}
  .zq-chat-enquiry-controls{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
  .zq-chat-enquiry-controls button,.zq-chat-enquiry-open{border:0;border-radius:9px;padding:10px 12px;background:#123f63;color:#fff;font-weight:700;cursor:pointer}
  .zq-chat-enquiry-controls button:focus-visible,.zq-chat-enquiry-open:focus-visible{outline:3px solid #ffcb57;outline-offset:2px}
  .zq-chat-enquiry-controls [data-chat-enquiry-close],.zq-chat-enquiry-controls [data-chat-enquiry-back]{background:#e5eef4;color:#163a54}
  .zq-chat-enquiry-controls button:disabled{opacity:.55;cursor:wait}
  .zq-chat-review-summary{padding:10px;background:#f2f6f9;border:1px solid #cbdbe5;border-radius:9px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px}
  .zq-chat-consent{display:flex;gap:9px;align-items:start;padding:10px 0;font-size:13px;color:#263f55}
  .zq-chat-consent input{flex:none;width:18px;height:18px}
  .zq-chat-enquiry-feedback{margin-top:8px;font-size:13px;color:#2c465b}
  .zq-chat-honey{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}
  .zq-chat-window{position:fixed}
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
    <div class="zq-chat-enquiry" data-chat-enquiry hidden>
      <h3>Send a moving enquiry</h3>
      <p>Enter your moving details. You'll review everything and give explicit consent before we send your enquiry to ZQ Removals. This does not confirm a booking.</p>
      <form data-chat-enquiry-form>
        <div class="zq-chat-fields" data-chat-fields></div>
        <div class="zq-chat-enquiry-controls" data-chat-fields-actions>
          <button type="submit">Review my details</button>
          <button type="button" data-chat-enquiry-close>Back to chat</button>
        </div>
        <div class="zq-chat-review" data-chat-review hidden>
          <h4>Review your enquiry</h4>
          <div class="zq-chat-review-summary" data-chat-review-summary></div>
          <label class="zq-chat-consent"><input type="checkbox" data-chat-consent><span>I confirm that these details are correct and consent to ZQ Removals receiving my enquiry and contacting me about my move. I understand this is not a booking.</span></label>
          <div class="zq-chat-enquiry-controls">
            <button type="button" data-chat-enquiry-back>Edit details</button>
            <button type="button" data-chat-enquiry-confirm>Confirm &amp; send enquiry</button>
          </div>
        </div>
        <div class="zq-chat-enquiry-feedback" data-chat-enquiry-feedback role="status" aria-live="polite"></div>
      </form>
    </div>
    <div class="zq-chat-foot">
      <form class="zq-chat-form"><label for="zq-chat-message" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Your message</label><textarea id="zq-chat-message" class="zq-chat-input" rows="2" maxlength="1200" required placeholder="Ask about moving, pricing, or packing..."></textarea><button type="submit" class="zq-chat-send">Send</button></form>
      <div class="zq-chat-status" role="status" aria-live="polite"></div>
      <div class="zq-chat-links"><button type="button" class="zq-chat-enquiry-open" data-chat-enquiry-open>Send enquiry</button><a href="/contact-us/#quote-form">Quote form</a><a href="tel:+61433819989">Call us</a></div>
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
  const leadPanel = panel.querySelector("[data-chat-enquiry]");
  const leadForm = panel.querySelector("[data-chat-enquiry-form]");
  const leadFieldsArea = panel.querySelector("[data-chat-fields]");
  const reviewArea = panel.querySelector("[data-chat-review]");
  const reviewSummary = panel.querySelector("[data-chat-review-summary]");
  const leadConsent = panel.querySelector("[data-chat-consent]");
  const leadFeedback = panel.querySelector("[data-chat-enquiry-feedback]");
  const confirmLead = panel.querySelector("[data-chat-enquiry-confirm]");
  const leadFieldsActions = panel.querySelector("[data-chat-fields-actions]");
  let currentLead = null;
  let submissionId = null;
  let leadFinalised = false;
  const leadFields = [
    ["full_name", "Full name", "text", 120],
    ["phone", "Phone number", "tel", 30],
    ["email", "Email address", "email", 254],
    ["pickup_suburb", "Pickup suburb", "text", 120],
    ["dropoff_suburb", "Delivery suburb", "text", 120],
    ["move_date", "Preferred move date (optional)", "date", 10],
    ["crew_package", "Preferred crew", ["2 men + truck", "3 men + truck", "Not sure"], 120],
    ["move_scope", "Move type", ["Local move", "Interstate move", "Office move", "Other", "Not sure"], 120],
    ["property_type", "Property type", ["House", "Apartment", "Office", "Other"], 120],
    ["move_size", "Move size", ["Studio", "1 bedroom", "2 bedrooms", "3 bedrooms", "4+ bedrooms", "Office", "Not sure"], 120],
    ["pickup_access", "Pickup access, stairs, lifts or parking", "text", 500],
    ["dropoff_access", "Delivery access, stairs, lifts or parking", "text", 500],
    ["packing_required", "Packing assistance", ["Yes", "No", "Not sure"], 120],
    ["move_details", "Furniture, special items and moving details", "textarea", 4000]
  ];
  for (const [key, labelText, type, max] of leadFields) {
    const label = document.createElement("label");
    label.className = "zq-chat-field";
    const caption = document.createElement("span");
    caption.textContent = labelText;
    let control;
    if (Array.isArray(type)) {
      control = document.createElement("select");
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "Please select";
      control.appendChild(empty);
      for (const value of type) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        control.appendChild(option);
      }
    } else {
      control = document.createElement(type === "textarea" ? "textarea" : "input");
      if (type !== "textarea") control.type = type;
      control.maxLength = max;
      if (type === "textarea") control.rows = 3;
    }
    control.name = key;
    control.required = key !== "move_date";
    label.append(caption, control);
    leadFieldsArea.appendChild(label);
  }
  const trap = document.createElement("input");
  trap.name = "botcheck";
  trap.autocomplete = "off";
  trap.tabIndex = -1;
  trap.setAttribute("aria-hidden", "true");
  trap.className = "zq-chat-honey";
  leadFieldsArea.appendChild(trap);
  const openEnquiry = panel.querySelector("[data-chat-enquiry-open]");
  const closeEnquiry = panel.querySelector("[data-chat-enquiry-close]");
  const backEnquiry = panel.querySelector("[data-chat-enquiry-back]");
  function showLeadPanel(open) {
    leadPanel.hidden = !open;
    if (open) {
      leadPanel.scrollTop = 0;
      const first = leadForm.querySelector('input[name="full_name"]');
      first?.focus();
    } else openEnquiry.focus();
  }
  openEnquiry.addEventListener("click", async () => {
    await loadHistory();
    showLeadPanel(true);
  });
  closeEnquiry.addEventListener("click", () => showLeadPanel(false));
  backEnquiry.addEventListener("click", () => {
    if (leadFinalised) return;
    reviewArea.hidden = true;
    leadFieldsArea.hidden = false;
    leadFieldsActions.hidden = false;
    leadConsent.checked = false;
    leadFeedback.textContent = "";
    leadPanel.scrollTop = 0;
  });
  leadForm.addEventListener("submit", event => {
    event.preventDefault();
    if (leadFinalised || !leadForm.reportValidity()) return;
    const form = new FormData(leadForm);
    const lead = {};
    for (const [key] of leadFields) {
      const value = String(form.get(key) || "").trim();
      if (value || key !== "move_date") lead[key] = value;
    }
    currentLead = lead;
    if (!submissionId) submissionId = crypto.randomUUID();
    reviewSummary.textContent = leadFields.map(([key,label]) =>
      label + ": " + (lead[key] || "Not specified")).join("\n");
    leadFieldsArea.hidden = true;
    leadFieldsActions.hidden = true;
    reviewArea.hidden = false;
    leadConsent.checked = false;
    leadFeedback.textContent = "Check the details above before approving submission.";
    leadPanel.scrollTop = 0;
    leadConsent.focus();
  });
  confirmLead.addEventListener("click", async () => {
    if (leadFinalised || confirmLead.disabled) return;
    if (!leadConsent.checked || !currentLead || !submissionId) {
      leadFeedback.textContent = "Please tick the consent box to approve sending these exact details.";
      leadConsent.focus();
      return;
    }
    confirmLead.disabled = true;
    backEnquiry.disabled = true;
    leadFeedback.textContent = "Submitting your enquiry securely…";
    try {
      const response = await fetch("/api/ai-chat-submit/", {
        method:"POST",credentials:"same-origin",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({submission_id:submissionId,consent:true,lead:currentLead,botcheck:String(new FormData(leadForm).get("botcheck") || "")})
      });
      const result = await response.json();
      if (response.status === 200 && result.status === "accepted" && result.success === true) {
        leadFinalised = true;
        const note = result.message + (result.submission_id ? "\nReference: " + result.submission_id : "");
        leadFeedback.textContent = note;
        append("assistant", note);
        showLeadPanel(false);
        return;
      }
      if (result.status === "pending" || result.status === "unknown") {
        leadFinalised = true;
        leadFeedback.textContent = result.message + " Do not submit again.";
        return;
      }
      leadFeedback.textContent = result.message || "Unable to submit. Please use the existing quote form or call 0433 819 989.";
      backEnquiry.disabled = false;
      confirmLead.disabled = false;
    } catch {
      // An unknown network result may mean the provider accepted the enquiry.
      // Do not automatically retry with a new identifier.
      leadFinalised = true;
      leadFeedback.textContent = "Delivery could not be confirmed. Please call 0433 819 989 before attempting another submission.";
    }
  });

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
      leadForm.reset();
      leadPanel.hidden = true;
      leadFieldsArea.hidden = false;
      leadFieldsActions.hidden = false;
      reviewArea.hidden = true;
      leadConsent.checked = false;
      leadFeedback.textContent = "";
      currentLead = null;
      submissionId = null;
      leadFinalised = false;
      confirmLead.disabled = false;
      backEnquiry.disabled = false;
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
