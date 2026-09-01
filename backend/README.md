# JATA Ayurveda Backend

## Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## ICICI Bank Payment Gateway — UAT

The integration follows the supplied ICICI Bank Payment Gateway UAT documents and uses **Standard / Redirection Mode (`payType=0`)**:

1. Create a server-side Initiate Sale request.
2. Generate `secureHash` with the documented sorted-top-level-key HMAC-SHA256 algorithm.
3. Call the UAT Initiate Sale endpoint.
4. Store the returned `redirectURI` and `tranCtx` on the order.
5. Send the customer through the existing checkout's `/icici/start` bridge to `redirectURI?tranCtx=...`.
6. Accept ICICI's browser POST at `/icici/return` and independently call STATUS before marking the order paid.
7. Accept Payment Advice at `/icici/advice` as the server-to-server fallback/update path.

The supplied UAT document identifies the merchant as MID `100000000007164`, Aggregator ID `A100000000007164`, and provides a UAT APPID. The UAT secret key is intentionally **not committed to Git**; configure it as a deployment/server secret in `ICICI_SECRET_KEY`.

### Required environment

```env
ICICI_ENV=uat
ICICI_MERCHANT_ID=100000000007164
ICICI_AGGREGATOR_ID=A100000000007164
ICICI_SECRET_KEY=<UAT-secret-from-ICICI>
ICICI_RETURN_URL=https://<backend-host>/api/v1/orders/icici/return
ICICI_START_URL=https://<backend-host>/api/v1/orders/icici/start
ICICI_FRONTEND_URL=https://jatasayurveda.com
ICICI_ADVICE_URL=https://<backend-host>/api/v1/orders/icici/advice
```

`ICICI_SALE_URL` and `ICICI_COMMAND_URL` are optional overrides. When omitted, the adapter uses the documented UAT endpoints:

- Initiate Sale: `https://pgpayuat.icicibank.com/tsp/pg/api/v2/initiateSale`
- Status/Refund command: `https://pgpayuat.icicibank.com/tsp/pg/api/command?reqType=JSON`

Production URLs are selected only when `ICICI_ENV=production`.

### UAT test instruments

Use only in the ICICI sandbox:

- Card: `4761 3400 0000 0035`
- Expiry: `12/26`
- CVV: `123`
- OTP: `123456`
- Name: `test`
- Net Banking: `CC Avenue Test Bank`, login/OTP `123456`
- UPI VPA: `test@ybl`

### Tests and logs

Run:

```bash
npm test
```

The automated suite verifies the supplied hash algorithm, nested UDF serialization, Initiate Sale request construction, signed STATUS responses, callback verification, and success/rejection rules using a local HTTP mock. Runtime gateway events are logged with `[icici]` prefixes without logging the secret key or full payment payload.

A real end-to-end UAT payment still requires the deployed backend's HTTPS return URL to be reachable from ICICI and the merchant profile/webhook configuration to be enabled by ICICI. The implementation should not be called production-tested until that real UAT payment is completed successfully.
