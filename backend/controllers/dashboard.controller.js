const asyncHandler = require("express-async-handler");
const { sendSuccess } = require("../utils/ApiResponse");
const Order = require("../models/Order");
const Product = require("../models/Product");
const ContactMessage = require("../models/ContactMessage");
const Notification = require("../models/Notification");

const LOW_STOCK_THRESHOLD = 10;

// GET /api/v1/dashboard/summary
const summary = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalOrders,
    ordersByStatus,
    revenueAgg,
    recentOrders,
    lowStockProducts,
    newContactMessages,
    unreadNotifications,
  ] = await Promise.all([
    Order.countDocuments({}),
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { status: { $in: ["paid", "processing", "shipped", "delivered"] }, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, totalPaise: { $sum: "$totalPaise" }, count: { $sum: 1 } } },
    ]),
    Order.find({}).sort("-createdAt").limit(8).select("orderNumber customerName totalPaise status createdAt"),
    Product.find({ stockQuantity: { $lte: LOW_STOCK_THRESHOLD }, isEnabled: true })
      .sort("stockQuantity")
      .limit(10)
      .select("name slug stockQuantity"),
    ContactMessage.countDocuments({ status: "new" }),
    Notification.countDocuments({ recipientRoles: { $in: req.user.roles }, isRead: false }),
  ]);

  const statusCounts = ordersByStatus.reduce((acc, s) => {
    acc[s._id] = s.count;
    return acc;
  }, {});

  return sendSuccess(res, 200, {
    totalOrders,
    ordersByStatus: statusCounts,
    last30Days: {
      revenuePaise: revenueAgg[0]?.totalPaise || 0,
      orderCount: revenueAgg[0]?.count || 0,
    },
    recentOrders,
    lowStockProducts,
    newContactMessages,
    unreadNotifications,
  });
});

module.exports = { summary };
