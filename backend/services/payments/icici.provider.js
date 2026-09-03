const crypto = require("crypto");
const ApiError = require("../../utils/ApiError");

const UAT_SALE_URL = "https://pgpayuat.icicibank.com/tsp/pg/api/v2/initiateSale";
const UAT_COMMAND_URL = "https://pgpayuat.icicibank.com/tsp/pg/api/command?reqType=JSON";
const PROD_SALE_URL = "https://pgpay.icicibank.com/pg/api/v2/initiateSale";
const PROD_COMMAND_URL = "https://pgpay.icicibank.com/pg/api/command";

function getEnvironment() {
  return String(process.env.ICICI_ENV || "uat").toLowerCase() === "production" ? "production" : "uat";
}
function getSaleUrl() {
  return process.env.ICICI_SALE_URL || (getEnvironment() === "production" ? PROD_SALE_URL : UAT_SALE_URL);
}
function getCommandUrl() {
  return process.env.ICICI_COMMAND_URL || (getEnvironment() === "production" ? PROD_COMMAND_URL : UAT_COMMAND_URL);
}
function getRedirectBridgeUrl() {
  if (process.env.ICICI_REDIRECT_BRIDGE_URL) return process.env.ICICI_REDIRECT_BRIDGE_URL;
  if (process.env.ICICI_START_URL) return process.env.ICICI_START_URL;
  const returnUrl = String(process.env.ICICI_RETURN_URL || "");
  if (!returnUrl) return "";
  try {
    const url = new URL(returnUrl);
    url.pathname = url.pathname.replace(/\/return\/?$/i, "/start");
    return url.toString();
  } catch {
    return "";
  }
}
function isMockMode() {
  // Explicit opt-in only, and hard-blocked in production regardless of the
  // env var — this must never be able to simulate a real payment as
  // successful on the live site.
  return process.env.ICICI_MOCK_MODE === "true" && getEnvironment() !== "production";
}
function isEnabled() {
  if (isMockMode()) return true;
  return Boolean(process.env.ICICI_MERCHANT_ID && process.env.ICICI_AGGREGATOR_ID && process.env.ICICI_SECRET_KEY && process.env.ICICI_RETURN_URL && getRedirectBridgeUrl());
}
function assertConfigured() {
  const missing = [];
  if (!process.env.ICICI_MERCHANT_ID) missing.push("ICICI_MERCHANT_ID");
  if (!process.env.ICICI_AGGREGATOR_ID) missing.push("ICICI_AGGREGATOR_ID");
  if (!process.env.ICICI_SECRET_KEY) missing.push("ICICI_SECRET_KEY");
  if (!process.env.ICICI_RETURN_URL) missing.push("ICICI_RETURN_URL");
  if (!getRedirectBridgeUrl()) missing.push("ICICI_START_URL or ICICI_REDIRECT_BRIDGE_URL");
  if (missing.length) throw new ApiError(503, "ICICI Bank gateway is not configured", { gateway: "icici", environment: getEnvironment(), missing });
}
function generateSecureHash(requestObj, secretKey) {
  const data = requestObj || {};
  const hashText = Object.keys(data).sort().filter((key) => key !== "secureHash").map((key) => {
    const value = data[key];
    if (value !== undefined && value !== null && typeof value === "object") return JSON.stringify(value);
    if (value !== undefined && value !== null) return String(value);
    return "";
  }).join("");
  return crypto.createHmac("sha256", secretKey).update(hashText, "utf8").digest("hex");
}
function hashesMatch(expected, received) {
  if (!expected || !received || !/^[0-9a-f]+$/i.test(String(received))) return false;
  const expectedBuf = Buffer.from(String(expected), "hex");
  const receivedBuf = Buffer.from(String(received), "hex");
  return expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);
}
function verifySecureHash(payload) {
  assertConfigured();
  return hashesMatch(generateSecureHash(payload || {}, process.env.ICICI_SECRET_KEY), payload?.secureHash);
}
function makeMerchantTxnNo(orderNumber) {
  const value = String(orderNumber || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 20);
  if (!value) throw new ApiError(400, "Unable to generate ICICI transaction reference");
  return value;
}
function formatTxnDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date).reduce((result, part) => { result[part.type] = part.value; return result; }, {});
  return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;
}
function safeGatewayResponse(data) {
  if (!data || typeof data !== "object") return { rawType: typeof data };
  const allowedKeys = ["responseCode", "respDescription", "txnStatus", "txnResponseCode", "txnRespDescription", "merchantId", "merchantTxnNo", "transactionType", "redirectURI", "showOTPCapturePage", "tranCtx"];
  return Object.fromEntries(allowedKeys.filter((key) => data[key] !== undefined && data[key] !== null).map((key) => [key, data[key]]));
}
async function postJson(url, body, operation = "ICICI API request") {
  console.info("[icici] gateway request", { operation, url, body });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let response;
  try {
    response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body), signal: controller.signal });
  } catch (error) {
    const reason = error?.name === "AbortError" ? "request timed out after 15 seconds" : error?.message || "network error";
    console.error("[icici] gateway network error", { operation, url, reason });
    throw new ApiError(502, `Unable to reach ICICI Bank: ${reason}`, { gateway: "icici", environment: getEnvironment(), operation, endpoint: url, reason });
  } finally { clearTimeout(timeout); }
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch {
    throw new ApiError(502, `ICICI Bank returned a non-JSON response (HTTP ${response.status})`, { gateway: "icici", environment: getEnvironment(), operation, httpStatus: response.status, bodyPreview: text.slice(0, 300) });
  }
  console.info("[icici] gateway response", { operation, httpStatus: response.status, ...safeGatewayResponse(data) });
  if (!response.ok) throw new ApiError(502, `ICICI Bank request failed (HTTP ${response.status})`, { gateway: "icici", environment: getEnvironment(), operation, httpStatus: response.status, icici: safeGatewayResponse(data) });
  return data;
}
function isSuccessCode(code) { return ["0", "00", "000", "0000", "R1000", "P1000"].includes(String(code)); }
function isSuccessfulTransaction(status, responseCode) { return String(status).toUpperCase() === "SUC" && String(responseCode) === "0000"; }
function validateCustomerFields(order) {
  if (String(order.customerEmail || "").length > 48) throw new ApiError(400, "Customer email is too long for ICICI Bank payment");
  if (String(order.customerPhone || "").length > 13) throw new ApiError(400, "Customer mobile number is too long for ICICI Bank payment");
  if (String(order.customerName || "").length > 45) throw new ApiError(400, "Customer name is too long for ICICI Bank payment");
}
function getDiagnostics() {
  const environment = getEnvironment();
  const fields = {
    merchantId: Boolean(process.env.ICICI_MERCHANT_ID),
    aggregatorId: Boolean(process.env.ICICI_AGGREGATOR_ID),
    secretKey: Boolean(process.env.ICICI_SECRET_KEY),
    returnUrl: Boolean(process.env.ICICI_RETURN_URL),
    startUrl: Boolean(getRedirectBridgeUrl()),
    adviceUrl: Boolean(process.env.ICICI_ADVICE_URL),
  };
  return {
    gateway: "icici",
    environment,
    mockMode: isMockMode(),
    configured: Object.values(fields).every(Boolean),
    fields,
    merchantId: process.env.ICICI_MERCHANT_ID || null,
    aggregatorId: process.env.ICICI_AGGREGATOR_ID || null,
    endpoints: { sale: getSaleUrl(), command: getCommandUrl() },
    secureHashAlgorithm: "HMAC-SHA256 / sorted top-level keys / concatenated values",
    standardMode: true,
    payType: 0,
  };
}

