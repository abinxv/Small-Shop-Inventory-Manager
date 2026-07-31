const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");
const Supplier = require("../models/Supplier");

const listSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json(suppliers);
  } catch (error) {
    next(error);
  }
};

const createSupplier = async (req, res, next) => {
  try {
    const { name, contactPerson, phone, email, address, notes } = req.body;

    if (!name) {
      res.status(400);
      throw new Error("Supplier name is required.");
    }

    const supplier = await Supplier.create({
      name: name.trim(),
      contactPerson: contactPerson?.trim() || "",
      phone: phone?.trim() || "",
      email: email?.trim() || "",
      address: address?.trim() || "",
      notes: notes?.trim() || ""
    });

    res.status(201).json(supplier);
  } catch (error) {
    next(error);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      res.status(404);
      throw new Error("Supplier not found.");
    }

    const { name, contactPerson, phone, email, address, notes } = req.body;

    if (!name) {
      res.status(400);
      throw new Error("Supplier name is required.");
    }

    supplier.name = name.trim();
    supplier.contactPerson = contactPerson?.trim() || "";
    supplier.phone = phone?.trim() || "";
    supplier.email = email?.trim() || "";
    supplier.address = address?.trim() || "";
    supplier.notes = notes?.trim() || "";

    await supplier.save();

    res.json(supplier);
  } catch (error) {
    next(error);
  }
};

const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      res.status(404);
      throw new Error("Supplier not found.");
    }

    const linkedProducts = await Product.countDocuments({ supplier: supplier._id });
    if (linkedProducts > 0) {
      res.status(400);
      throw new Error("Reassign or remove linked products before deleting this supplier.");
    }

    const linkedMovements = await StockMovement.countDocuments({ supplier: supplier._id });
    if (linkedMovements > 0) {
      res.status(400);
      throw new Error("This supplier is used in purchase history and cannot be deleted.");
    }

    await supplier.deleteOne();
    res.json({ message: "Supplier deleted successfully." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier
};

