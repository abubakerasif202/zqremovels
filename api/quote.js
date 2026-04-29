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

function hasAnyField(payload, fields) {
  return fields.some((field) => Object.prototype.hasOwnProperty.call(payload, field));
}

function normaliseSubmission(payload) {
  const isSimpleContactSubmission =
    typeof payload === "object" &&
    payload !== null &&
    (Object.prototype.hasOwnProperty.call(payload, "message") ||
      Object.prototype.hasOwnProperty.call(payload, "name"));

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

  if (isLegacyQuoteSubmission) {
    return {
      upstreamPayload: {
        subject: "Quote request - ZQ Removals",
        from_name: getTrimmedString(payload, "full_name"),
        botcheck: "",
        pickup_suburb: getTrimmedString(payload, "pickup_suburb"),
        delivery_suburb: getTrimmedString(payload, "delivery_suburb"),
        move_type: getTrimmedString(payload, "move_type"),
        property_type: getTrimmedString(payload, "property_type"),
        preferred_move_date: getTrimmedString(payload, "preferred_move_date"),
        access_notes: getTrimmedString(payload, "access_notes"),
        inventory_special_items: getTrimmedString(payload, "inventory_special_items"),
        full_name: getTrimmedString(payload, "full_name"),
        phone: getTrimmedString(payload, "phone"),
        email: getTrimmedString(payload, "email"),
        source_page: getTrimmedString(payload, "source_page"),
      },
    };
  }

  return {
    upstreamPayload: {
      subject: "Quote request - ZQ Removals",
      from_name: getTrimmedString(payload, "full_name"),
      botcheck: "",
      move_date: getTrimmedString(payload, "move_date"),
      pickup_suburb: getTrimmedString(payload, "pickup_suburb"),
      dropoff_suburb: getTrimmedString(payload, "dropoff_suburb"),
      move_scope: getTrimmedString(payload, "move_scope"),
      property_type: getTrimmedString(payload, "property_type"),
      move_size: getTrimmedString(payload, "move_size"),
      pickup_access: getTrimmedString(payload, "pickup_access"),
      dropoff_access: getTrimmedString(payload, "dropoff_access"),
      packing_required: getTrimmedString(payload, "packing_required"),
      move_details: getTrimmedString(payload, "move_details"),
      full_name: getTrimmedString(payload, "full_name"),
      phone: getTrimmedString(payload, "phone"),
      email: getTrimmedString(payload, "email"),
      source_page: getTrimmedString(payload, "source_page"),
    },
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { success: false, message: "Method not allowed" });
  }

  try {
    const rawBody = await readJsonBody(req);
    let payload = {};
    try {
      payload = rawBody ? JSON.parse(rawBody) : {};
    } catch (error) {
      console.error("Quote API received malformed JSON.", error);
      return sendJson(res, 400, { success: false, message: "Malformed JSON payload" });
    }

    if (payload.botcheck) {
      return sendJson(res, 400, { success: false, message: "Invalid request" });
    }

    const submission = normaliseSubmission(payload);
    if (submission.error) {
      return sendJson(res, submission.error.status, {
        success: false,
        message: submission.error.message,
      });
    }

    const accessKey =
      process.env.WEB3FORMS_ACCESS_KEY?.trim() ||
      process.env.VITE_WEB3FORMS_ACCESS_KEY?.trim();
    if (!accessKey) {
      return sendJson(res, 500, {
        success: false,
        message: "Quote service unavailable",
        details: "Missing Web3Forms access key environment variable.",
      });
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
      return sendJson(res, 502, {
        success: false,
        message: "Failed to reach quote service",
      });
    }

    let web3Result;
    try {
      web3Result = await web3Response.json();
    } catch (error) {
      console.error("Web3Forms response parse failed.", error);
      return sendJson(res, 502, {
        success: false,
        message: "Invalid response from quote service",
      });
    }
    if (!web3Response.ok || web3Result.success === false) {
      console.error("Web3Forms upstream returned a failure response.", {
        status: web3Response.status,
        body: web3Result,
      });
      return sendJson(res, 502, {
        success: false,
        message: "Quote submission failed",
        details:
          web3Result.message ||
          web3Result.error ||
          `Upstream error (${web3Response.status})`,
      });
    }

    return sendJson(res, 200, { success: true, message: "Quote submitted" });
  } catch (error) {
    console.error("Quote API handler failed.", error);
    return sendJson(res, 500, { success: false, message: "Unexpected server error" });
  }
};
