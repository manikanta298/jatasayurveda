const mongoose = require("mongoose");

const mediaAssetSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true, unique: true }, // Cloudinary public_id
    folder: { type: String, default: "uploads" },
    filename: { type: String, required: true },
    alt: { type: String, default: "" },
    mime: { type: String },
    sizeBytes: { type: Number },
    width: { type: Number },
    height: { type: Number },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

mediaAssetSchema.index({ folder: 1 });

module.exports = mongoose.model("MediaAsset", mediaAssetSchema);
