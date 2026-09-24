const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const superAdminMiddleware = require("../middlewares/superAdminMiddleware");
const {
  adminLimiter,
  adminWriteLimiter,
} = require("../middlewares/security");
const {
  getAdminMe,
  getAdminDashboard,
  getAdminAnalytics,
  getAdminUsers,
  getAdminUser,
  getAdminEvents,
  getAdminEvent,
  createAdminUser,
  createAdminEventForUser,
  deleteAdminUser,
  getAdminLogs,
} = require("../controllers/adminController");

router.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

router.use(authMiddleware);
router.use(adminMiddleware);
router.use(adminLimiter);

router.get("/me", getAdminMe);
router.get("/dashboard", getAdminDashboard);
router.get("/analytics", getAdminAnalytics);
router.get("/users", getAdminUsers);
router.post("/users", adminWriteLimiter, createAdminUser);
router.get("/users/:userId", getAdminUser);
router.post(
  "/users/:userId/events",
  adminWriteLimiter,
  createAdminEventForUser,
);
router.delete(
  "/users/:userId",
  superAdminMiddleware,
  adminWriteLimiter,
  deleteAdminUser,
);
router.get("/events", getAdminEvents);
router.get("/events/:eventId", getAdminEvent);
router.get("/logs", getAdminLogs);

module.exports = router;
