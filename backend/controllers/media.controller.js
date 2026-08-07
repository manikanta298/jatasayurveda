const asyncHandler = require("express-async-handler");
const cloudinary = require("../config/cloudinary");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/ApiResponse");
const MediaAsset = require("../models/MediaAsset");

function streamUpload(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `jata-ayurveda/${folder}`, resource_type: "auto" },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
}

// POST /api/v1/media  (multipart/form-data, field name "file")
const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded (expected field name 'file')");

  const folder = req.body.folder || "uploads";
  const result = await streamUpload(req.file.buffer, folder);

  const asset = await MediaAsset.create({
    url: result.secure_url,
    publicId: result.public_id,
    folder,
    filename: req.file.originalname,
    alt: req.body.alt || "",
    mime: req.file.mimetype,
    sizeBytes: result.bytes,
    width: result.width,
    height: result.height,
    uploadedBy: req.user._id,
  });

  return sendSuccess(res, 201, asset);
});

// GET /api/v1/media?folder=products
const listMedia = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.folder) filter.folder = req.query.folder;

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 40, 1), 100);

  const [items, total] = await Promise.all([
    MediaAsset.find(filter)
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit),
    MediaAsset.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, items, { page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
});

// DELETE /api/v1/media/:id
const deleteMedia = asyncHandler(async (req, res) => {
  const asset = await MediaAsset.findById(req.params.id);
  if (!asset) throw new ApiError(404, "Media asset not found");

  await cloudinary.uploader.destroy(asset.publicId);
  await asset.deleteOne();

  return sendSuccess(res, 200, { deleted: true, id: req.params.id });
});

module.exports = { uploadMedia, listMedia, deleteMedia };
