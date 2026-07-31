const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");
const Supplier = require("../models/Supplier");

const incomingMovementTypes = new Set(["purchase", "adjustment_in"]);

const createRollbackUpdate = (type, quantity) => {
  return incomingMovementTypes.has(type)
    ? { $inc: { stock: -quantity } }
    : { $inc: { stock: quantity } };
};

const buildUpdateQuery = (productId, type, quantity) => {
  const query = { _id: productId };

  if (!incomingMovementTypes.has(type)) {
    query.stock = { $gte: quantity };
  }

  return query;
};

const buildStockUpdate = (type, quantity) => {
  return incomingMovementTypes.has(type)
    ? { $inc: { stock: quantity } }
    : { $inc: { stock: -quantity } };
};

const listStockMovements = async (req, res, next) => {
  try {
    const { type, startDate, endDate, limit = 20 } = req.query;
    const query = {};

    if (type) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.date = {};

      if (startDate) {
        query.date.$gte = new Date(startDate);
      }

      if (endDate) {
        const lastMoment = new Date(endDate);
        lastMoment.setHours(23, 59, 59, 999);
        query.date.$lte = lastMoment;
      }
    }

    const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const movements = await StockMovement.find(query)
      .populate("product", "name sku stock")
      .populate("supplier", "name")
      .sort({ date: -1, createdAt: -1 })
      .limit(parsedLimit);

    res.json(movements);
  } catch (error) {
    next(error);
  }
};

const createStockMovement = async (req, res, next) => {
  let productAfterUpdate = null;

  try {
    const { product, supplier, type, quantity, unitPrice, note, date } = req.body;

    if (!product || !type || !quantity) {
      res.status(400);
      throw new Error("Product, movement type, and quantity are required.");
    }

    const normalizedQuantity = Number(quantity);
    const normalizedUnitPrice = Number(unitPrice ?? 0);

    if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
      res.status(400);
      throw new Error("Quantity must be greater than zero.");
    }

    if (
      !["purchase", "sale", "adjustment_in", "adjustment_out"].includes(type)
    ) {
      res.status(400);
      throw new Error("Invalid stock movement type.");
    }

    if (supplier) {
      const supplierExists = await Supplier.findById(supplier);
      if (!supplierExists) {
        res.status(400);
        throw new Error("Selected supplier does not exist.");
      }
    }

    const productBeforeUpdate = await Product.findById(product);
    if (!productBeforeUpdate) {
      res.status(404);
      throw new Error("Product not found.");
    }

    productAfterUpdate = await Product.findOneAndUpdate(
      buildUpdateQuery(product, type, normalizedQuantity),
      buildStockUpdate(type, normalizedQuantity),
      { new: true }
    );

    if (!productAfterUpdate) {
      res.status(400);
      throw new Error("Not enough stock available for this operation.");
    }

    const stockBefore = incomingMovementTypes.has(type)
      ? productAfterUpdate.stock - normalizedQuantity
      : productAfterUpdate.stock + normalizedQuantity;

    const movement = await StockMovement.create({
      product,
      supplier: supplier || null,
      type,
      quantity: normalizedQuantity,
      unitPrice:
        Number.isFinite(normalizedUnitPrice) && normalizedUnitPrice >= 0
          ? normalizedUnitPrice
          : 0,
      totalAmount:
        (Number.isFinite(normalizedUnitPrice) && normalizedUnitPrice >= 0
          ? normalizedUnitPrice
          : 0) * normalizedQuantity,
      stockBefore,
      stockAfter: productAfterUpdate.stock,
      note: note?.trim() || "",
      date: date ? new Date(date) : new Date()
    });

    const populatedMovement = await StockMovement.findById(movement._id)
      .populate("product", "name sku stock")
      .populate("supplier", "name");

    res.status(201).json(populatedMovement);
  } catch (error) {
    if (productAfterUpdate) {
      await Product.updateOne(
        { _id: productAfterUpdate._id },
        createRollbackUpdate(req.body.type, Number(req.body.quantity))
      ).catch(() => null);
    }

    next(error);
  }
};

module.exports = {
  listStockMovements,
  createStockMovement
};
