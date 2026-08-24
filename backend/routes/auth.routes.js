const express = require("express");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { adminLogin } = require("../validators/schemas");
const controller = require("../controllers/auth.controller");

const router = express.Router();

router.post("/login", validate(adminLogin), controller.login);
router.post("/logout", controller.logout);
router.get("/me", protect, controller.me);
router.patch("/me/password", protect, controller.changePassword);

module.exports = router;
