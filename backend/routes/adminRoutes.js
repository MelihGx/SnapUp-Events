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
  getAdminStorage,
  getAdminAnalytics,
  getAdminUsers,
  getAdminUser,
  getAdminEvents,
  getAdminEvent,
  createAdminUser,
  createAdminEventForUser,
  setAdminEventSuspension,
  changeAdminEventPackage,
  setAdminEventStorageOverride,
  setAdminUserActiveStatus,
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
router.get("/storage", getAdminStorage);
router.get("/analytics", getAdminAnalytics);
router.get("/users", getAdminUsers);
router.post("/users", adminWriteLimiter, createAdminUser);
router.get("/users/:userId", getAdminUser);
router.post(
  "/users/:userId/events",
  adminWriteLimiter,
  createAdminEventForUser,
);
router.patch(
  "/users/:userId/status",
  adminWriteLimiter,
  setAdminUserActiveStatus,
);
router.delete(
  "/users/:userId",
  superAdminMiddleware,
  adminWriteLimiter,
  deleteAdminUser,
);
router.get("/events", getAdminEvents);
router.get("/events/:eventId", getAdminEvent);
router.patch(
  "/events/:eventId/status",
  adminWriteLimiter,
  setAdminEventSuspension,
);
router.patch(
  "/events/:eventId/package",
  adminWriteLimiter,
  changeAdminEventPackage,
);
router.patch(
  "/events/:eventId/storage-override",
  adminWriteLimiter,
  setAdminEventStorageOverride,
);
router.get("/logs", getAdminLogs);

module.exports = router;
