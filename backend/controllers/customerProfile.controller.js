const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/ApiResponse");

const ADDRESS_FIELDS = ["line1", "line2", "city", "state", "postalCode", "country"];

function publicCustomer(customer) {
  return {
    id: customer._id,
    name: customer.name,
    email: customer.email,
    emailVerified: Boolean(customer.emailVerified),
    avatarUrl: customer.avatarUrl || null,
    address: customer.address || {},
    location: customer.location || {},
    addresses: (customer.addresses?.length ? customer.addresses : (customer.address?.line1 ? [{
      _id: "legacy-address",
      label: "Home",
      ...customer.address.toObject?.() || customer.address,
      isDefault: true,
    }] : [])).slice(0, 3).map((a) => ({
      id: a._id,
      label: a.label || "Address",
      line1: a.line1 || "",
      line2: a.line2 || "",
      city: a.city || "",
      state: a.state || "",
      postalCode: a.postalCode || "",
      country: a.country || "India",
      isDefault: Boolean(a.isDefault),
    })),
    devices: (customer.devices || []).map((d) => ({ label: d.label, lastUsedAt: d.lastUsedAt })),
  };
}

function cleanString(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function normalizeAddress(input, existing = {}, label = "Address") {
  const source = input && typeof input === "object" ? input : {};
  const out = { label: cleanString(source.label) || cleanString(existing.label) || label };

  // PATCH semantics: fields omitted by the UI retain their existing values.
  for (const field of ADDRESS_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      out[field] = cleanString(source[field]);
    } else {
      out[field] = cleanString(existing[field]);
    }
  }

  out.isDefault = source.isDefault !== undefined
    ? Boolean(source.isDefault)
    : Boolean(existing.isDefault);

  return out;
}

function pickAddressId(address) {
  return address?.id || address?._id || null;
}

// PATCH /api/v1/customers/auth/profile
// Supports partial profile/address updates. Address fields are intentionally
// free-form in the Customer model, so saving a partially completed address is
// valid; checkout remains responsible for requiring a complete shipping address.
const updateProfile = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const customer = req.customer;

  if (!customer) throw new ApiError(401, "Please sign in to continue.");

  const { name, address, addresses, location } = body;

  if (name !== undefined) {
    const nextName = cleanString(name);
    if (!nextName) throw new ApiError(400, "Name cannot be empty");
    if (nextName.length > 120) throw new ApiError(400, "Name is too long");
    customer.name = nextName;
  }

  if (Array.isArray(addresses)) {
    if (addresses.length > 3) throw new ApiError(400, "You can save up to 3 addresses");

    const existing = customer.addresses || [];
    const normalized = addresses.map((input, index) => {
      if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new ApiError(400, `Invalid address ${index + 1}`);
      }
      const id = pickAddressId(input);
      const previous = id ? existing.find((item) => String(item._id) === String(id)) : existing[index];
      return normalizeAddress(input, previous || {}, `Address ${index + 1}`);
    });

    let defaultIndex = normalized.findIndex((item) => item.isDefault);
    if (defaultIndex < 0 && normalized.length) defaultIndex = 0;
    normalized.forEach((item, index) => {
      item.isDefault = index === defaultIndex;
    });

    customer.addresses = normalized;
    const defaultAddress = normalized[defaultIndex];
    if (defaultAddress) {
      customer.address = {
        line1: defaultAddress.line1,
        line2: defaultAddress.line2,
        city: defaultAddress.city,
        state: defaultAddress.state,
        postalCode: defaultAddress.postalCode,
        country: defaultAddress.country,
      };
    }
  } else if (address && typeof address === "object" && !Array.isArray(address)) {
    const current = customer.address?.toObject?.() || customer.address || {};
    customer.address = normalizeAddress(address, current, "Home");

    if (!customer.addresses?.length) {
      customer.addresses = [{ ...customer.address, label: "Home", isDefault: true }];
    } else {
      const currentDefault = customer.addresses.find((item) => item.isDefault) || customer.addresses[0];
      if (currentDefault) {
        for (const field of ADDRESS_FIELDS) currentDefault[field] = customer.address[field] || "";
      }
    }
  } else {
    const hasFlatAddress = ADDRESS_FIELDS.some((field) => Object.prototype.hasOwnProperty.call(body, field));
    if (hasFlatAddress) {
      const current = customer.address?.toObject?.() || customer.address || {};
      customer.address = normalizeAddress(body, current, "Home");
      if (!customer.addresses?.length) {
        customer.addresses = [{ ...customer.address, label: "Home", isDefault: true }];
      }
    }
  }

  if (location && typeof location === "object" && !Array.isArray(location)) {
    const current = customer.location?.toObject?.() || customer.location || {};
    const next = { ...current };
    if (location.lat !== undefined && location.lat !== "") {
      const lat = Number(location.lat);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new ApiError(400, "Invalid latitude");
      next.lat = lat;
    }
    if (location.lng !== undefined && location.lng !== "") {
      const lng = Number(location.lng);
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) throw new ApiError(400, "Invalid longitude");
      next.lng = lng;
    }
    if (location.formattedAddress !== undefined) next.formattedAddress = cleanString(location.formattedAddress);
    if (location.placeId !== undefined) next.placeId = cleanString(location.placeId);
    customer.location = next;
  }

  await customer.save();
  return sendSuccess(res, 200, publicCustomer(customer));
});

module.exports = { updateProfile, normalizeAddress };
