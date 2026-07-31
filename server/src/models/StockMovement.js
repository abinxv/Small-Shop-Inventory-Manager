const mongoose = require("mongoose");

const stockMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null
    },
    type: {
      type: String,
      enum: ["purchase", "sale", "adjustment_in", "adjustment_out"],
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      min: 0,
      default: 0
    },
    totalAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    stockBefore: {
      type: Number,
      min: 0,
      required: true
    },
    stockAfter: {
      type: Number,
      min: 0,
      required: true
    },
    note: {
      type: String,
      trim: true,
      default: ""
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("StockMovement", stockMovementSchema);

