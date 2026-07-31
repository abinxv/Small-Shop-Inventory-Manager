import { useEffect, useState } from "react";
import Panel from "../components/Panel";
import { inventoryApi } from "../api";
import { formatCurrency, formatDate, getTodayDate } from "../utils";

const initialDateFilters = {
  startDate: "",
  endDate: getTodayDate()
};

function ReportsSection({ refreshKey }) {
  const [dateFilters, setDateFilters] = useState(initialDateFilters);
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [purchaseReport, setPurchaseReport] = useState(null);
  const [lowStockReport, setLowStockReport] = useState(null);
  const [analyticsReport, setAnalyticsReport] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const buildDateQuery = () => {
    const params = new URLSearchParams();

    if (dateFilters.startDate) {
      params.set("startDate", dateFilters.startDate);
    }

    if (dateFilters.endDate) {
      params.set("endDate", dateFilters.endDate);
    }

    const query = params.toString();
    return query ? `?${query}` : "";
  };

  const loadReports = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const query = buildDateQuery();
      const [inventory, sales, purchases, lowStock, analytics] = await Promise.all([
        inventoryApi.getInventoryReport(),
        inventoryApi.getSalesReport(query),
        inventoryApi.getPurchaseReport(query),
        inventoryApi.getLowStockReport(),
        inventoryApi.getAnalyticsReport(`?days=${analyticsDays}&limit=8`)
      ]);

      setInventoryReport(inventory);
      setSalesReport(sales);
      setPurchaseReport(purchases);
      setLowStockReport(lowStock);
      setAnalyticsReport(analytics);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [dateFilters.startDate, dateFilters.endDate, analyticsDays, refreshKey]);

  return (
    <div className="section-grid">
      <Panel
        title="Report Filters"
        subtitle="Reports now refresh automatically when filters change or new stock activity is recorded."
      >
        <div className="filters-row">
          <label>
            Start Date
            <input
              type="date"
              value={dateFilters.startDate}
              onChange={(event) =>
                setDateFilters((currentFilters) => ({
                  ...currentFilters,
                  startDate: event.target.value
                }))
              }
            />
          </label>
          <label>
            End Date
            <input
              type="date"
              value={dateFilters.endDate}
              onChange={(event) =>
                setDateFilters((currentFilters) => ({
                  ...currentFilters,
                  endDate: event.target.value
                }))
              }
            />
          </label>
          <label>
            Analytics Window (days)
            <input
              type="number"
              min="1"
              value={analyticsDays}
              onChange={(event) => setAnalyticsDays(event.target.value)}
            />
          </label>
          <button type="button" className="button button--primary" onClick={loadReports}>
            Refresh Reports
          </button>
        </div>
        {errorMessage ? <p className="form-warning">{errorMessage}</p> : null}
      </Panel>

      {isLoading ? <p className="page-message">Loading reports...</p> : null}

      {inventoryReport ? (
        <div className="three-column-grid">
          <Panel title="Inventory Summary">
            <div className="mini-metrics">
              <div>
                <strong>{inventoryReport.summary.totalProducts}</strong>
                <span>Products</span>
              </div>
              <div>
                <strong>{inventoryReport.summary.totalUnitsInStock}</strong>
                <span>Units</span>
              </div>
              <div>
                <strong>{formatCurrency(inventoryReport.summary.totalCostValue)}</strong>
                <span>Cost Value</span>
              </div>
              <div>
                <strong>{formatCurrency(inventoryReport.summary.totalRetailValue)}</strong>
                <span>Retail Value</span>
              </div>
            </div>
          </Panel>
          <Panel title="Sales Summary">
            <div className="mini-metrics">
              <div>
                <strong>{salesReport?.summary.totalQuantitySold || 0}</strong>
                <span>Units Sold</span>
              </div>
              <div>
                <strong>{formatCurrency(salesReport?.summary.totalSalesAmount || 0)}</strong>
                <span>Sales Value</span>
              </div>
            </div>
          </Panel>
          <Panel title="Purchase Summary">
            <div className="mini-metrics">
              <div>
                <strong>{purchaseReport?.summary.totalQuantityPurchased || 0}</strong>
                <span>Units Purchased</span>
              </div>
              <div>
                <strong>{formatCurrency(purchaseReport?.summary.totalPurchaseAmount || 0)}</strong>
                <span>Purchase Value</span>
              </div>
            </div>
          </Panel>
        </div>
      ) : null}

      {analyticsReport ? (
        <div className="two-column-grid">
          <Panel title={`Fast-Moving (${analyticsReport.days} days)`}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Sold</th>
                    <th>Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsReport.fastMovingProducts.map((product) => (
                    <tr key={product.productId}>
                      <td>
                        {product.name}
                        <span className="table-subtext">{product.sku}</span>
                      </td>
                      <td>{product.totalSold}</td>
                      <td>{formatCurrency(product.totalSalesAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel title={`Low-Selling (${analyticsReport.days} days)`}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Sold</th>
                    <th>Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsReport.lowSellingProducts.map((product) => (
                    <tr key={product.productId}>
                      <td>
                        {product.name}
                        <span className="table-subtext">{product.sku}</span>
                      </td>
                      <td>{product.totalSold}</td>
                      <td>{formatCurrency(product.totalSalesAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      ) : null}

      {inventoryReport ? (
        <Panel title="Inventory Report" subtitle="Current stock and product values.">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Supplier</th>
                  <th>Stock</th>
                  <th>Cost Value</th>
                  <th>Retail Value</th>
                </tr>
              </thead>
              <tbody>
                {inventoryReport.products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      {product.name}
                      <span className="table-subtext">{product.sku}</span>
                    </td>
                    <td>{product.supplier?.name || "Unassigned"}</td>
                    <td>{product.stock}</td>
                    <td>{formatCurrency(product.stock * product.costPrice)}</td>
                    <td>{formatCurrency(product.stock * product.sellingPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      <div className="two-column-grid">
        {salesReport ? (
          <Panel title="Sales Report" subtitle="Recorded outgoing sales within the selected dates.">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {salesReport.sales.map((sale) => (
                    <tr key={sale._id}>
                      <td>{formatDate(sale.date)}</td>
                      <td>{sale.product?.name || "Deleted product"}</td>
                      <td>{sale.quantity}</td>
                      <td>{formatCurrency(sale.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        ) : null}

        {purchaseReport ? (
          <Panel
            title="Purchase Report"
            subtitle="Recorded incoming stock from suppliers within the selected dates."
          >
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Supplier</th>
                    <th>Qty</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseReport.purchases.map((purchase) => (
                    <tr key={purchase._id}>
                      <td>{formatDate(purchase.date)}</td>
                      <td>{purchase.product?.name || "Deleted product"}</td>
                      <td>{purchase.supplier?.name || "-"}</td>
                      <td>{purchase.quantity}</td>
                      <td>{formatCurrency(purchase.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        ) : null}
      </div>

      {lowStockReport ? (
        <Panel title="Low-Stock Report" subtitle="Products that have reached the reorder point.">
          {lowStockReport.products.length === 0 ? (
            <p className="empty-state">No products are currently low on stock.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Supplier</th>
                    <th>Stock</th>
                    <th>Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockReport.products.map((product) => (
                    <tr key={product._id}>
                      <td>
                        {product.name}
                        <span className="table-subtext">{product.sku}</span>
                      </td>
                      <td>{product.supplier?.name || "Unassigned"}</td>
                      <td>{product.stock}</td>
                      <td>{product.lowStockThreshold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      ) : null}
    </div>
  );
}

export default ReportsSection;
