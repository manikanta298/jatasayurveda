const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const TEST_KEY = "test-secret-key";
process.env.ICICI_ENV = "uat";
process.env.ICICI_MERCHANT_ID = "100000000007164";
process.env.ICICI_AGGREGATOR_ID = "A100000000007164";
process.env.ICICI_SECRET_KEY = TEST_KEY;
process.env.ICICI_RETURN_URL = "https://merchant.example/api/v1/orders/icici/return";
process.env.ICICI_START_URL = "https://merchant.example/api/v1/orders/icici/start";

const provider = require("../services/payments/icici.provider");

function signed(payload) {
  return { ...payload, secureHash: provider.generateSecureHash(payload, TEST_KEY) };
}

async function readJson(req) {
  let body = "";
  for await (const chunk of req) body += chunk;
  return JSON.parse(body);
}

test("ICICI secureHash matches the deterministic reference fixture", () => {
  const request = {
    aggregatorID: "A100000000007164",
    merchantId: "100000000007164",
    merchantTxnNo: "TX126443453",
    originalTxnNo: "4560012_SANDBOX",
    transactionType: "STATUS",
  };
  assert.equal(
    provider.generateSecureHash(request, TEST_KEY),
    "a70cc0c94a0165bb2cfecda24dfb4df6ef6c6820e1392e8ca70db7c4f185d1df"
  );
});

test("ICICI secureHash excludes secureHash and serializes nested objects", () => {
  const request = {
    merchantId: "100000000007164",
    udfFields: { udf23: "A", udf24: "B" },
    transactionType: "SALE",
    secureHash: "ignored",
  };
  const unsigned = {
    merchantId: "100000000007164",
    udfFields: { udf23: "A", udf24: "B" },
    transactionType: "SALE",
  };
  assert.equal(provider.generateSecureHash(request, TEST_KEY), provider.generateSecureHash(unsigned, TEST_KEY));
});

test("ICICI only treats SUC + 0000 as paid", () => {
  assert.equal(provider.isSuccessfulTransaction("SUC", "0000"), true);
  assert.equal(provider.isSuccessfulTransaction("REQ", "0000"), false);
  assert.equal(provider.isSuccessfulTransaction("REJ", "0000"), false);
  assert.equal(provider.isSuccessfulTransaction("SUC", "039"), false);
});

test("Initiate Sale, Status and callback verification work against a local UAT-shaped mock", async () => {
  const server = http.createServer(async (req, res) => {
    const body = await readJson(req);
    res.setHeader("Content-Type", "application/json");

    if (body.transactionType === "SALE") {
      assert.equal(body.merchantId, "100000000007164");
      assert.equal(body.aggregatorID, "A100000000007164");
      assert.equal(body.payType, 0);
      assert.equal(body.currencyCode, "356");
      assert.equal(body.returnURL, process.env.ICICI_RETURN_URL);
      assert.equal(body.secureHash, provider.generateSecureHash(body, TEST_KEY));
      return res.end(
        JSON.stringify({
          responseCode: "R1000",
          merchantId: body.merchantId,
          merchantTxnNo: body.merchantTxnNo,
          redirectURI: "https://pgpayuat.icicibank.com/tsp/pg/api/v2/authRedirect",
          showOTPCapturePage: "N",
          tranCtx: "TEST-CONTEXT",
        })
      );
    }

    return res.end(
      JSON.stringify(
        signed({
          txnRespDescription: "Transaction successful",
          amount: "1.00",
          txnAuthID: "92485056629",
          txnResponseCode: "0000",
          paymentMode: "NB",
          respDescription: "Request processed successfully",
          aggregatorID: "A100000000007164",
          TransmissionDateTime: "20260720145903",
          responseCode: "000",
          transactionType: "SALE",
          acqName: "ICICI Bank",
          txnStatus: "SUC",
          merchantId: "100000000007164",
          merchantTxnNo: "JATATEST1234",
          paymentDateTime: "20260720145910",
          txnID: "7700229146709",
        })
      )
    );
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  process.env.ICICI_SALE_URL = base;
  process.env.ICICI_COMMAND_URL = base;

  try {
    const order = {
      orderNumber: "JATA-TEST1234",
      totalPaise: 100,
      currency: "INR",
      customerEmail: "test@example.com",
      customerPhone: "9999999999",
      customerName: "Test Customer",
    };

    const created = await provider.createOrder({ order });
    assert.equal(created.gatewayOrderId, "JATATEST1234");
    assert.equal(order.gatewayRedirectUrl, "https://pgpayuat.icicibank.com/tsp/pg/api/v2/authRedirect");
    assert.equal(order.gatewayTranCtx, "TEST-CONTEXT");
    assert.equal(created.clientConfig.redirectUrl, process.env.ICICI_START_URL);

    const status = await provider.checkStatus({ originalTxnNo: "JATATEST1234" });
    assert.equal(status.txnStatus, "SUC");
    assert.equal(status.txnResponseCode, "0000");

    const callback = signed({
      responseCode: "000",
      respDescription: "SUCCESS",
      merchantId: "100000000007164",
      merchantTxnNo: "JATATEST1234",
      txnID: "T1",
      paymentDateTime: "20260720155335",
      paymentID: "006503",
    });

    const verified = await provider.verifyPayment({
      order: { gatewayOrderId: "JATATEST1234" },
      payload: callback,
    });
    assert.equal(verified.paid, true);
    assert.equal(verified.gatewayPaymentId, "7700229146709");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("invalid callback signatures are rejected", async () => {
  const payload = {
    responseCode: "000",
    merchantId: "100000000007164",
    merchantTxnNo: "JATATEST1234",
    secureHash: "0000000000000000000000000000000000000000000000000000000000000000",
  };

  await assert.rejects(
    () => provider.verifyPayment({ order: { gatewayOrderId: "JATATEST1234" }, payload }),
    /signature verification failed/
  );
});
