/**
 * ZQ Removals - Production Lead Extraction & Telemetry Engine
 * Engineered by FuckTheBug.com.au
 */

const { requestWeb3Forms } = require("../lib/server/web3forms.js");

const { createReceiptStore, UUID } = require("../lib/server/quote-receipts.js");
const { isIP, isIPv4 } = require("node:net");

const QUOTE_REQUIRED_FIELDS = [
  "pickup_suburb",
  "dropoff_suburb",
  "crew_package",
  "move_scope",
  "property_type",
  "move_size",
  "pickup_access",
  "dropoff_access",
  "packing_required",
  "full_name",
  "phone",
  "email",
  "move_details",
];

const LEGACY_QUOTE_REQUIRED_FIELDS = [
  "pickup_suburb",
  "delivery_suburb",
  "move_type",
  "property_type",
  "access_notes",
  "inventory_special_items",
  "full_name",
  "phone",
  "email",
];

const CONTACT_REQUIRED_FIELDS = ["name", "email", "message"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORM_URLENCODED_REGEX = /^application\/x-www-form-urlencoded\b/i;
const JSON_CONTENT_TYPE_REGEX = /^application\/json\b/i;
const QUOTE_INDICATOR_FIELDS = [
  "pickup_suburb",
  "dropoff_suburb",
  "delivery_suburb",
  "move_scope",
  "move_type",
  "crew_package",
  "property_type",
  "move_size",
  "pickup_access",
  "dropoff_access",
  "packing_required",
  "move_details",
  "access_notes",
  "inventory_special_items",
  "preferred_move_date",
  "move_date",
  "attached_inventory",
];

const memoryStore = new Map();

if (typeof setInterval !== "undefined") {
  const intervalId = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryStore.entries()) {
      if (now > value.resetTime) {
        memoryStore.delete(key);
      }
    }
  }, 300000);
  if (intervalId && typeof intervalId.unref === "function") {
    intervalId.unref();
  }
}

function checkRateLimitMemory(ip) {
  const now = Date.now();
  const record = memoryStore.get(ip);
  if (!record || now > record.resetTime) {
    memoryStore.set(ip, {
      count: 1,
      resetTime: now + 60000,
    });
    return false;
  }
  record.count += 1;
  return record.count > 5;
}

function normalizeIp(value) {
  if (typeof value !== "string") return "";
  let candidate = value.trim();
  if (candidate.startsWith("[") && candidate.endsWith("]")) {
    candidate = candidate.slice(1, -1);
  }
  if (isIP(candidate) === 0 || candidate.includes("%")) return "";

  const mappedIpv4 = candidate.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i)?.[1];
  if (mappedIpv4 && isIPv4(mappedIpv4)) return mappedIpv4;
  if (isIPv4(candidate)) return candidate;

  try {
    return new URL(`http://[${candidate}]/`).hostname.slice(1, -1).toLowerCase();
  } catch {
    return "";
  }
}

function firstValidIp(value) {
  const values = Array.isArray(value) ? value : [value];
  for (const headerValue of values) {
    if (typeof headerValue !== "string") continue;
    const first = headerValue.split(",", 1)[0];
    const normalized = normalizeIp(first);
    if (normalized) return normalized;
  }
  return "";
}

