import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import { useDepartments } from "../../hooks/useDepartments";
import "./admin.css";

const INITIAL_FORM = {
  name: "",
  department: "",
  active: true,
};

export default function AdminCategories() {
  const { departments = [] } = useDepartments();

  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading");

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  /*
   * ============================================================
   * LOAD CATEGORIES
   * ============================================================
   */

  const loadCategories = useCallback(async () => {
    setStatus("loading");

    try {
      const { data } = await api.get("/categories", {
        params: {
          includeInactive: true,
        },
      });

      setCategories(
        Array.isArray(data?.categories)
          ? data.categories
          : [],
      );

      setStatus("ready");
    } catch (err) {
      console.error("Failed to load categories:", err);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  /*
   * ============================================================
   * DEPARTMENT LOOKUP
   * ============================================================
   */

  const departmentLabels = departments.reduce(
    (map, department) => {
      map[department.id] = department.label;
      return map;
    },
    {},
  );

  /*
   * ============================================================
   * MODAL HELPERS
   * ============================================================
   */

  function closeModal() {
    if (saving) return;

    setModal(null);
    setError("");
  }

  function openCreate() {
    setForm({
      ...INITIAL_FORM,
    });

    setError("");

    setModal({
      mode: "create",
    });
  }

  function openEdit(category) {
    setForm({
      name: category.name || "",
      department: category.department || "",
      active: Boolean(category.active),
    });

    setError("");

    setModal({
      mode: "edit",
      data: category,
    });
  }

  /*
   * ============================================================
   * FORM HANDLING
   * ============================================================
   */

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /*
   * ============================================================
   * SAVE CATEGORY
   * ============================================================
   */

  async function handleSave(event) {
    event.preventDefault();

    const trimmedName = form.name.trim();

    if (!trimmedName) {
      setError("Category name is required.");
      return;
    }

    if (!form.department) {
      setError("Please select a department.");
      return;
    }

    if (saving || !modal) {
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      name: trimmedName,
      active: form.active,
      department: form.department,
    };

    try {
      if (modal.mode === "create") {
        await api.post("/categories", payload);
      } else {
        await api.put(
          `/categories/${modal.data._id}`,
          payload,
        );
      }

      setModal(null);
      setForm({ ...INITIAL_FORM });

      await loadCategories();
    } catch (err) {
      console.error("Failed to save category:", err);

      setError(
        err.response?.data?.message ||
          "Could not save category.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ============================================================
   * DELETE CATEGORY
   * ============================================================
   */

  async function handleDelete(category) {
    const confirmed = window.confirm(
      `Delete category "${category.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/categories/${category._id}`);

      await loadCategories();
    } catch (err) {
      console.error("Failed to delete category:", err);

      window.alert(
        err.response?.data?.message ||
          "Could not delete category.",
      );
    }
  }

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div>
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="admin-page-header">
        <h1>Categories</h1>

        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreate}
          disabled={saving}
        >
          + Add category
        </button>
      </div>

      {/* ======================================================
          DESCRIPTION
      ====================================================== */}

      <p
        style={{
          marginTop: -14,
          marginBottom: 18,
          fontSize: 13.5,
          color: "var(--color-text-muted)",
        }}
      >
        Assign each category to a department (e.g. "Cooking Oil" → Grocery &
        Kitchen) so it appears in the right homepage section. Categories with no
        department won't show on the homepage, but still work as a filter on the
        Products page.
      </p>

      {/* ======================================================
          CATEGORY TABLE
      ====================================================== */}

      <div className="admin-card">
        {status === "loading" && <p>Loading…</p>}

        {status === "error" && (
          <div>
            <p className="field-error">Couldn't load categories.</p>

            <button
              type="button"
              className="btn btn-outline"
              onClick={loadCategories}
            >
              Retry
            </button>
          </div>
        )}

        {status === "ready" && (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Department</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>

              <tbody>
                {categories.map((category) => (
                  <tr key={category._id}>
                    {/* NAME */}

                    <td>{category.name}</td>

                    {/* DEPARTMENT */}

                    <td>
                      {category.department ? (
                        departmentLabels[category.department] || "Unknown"
                      ) : (
                        <span
                          style={{
                            color: "var(--color-text-muted)",
                          }}
                        >
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* STATUS */}

                    <td>
                      <span
                        className={`badge ${
                          category.active ? "badge-active" : "badge-inactive"
                        }`}
                      >
                        {category.active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* ACTIONS */}

                    <td>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => openEdit(category)}
                        disabled={saving}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => handleDelete(category)}
                        disabled={saving}
                      >
                        Delete
                      </button>
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
          </div>
        )}
      </div>

      {/* ======================================================
          CREATE / EDIT MODAL
      ====================================================== */}

      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <form
            className="modal-card"
            onSubmit={handleSave}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2>
              {modal.mode === "create" ? "Add category" : "Edit category"}
            </h2>

            <div className="form-grid">
              {/* CATEGORY NAME */}

              <label>
                Name
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  required
                  autoFocus
                  maxLength={100}
                  placeholder="e.g. Cooking Oil"
                  disabled={saving}
                />
              </label>

              {/* DEPARTMENT */}

              <label>
                Department
                <select
                  value={form.department}
                  onChange={(event) =>
                    updateForm("department", event.target.value)
                  }
                  disabled={saving}
                  required
                >
                  <option value="" disabled>
                    Select department
                  </option>

                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* ACTIVE */}

              <label className="form-grid-check">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    updateForm("active", event.target.checked)
                  }
                  disabled={saving}
                />
                Active
              </label>

              {/* ERROR */}

              {error && (
                <p className="field-error" role="alert">
                  {error}
                </p>
              )}
            </div>

            {/* ==================================================
                MODAL ACTIONS
            ================================================== */}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || !form.name.trim()}
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