const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeAddress } = require("../controllers/customerProfile.controller");

test("customer profile address PATCH preserves omitted fields", () => {
  const existing = {
    label: "Home",
    line1: "12 Main Road",
    line2: "Near Temple",
    city: "Hyderabad",
    state: "Telangana",
    postalCode: "500001",
    country: "India",
    isDefault: true,
  };

  const result = normalizeAddress({ city: "Secunderabad" }, existing, "Home");

  assert.equal(result.line1, "12 Main Road");
  assert.equal(result.line2, "Near Temple");
  assert.equal(result.city, "Secunderabad");
  assert.equal(result.state, "Telangana");
  assert.equal(result.postalCode, "500001");
  assert.equal(result.country, "India");
  assert.equal(result.isDefault, true);
});

test("customer profile address PATCH accepts partially completed new addresses", () => {
  const result = normalizeAddress({ line1: "New Address" }, {}, "Address 1");

  assert.equal(result.line1, "New Address");
  assert.equal(result.city, "");
  assert.equal(result.state, "");
  assert.equal(result.postalCode, "");
  assert.equal(result.country, "");
});