module.exports = {
  key: "icici",
  label: "ICICI Bank Payment Gateway",
  isEnabled,
  generateSecureHash,
  verifySecureHash,
  isSuccessCode,
  isSuccessfulTransaction,
  formatTxnDate,
  getDiagnostics,
  async createOrder({ order }) {
    if (isMockMode()) {
      console.warn(`[icici] MOCK MODE — simulating a successful "Initiate Sale" response for order ${order.orderNumber}. This is NOT a real ICICI transaction; do not use for the bank's certification test.`);
      validateCustomerFields(order);
      const merchantTxnNo = makeMerchantTxnNo(order.orderNumber);
      order.gatewayRedirectUrl = "about:blank#icici-mock";
      order.gatewayTranCtx = "mock-tran-ctx";
      order.gatewayRequestHash = "mock-request-hash";
      return {
        requiresClientAction: true,
        gatewayOrderId: merchantTxnNo,
        clientConfig: { mock: true, merchantId: "MOCK", requestHash: "mock-bridge-hash", redirectUrl: getRedirectBridgeUrl() || "/checkout", amount: order.totalPaise, currency: order.currency },
        initialStatus: "created",
      };
    }
    assertConfigured();
    validateCustomerFields(order);
    const merchantTxnNo = makeMerchantTxnNo(order.orderNumber);
    const request = {
      aggregatorID: process.env.ICICI_AGGREGATOR_ID,
      amount: (order.totalPaise / 100).toFixed(2),
      currencyCode: "356",
      customerEmailID: order.customerEmail,
      customerMobileNo: order.customerPhone,
      customerName: order.customerName,
      merchantId: process.env.ICICI_MERCHANT_ID,
      merchantTxnNo,
      payType: 0,
      returnURL: process.env.ICICI_RETURN_URL,
      transactionType: "SALE",
      txnDate: formatTxnDate(),
    };
    if (process.env.ICICI_PAYMENT_MODE) request.paymentMode = process.env.ICICI_PAYMENT_MODE;
    if (process.env.ICICI_TXN_CHANNEL) request.txnChannel = process.env.ICICI_TXN_CHANNEL;
    const udfFields = {};
    if (process.env.ICICI_UDF23) udfFields.udf23 = process.env.ICICI_UDF23;
    if (process.env.ICICI_UDF24) udfFields.udf24 = process.env.ICICI_UDF24;
    if (Object.keys(udfFields).length) request.udfFields = udfFields;
    request.secureHash = generateSecureHash(request, process.env.ICICI_SECRET_KEY);
    const response = await postJson(getSaleUrl(), request, "Initiate Sale");
    if (String(response.responseCode) !== "R1000") throw new ApiError(502, response.respDescription || "ICICI Bank could not initiate the payment", { gateway: "icici", environment: getEnvironment(), operation: "Initiate Sale", icici: safeGatewayResponse(response) });
    if (!response.redirectURI || !response.tranCtx) throw new ApiError(502, "ICICI Bank returned an incomplete payment redirect response", { gateway: "icici", environment: getEnvironment(), operation: "Initiate Sale", icici: safeGatewayResponse(response) });
    order.gatewayRedirectUrl = response.redirectURI;
    order.gatewayTranCtx = response.tranCtx;
    order.gatewayRequestHash = request.secureHash;
    const bridgeRequestHash = crypto.createHmac("sha256", process.env.ICICI_SECRET_KEY).update(`${merchantTxnNo}|${response.tranCtx}`, "utf8").digest("hex");
    return {
      requiresClientAction: true,
      gatewayOrderId: merchantTxnNo,
      clientConfig: { merchantId: process.env.ICICI_MERCHANT_ID, requestHash: bridgeRequestHash, redirectUrl: getRedirectBridgeUrl(), amount: order.totalPaise, currency: order.currency },
      initialStatus: "created",
    };
  },
  async checkStatus({ originalTxnNo }) {
    assertConfigured();
    if (!originalTxnNo) throw new ApiError(400, "ICICI original transaction reference is required");
    const request = { aggregatorID: process.env.ICICI_AGGREGATOR_ID, merchantId: process.env.ICICI_MERCHANT_ID, merchantTxnNo: String(originalTxnNo), originalTxnNo: String(originalTxnNo), transactionType: "STATUS" };
    request.secureHash = generateSecureHash(request, process.env.ICICI_SECRET_KEY);
    const response = await postJson(getCommandUrl(), request, "STATUS");
    if (!verifySecureHash(response)) throw new ApiError(502, "ICICI Bank status response signature verification failed", { gateway: "icici", environment: getEnvironment(), operation: "STATUS", icici: safeGatewayResponse(response) });
    return response;
  },
  async verifyPayment({ order, payload }) {
    if (isMockMode()) {
      console.warn(`[icici] MOCK MODE — simulating a successful payment verification for order ${order?.orderNumber}. This is NOT a real ICICI transaction; do not use for the bank's certification test.`);
      return {
        gatewayPaymentId: `MOCK-${order?.gatewayOrderId || "unknown"}`,
        gatewaySignature: "mock-signature",
        paid: true,
        finalStatus: "paid",
        response: { mock: true },
      };
    }
    assertConfigured();
    if (!order || !payload) throw new ApiError(400, "Invalid ICICI payment response");
    if (String(payload.merchantTxnNo) !== String(order.gatewayOrderId)) throw new ApiError(400, "ICICI payment does not match this order");
    if (String(payload.merchantId) !== String(process.env.ICICI_MERCHANT_ID)) throw new ApiError(400, "ICICI payment merchant mismatch");
    if (payload.aggregatorID && String(payload.aggregatorID) !== String(process.env.ICICI_AGGREGATOR_ID)) throw new ApiError(400, "ICICI payment aggregator mismatch");
    if (!verifySecureHash(payload)) throw new ApiError(400, "ICICI payment response signature verification failed");
    const status = await this.checkStatus({ originalTxnNo: order.gatewayOrderId });
    if (status.merchantId && String(status.merchantId) !== String(process.env.ICICI_MERCHANT_ID)) throw new ApiError(502, "ICICI STATUS response merchant mismatch");
    if (status.aggregatorID && String(status.aggregatorID) !== String(process.env.ICICI_AGGREGATOR_ID)) throw new ApiError(502, "ICICI STATUS response aggregator mismatch");
    if (order.totalPaise != null && status.amount != null && Number(status.amount).toFixed(2) !== (Number(order.totalPaise) / 100).toFixed(2)) throw new ApiError(409, "ICICI payment amount does not match this order");
    const paid = isSuccessfulTransaction(status.txnStatus, status.txnResponseCode);
    const finalStatus = paid ? "paid" : String(status.txnStatus).toUpperCase() === "REJ" ? "cancelled" : "created";
    return { gatewayPaymentId: status.txnID || payload.txnID || payload.paymentID || null, gatewaySignature: payload.secureHash, paid, finalStatus, response: status };
  },
};
