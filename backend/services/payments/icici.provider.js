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

function isEnabled() {
  return Boolean(
    process.env.ICICI_MERCHANT_ID &&
      process.env.ICICI_SECRET_KEY &&
      process.env.ICICI_RETURN_URL
  );
}

function assertConfigured() {
  if (!isEnabled()) {
    throw new ApiError(
      503,
      "ICICI Bank gateway is not configured. Set ICICI_MERCHANT_ID, ICICI_SECRET_KEY and ICICI_RETURN_URL in the backend environment."
    );
  }
}

/**
 * ICICI PG UAT reference hash:
 * - sort top-level parameter names ascending
 * - skip secureHash itself
 * - concatenate non-null values; nested objects are JSON-stringified
 * - HMAC-SHA256 with the merchant key
 * - lower-case hexadecimal output
 */
function generateSecureHash(requestData, secretKey) {
  const hashText = Object.keys(requestData)
    .sort()
    .filter((key) => key !== "secureHash")
    .map((key) => {
      const value = requestData[key];
      if (value !== null && typeof value === "object") return JSON.stringify(value);
      if (value === undefined || value === null) return "";
      return String(value);
    })
    .join("");

  return crypto.createHmac("sha256", secretKey).update(hashText, "utf8").digest("hex");
}

function hashesMatch(expected, received) {
  if (!expected || !received) return false;
  const expectedBuf = Buffer.from(String(expected), "hex");
  const receivedBuf = Buffer.from(String(received), "hex");
  return expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

function verifySecureHash(payload) {
  assertConfigured();
  const received = payload?.secureHash;
  const expected = generateSecureHash(payload || {}, process.env.ICICI_SECRET_KEY);
  return hashesMatch(expected, received);
}

function makeMerchantTxnNo(orderNumber) {
  // ICICI documents merchantTxnNo as alphanumeric only, max 20 characters.
  const value = String(orderNumber || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 20);
  if (!value) throw new ApiError(400, "Unable to generate ICICI transaction reference");
  return value;
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

  if (!response.ok) {
    throw new ApiError(502, `ICICI Bank request failed (HTTP ${response.status})`);
  }
  return data;
}

function isSuccessCode(code) {
  return ["0", "00", "000", "0000", "R1000"].includes(String(code));
}

function isSuccessfulTransaction(status, responseCode) {
  return String(status).toUpperCase() === "SUC" && ["000", "0000"].includes(String(responseCode));
}

module.exports = {
  key: "icici",
  label: "ICICI Bank Payment Gateway",
  isEnabled,
  generateSecureHash,
  verifySecureHash,
  isSuccessCode,
  isSuccessfulTransaction,

  async createOrder({ order }) {
    assertConfigured();

    const merchantTxnNo = makeMerchantTxnNo(order.orderNumber);
    const txnDate = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
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
      txnDate,
    };

    if (process.env.ICICI_PAYMENT_MODE) request.paymentMode = process.env.ICICI_PAYMENT_MODE;
    if (process.env.ICICI_TXN_CHANNEL) request.txnChannel = process.env.ICICI_TXN_CHANNEL;

    request.secureHash = generateSecureHash(request, process.env.ICICI_SECRET_KEY);

    const response = await postJson(getSaleUrl(), request);
    if (!isSuccessCode(response.responseCode)) {
      throw new ApiError(502, response.respDescription || "ICICI Bank could not initiate the payment");
    }
    if (!response.redirectURI || !response.tranCtx) {
      throw new ApiError(502, "ICICI Bank returned an incomplete payment redirect response");
    }

    order.gatewayRedirectUrl = response.redirectURI;
    order.gatewayTranCtx = response.tranCtx;
    order.gatewayRequestHash = request.secureHash;

    const startUrl = process.env.ICICI_START_URL || new URL(
      String(process.env.ICICI_RETURN_URL).replace(/\/+$/, "")
    ).toString().replace(/\/return$/, "/start");

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
        requestHash: request.secureHash,
        redirectUrl: startUrl,
        amount: order.totalPaise,
        currency: order.currency,
        orderNumber: order.orderNumber,
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

  /**
   * Browser return/advice payloads are trusted only after their callback hash
   * is independently recomputed. The final payment decision is then made from
   * ICICI's server-to-server STATUS API, never from the browser callback alone.
   */
  async verifyPayment({ order, payload }) {
    assertConfigured();
    if (!order || !payload) throw new ApiError(400, "Invalid ICICI payment response");
    if (String(payload.merchantTxnNo) !== String(order.gatewayOrderId)) {
      throw new ApiError(400, "ICICI payment does not match this order");
    }
    if (!verifySecureHash(payload)) {
      throw new ApiError(400, "ICICI payment response signature verification failed");
    }

    const status = await this.checkStatus({ originalTxnNo: order.gatewayOrderId });
    const paid = isSuccessfulTransaction(status.txnStatus, status.txnResponseCode);
    const finalStatus = paid ? "paid" : String(status.txnStatus).toUpperCase() === "REJ" ? "cancelled" : "created";

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
