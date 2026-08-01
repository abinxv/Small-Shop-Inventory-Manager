const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const fs = require("fs");
const morgan = require("morgan");
const path = require("path");

const connectDb = require("./config/connectDb");
const productRoutes = require("./routes/productRoutes");
const reportRoutes = require("./routes/reportRoutes");
const stockMovementRoutes = require("./routes/stockMovementRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const { errorHandler, notFound } = require("./middleware/errorHandler");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();

app.use(async (req, res, next) => {
  await connectDb();
  next();
});

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim())
  : true;

app.use(
  cors({
    origin: allowedOrigins
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Inventory server is running."
  });
});

const distPath = path.resolve(__dirname, "../../dist");
const clientDistPath = path.resolve(__dirname, "../../client/dist");
const staticPath = fs.existsSync(path.join(distPath, "index.html"))
  ? distPath
  : clientDistPath;

app.use(express.static(staticPath));

app.use("/api/products", productRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/stock-movements", stockMovementRoutes);
app.use("/api/reports", reportRoutes);

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return notFound(req, res, next);
  }
  const indexPath = path.join(staticPath, "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
