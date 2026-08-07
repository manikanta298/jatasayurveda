const express = require("express");
const attachCrudRoutes = require("./attachCrudRoutes");
const crud = require("../controllers/coupon.controller");

const router = express.Router();

// Public: checkout calls this to apply a coupon code
router.post("/validate", crud.validate);

// Admin-only CRUD (no public listing of coupon codes)
attachCrudRoutes(router, crud, {
  writeRoles: ["admin", "marketing_manager", "order_manager"],
  publicRead: false,
});

module.exports = router;
