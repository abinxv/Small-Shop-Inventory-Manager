const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true
    },
    category: {
      type: String,
      trim: true,
      default: ""
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    costPrice: {
      type: Number,
      min: 0,
      default: 0
    },
    sellingPrice: {
      type: Number,
      min: 0,
      default: 0
    },
    stock: {
      type: Number,
      min: 0,
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      min: 0,
      default: 5
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Product", productSchema);

