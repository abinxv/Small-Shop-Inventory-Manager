const express = require("express");
const {
  listStockMovements,
  createStockMovement
} = require("../controllers/stockMovementController");

const router = express.Router();

router.route("/").get(listStockMovements).post(createStockMovement);

module.exports = router;

