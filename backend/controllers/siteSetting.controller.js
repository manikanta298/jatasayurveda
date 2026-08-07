const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/ApiResponse");
const SiteSetting = require("../models/SiteSetting");

// GET /api/v1/settings — returns all settings collapsed into a single { key: value } object.
// This route is public and unauthenticated (the whole storefront reads it),
// so only whitelisted, known-public top-level keys are returned. If you add
// a new settings section, add its key here too — otherwise it silently won't
// show up on the public site, which is the safe failure mode.
const PUBLIC_SETTING_KEYS = new Set([
  "brand",
  "contact",
  "socials",
  "seo",
  "analytics",
  "commerce",
  "footer",
  "home_hero",
  "about_intro",
  "site",
]);

const getAll = asyncHandler(async (req, res) => {
  const settings = await SiteSetting.find({});
  const collapsed = settings.reduce((acc, s) => {
    if (PUBLIC_SETTING_KEYS.has(s.key)) {
      acc[s.key] = s.value;
    }
    return acc;
  }, {});
  return sendSuccess(res, 200, collapsed);
});

// GET /api/v1/settings/:key — also public/unauthenticated, so it uses the
// same whitelist as getAll.
const getOne = asyncHandler(async (req, res) => {
  if (!PUBLIC_SETTING_KEYS.has(req.params.key)) {
    throw new ApiError(404, `Setting "${req.params.key}" not found`);
  }
  const setting = await SiteSetting.findOne({ key: req.params.key });
  if (!setting) throw new ApiError(404, `Setting "${req.params.key}" not found`);
  return sendSuccess(res, 200, setting.value);
});

// PATCH /api/v1/settings/:key  { value: {...} } — upserts
const upsert = asyncHandler(async (req, res) => {
  const { value } = req.body;
  if (value === undefined) throw new ApiError(400, "value is required");

  const setting = await SiteSetting.findOneAndUpdate(
    { key: req.params.key },
    { value, updatedBy: req.user._id },
    { new: true, upsert: true, runValidators: true }
  );
  return sendSuccess(res, 200, setting);
});

module.exports = { getAll, getOne, upsert };
