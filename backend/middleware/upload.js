const multer = require("multer");

const storage = multer.memoryStorage();

// `file.mimetype` comes straight from the client-supplied Content-Type and
// can be spoofed, but accepting it against a strict allowlist (rather than
// any image/* or video/* subtype) at least blocks the obviously wrong cases
// like image/svg+xml (SVG can carry inline JS) or oddball video containers.
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);

const upload = multer({
  storage,
  // 60MB — images stay small, but short hero background video clips need
  // meaningfully more headroom than the old 8MB image-only cap.
  limits: { fileSize: 60 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error("Unsupported file type"));
    }
    cb(null, true);
  },
});

module.exports = upload;
