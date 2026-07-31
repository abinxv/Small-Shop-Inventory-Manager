import { startTransition, useEffect, useState } from "react";
import { inventoryApi } from "./api";
import DashboardSection from "./sections/DashboardSection";
import MovementsSection from "./sections/MovementsSection";
import ProductsSection from "./sections/ProductsSection";
import ReportsSection from "./sections/ReportsSection";
import SuppliersSection from "./sections/SuppliersSection";

const sections = [
  { id: "dashboard", label: "Dashboard" },
  { id: "products", label: "Products" },
  { id: "suppliers", label: "Suppliers" },
  { id: "stock", label: "Stock Movements" },
  { id: "reports", label: "Reports" }
];

function App() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState(null);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [movements, setMovements] = useState([]);
  const [reportsRefreshKey, setReportsRefreshKey] = useState(0);
  const [pageMessage, setPageMessage] = useState("");
  const [pageMessageTone, setPageMessageTone] = useState("success");
  const [isLoading, setIsLoading] = useState(true);

  const loadCoreData = async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const [dashboard, productList, supplierList, movementList] = await Promise.all([
        inventoryApi.getDashboard(),
        inventoryApi.getProducts(),
        inventoryApi.getSuppliers(),
        inventoryApi.getStockMovements("?limit=12")
      ]);

      setDashboardData(dashboard);
      setProducts(productList);
      setSuppliers(supplierList);
      setMovements(movementList);
    } catch (error) {
      setPageMessage(error.message);
      setPageMessageTone("danger");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoreData();
  }, []);

  useEffect(() => {
    if (!pageMessage) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setPageMessage("");
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [pageMessage]);

  const runAction = async (action, successMessage) => {
    try {
      const result = await action();
      await loadCoreData({ silent: true });
      setReportsRefreshKey((currentKey) => currentKey + 1);
      setPageMessage(successMessage);
      setPageMessageTone("success");
      return result;
    } catch (error) {
      setPageMessage(error.message);
      setPageMessageTone("danger");
      throw error;
    }
  };

  if (isLoading && !dashboardData) {
    return <div className="loading-screen">Loading inventory manager...</div>;
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__content">
          <p className="eyebrow">Small Shop Inventory Manager</p>
          <h1>Simple retail inventory control with products, suppliers, stock, sales, and reports.</h1>
          <p className="hero__copy">
            Built with the MERN stack. Stock changes are tracked through
            purchases, sales, and adjustments, and the backend prevents negative stock at all
            times.
          </p>
        </div>
        <div className="hero__badge">
          <span>Key Rule</span>
          <strong>Stock can never be negative</strong>
        </div>
      </header>

      <nav className="tabs">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`tab ${activeSection === section.id ? "tab--active" : ""}`}
            onClick={() =>
              startTransition(() => {
                setActiveSection(section.id);
              })
            }
          >
            {section.label}
          </button>
        ))}
      </nav>

      {pageMessage ? (
        <div className={`feedback feedback--${pageMessageTone}`}>{pageMessage}</div>
      ) : null}

      <main className="page-content">
        {activeSection === "dashboard" ? <DashboardSection dashboardData={dashboardData} /> : null}

        {activeSection === "products" ? (
          <ProductsSection
            products={products}
            suppliers={suppliers}
            onCreateProduct={(payload) =>
              runAction(() => inventoryApi.createProduct(payload), "Product saved successfully.")
            }
            onUpdateProduct={(id, payload) =>
              runAction(() => inventoryApi.updateProduct(id, payload), "Product updated.")
            }
            onDeleteProduct={(id) =>
              runAction(() => inventoryApi.deleteProduct(id), "Product deleted.")
            }
          />
        ) : null}

        {activeSection === "suppliers" ? (
          <SuppliersSection
            suppliers={suppliers}
            onCreateSupplier={(payload) =>
              runAction(() => inventoryApi.createSupplier(payload), "Supplier saved successfully.")
            }
            onUpdateSupplier={(id, payload) =>
              runAction(() => inventoryApi.updateSupplier(id, payload), "Supplier updated.")
            }
            onDeleteSupplier={(id) =>
              runAction(() => inventoryApi.deleteSupplier(id), "Supplier deleted.")
            }
          />
        ) : null}

        {activeSection === "stock" ? (
          <MovementsSection
            products={products}
            suppliers={suppliers}
            movements={movements}
            onCreateMovement={(payload) =>
              runAction(
                () => inventoryApi.createStockMovement(payload),
                "Stock movement recorded successfully."
              )
            }
          />
        ) : null}

        {activeSection === "reports" ? (
          <ReportsSection refreshKey={reportsRefreshKey} />
        ) : null}
      </main>
    </div>
  );
}

export default App;
