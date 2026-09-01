const test = require("node:test");
const assert = require("node:assert/strict");
const { generateSecureHash, isSuccessfulTransaction } = require("../services/payments/icici.provider");

const TEST_KEY = "test-secret-key";

test("ICICI secureHash uses sorted top-level values and HMAC-SHA256", () => {
  const request = {
    aggregatorID: "A100000000007164",
    merchantId: "100000000007164",
    merchantTxnNo: "TX126443453",
    originalTxnNo: "4560012_SANDBOX",
    transactionType: "STATUS",
  };
  assert.equal(
    generateSecureHash(request, TEST_KEY),
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
  assert.equal(generateSecureHash(request, TEST_KEY), generateSecureHash(unsigned, TEST_KEY));
});

test("ICICI only treats SUC + 000/0000 as paid", () => {
  assert.equal(isSuccessfulTransaction("SUC", "000"), true);
  assert.equal(isSuccessfulTransaction("SUC", "0000"), true);
  assert.equal(isSuccessfulTransaction("REQ", "000"), false);
  assert.equal(isSuccessfulTransaction("REJ", "000"), false);
  assert.equal(isSuccessfulTransaction("SUC", "039"), false);
});
