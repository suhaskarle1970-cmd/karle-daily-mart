import { useEffect, useState } from "react";
import api from "../../services/api";
import "./admin.css";

const EMPTY_FORM = { heading: "", description: "", ctaText: "Shop Now", ctaLink: "/products", active: true, order: 0 };

export default function AdminSliders() {
  const [sliders, setSliders] = useState([]);
  const [status, setStatus] = useState("loading");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setStatus("loading");
    api
      .get("/sliders", { params: { includeInactive: true } })
      .then(({ data }) => {
        setSliders(data.sliders);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setError("");
    setModal({ mode: "create" });
  }

  function openEdit(s) {
    setForm({ heading: s.heading, description: s.description || "", ctaText: s.ctaText, ctaLink: s.ctaLink, active: s.active, order: s.order });
    setImageFile(null);
    setError("");
    setModal({ mode: "edit", data: s });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (modal.mode === "create" && !imageFile) {
      setError("Banner image is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append("image", imageFile);

      if (modal.mode === "create") {
        await api.post("/sliders", fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.put(`/sliders/${modal.data._id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save slide.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(s) {
    if (!window.confirm(`Delete slide "${s.heading}"?`)) return;
    try {
      await api.delete(`/sliders/${s._id}`);
      load();
    } catch (err) {
      alert("Could not delete slide.");
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>Hero Slider</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add slide</button>
      </div>

      <div className="admin-card">
        {status === "loading" && <p>Loading…</p>}
        {status === "error" && <p className="field-error">Couldn't load slides.</p>}
        {status === "ready" && (
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Heading</th>
                <th>Order</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sliders.map((s) => (
                <tr key={s._id}>
                  <td><img className="thumb" src={s.imageUrl} alt="" /></td>
                  <td>{s.heading}</td>
                  <td>{s.order}</td>
                  <td>
                    <span className={`badge ${s.active ? "badge-active" : "badge-inactive"}`}>
                      {s.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button className="icon-btn" onClick={() => openEdit(s)}>Edit</button>
                    <button className="icon-btn danger" onClick={() => handleDelete(s)}>Delete</button>
                  </td>
                </tr>
              ))}
              {sliders.length === 0 && <tr><td colSpan={5}>No slides yet.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <h2>{modal.mode === "create" ? "Add slide" : "Edit slide"}</h2>
            <div className="form-grid">
              <label>
                Heading
                <input value={form.heading} onChange={(e) => setForm({ ...form, heading: e.target.value })} required />
              </label>
              <label>
                Description
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>
              <label>
                CTA text
                <input value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} />
              </label>
              <label>
                CTA link
                <input value={form.ctaLink} onChange={(e) => setForm({ ...form, ctaLink: e.target.value })} placeholder="/products" />
              </label>
              <label>
                Display order
                <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
              </label>
              <label>
                Banner image {modal.mode === "edit" && "(leave blank to keep current)"}
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
