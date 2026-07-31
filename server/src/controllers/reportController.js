const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
const StockMovement = require("../models/StockMovement");

const parsePositiveNumber = (value, fallback) => {
  const numericValue = Number(value ?? fallback);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : fallback;
};

const buildDateQuery = ({ startDate, endDate, defaultDays = null }) => {
  const dateQuery = {};

  if (startDate) {
    dateQuery.$gte = new Date(startDate);
  }

  if (endDate) {
    const lastMoment = new Date(endDate);
    lastMoment.setHours(23, 59, 59, 999);
    dateQuery.$lte = lastMoment;
  }

  if (!startDate && !endDate && defaultDays) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (defaultDays - 1));
    dateQuery.$gte = start;
  }

  return Object.keys(dateQuery).length > 0 ? { date: dateQuery } : {};
};

const buildSalesMap = async (days) => {
  const salesInWindow = await StockMovement.aggregate([
    {
      $match: {
        type: "sale",
        ...buildDateQuery({ defaultDays: days })
      }
    },
    {
      $group: {
        _id: "$product",
        totalSold: { $sum: "$quantity" },
        totalSalesAmount: { $sum: "$totalAmount" }
      }
    }
  ]);

  return new Map(
    salesInWindow.map((item) => [
      String(item._id),
      {
        totalSold: item.totalSold,
        totalSalesAmount: item.totalSalesAmount
      }
    ])
  );
};

const buildAnalyticsPayload = async (days, limit) => {
  const products = await Product.find()
    .select("name sku category stock sellingPrice")
    .sort({ name: 1 })
    .lean();

  const salesMap = await buildSalesMap(days);

  const productAnalytics = products.map((product) => {
    const sales = salesMap.get(String(product._id)) || {
      totalSold: 0,
      totalSalesAmount: 0
    };

    return {
      productId: product._id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      currentStock: product.stock,
      totalSold: sales.totalSold,
      totalSalesAmount: sales.totalSalesAmount
    };
  });

  const fastMovingProducts = [...productAnalytics]
    .sort((first, second) => second.totalSold - first.totalSold || first.name.localeCompare(second.name))
    .slice(0, limit);

  const lowSellingProducts = [...productAnalytics]
    .sort((first, second) => first.totalSold - second.totalSold || first.name.localeCompare(second.name))
    .slice(0, limit);

  return {
    days,
    fastMovingProducts,
    lowSellingProducts
  };
};

const getDashboardReport = async (req, res, next) => {
  try {
    const analyticsDays = parsePositiveNumber(req.query.days, 30);

    const [products, supplierCount, recentMovements, analytics] = await Promise.all([
      Product.find()
        .populate("supplier", "name")
        .sort({ name: 1 })
        .lean(),
      Supplier.countDocuments(),
      StockMovement.find()
        .populate("product", "name sku")
        .populate("supplier", "name")
        .sort({ date: -1, createdAt: -1 })
        .limit(8)
        .lean(),
      buildAnalyticsPayload(analyticsDays, 5)
    ]);

    const lowStockItems = products.filter(
      (product) => product.lowStockThreshold > 0 && product.stock <= product.lowStockThreshold
    );

    const summary = products.reduce(
      (accumulator, product) => {
        accumulator.totalUnitsInStock += product.stock;
        accumulator.totalCostValue += product.stock * product.costPrice;
        accumulator.totalSalesValue += product.stock * product.sellingPrice;
        return accumulator;
      },
      {
        totalProducts: products.length,
        totalSuppliers: supplierCount,
        totalUnitsInStock: 0,
        totalCostValue: 0,
        totalSalesValue: 0,
        lowStockCount: lowStockItems.length
      }
    );

    res.json({
      summary,
      lowStockItems,
      recentMovements,
      analytics
    });
  } catch (error) {
    next(error);
  }
};

const getInventoryReport = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate("supplier", "name phone email")
      .sort({ name: 1 });

    const summary = products.reduce(
      (accumulator, product) => {
        accumulator.totalUnitsInStock += product.stock;
        accumulator.totalCostValue += product.stock * product.costPrice;
        accumulator.totalRetailValue += product.stock * product.sellingPrice;
        return accumulator;
      },
      {
        totalProducts: products.length,
        totalUnitsInStock: 0,
        totalCostValue: 0,
        totalRetailValue: 0
      }
    );

    res.json({
      summary,
      products
    });
  } catch (error) {
    next(error);
  }
};

const getSalesReport = async (req, res, next) => {
  try {
    const dateFilter = buildDateQuery(req.query);
    const query = {
      type: "sale",
      ...dateFilter
    };

    const [sales, totals] = await Promise.all([
      StockMovement.find(query)
        .populate("product", "name sku")
        .sort({ date: -1, createdAt: -1 }),
      StockMovement.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalQuantitySold: { $sum: "$quantity" },
            totalSalesAmount: { $sum: "$totalAmount" }
          }
        }
      ])
    ]);

    res.json({
      summary: totals[0] || { totalQuantitySold: 0, totalSalesAmount: 0 },
      sales
    });
  } catch (error) {
    next(error);
  }
};

const getPurchaseReport = async (req, res, next) => {
  try {
    const dateFilter = buildDateQuery(req.query);
    const query = {
      type: "purchase",
      ...dateFilter
    };

    const [purchases, totals] = await Promise.all([
      StockMovement.find(query)
        .populate("product", "name sku")
        .populate("supplier", "name")
        .sort({ date: -1, createdAt: -1 }),
      StockMovement.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalQuantityPurchased: { $sum: "$quantity" },
            totalPurchaseAmount: { $sum: "$totalAmount" }
          }
        }
      ])
    ]);

    res.json({
      summary: totals[0] || { totalQuantityPurchased: 0, totalPurchaseAmount: 0 },
      purchases
    });
  } catch (error) {
    next(error);
  }
};

const getLowStockReport = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate("supplier", "name phone email")
      .sort({ stock: 1, name: 1 });

    const lowStockItems = products.filter(
      (product) => product.lowStockThreshold > 0 && product.stock <= product.lowStockThreshold
    );

    res.json({
      count: lowStockItems.length,
      products: lowStockItems
    });
  } catch (error) {
    next(error);
  }
};

const getAnalyticsReport = async (req, res, next) => {
  try {
    const days = parsePositiveNumber(req.query.days, 30);
    const limit = parsePositiveNumber(req.query.limit, 10);

    const analytics = await buildAnalyticsPayload(days, limit);
    res.json(analytics);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardReport,
  getInventoryReport,
  getSalesReport,
  getPurchaseReport,
  getLowStockReport,
  getAnalyticsReport
};

