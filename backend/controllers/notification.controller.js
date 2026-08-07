const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/ApiResponse");
const Notification = require("../models/Notification");

// GET /api/v1/notifications — only notifications addressed to one of the user's roles
const list = asyncHandler(async (req, res) => {
  const filter = { recipientRoles: { $in: req.user.roles } };
  if (req.query.unreadOnly === "true") filter.isRead = false;

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);

  return sendSuccess(res, 200, items, { page, limit, total, totalPages: Math.ceil(total / limit) || 1, unreadCount });
});

// PATCH /api/v1/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipientRoles: { $in: req.user.roles } },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw new ApiError(404, "Notification not found");
  return sendSuccess(res, 200, notification);
});

// PATCH /api/v1/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipientRoles: { $in: req.user.roles }, isRead: false }, { isRead: true });
  return sendSuccess(res, 200, { updated: true });
});

module.exports = { list, markRead, markAllRead };
