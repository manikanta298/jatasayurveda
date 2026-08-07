const express = require("express");
const { protect, requireRole } = require("../middleware/auth");
const upload = require("../middleware/upload");
const controller = require("../controllers/media.controller");

const router = express.Router();

const contentRoles = ["admin", "content_manager", "product_manager", "marketing_manager"];

router.get("/", protect, requireRole(...contentRoles), controller.listMedia);
router.post("/", protect, requireRole(...contentRoles), upload.single("file"), controller.uploadMedia);
router.delete("/:id", protect, requireRole("admin"), controller.deleteMedia);

module.exports = router;
