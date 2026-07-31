const express = require("express");
const {
  getDashboardReport,
  getInventoryReport,
  getSalesReport,
  getPurchaseReport,
  getLowStockReport,
  getAnalyticsReport
} = require("../controllers/reportController");

const router = express.Router();

router.get("/dashboard", getDashboardReport);
router.get("/inventory", getInventoryReport);
router.get("/sales", getSalesReport);
router.get("/purchases", getPurchaseReport);
router.get("/low-stock", getLowStockReport);
router.get("/analytics", getAnalyticsReport);

module.exports = router;

