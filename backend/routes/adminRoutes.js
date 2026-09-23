const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const { adminLimiter } = require("../middlewares/security");
const { getAdminMe } = require("../controllers/adminController");

router.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

router.use(authMiddleware);
router.use(adminMiddleware);
router.use(adminLimiter);

router.get("/me", getAdminMe);

module.exports = router;
