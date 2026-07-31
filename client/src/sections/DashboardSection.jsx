import MetricCard from "../components/MetricCard";
import Panel from "../components/Panel";
import {
  formatCurrency,
  formatDateTime,
  formatMovementType
} from "../utils";

function DashboardSection({ dashboardData }) {
  if (!dashboardData) {
    return null;
  }

  const { summary, lowStockItems, recentMovements, analytics } = dashboardData;

  return (
    <div className="section-grid">
      <div className="metrics-grid">
        <MetricCard
          label="Products"
          value={summary.totalProducts}
          note="Active inventory items"
        />
        <MetricCard
          label="Suppliers"
          value={summary.totalSuppliers}
          note="Saved vendor records"
        />
        <MetricCard
          label="Units In Stock"
          value={summary.totalUnitsInStock}
          note="All available stock"
        />
        <MetricCard
          label="Low Stock Alerts"
          value={summary.lowStockCount}
          note="Needs replenishment"
          tone={summary.lowStockCount > 0 ? "danger" : "success"}
        />
        <MetricCard
          label="Cost Value"
          value={formatCurrency(summary.totalCostValue)}
          note="Based on cost price"
        />
        <MetricCard
          label="Retail Value"
          value={formatCurrency(summary.totalSalesValue)}
          note="Based on selling price"
        />
      </div>

      <div className="two-column-grid">
        <Panel
          title="Low-Stock Alerts"
          subtitle="Products at or below their alert threshold."
        >
          {lowStockItems.length === 0 ? (
            <p className="empty-state">No low-stock products right now.</p>
          ) : (
            <div className="list-stack">
              {lowStockItems.map((product) => (
                <div key={product._id} className="list-row">
                  <div>
                    <strong>{product.name}</strong>
                    <p>
                      SKU: {product.sku}
                      {product.supplier?.name ? ` • Supplier: ${product.supplier.name}` : ""}
                    </p>
                  </div>
                  <span className="pill pill--danger">
                    {product.stock} left / alert at {product.lowStockThreshold}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Recent Activity"
          subtitle="Latest purchases, sales, and stock updates."
        >
          {recentMovements.length === 0 ? (
            <p className="empty-state">No stock movements recorded yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Stock After</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMovements.map((movement) => (
                    <tr key={movement._id}>
                      <td>{formatDateTime(movement.date)}</td>
                      <td>{movement.product?.name || "Deleted product"}</td>
                      <td>{formatMovementType(movement.type)}</td>
                      <td>{movement.quantity}</td>
                      <td>{movement.stockAfter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <div className="two-column-grid">
        <Panel
          title={`Fast-Moving Products (${analytics.days} days)`}
          subtitle="Top products by quantity sold."
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Sold</th>
                  <th>Sales Value</th>
                  <th>Current Stock</th>
                </tr>
              </thead>
              <tbody>
                {analytics.fastMovingProducts.map((product) => (
                  <tr key={product.productId}>
                    <td>
                      {product.name}
                      <span className="table-subtext">{product.sku}</span>
                    </td>
                    <td>{product.totalSold}</td>
                    <td>{formatCurrency(product.totalSalesAmount)}</td>
                    <td>{product.currentStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title={`Low-Selling Products (${analytics.days} days)`}
          subtitle="Products with the fewest recorded sales."
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Sold</th>
                  <th>Sales Value</th>
                  <th>Current Stock</th>
                </tr>
              </thead>
              <tbody>
                {analytics.lowSellingProducts.map((product) => (
                  <tr key={product.productId}>
                    <td>
                      {product.name}
                      <span className="table-subtext">{product.sku}</span>
                    </td>
                    <td>{product.totalSold}</td>
                    <td>{formatCurrency(product.totalSalesAmount)}</td>
                    <td>{product.currentStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export default DashboardSection;

