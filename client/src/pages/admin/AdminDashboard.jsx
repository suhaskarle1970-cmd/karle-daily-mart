import { useEffect, useState } from "react";
import api from "../../services/api";
import { formatCurrency } from "../../utils/format";
import "./admin.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    api
      .get("/dashboard/stats")
      .then(({ data }) => {
        setStats(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div>
      <div className="admin-page-header">
        <h1>Dashboard</h1>
      </div>

      {status === "loading" && <p>Loading…</p>}
      {status === "error" && <p className="field-error">Couldn't load dashboard stats.</p>}

      {status === "ready" && stats && (
        <>
          <div className="admin-stats-grid">
            <div className="admin-stat">
              <div className="admin-stat-value">{stats.totalProducts}</div>
              <div className="admin-stat-label">Total products</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat-value">{stats.activeProducts}</div>
              <div className="admin-stat-label">Active</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat-value">{stats.inactiveProducts}</div>
              <div className="admin-stat-label">Inactive</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat-value">{stats.totalCategories}</div>
              <div className="admin-stat-label">Categories</div>
            </div>
          </div>

          <div className="admin-card">
            <h3 style={{ marginBottom: 14, fontSize: 16 }}>Recently added products</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentProducts.map((p) => (
                  <tr key={p._id}>
                    <td>{p.imageUrl ? <img className="thumb" src={p.imageUrl} alt="" /> : null}</td>
                    <td>{p.name}</td>
                    <td>{p.category?.name || "—"}</td>
                    <td>{formatCurrency(p.price)}</td>
                  </tr>
                ))}
                {stats.recentProducts.length === 0 && (
                  <tr>
                    <td colSpan={4}>No products yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
