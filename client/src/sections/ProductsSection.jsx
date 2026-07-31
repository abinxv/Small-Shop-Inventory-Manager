import { useDeferredValue, useEffect, useState } from "react";
import Panel from "../components/Panel";
import { formatCurrency } from "../utils";

const initialForm = {
  name: "",
  sku: "",
  category: "",
  supplier: "",
  description: "",
  costPrice: "",
  sellingPrice: "",
  lowStockThreshold: 5
};

function ProductsSection({
  products,
  suppliers,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct
}) {
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    if (!editingId) {
      setForm(initialForm);
      return;
    }

    const product = products.find((item) => item._id === editingId);
    if (!product) {
      return;
    }

    setForm({
      name: product.name || "",
      sku: product.sku || "",
      category: product.category || "",
      supplier: product.supplier?._id || "",
      description: product.description || "",
      costPrice: product.costPrice ?? "",
      sellingPrice: product.sellingPrice ?? "",
      lowStockThreshold: product.lowStockThreshold ?? 5
    });
  }, [editingId, products]);

  const filteredProducts = products.filter((product) => {
    const term = deferredSearchTerm.trim().toLowerCase();

    if (!term) {
      return true;
    }

    return [product.name, product.sku, product.category, product.supplier?.name]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(term));
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const resetForm = () => {
    setEditingId("");
    setForm(initialForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingId) {
        await onUpdateProduct(editingId, form);
      } else {
        await onCreateProduct(form);
      }

      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (productId) => {
    const confirmed = window.confirm(
      "Delete this product? Products with stock history cannot be deleted."
    );

    if (!confirmed) {
      return;
    }

    await onDeleteProduct(productId);

    if (editingId === productId) {
      resetForm();
    }
  };

  return (
    <div className="section-grid">
      <Panel
        title={editingId ? "Edit Product" : "Add Product"}
        subtitle="Stock is adjusted from the stock movement section so history stays accurate."
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Product Name
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Rice Bag 5kg"
              required
            />
          </label>
          <label>
            SKU (Stock Keeping Unit)
            <input
              name="sku"
              value={form.sku}
              onChange={handleChange}
              placeholder="RICE-5KG"
              required
            />
          </label>
          <label>
            Category
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Groceries"
            />
          </label>
          <label>
            Supplier (add supplier in supplier section if none available)
            <select name="supplier" value={form.supplier} onChange={handleChange}>
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier._id} value={supplier._id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cost Price (₹)
            <input
              type="number"
              step="0.01"
              min="0"
              name="costPrice"
              value={form.costPrice}
              onChange={handleChange}
              placeholder="0.00"
            />
          </label>
          <label>
            Selling Price (₹)
            <input
              type="number"
              step="0.01"
              min="0"
              name="sellingPrice"
              value={form.sellingPrice}
              onChange={handleChange}
              placeholder="0.00"
            />
          </label>
          <label>
            Low-Stock Threshold
            <input
              type="number"
              min="0"
              name="lowStockThreshold"
              value={form.lowStockThreshold}
              onChange={handleChange}
            />
          </label>
          <label className="form-grid__span-2">
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional product notes"
              rows="3"
            />
          </label>
          <div className="form-actions form-grid__span-2">
            <button type="submit" className="button button--primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : editingId
                  ? "Update Product"
                  : "Add Product"}
            </button>
            <button type="button" className="button button--ghost" onClick={resetForm}>
              Clear
            </button>
          </div>
        </form>
      </Panel>

      <Panel
        title="Product List"
        subtitle="Search, edit, and review stock status across the store."
        actions={
          <input
            className="search-input"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name, SKU, category..."
          />
        }
      >
        {filteredProducts.length === 0 ? (
          <p className="empty-state">No products found.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Supplier</th>
                  <th>Stock</th>
                  <th>Cost</th>
                  <th>Selling</th>
                  <th>Threshold</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isLowStock =
                    product.lowStockThreshold > 0 && product.stock <= product.lowStockThreshold;

                  return (
                    <tr key={product._id}>
                      <td>
                        {product.name}
                        <span className="table-subtext">
                          {product.sku}
                          {product.category ? ` • ${product.category}` : ""}
                        </span>
                      </td>
                      <td>{product.supplier?.name || "Unassigned"}</td>
                      <td>
                        <span className={`pill ${isLowStock ? "pill--danger" : "pill--success"}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td>{formatCurrency(product.costPrice)}</td>
                      <td>{formatCurrency(product.sellingPrice)}</td>
                      <td>{product.lowStockThreshold}</td>
                      <td>
                        <div className="inline-actions">
                          <button
                            type="button"
                            className="button button--small"
                            onClick={() => setEditingId(product._id)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="button button--small button--danger"
                            onClick={() => handleDelete(product._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

export default ProductsSection;

