import { useEffect, useState } from "react";
import api from "../../services/api";
import { formatCurrency } from "../../utils/format";
import "./admin.css";

const EMPTY_FORM = { name: "", price: "", category: "", description: "", barcode: "", active: true };
const UNITS = ["g", "kg", "ml", "l", "pcs"];

function VariantEditor({ variants, onChange }) {
  function updateRow(i, field, value) {
    const next = variants.map((v, idx) => (idx === i ? { ...v, [field]: value } : v));
    onChange(next);
  }
  function addRow() {
    onChange([...variants, { unit: "g", amount: "", price: "" }]);
  }
  function removeRow(i) {
    onChange(variants.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      {variants.length === 0 && (
        <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginBottom: 8 }}>
          No sizes added — product will sell at the single price above.
        </p>
      )}
      {variants.map((v, i) => (
        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
          <input
            type="number"
            min="0"
            step="any"
            placeholder="Amount"
            value={v.amount}
            onChange={(e) => updateRow(i, "amount", e.target.value)}
            style={{ width: 80, padding: "8px 10px", border: "1.5px solid var(--color-border)", borderRadius: 6 }}
          />
          <select
            value={v.unit}
            onChange={(e) => updateRow(i, "unit", e.target.value)}
            style={{ padding: "8px 10px", border: "1.5px solid var(--color-border)", borderRadius: 6 }}
          >
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Price ₹"
            value={v.price}
            onChange={(e) => updateRow(i, "price", e.target.value)}
            style={{ width: 90, padding: "8px 10px", border: "1.5px solid var(--color-border)", borderRadius: 6 }}
          />
          <button type="button" className="icon-btn danger" onClick={() => removeRow(i)}>Remove</button>
        </div>
      ))}
      <button type="button" className="btn btn-outline" onClick={addRow} style={{ padding: "6px 14px", fontSize: 13 }}>
        + Add size
      </button>
    </div>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [status, setStatus] = useState("loading");

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [variants, setVariants] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/categories", { params: { includeInactive: true } }).then(({ data }) => setCategories(data.categories));
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, categoryFilter]);

  function load() {
    setStatus("loading");
    api
      .get("/products", {
        params: {
          page,
          limit: 20,
          includeInactive: true,
          search: search || undefined,
          category: categoryFilter || undefined,
        },
      })
      .then(({ data }) => {
        setProducts(data.products);
        setPagination(data.pagination);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setVariants([]);
    setImageFile(null);
    setError("");
    setModal({ mode: "create" });
  }

  function openEdit(p) {
    setForm({
      name: p.name,
      price: p.price,
      category: p.category?._id || "",
      description: p.description || "",
      barcode: p.barcode || "",
      active: p.active,
    });
    setVariants((p.variants || []).map((v) => ({ ...v })));
    setImageFile(null);
    setError("");
    setModal({ mode: "edit", data: p });
  }

  function validateVariants() {
    for (const v of variants) {
      if (!v.amount || Number(v.amount) <= 0) return "Every size needs a positive amount.";
      if (v.price === "" || Number(v.price) < 0) return "Every size needs a valid price.";
    }
    return null;
  }

  async function handleSave(e) {
    e.preventDefault();
    const variantError = validateVariants();
    if (variantError) {
      setError(variantError);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("variants", JSON.stringify(variants.map((v) => ({ unit: v.unit, amount: Number(v.amount), price: Number(v.price) }))));
      if (imageFile) fd.append("image", imageFile);

      if (modal.mode === "create") {
        await api.post("/products", fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.put(`/products/${modal.data._id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p) {
    if (!window.confirm(`Delete "${p.name}"? This also removes its image from Cloudinary.`)) return;
    try {
      await api.delete(`/products/${p._id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete product.");
    }
  }

  async function toggleActive(p) {
    try {
      const fd = new FormData();
      fd.append("active", String(!p.active));
      await api.put(`/products/${p._id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      load();
    } catch (err) {
      alert("Could not update status.");
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>Products</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add product</button>
      </div>

      <div className="admin-toolbar">
        <input
          placeholder="Search products…"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
        />
        <select value={categoryFilter} onChange={(e) => { setPage(1); setCategoryFilter(e.target.value); }}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="admin-card">
        {status === "loading" && <p>Loading…</p>}
        {status === "error" && <p className="field-error">Couldn't load products.</p>}
        {status === "ready" && (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Sizes</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>{p.imageUrl ? <img className="thumb" src={p.imageUrl} alt="" /> : null}</td>
                    <td>{p.name}</td>
                    <td>{p.category?.name || "—"}</td>
                    <td>{formatCurrency(p.price)}</td>
                    <td>{p.variants?.length ? `${p.variants.length} sizes` : "—"}</td>
                    <td>
                      <button className={`badge ${p.active ? "badge-active" : "badge-inactive"}`} style={{ border: "none" }} onClick={() => toggleActive(p)}>
                        {p.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td>
                      <button className="icon-btn" onClick={() => openEdit(p)}>Edit</button>
                      <button className="icon-btn danger" onClick={() => handleDelete(p)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={7}>No products found.</td></tr>
                )}
              </tbody>
            </table>

            {pagination && pagination.totalPages > 1 && (
              <div className="pagination">
                <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <span>Page {pagination.page} of {pagination.totalPages}</span>
                <button className="btn btn-outline" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <h2>{modal.mode === "create" ? "Add product" : "Edit product"}</h2>
            <div className="form-grid">
              <label>
                Name
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </label>
              <label>
                Price (₹) {variants.length > 0 && <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>— used if no size is selected</span>}
                <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </label>
              <label>
                Category
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Barcode
                <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="For billing software reference" />
              </label>
              <label>
                Description
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>
              <label>
                Sizes / quantities (optional)
                <VariantEditor variants={variants} onChange={setVariants} />
              </label>
              <label>
                Product image
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
              </label>
              <label className="form-grid-check">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                Active
              </label>
              {error && <p className="field-error">{error}</p>}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
