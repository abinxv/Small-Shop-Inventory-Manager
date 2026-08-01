const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || "Request failed.");
  }

  return data;
};

export const inventoryApi = {
  getDashboard: () => request("/reports/dashboard"),
  getProducts: () => request("/products"),
  createProduct: (payload) =>
    request("/products", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateProduct: (id, payload) =>
    request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteProduct: (id) =>
    request(`/products/${id}`, {
      method: "DELETE"
    }),
  getSuppliers: () => request("/suppliers"),
  createSupplier: (payload) =>
    request("/suppliers", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateSupplier: (id, payload) =>
    request(`/suppliers/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteSupplier: (id) =>
    request(`/suppliers/${id}`, {
      method: "DELETE"
    }),
  getStockMovements: (query = "") => request(`/stock-movements${query}`),
  createStockMovement: (payload) =>
    request("/stock-movements", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getInventoryReport: () => request("/reports/inventory"),
  getSalesReport: (query = "") => request(`/reports/sales${query}`),
  getPurchaseReport: (query = "") => request(`/reports/purchases${query}`),
  getLowStockReport: () => request("/reports/low-stock"),
  getAnalyticsReport: (query = "") => request(`/reports/analytics${query}`)
};
