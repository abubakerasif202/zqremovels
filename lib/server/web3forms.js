// Server-only transport shared by the public form and authenticated AI leads.
// A successful HTTP response still requires a parsed `success === true` receipt.
async function requestWeb3Forms(payload, accessKey, fetchImpl = fetch) {
  return fetchImpl("https://api.web3forms.com/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ ...payload, access_key: accessKey }),
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  });
}

module.exports = { requestWeb3Forms };
