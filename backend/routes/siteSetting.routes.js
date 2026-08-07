const express = require("express");
const { protect, requireRole } = require("../middleware/auth");
const controller = require("../controllers/siteSetting.controller");

const router = express.Router();

router.get("/", controller.getAll);
router.get("/:key", controller.getOne);
router.patch("/:key", protect, requireRole("admin"), controller.upsert);

module.exports = router;
