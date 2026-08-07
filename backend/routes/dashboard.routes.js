const express = require("express");
const { protect, requireRole } = require("../middleware/auth");
const controller = require("../controllers/dashboard.controller");

const router = express.Router();

router.get("/summary", protect, requireRole("admin", "order_manager", "product_manager", "content_manager", "marketing_manager"), controller.summary);

module.exports = router;
