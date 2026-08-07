const express = require("express");
const { protect, requireRole } = require("../middleware/auth");
const controller = require("../controllers/adminUser.controller");

const router = express.Router();

router.use(protect, requireRole("admin"));

router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
