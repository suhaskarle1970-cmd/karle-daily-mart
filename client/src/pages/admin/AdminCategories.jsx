import { useEffect, useState } from "react";
import api from "../../services/api";
import { useDepartments } from "../../hooks/useDepartments";
import "./admin.css";

export default function AdminCategories() {
  const { departments } = useDepartments();
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading");
  const [modal, setModal] = useState(null);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setStatus("loading");
    api
      .get("/categories", { params: { includeInactive: true } })
      .then(({ data }) => {
        setCategories(data.categories);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }

  function departmentLabel(id) {
    return departments.find((d) => d.id === id)?.label || "—";
  }

  function openCreate() {
    setName("");
    setDepartment("");
    setActive(true);
    setError("");
    setModal({ mode: "create" });
  }

  function openEdit(cat) {
    setName(cat.name);
    setDepartment(cat.department || "");
    setActive(cat.active);
    setError("");
    setModal({ mode: "edit", data: cat });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (modal.mode === "create") {
        await api.post("/categories", { name, active, department: department || null });
      } else {
        await api.put(`/categories/${modal.data._id}`, { name, active, department: department || null });
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save category.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat) {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await api.delete(`/categories/${cat._id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete category.");
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>Categories</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add category</button>
      </div>

      <p style={{ marginTop: -14, marginBottom: 18, fontSize: 13.5, color: "var(--color-text-muted)" }}>
        Assign each category to a department (e.g. "Cooking Oil" → Grocery & Kitchen) so it appears in the right
        homepage section. Categories with no department won't show on the homepage, but still work as a filter on
        the Products page.
      </p>

      <div className="admin-card">
        {status === "loading" && <p>Loading…</p>}
        {status === "error" && <p className="field-error">Couldn't load categories.</p>}
        {status === "ready" && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td>{c.department ? departmentLabel(c.department) : <span style={{ color: "var(--color-text-muted)" }}>Unassigned</span>}</td>
                  <td>
                    <span className={`badge ${c.active ? "badge-active" : "badge-inactive"}`}>
                      {c.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button className="icon-btn" onClick={() => openEdit(c)}>Edit</button>
                    <button className="icon-btn danger" onClick={() => handleDelete(c)}>Delete</button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4}>No categories yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <h2>{modal.mode === "create" ? "Add category" : "Edit category"}</h2>
            <div className="form-grid">
              <label>
                Name
                <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Cooking Oil" />
              </label>
              <label>
                Department
                <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="">Unassigned</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </label>
              <label className="form-grid-check">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                Active
              </label>
              {error && <p className="field-error">{error}</p>}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
