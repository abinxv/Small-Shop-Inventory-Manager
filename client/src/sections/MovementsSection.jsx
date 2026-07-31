import { useState } from "react";
import Panel from "../components/Panel";
import {
  formatCurrency,
  formatDateTime,
  formatMovementType,
  getTodayDate
} from "../utils";

const initialForm = {
  product: "",
  type: "purchase",
  quantity: 1,
  unitPrice: "",
  supplier: "",
  note: "",
  date: getTodayDate()
};

function MovementsSection({ products, suppliers, movements, onCreateMovement }) {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProduct = products.find((product) => product._id === form.product);
  const isOutgoing = form.type === "sale" || form.type === "adjustment_out";
  const quantityExceedsStock =
    isOutgoing && selectedProduct && Number(form.quantity) > selectedProduct.stock;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => {
      const nextForm = { ...currentForm, [name]: value };

      if (name === "product" || name === "type") {
        const nextProduct = products.find(
          (product) => product._id === (name === "product" ? value : currentForm.product)
        );
        const nextType = name === "type" ? value : currentForm.type;

        if (nextProduct) {
          nextForm.unitPrice =
            nextType === "sale" ? nextProduct.sellingPrice : nextProduct.costPrice;
          if (nextType !== "purchase") {
            nextForm.supplier = "";
          }
        }
      }

      return nextForm;
    });
  };

  const resetForm = () => {
    setForm(initialForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (quantityExceedsStock) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreateMovement(form);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="section-grid">
      <Panel
        title="Record Stock Movement"
        subtitle="Use purchases, sales, and manual adjustments to change stock. Stock can never go below zero."
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Product
            <select name="product" value={form.product} onChange={handleChange} required>
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </label>
          <label>
            Movement Type
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="purchase">Purchase</option>
              <option value="sale">Sale</option>
              <option value="adjustment_in">Adjustment In</option>
              <option value="adjustment_out">Adjustment Out</option>
            </select>
          </label>
          <label>
            Quantity
            <input
              type="number"
              min="1"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Unit Price
            <input
              type="number"
              step="0.01"
              min="0"
              name="unitPrice"
              value={form.unitPrice}
              onChange={handleChange}
              placeholder="0.00"
            />
          </label>
          {form.type === "purchase" ? (
            <label>
              Supplier
              <select name="supplier" value={form.supplier} onChange={handleChange}>
                <option value="">Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="stock-note">
              <strong>Current Stock</strong>
              <span>{selectedProduct ? selectedProduct.stock : "-"}</span>
            </div>
          )}
          <label>
            Movement Date
            <input type="date" name="date" value={form.date} onChange={handleChange} required />
          </label>
          <label className="form-grid__span-2">
            Note
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              rows="3"
              placeholder="Optional purchase/sale note"
            />
          </label>

          {quantityExceedsStock ? (
            <p className="form-warning form-grid__span-2">
              This quantity is higher than current stock. The backend will reject it to prevent
              negative inventory.
            </p>
          ) : null}

          <div className="form-actions form-grid__span-2">
            <button
              type="submit"
              className="button button--primary"
              disabled={isSubmitting || quantityExceedsStock}
            >
              {isSubmitting ? "Saving..." : "Record Movement"}
            </button>
            <button type="button" className="button button--ghost" onClick={resetForm}>
              Clear
            </button>
          </div>
        </form>
      </Panel>

      <Panel
        title="Recent Stock History"
        subtitle="A running trail of purchases, sales, and manual corrections."
      >
        {movements.length === 0 ? (
          <p className="empty-state">No stock movement history yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>Stock Before</th>
                  <th>Stock After</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement._id}>
                    <td>{formatDateTime(movement.date)}</td>
                    <td>
                      {movement.product?.name || "Deleted product"}
                      <span className="table-subtext">
                        {movement.supplier?.name || movement.note || "No extra details"}
                      </span>
                    </td>
                    <td>{formatMovementType(movement.type)}</td>
                    <td>{movement.quantity}</td>
                    <td>{formatCurrency(movement.unitPrice)}</td>
                    <td>{formatCurrency(movement.totalAmount)}</td>
                    <td>{movement.stockBefore}</td>
                    <td>{movement.stockAfter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

export default MovementsSection;

