import { useState } from "react";
import api from "../../services/api";
import "./admin.css";

export default function AdminImport() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/products/import", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Import failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>Bulk Product Import</h1>
      </div>

      <div className="admin-card">
        <p style={{ marginBottom: 16, color: "var(--color-text-muted)", fontSize: 14 }}>
          Upload a CSV exported from your billing software. Required columns: <code>name</code>, <code>price</code>,{" "}
          <code>category</code>. Optional: <code>barcode</code>, <code>description</code>. Products matched by barcode are
          updated; everything else is inserted. Missing categories are created automatically.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} required />
          <button type="submit" className="btn btn-primary" disabled={loading || !file}>
            {loading ? "Importing…" : "Import"}
          </button>
        </form>

        {error && <p className="field-error" style={{ marginTop: 14 }}>{error}</p>}

        {result && (
          <>
            <div className="import-summary">
              <div className="admin-stat">
                <div className="admin-stat-value">{result.total}</div>
                <div className="admin-stat-label">Total rows</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat-value">{result.imported + result.updated}</div>
                <div className="admin-stat-label">Succeeded ({result.imported} new, {result.updated} updated)</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat-value">{result.failed}</div>
                <div className="admin-stat-label">Failed</div>
              </div>
            </div>

            {result.errors?.length > 0 && (
              <ul className="import-errors">
                {result.errors.map((e, i) => (
                  <li key={i}>Row {e.row}: {e.message}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <div className="admin-card" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 10 }}>Example CSV</h3>
        <pre style={{ background: "var(--color-bg)", padding: 12, borderRadius: 8, fontSize: 12.5, overflowX: "auto" }}>
{`name,barcode,price,category,description
Tata Salt,8901030,28,Grocery,Iodised salt 1kg
Aashirvaad Atta,8901234,250,Grocery,Whole wheat flour 5kg`}
        </pre>
      </div>
    </div>
  );
}