async function checkRateLimitKV(ip, kvUrl, kvToken) {
  const key = `rate_limit:${ip}:${Math.floor(Date.now() / 60000)}`;
  try {
    const target = new URL(kvUrl);
    if (target.protocol !== "https:" || target.username || target.password) throw new Error("Invalid datastore configuration");
    const response = await fetch(target.href, {
      method: "POST", redirect: "error",
      headers: { Authorization: `Bearer ${kvToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(["EVAL", "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],60) end; return n", "1", key]),
      signal: AbortSignal.timeout(5000),
    });
    const data = await response.json();
    if (!response.ok || data.error || !Number.isInteger(data.result) || data.result < 1) throw new Error("Datastore unavailable");
    return data.result > 5;
  } catch {
    // Keep an abuse limit during datastore outages instead of allowing unlimited sends.
    return checkRateLimitMemory(ip);
  }
}

async function verifyTurnstile(token, ip, secretKey) {
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(5000),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: ip,
      }),
    });
    const data = await res.json();
    return res.ok !== false && data.success === true;
  } catch (err) {
    console.error("Turnstile verification error:");
    return false;
  }
}

async function verifyRecaptcha(token, ip, secretKey) {
  if (!token) return false;
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(5000),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: ip,
      }),
    });
    const data = await res.json();
    return res.ok !== false && data.success === true && (data.score === undefined || (typeof data.score === "number" && data.score >= 0.5));
  } catch (err) {
    console.error("reCAPTCHA verification error:");
    return false;
  }
}

function sendJson(res, status, payload) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > 32000) {
      const error = new Error("Request too large");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(buffer);
  }
  const body = Buffer.concat(chunks).toString("utf8");
  return body;
}

function getTrimmedString(payload, field) {
  return String(payload[field] ?? "").trim();
}

function getFirstTrimmedString(payload, fields, fallback = "") {
  for (const field of fields) {
    const value = getTrimmedString(payload, field);
    if (value) {
      return value;
    }
  }

  return fallback;
}

function getHeaderValue(req, headerName) {
  const value = req.headers?.[headerName];
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return typeof value === "string" ? value : "";
}

function wantsJsonResponse(req) {
  return /application\/json/i.test(getHeaderValue(req, "accept"));
}

function parseRequestPayload(rawBody, contentType) {
  if (!rawBody) {
    return {};
  }

  if (JSON_CONTENT_TYPE_REGEX.test(contentType)) {
    return JSON.parse(rawBody);
  }

  if (FORM_URLENCODED_REGEX.test(contentType)) {
    const payload = {};
    const searchParams = new URLSearchParams(rawBody);

    for (const [key, value] of searchParams.entries()) {
      payload[key] = value;
    }

    return payload;
  }

  return JSON.parse(rawBody);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function sendHtml(res, status, title, message, details = "") {
  title = escapeHtml(title);
  message = escapeHtml(message);
  details = escapeHtml(details);
  res.status(status).setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; line-height: 1.5; background: #f7f7f7; color: #111; }
      main { max-width: 42rem; margin: 0 auto; background: #fff; border-radius: 1rem; padding: 2rem; box-shadow: 0 8px 30px rgba(0,0,0,.08); }
      a { color: #0a58ca; }
      .details { color: #555; margin-top: 0.75rem; }
    </style>
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p>${message}</p>
      ${details ? `<p class="details">${details}</p>` : ""}
      <p><a href="/contact-us/#quote-form">Back to the quote form</a></p>
    </main>
  </body>
</html>`);
}

function sendRedirect(res, location) {
  res.status(303).setHeader("Location", location);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end("Redirecting...");
}

function hasAnyField(payload, fields) {
  return fields.some((field) => Object.prototype.hasOwnProperty.call(payload, field));
}

function extractEdgeGeoContext(req) {
  const ip = firstValidIp(req.headers?.["x-vercel-forwarded-for"])
    || firstValidIp(req.headers?.["x-forwarded-for"])
    || normalizeIp(req.socket?.remoteAddress)
    || "unknown";
  return {
    ip,
    city: req.headers["x-vercel-ip-city"] ? decodeURIComponent(req.headers["x-vercel-ip-city"]) : "Unknown",
    region: req.headers["x-vercel-ip-country-region"] || "Unknown",
    country: req.headers["x-vercel-ip-country"] || "Unknown",
    timezone: req.headers["x-vercel-ip-timezone"] || "Unknown",
  };
}

const SIMPLE_QUOTE_FORM_TYPE = "simple_quote";
const SIMPLE_QUOTE_LIMITS = { full_name: 100, phone: 30, place: 120, details: 2000, context: 200 };
const MIN_PHONE_DIGITS = 8;

function clip(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

// The one public quote form: four required fields, everything else is optional metadata.
function normaliseSimpleQuote(payload, trackingMeta) {
  const fullName = clip(getFirstTrimmedString(payload, ["full_name", "name"]), SIMPLE_QUOTE_LIMITS.full_name);
  const phone = clip(payload.phone, SIMPLE_QUOTE_LIMITS.phone);
  const pickup = clip(payload.pickup_suburb, SIMPLE_QUOTE_LIMITS.place);
  const dropoff = clip(getFirstTrimmedString(payload, ["dropoff_suburb", "delivery_suburb"]), SIMPLE_QUOTE_LIMITS.place);

  const required = { full_name: fullName, phone, pickup_suburb: pickup, dropoff_suburb: dropoff };
  for (const [field, value] of Object.entries(required)) {
    if (!value) return { error: { status: 400, message: `Missing field: ${field}` } };
  }
  if (phone.replace(/\D/g, "").length < MIN_PHONE_DIGITS || !/^[\d\s+()\-.]+$/.test(phone)) {
    return { error: { status: 400, message: "Invalid phone number" } };
  }
  const email = clip(payload.email, 200);
  if (email && !EMAIL_REGEX.test(email)) {
    return { error: { status: 400, message: "Invalid email" } };
  }

  const details = clip(getFirstTrimmedString(payload, ["additional_details", "move_details", "message"]), SIMPLE_QUOTE_LIMITS.details);
  return {
    upstreamPayload: {
      subject: `Quote request - ${fullName} - ${pickup} to ${dropoff}`,
      from_name: "ZQ Removals Website",
      botcheck: "",
      form_type: SIMPLE_QUOTE_FORM_TYPE,
      full_name: fullName,
      phone,
      ...(email ? { email } : {}),
      pickup_suburb: pickup,
      dropoff_suburb: dropoff,
      move_date: clip(getFirstTrimmedString(payload, ["move_date", "preferred_move_date"]), 40),
      additional_details: details,
      attached_inventory: clip(payload.attached_inventory, SIMPLE_QUOTE_LIMITS.details),
      page_type: clip(payload.page_type, 40),
      page_title: clip(payload.page_title, SIMPLE_QUOTE_LIMITS.context),
      service_context: clip(payload.service_context, SIMPLE_QUOTE_LIMITS.context),
      location_context: clip(payload.location_context, SIMPLE_QUOTE_LIMITS.context),
      form_location: clip(payload.form_location, 80),
      source_page: clip(payload.source_page, 500),
      ...trackingMeta,
    },
  };
}

function normaliseSubmission(payload, geoContext) {
  const isSimpleContactSubmission =
    typeof payload === "object" &&
    payload !== null &&
    !hasAnyField(payload, QUOTE_INDICATOR_FIELDS) &&
    (Object.prototype.hasOwnProperty.call(payload, "message") ||
      Object.prototype.hasOwnProperty.call(payload, "name"));

  const clientAttribution =
    payload.attribution && typeof payload.attribution === "object"
      ? payload.attribution
      : {
          utm_source: getTrimmedString(payload, "utm_source"),
          utm_medium: getTrimmedString(payload, "utm_medium"),
          utm_campaign: getTrimmedString(payload, "utm_campaign"),
          utm_content: getTrimmedString(payload, "utm_content"),
          utm_term: getTrimmedString(payload, "utm_term"),
          gclid: getTrimmedString(payload, "gclid"),
          gbraid: getTrimmedString(payload, "gbraid"),
          wbraid: getTrimmedString(payload, "wbraid"),
          fbclid: getTrimmedString(payload, "fbclid"),
          landing_page: getTrimmedString(payload, "landing_page"),
        };

  const trackingMeta = {
    _edge_ip: geoContext.ip,
    _edge_location: `${geoContext.city}, ${geoContext.region}, ${geoContext.country}`,
    _edge_timezone: geoContext.timezone,
    utm_source: clientAttribution.utm_source || "organic",
    utm_medium: clientAttribution.utm_medium || "direct",
    utm_campaign: clientAttribution.utm_campaign || "",
    utm_content: clientAttribution.utm_content || "",
    utm_term: clientAttribution.utm_term || "",
    gclid: clientAttribution.gclid || "",
    gbraid: clientAttribution.gbraid || "",
    wbraid: clientAttribution.wbraid || "",
    fbclid: clientAttribution.fbclid || "",
    landing_page: clientAttribution.landing_page || "",
  };

  if (getTrimmedString(payload, "form_type") === SIMPLE_QUOTE_FORM_TYPE) {
    return normaliseSimpleQuote(payload, trackingMeta);
  }

  if (isSimpleContactSubmission) {
    for (const field of CONTACT_REQUIRED_FIELDS) {
      if (!getTrimmedString(payload, field)) {
        return {
          error: { status: 400, message: `Missing field: ${field}` },
        };
      }
    }

    if (!EMAIL_REGEX.test(getTrimmedString(payload, "email"))) {
      return {
        error: { status: 400, message: "Invalid email" },
      };
    }

    return {
      upstreamPayload: {
        subject: "New ZQ Removals Contact",
        from_name: "ZQ Removals Website",
        botcheck: "",
        name: getTrimmedString(payload, "name"),
        email: getTrimmedString(payload, "email"),
        phone: getTrimmedString(payload, "phone"),
        message: getTrimmedString(payload, "message"),
        source_page: getTrimmedString(payload, "source_page"),
        ...trackingMeta,
      },
    };
  }

  const isLegacyQuoteSubmission = hasAnyField(payload, [
    "delivery_suburb",
    "move_type",
    "access_notes",
    "inventory_special_items",
    "preferred_move_date",
  ]);

  const requiredFields = isLegacyQuoteSubmission
    ? LEGACY_QUOTE_REQUIRED_FIELDS
    : QUOTE_REQUIRED_FIELDS;

  for (const field of requiredFields) {
    const value =
              field === "full_name"
        ? getFirstTrimmedString(payload, ["full_name", "name"])
        : field === "dropoff_suburb"
          ? getFirstTrimmedString(payload, ["dropoff_suburb", "delivery_suburb"])
          : field === "move_scope"
            ? getFirstTrimmedString(payload, ["move_scope", "move_type"], "not-sure")
              : field === "move_details"
              ? getFirstTrimmedString(payload, [
                  "move_details",
                  "message",
                  "access_notes",
                  "inventory_special_items",
                ])
              : field === "move_size" || field === "pickup_access" || field === "dropoff_access" || field === "packing_required"
                ? getTrimmedString(payload, field) || "not-sure"
                : getTrimmedString(payload, field);

    if (!value) {
      return {
        error: { status: 400, message: `Missing field: ${field}` },
      };
    }
  }

  if (!EMAIL_REGEX.test(getTrimmedString(payload, "email"))) {
    return {
      error: { status: 400, message: "Invalid email" },
    };
  }

  if (isLegacyQuoteSubmission) {
    return {
      upstreamPayload: {
        subject: "Quote request - ZQ Removals",
        from_name: getFirstTrimmedString(payload, ["full_name", "name"]),
        botcheck: "",
        pickup_suburb: getTrimmedString(payload, "pickup_suburb"),
        delivery_suburb: getTrimmedString(payload, "delivery_suburb"),
        move_type: getTrimmedString(payload, "move_type"),
        property_type: getTrimmedString(payload, "property_type"),
        preferred_move_date: getTrimmedString(payload, "preferred_move_date"),
        access_notes: getTrimmedString(payload, "access_notes"),
        inventory_special_items: getTrimmedString(payload, "inventory_special_items"),
        full_name: getFirstTrimmedString(payload, ["full_name", "name"]),
        phone: getTrimmedString(payload, "phone"),
        email: getTrimmedString(payload, "email"),
        source_page: getTrimmedString(payload, "source_page"),
        ...trackingMeta,
      },
    };
  }

  return {
    upstreamPayload: {
      subject: "Quote request - ZQ Removals",
      from_name: getFirstTrimmedString(payload, ["full_name", "name"]),
      botcheck: "",
      move_date: getFirstTrimmedString(payload, ["move_date", "preferred_move_date"]),
      crew_package: getTrimmedString(payload, "crew_package"),
      pickup_suburb: getTrimmedString(payload, "pickup_suburb"),
      dropoff_suburb: getFirstTrimmedString(payload, ["dropoff_suburb", "delivery_suburb"]),
      move_scope: getFirstTrimmedString(payload, ["move_scope", "move_type"], "not-sure"),
      property_type: getFirstTrimmedString(payload, ["property_type"], "not-sure"),
      move_size: getFirstTrimmedString(payload, ["move_size"], "not-sure"),
      pickup_access: getFirstTrimmedString(payload, ["pickup_access"], "not-sure"),
      dropoff_access: getFirstTrimmedString(payload, ["dropoff_access"], "not-sure"),
      packing_required: getFirstTrimmedString(payload, ["packing_required"], "not-sure"),
      attached_inventory: getTrimmedString(payload, "attached_inventory"),
      move_details: getFirstTrimmedString(payload, [
        "move_details",
        "message",
        "access_notes",
        "inventory_special_items",
      ]),
      full_name: getFirstTrimmedString(payload, ["full_name", "name"]),
      phone: getTrimmedString(payload, "phone"),
      email: getTrimmedString(payload, "email"),
      source_page: getTrimmedString(payload, "source_page"),
      ...trackingMeta,
    },
  };
}

async function triggerServerTelemetryLog() {
  if (!process.env.TELEMETRY_LOG_ENDPOINT) return;

  try {
    await fetch(process.env.TELEMETRY_LOG_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        business: "ZQ Removals",
        event: "quote_accepted",
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    console.error("Server-side conversion telemetric tracking failed asynchronously.");
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { success: false, message: "Method not allowed" });
  }

  try {
    const rawBody = await readJsonBody(req);
    let payload = {};
    try {
      const contentType = getHeaderValue(req, "content-type").split(";")[0].trim();
      payload = parseRequestPayload(rawBody, contentType);
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid payload shape");
    } catch (error) {
      console.error("Quote API received malformed JSON.");
      if (wantsJsonResponse(req)) {
        return sendJson(res, 400, { success: false, message: "Malformed JSON payload" });
      }
      return sendHtml(
        res,
        400,
        "Submission error",
        "We could not read your quote request.",
        "Please try again or call us if the problem continues.",
      );
    }

    if (!getTrimmedString(payload, "source_page")) {
      payload.source_page = getHeaderValue(req, "referer") || getHeaderValue(req, "origin") || "";
    }

    if (payload.botcheck) {
      if (wantsJsonResponse(req)) {
        return sendJson(res, 400, { success: false, message: "Invalid request" });
      }
      return sendHtml(
        res,
        400,
        "Submission blocked",
        "The form submission was rejected.",
        "Please return to the quote form and try again.",
      );
    }

    const geoContext = extractEdgeGeoContext(req);
    const ip = geoContext.ip;

    // Rate Limiting
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;
    let isLimited = false;
    if (kvUrl && kvToken) {
      isLimited = await checkRateLimitKV(ip, kvUrl, kvToken);
    } else {
      isLimited = checkRateLimitMemory(ip);
    }

    if (isLimited) {
      if (wantsJsonResponse(req)) {
        return sendJson(res, 429, { success: false, message: "Too many requests. Please try again later." });
      }
      return sendHtml(
        res,
        429,
        "Too many requests",
        "You have made too many quote requests in a short period.",
        "Please wait a minute before trying again.",
      );
    }

    const submission = normaliseSubmission(payload, geoContext);
    if (submission.error) {
      return sendJson(res, submission.error.status, {
        success: false,
        message: submission.error.message,
      });
    }

    // Receipt replay does not deliver a lead: allow it before a one-use CAPTCHA is rechecked.
    let receiptStore, receiptClaim, receiptFingerprint;
    const replayReceipt = previous => {
      if (previous.conflict) return sendJson(res, 409, { success: false, status: "conflict", message: "This request ID already belongs to different details. Please call to confirm before starting another request." });
      if (previous.record.status === "accepted") return sendJson(res, 200, {
        success: true, submission_status: "accepted", submission_id: previous.record.submission_id,
      });
      if (previous.record.status === "rejected") return sendJson(res, 409, { success: false, status: "rejected", message: "The previous request was rejected. Review your details and try again." });
      return sendJson(res, 409, { success: false, status: "pending", message: "Your request may already be processing. Please call to confirm before sending again." });
    };
    if (payload.submission_id !== undefined) {
      if (typeof payload.submission_id !== "string" || !UUID.test(payload.submission_id)) {
        return sendJson(res, 400, { success: false, message: "Invalid submission ID" });
      }
      // Consent, attribution and the page URL can change on reload. Only lead details identify a retry.
      const volatileFields = new Set(["source_page", "landing_page", "captured_at", "gclid", "gbraid", "wbraid", "fbclid"]);
      receiptFingerprint = Object.fromEntries(Object.entries(submission.upstreamPayload)
        .filter(([key]) => !key.startsWith("_edge_") && !key.startsWith("utm_") && !volatileFields.has(key)));
      try {
        receiptStore = createReceiptStore();
        const previous = await receiptStore.lookup(payload.submission_id, receiptFingerprint);
        if (previous) return replayReceipt(previous);
      } catch {
        return sendJson(res, 503, { success: false, message: "Quote service temporarily unavailable. Please try again or call." });
      }
    }

    // Bot verification challenge
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY || process.env.CF_TURNSTILE_SECRET;
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    if (turnstileSecret || recaptchaSecret) {
      const token = payload["cf-turnstile-response"] || payload["g-recaptcha-response"] || payload["token"] || payload["verification_token"];
      let verified = false;
      if (turnstileSecret) {
        verified = await verifyTurnstile(token, ip, turnstileSecret);
      } else {
        verified = await verifyRecaptcha(token, ip, recaptchaSecret);
      }

      if (!verified) {
        if (wantsJsonResponse(req)) {
          return sendJson(res, 403, { success: false, message: "Security verification failed" });
        }
        return sendHtml(
          res,
          403,
          "Verification failed",
          "The security check did not pass.",
          "Please return to the quote form, reload the page, and try again.",
        );
      }
    }

    const accessKey = process.env.WEB3FORMS_ACCESS_KEY?.trim() || process.env.VITE_WEB3FORMS_ACCESS_KEY?.trim();
    if (!accessKey) {
      if (wantsJsonResponse(req)) {
        return sendJson(res, 500, {
          success: false,
          message: "Quote service unavailable",
          details: "Please try again later or call us to request a quote.",
        });
      }
      return sendHtml(
        res,
        500,
        "Quote service unavailable",
        "The quote service is temporarily unavailable.",
        "Please try again later or call us to request a quote.",
      );
    }

    // Claim only after all validation and spam checks have passed.
    if (receiptStore) {
      try {
        receiptClaim = await receiptStore.claim(payload.submission_id, receiptFingerprint);
        if (!receiptClaim.fresh) return replayReceipt(receiptClaim);
        submission.upstreamPayload.submission_id = receiptClaim.record.submission_id;
      } catch {
        return sendJson(res, 503, { success: false, message: "Quote service temporarily unavailable. Please try again or call." });
      }
    }

    let web3Response;
    try {
      web3Response = await requestWeb3Forms(submission.upstreamPayload, accessKey);
    } catch (error) {
      console.error("Web3Forms request failed.");
      if (wantsJsonResponse(req)) {
        return sendJson(res, 502, {
          success: false,
          message: "Failed to reach quote service",
          ...(receiptClaim ? { status: "pending" } : {}),
        });
      }
      return sendHtml(res, 502, "Submission failed", "Failed to reach the quote service.");
    }

    let web3Result;
    try {
      web3Result = await web3Response.json();
    } catch (error) {
      console.error("Web3Forms response parse failed.");
      if (wantsJsonResponse(req)) {
        return sendJson(res, 502, {
          success: false,
          message: "Invalid response from quote service",
          ...(receiptClaim ? { status: "pending" } : {}),
        });
      }
      return sendHtml(res, 502, "Submission failed", "The quote service returned an invalid response.");
    }
    if (!web3Response.ok || web3Result?.success !== true) {
      console.error("Web3Forms upstream returned a failure response.", {
        status: web3Response.status,
      });
      let status = "pending";
      // A strict negative receipt on HTTP 200 or 4xx confirms rejection. Queued/other outcomes are ambiguous.
      if (receiptClaim && web3Result?.success === false && (web3Response.status === 200 || (web3Response.status >= 400 && web3Response.status < 500))) {
        try { await receiptStore.reject(receiptClaim); status = "rejected"; } catch { /* Retain pending on storage failure. */ }
      }
      if (wantsJsonResponse(req)) {
        return sendJson(res, 502, {
          success: false, ...(receiptClaim ? { status } : {}), message: "Quote submission failed",
        });
      }
      return sendHtml(res, 502, "Submission failed", "Quote submission failed.");
    }

    if (receiptClaim) {
      try { await receiptStore.accept(receiptClaim); }
      catch { return sendJson(res, 503, { success: false, status: "pending", message: "Your request may have been received. Please call to confirm before sending again." }); }
    }
    triggerServerTelemetryLog();

    if (!wantsJsonResponse(req)) {
      return sendRedirect(res, "/thank-you/");
    }

    return sendJson(res, 200, { success: true, message: "Quote submitted",
      ...(receiptClaim ? { submission_status: "accepted", submission_id: receiptClaim.record.submission_id } : {}),
    });
  } catch (error) {
    if (error.statusCode === 413) {
      if (wantsJsonResponse(req)) return sendJson(res, 413, { success: false, message: "Quote request is too large" });
      return sendHtml(res, 413, "Request too large", "Please shorten your enquiry and try again.");
    }
    console.error("Quote API handler failed.");
    if (wantsJsonResponse(req)) {
      return sendJson(res, 500, { success: false, message: "Unexpected server error" });
    }
    return sendHtml(res, 500, "Unexpected server error", "The quote service encountered an unexpected error.");
  }
};
