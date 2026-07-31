const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");
const Supplier = require("../models/Supplier");

const normalizeMoney = (value) => {
  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0;
};

const normalizeThreshold = (value, fallback = 5) => {
  const numericValue = Number(value ?? fallback);
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : fallback;
};

const listProducts = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate("supplier", "name contactPerson phone email")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "supplier",
      "name contactPerson phone email"
    );

    if (!product) {
      res.status(404);
      throw new Error("Product not found.");
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      category,
      supplier,
      description,
      costPrice,
      sellingPrice,
      lowStockThreshold
    } = req.body;

    if (!name || !sku) {
      res.status(400);
      throw new Error("Product name and SKU are required.");
    }

    if (supplier) {
      const supplierExists = await Supplier.findById(supplier);
      if (!supplierExists) {
        res.status(400);
        throw new Error("Selected supplier does not exist.");
      }
    }

    const existingProduct = await Product.findOne({ sku: sku.trim().toUpperCase() });
    if (existingProduct) {
      res.status(400);
      throw new Error("A product with this SKU already exists.");
    }

    const product = await Product.create({
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category: category?.trim() || "",
      supplier: supplier || null,
      description: description?.trim() || "",
      costPrice: normalizeMoney(costPrice),
      sellingPrice: normalizeMoney(sellingPrice),
      lowStockThreshold: normalizeThreshold(lowStockThreshold),
      stock: 0
    });

    const populatedProduct = await Product.findById(product._id).populate(
      "supplier",
      "name contactPerson phone email"
    );

    res.status(201).json(populatedProduct);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found.");
    }

    const {
      name,
      sku,
      category,
      supplier,
      description,
      costPrice,
      sellingPrice,
      lowStockThreshold
    } = req.body;

    if (!name || !sku) {
      res.status(400);
      throw new Error("Product name and SKU are required.");
    }

    const normalizedSku = sku.trim().toUpperCase();
    const duplicateProduct = await Product.findOne({
      sku: normalizedSku,
      _id: { $ne: product._id }
    });

    if (duplicateProduct) {
      res.status(400);
      throw new Error("Another product already uses this SKU.");
    }

    if (supplier) {
      const supplierExists = await Supplier.findById(supplier);
      if (!supplierExists) {
        res.status(400);
        throw new Error("Selected supplier does not exist.");
      }
    }

    product.name = name.trim();
    product.sku = normalizedSku;
    product.category = category?.trim() || "";
    product.supplier = supplier || null;
    product.description = description?.trim() || "";
    product.costPrice = normalizeMoney(costPrice);
    product.sellingPrice = normalizeMoney(sellingPrice);
    product.lowStockThreshold = normalizeThreshold(lowStockThreshold);

    await product.save();

    const updatedProduct = await Product.findById(product._id).populate(
      "supplier",
      "name contactPerson phone email"
    );

    res.json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found.");
    }

    const movementCount = await StockMovement.countDocuments({ product: product._id });
    if (movementCount > 0) {
      res.status(400);
      throw new Error("This product has stock history and cannot be deleted.");
    }

    if (product.stock > 0) {
      res.status(400);
      throw new Error("Reduce stock to zero before deleting this product.");
    }

    await product.deleteOne();
    res.json({ message: "Product deleted successfully." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};

