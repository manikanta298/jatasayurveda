const express = require("express");
const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ success: true, message: "JATA Ayurveda API is running", time: new Date().toISOString() });
});

// --- Phase 2: core content CRUD ---
router.use("/products", require("./product.routes"));
router.use("/categories", require("./category.routes"));
router.use("/services", require("./service.routes"));
router.use("/coupons", require("./coupon.routes"));
router.use("/blog", require("./blog.routes"));
router.use("/research", require("./research.routes"));
router.use("/testimonials", require("./testimonial.routes"));
router.use("/doctors", require("./doctor.routes"));
router.use("/certifications", require("./certification.routes"));
router.use("/hero-banners", require("./heroBanner.routes"));
router.use("/contact", require("./contact.routes"));
router.use("/settings", require("./siteSetting.routes"));
router.use("/media", require("./media.routes"));

// --- Auth, orders, ICICI payments, notifications, dashboard ---
router.use("/auth", require("./auth.routes"));
router.use("/orders", require("./order.routes"));
router.use("/notifications", require("./notification.routes"));
router.use("/dashboard", require("./dashboard.routes"));
router.use("/users", require("./adminUser.routes"));

// --- Phase 4: customer accounts (public), separate from staff/admin auth above ---
router.use("/customers/auth", require("./customerAuth.routes"));

module.exports = router;
