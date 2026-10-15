// Acceptance authority stays in this document's module closure, never in storage.
const documents = new WeakMap();
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function stateFor(win) {
  let state = documents.get(win);
  if (state) return state;
  state = { accepted: new Map(), claimed: new Set(), queued: new Set() };
  documents.set(win, state);
  win.__zqClaimAcceptedQuoteForAds = (id, form, status) => {
    if (typeof id !== "string" || !UUID_V4.test(id) || form !== "quote_form" || status !== "accepted") return false;
    const record = state.accepted.get(id);
    if (!record || record.form_name !== form || record.submission_status !== status || state.claimed.has(id)) return false;
    state.claimed.add(id);
    return true;
  };
  return state;
}

// Called only by the strictly accepted provider-response path; not exposed on window.
export function coordinateAcceptedQuote(win) {
  return new Promise((resolve) => {
    let settled = false;
    let timer;
    let state;
    let id;
    const settle = () => {
      if (settled) return;
      settled = true;
      if (timer !== undefined) win.clearTimeout(timer);
      if (state && id) state.accepted.delete(id);
      resolve();
    };
    try {
      timer = win.setTimeout(settle, 1600);
      state = stateFor(win);
      id = win.crypto.randomUUID();
      if (!UUID_V4.test(id) || state.accepted.has(id)) { settle(); return; }
      const record = Object.freeze({ form_name: "quote_form", submission_status: "accepted", submission_id: id });
      state.accepted.set(id, record);
      const key = `zq_quote_event:${id}`;
      if (state.queued.has(key) || settled) { settle(); return; }
      state.queued.add(key);
      win.dataLayer ||= [];
      win.dataLayer.push({ event: "zq_quote_submitted", ...record, eventCallback: settle, eventTimeout: 1500 });
    } catch { settle(); }
  });
}
