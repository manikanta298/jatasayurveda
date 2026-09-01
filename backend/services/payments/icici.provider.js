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

function isEnabled() {
  return Boolean(
    process.env.ICICI_MERCHANT_ID &&
      process.env.ICICI_SECRET_KEY &&
      process.env.ICICI_RETURN_URL &&
      getRedirectBridgeUrl()
  );
}

function assertConfigured() {
  if (!isEnabled()) {
    throw new ApiError(
      503,
      "ICICI Bank gateway is not configured. Set ICICI_MERCHANT_ID, ICICI_SECRET_KEY, ICICI_RETURN_URL and ICICI_START_URL (or ICICI_REDIRECT_BRIDGE_URL) in the backend environment."
    );
  }
}

function generateSecureHash(requestObj, secretKey) {
  const data = requestObj || {};
  const hashText = Object.keys(data)
    .sort()
    .filter((key) => key !== "secureHash")
    .map((key) => {
      const value = data[key];
      if (value !== undefined && value !== null && typeof value === "object") return JSON.stringify(value);
      if (value !== undefined && value !== null) return String(value);
      return "";
    })
    .join("");

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
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(date)
    .reduce((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});

  return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new ApiError(502, `ICICI Bank returned a non-JSON response (HTTP ${response.status})`);
  }

  if (!response.ok) throw new ApiError(502, `ICICI Bank request failed (HTTP ${response.status})`);
  return data;
}

function isSuccessCode(code) {
  return ["0", "00", "000", "0000", "R1000", "P1000"].includes(String(code));
}

function isSuccessfulTransaction(status, responseCode) {
  return String(status).toUpperCase() === "SUC" && String(responseCode) === "0000";
}

function validateCustomerFields(order) {
  const email = String(order.customerEmail || "");
  const mobile = String(order.customerPhone || "");
  const name = String(order.customerName || "");
  if (email.length > 48) throw new ApiError(400, "Customer email is too long for ICICI Bank payment");
  if (mobile.length > 13) throw new ApiError(400, "Customer mobile number is too long for ICICI Bank payment");
  if (name.length > 45) throw new ApiError(400, "Customer name is too long for ICICI Bank payment");
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

  async createOrder({ order }) {
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

    const response = await postJson(getSaleUrl(), request);
    if (String(response.responseCode) !== "R1000") {
      throw new ApiError(502, response.respDescription || "ICICI Bank could not initiate the payment");
    }
    if (!response.redirectURI || !response.tranCtx) {
      throw new ApiError(502, "ICICI Bank returned an incomplete payment redirect response");
    }

    order.gatewayRedirectUrl = response.redirectURI;
    order.gatewayTranCtx = response.tranCtx;
    order.gatewayRequestHash = request.secureHash;

    const bridgePayload = `${merchantTxnNo}|${response.tranCtx}`;
    const bridgeRequestHash = crypto
      .createHmac("sha256", process.env.ICICI_SECRET_KEY)
      .update(bridgePayload, "utf8")
      .digest("hex");

    console.info("[icici] sale initiated", {
      merchantTxnNo,
      responseCode: response.responseCode,
      environment: getEnvironment(),
    });

    return {
      requiresClientAction: true,
      gatewayOrderId: merchantTxnNo,
      clientConfig: {
        merchantId: process.env.ICICI_MERCHANT_ID,
        requestHash: bridgeRequestHash,
        redirectUrl: getRedirectBridgeUrl(),
        amount: order.totalPaise,
        currency: order.currency,
      },
      initialStatus: "created",
    };
  },

  async checkStatus({ originalTxnNo }) {
    assertConfigured();
    if (!originalTxnNo) throw new ApiError(400, "ICICI original transaction reference is required");

    const request = {
      aggregatorID: process.env.ICICI_AGGREGATOR_ID,
      merchantId: process.env.ICICI_MERCHANT_ID,
      merchantTxnNo: String(originalTxnNo),
      originalTxnNo: String(originalTxnNo),
      transactionType: "STATUS",
    };
    request.secureHash = generateSecureHash(request, process.env.ICICI_SECRET_KEY);

    const response = await postJson(getCommandUrl(), request);
    if (!verifySecureHash(response)) {
      throw new ApiError(502, "ICICI Bank status response signature verification failed");
    }

    return response;
  },

  async verifyPayment({ order, payload }) {
    assertConfigured();
    if (!order || !payload) throw new ApiError(400, "Invalid ICICI payment response");
    if (String(payload.merchantTxnNo) !== String(order.gatewayOrderId)) {
      throw new ApiError(400, "ICICI payment does not match this order");
    }
    if (String(payload.merchantId) !== String(process.env.ICICI_MERCHANT_ID)) {
      throw new ApiError(400, "ICICI payment merchant mismatch");
    }
    if (!verifySecureHash(payload)) {
      throw new ApiError(400, "ICICI payment response signature verification failed");
    }

    const status = await this.checkStatus({ originalTxnNo: order.gatewayOrderId });
    const paid = isSuccessfulTransaction(status.txnStatus, status.txnResponseCode);
    const finalStatus = paid
      ? "paid"
      : String(status.txnStatus).toUpperCase() === "REJ"
        ? "cancelled"
        : "created";

    console.info("[icici] payment status confirmed", {
      merchantTxnNo: order.gatewayOrderId,
      txnStatus: status.txnStatus,
      txnResponseCode: status.txnResponseCode,
      responseCode: status.responseCode,
    });

    return {
      gatewayPaymentId: status.txnID || payload.txnID || payload.paymentID || null,
      gatewaySignature: payload.secureHash,
      paid,
      finalStatus,
      response: status,
    };
  },
};
