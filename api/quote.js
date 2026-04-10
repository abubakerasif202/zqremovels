const REQUIRED_FIELDS = [
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

    for (const field of REQUIRED_FIELDS) {
      const value = String(payload[field] ?? "").trim();
      if (!value) {
        return sendJson(res, 400, { success: false, message: `Missing field: ${field}` });
      }
    }

    if (!EMAIL_REGEX.test(String(payload.email).trim())) {
      return sendJson(res, 400, { success: false, message: "Invalid email" });
    }

    const accessKey =
      process.env.VITE_WEB3FORMS_ACCESS_KEY ||
      "80c3ff0c-7ae6-4aa7-bb66-567612739824";
    if (!accessKey) {
      return sendJson(res, 500, { success: false, message: "Quote service unavailable" });
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
          subject: "Homepage quote request - ZQ Removals",
          from_name: payload.full_name,
          botcheck: "",
          pickup_suburb: payload.pickup_suburb,
          delivery_suburb: payload.delivery_suburb,
          move_type: payload.move_type,
          property_type: payload.property_type,
          preferred_move_date: payload.preferred_move_date || "",
          access_notes: payload.access_notes,
          inventory_special_items: payload.inventory_special_items,
          full_name: payload.full_name,
          phone: payload.phone,
          email: payload.email,
          source_page: payload.source_page || "",
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
        details: web3Result.message || "Upstream error",
      });
    }

    return sendJson(res, 200, { success: true, message: "Quote submitted" });
  } catch (error) {
    console.error("Quote API handler failed.", error);
    return sendJson(res, 500, { success: false, message: "Unexpected server error" });
  }
};
