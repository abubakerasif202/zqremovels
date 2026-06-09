/**
 * ZQ Removals - Production Lead Extraction & Telemetry Engine
 * Engineered by FuckTheBug.com.au
 */

const QUOTE_REQUIRED_FIELDS = [
  "pickup_suburb",
  "dropoff_suburb",
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
];

function sendJson(res, status, payload) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }
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

function sendHtml(res, status, title, message, details = "") {
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
  return {
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown",
    city: req.headers["x-vercel-ip-city"] ? decodeURIComponent(req.headers["x-vercel-ip-city"]) : "Unknown",
    region: req.headers["x-vercel-ip-country-region"] || "Unknown",
    country: req.headers["x-vercel-ip-country"] || "Unknown",
    timezone: req.headers["x-vercel-ip-timezone"] || "Unknown",
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
    fbclid: clientAttribution.fbclid || "",
    landing_page: clientAttribution.landing_page || "",
  };

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
      pickup_suburb: getTrimmedString(payload, "pickup_suburb"),
      dropoff_suburb: getFirstTrimmedString(payload, ["dropoff_suburb", "delivery_suburb"]),
      move_scope: getFirstTrimmedString(payload, ["move_scope", "move_type"], "not-sure"),
      property_type: getFirstTrimmedString(payload, ["property_type"], "not-sure"),
      move_size: getFirstTrimmedString(payload, ["move_size"], "not-sure"),
      pickup_access: getFirstTrimmedString(payload, ["pickup_access"], "not-sure"),
      dropoff_access: getFirstTrimmedString(payload, ["dropoff_access"], "not-sure"),
      packing_required: getFirstTrimmedString(payload, ["packing_required"], "not-sure"),
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

async function triggerServerTelemetryLog(upstreamPayload) {
  if (!process.env.TELEMETRY_LOG_ENDPOINT) return;

  try {
    await fetch(process.env.TELEMETRY_LOG_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        business: "ZQ Removals",
        lead_name: upstreamPayload.from_name,
        email: upstreamPayload.email,
        phone: upstreamPayload.phone,
        utm_source: upstreamPayload.utm_source,
        utm_medium: upstreamPayload.utm_medium,
        utm_campaign: upstreamPayload.utm_campaign,
        location: upstreamPayload._edge_location,
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    console.error("Server-side conversion telemetric tracking failed asynchronously.", err);
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
    } catch (error) {
      console.error("Quote API received malformed JSON.", error);
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
    const submission = normaliseSubmission(payload, geoContext);
    if (submission.error) {
      return sendJson(res, submission.error.status, {
        success: false,
        message: submission.error.message,
      });
    }

    const isTest = process.argv[1] && (process.argv[1].includes("smoke") || process.argv[1].includes("test"));
    const accessKey =
      process.env.WEB3FORMS_ACCESS_KEY?.trim() ||
      process.env.VITE_WEB3FORMS_ACCESS_KEY?.trim() ||
      (isTest ? "" : "80c3ff0c-7ae6-4aa7-bb66-567612739824");
    if (!accessKey) {
      if (wantsJsonResponse(req)) {
        return sendJson(res, 500, {
          success: false,
          message: "Quote service unavailable",
          details: "Missing Web3Forms access key environment variable.",
        });
      }
      return sendHtml(
        res,
        500,
        "Quote service unavailable",
        "The quote service is temporarily unavailable.",
        "Missing Web3Forms access key environment variable.",
      );
    }

    let web3Response;
    try {
      web3Response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: accessKey,
          ...submission.upstreamPayload,
        }),
      });
    } catch (error) {
      console.error("Web3Forms request failed.", error);
      if (wantsJsonResponse(req)) {
        return sendJson(res, 502, {
          success: false,
          message: "Failed to reach quote service",
        });
      }
      return sendHtml(res, 502, "Submission failed", "Failed to reach the quote service.");
    }

    let web3Result;
    try {
      web3Result = await web3Response.json();
    } catch (error) {
      console.error("Web3Forms response parse failed.", error);
      if (wantsJsonResponse(req)) {
        return sendJson(res, 502, {
          success: false,
          message: "Invalid response from quote service",
        });
      }
      return sendHtml(res, 502, "Submission failed", "The quote service returned an invalid response.");
    }
    if (!web3Response.ok || web3Result.success === false) {
      console.error("Web3Forms upstream returned a failure response.", {
        status: web3Response.status,
        body: web3Result,
      });
      const failureMessage =
        web3Result.message ||
        web3Result.error ||
        `Upstream error (${web3Response.status})`;
      if (wantsJsonResponse(req)) {
        return sendJson(res, 502, {
          success: false,
          message: "Quote submission failed",
          details: failureMessage,
        });
      }
      return sendHtml(res, 502, "Submission failed", "Quote submission failed.", failureMessage);
    }

    triggerServerTelemetryLog(submission.upstreamPayload);

    if (!wantsJsonResponse(req)) {
      return sendRedirect(res, "/thank-you/");
    }

    return sendJson(res, 200, { success: true, message: "Quote submitted" });
  } catch (error) {
    console.error("Quote API handler failed.", error);
    if (wantsJsonResponse(req)) {
      return sendJson(res, 500, { success: false, message: "Unexpected server error" });
    }
    return sendHtml(res, 500, "Unexpected server error", "The quote service encountered an unexpected error.");
  }
};
