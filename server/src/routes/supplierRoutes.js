const express = require("express");
const {
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier
} = require("../controllers/supplierController");

const router = express.Router();

router.route("/").get(listSuppliers).post(createSupplier);
router.route("/:id").put(updateSupplier).delete(deleteSupplier);

module.exports = router;

