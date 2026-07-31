import { useEffect, useState } from "react";
import Panel from "../components/Panel";

const initialForm = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  notes: ""
};

function SuppliersSection({
  suppliers,
  onCreateSupplier,
  onUpdateSupplier,
  onDeleteSupplier
}) {
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!editingId) {
      setForm(initialForm);
      return;
    }

    const supplier = suppliers.find((item) => item._id === editingId);
    if (!supplier) {
      return;
    }

    setForm({
      name: supplier.name || "",
      contactPerson: supplier.contactPerson || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      notes: supplier.notes || ""
    });
  }, [editingId, suppliers]);

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
        await onUpdateSupplier(editingId, form);
      } else {
        await onCreateSupplier(form);
      }

      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (supplierId) => {
    const confirmed = window.confirm(
      "Delete this supplier? Linked supplier history prevents deletion."
    );

    if (!confirmed) {
      return;
    }

    await onDeleteSupplier(supplierId);

    if (editingId === supplierId) {
      resetForm();
    }
  };

  return (
    <div className="section-grid">
      <Panel
        title={editingId ? "Edit Supplier" : "Add Supplier"}
        subtitle="Keep vendor details available while recording purchases."
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Supplier Name
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="ABC Wholesalers"
              required
            />
          </label>
          <label>
            Contact Person
            <input
              name="contactPerson"
              value={form.contactPerson}
              onChange={handleChange}
              placeholder="Ravi Kumar"
            />
          </label>
          <label>
            Phone
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="supplier@example.com"
            />
          </label>
          <label className="form-grid__span-2">
            Address
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows="2"
              placeholder="Supplier address"
            />
          </label>
          <label className="form-grid__span-2">
            Notes
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Credit terms, delivery notes, or other details"
            />
          </label>
          <div className="form-actions form-grid__span-2">
            <button type="submit" className="button button--primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : editingId
                  ? "Update Supplier"
                  : "Add Supplier"}
            </button>
            <button type="button" className="button button--ghost" onClick={resetForm}>
              Clear
            </button>
          </div>
        </form>
      </Panel>

      <Panel
        title="Supplier Directory"
        subtitle="All saved suppliers for purchase tracking and product mapping."
      >
        {suppliers.length === 0 ? (
          <p className="empty-state">No suppliers added yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Contact</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier._id}>
                    <td>
                      {supplier.name}
                      <span className="table-subtext">
                        {supplier.address || "No address saved"}
                      </span>
                    </td>
                    <td>{supplier.contactPerson || "-"}</td>
                    <td>{supplier.phone || "-"}</td>
                    <td>{supplier.email || "-"}</td>
                    <td>
                      <div className="inline-actions">
                        <button
                          type="button"
                          className="button button--small"
                          onClick={() => setEditingId(supplier._id)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="button button--small button--danger"
                          onClick={() => handleDelete(supplier._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
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

export default SuppliersSection;

