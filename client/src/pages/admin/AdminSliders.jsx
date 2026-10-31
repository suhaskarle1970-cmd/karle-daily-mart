import { useEffect, useState } from "react";
import api from "../../services/api";
import "./admin.css";

const EMPTY_FORM = {
  heading: "",
  description: "",
  ctaText: "Shop Now",
  ctaLink: "/products",
  active: true,
  order: 0,
};

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
    setForm({
      heading: s.heading,
      description: s.description || "",
      ctaText: s.ctaText,
      ctaLink: s.ctaLink,
      active: s.active,
      order: s.order,
    });
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
        await api.post("/sliders", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.put(`/sliders/${modal.data._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
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
    <div className="admin-page-container">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="admin-page-header">
        <h1>Hero Slider</h1>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Add slide
        </button>
      </div>

      {/* =====================================================
          SLIDERS TABLE
      ===================================================== */}

      <div className="admin-card">
        {status === "loading" && (
          <div className="admin-state-box">
            <p>Loading…</p>
          </div>
        )}

        {status === "error" && (
          <div className="admin-state-box">
            <p className="field-error">Couldn&apos;t load slides.</p>
          </div>
        )}

        {status === "ready" && (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Banner</th>
                  <th scope="col">Heading</th>
                  <th scope="col">Order</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sliders.map((s) => (
                  <tr key={s._id}>
                    <td>
                      {s.imageUrl ? (
                        <img
                          className="thumb thumb-banner"
                          src={s.imageUrl}
                          alt={s.heading || "Slide banner"}
                          loading="lazy"
                        />
                      ) : (
                        <span className="thumb-placeholder">—</span>
                      )}
                    </td>

                    <td className="admin-cell-name">{s.heading || "—"}</td>

                    <td>{s.order}</td>

                    <td>
                      <span
                        className={`badge ${
                          s.active ? "badge-active" : "badge-inactive"
                        }`}
                      >
                        {s.active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => openEdit(s)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => handleDelete(s)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {sliders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="admin-empty-cell">
                      No slides yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================
          CREATE / EDIT MODAL
      ===================================================== */}

      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) {
              setModal(null);
            }
          }}
        >
          <form
            className="modal-card"
            onMouseDown={(e) => e.stopPropagation()}
            onSubmit={handleSave}
          >
            <div className="modal-card-header">
              <h2>{modal.mode === "create" ? "Add slide" : "Edit slide"}</h2>
              <button
                type="button"
                className="camera-close-btn modal-close-btn"
                onClick={() => !saving && setModal(null)}
                disabled={saving}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className="form-grid">
              <label>
                <span>Heading</span>
                <input
                  value={form.heading}
                  onChange={(e) =>
                    setForm({ ...form, heading: e.target.value })
                  }
                  placeholder="e.g. Fresh Groceries Delivered Fast"
                />
              </label>

              <label className="form-full">
                <span>Description</span>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Optional subtitle shown on the banner"
                />
              </label>

              <div className="form-row">
                <label>
                  <span>CTA text</span>
                  <input
                    value={form.ctaText}
                    onChange={(e) =>
                      setForm({ ...form, ctaText: e.target.value })
                    }
                    placeholder="Shop Now"
                  />
                </label>

                <label>
                  <span>CTA link</span>
                  <input
                    value={form.ctaLink}
                    onChange={(e) =>
                      setForm({ ...form, ctaLink: e.target.value })
                    }
                    placeholder="/products"
                  />
                </label>
              </div>

              <label>
                <span>Display order</span>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                />
              </label>

              <label className="form-full">
                <span className="form-label-inline">
                  Banner image{" "}
                  {modal.mode === "edit" && (
                    <span className="form-help-inline">
                      — leave blank to keep current
                    </span>
                  )}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                />
              </label>

              <div className="form-checks-row form-full">
                <label className="form-grid-check">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) =>
                      setForm({ ...form, active: e.target.checked })
                    }
                  />
                  <span>Active</span>
                </label>
              </div>

              {error && (
                <p className="field-error form-full" role="alert">
                  {error}
                </p>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setModal(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
