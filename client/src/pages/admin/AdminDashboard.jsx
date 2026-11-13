import { useEffect, useState } from "react";
import api from "../../services/api";
import { formatCurrency } from "../../utils/format";
import "./admin.css";

function getProductDisplayPrice(product) {
  if (!product) return formatCurrency(0);

  // 1. If it's a type-based product (or has types with sizes), get price(s) from types
  if (
    product.pricingType === "type-based" ||
    (Array.isArray(product.types) && product.types.length > 0)
  ) {
    const typePrices = (product.types || [])
      .flatMap((t) => (Array.isArray(t.sizes) ? t.sizes : []))
      .map((s) => Number(s.price))
      .filter((price) => Number.isFinite(price) && price > 0);

    if (typePrices.length > 0) {
      const min = Math.min(...typePrices);
      const max = Math.max(...typePrices);
      return min === max
        ? formatCurrency(min)
        : `${formatCurrency(min)} – ${formatCurrency(max)}`;
    }
  }

  // 2. If standard product has variants and top-level price is 0, get price(s) from variants
  if (
    !(Number(product.price) > 0) &&
    Array.isArray(product.variants) &&
    product.variants.length > 0
  ) {
    const variantPrices = product.variants
      .map((v) => Number(v.price))
      .filter((price) => Number.isFinite(price) && price > 0);

    if (variantPrices.length > 0) {
      const min = Math.min(...variantPrices);
      const max = Math.max(...variantPrices);
      return min === max
        ? formatCurrency(min)
        : `${formatCurrency(min)} – ${formatCurrency(max)}`;
    }
  }

  // 3. Fallback to standard top-level price
  return formatCurrency(product.price || 0);
}

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
      {status === "error" && (
        <p className="field-error">Couldn't load dashboard stats.</p>
      )}

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
            <h3 style={{ marginBottom: 14, fontSize: 16 }}>
              Recently added products
            </h3>

            <div className="admin-table-scroll">
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
                      <td>
                        {p.imageUrl ? (
                          <img className="thumb" src={p.imageUrl} alt="" />
                        ) : null}
                      </td>

                      <td>{p.name}</td>

                      <td>{p.category?.name || "—"}</td>

                      <td>{getProductDisplayPrice(p)}</td>
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
          </div>
        </>
      )}
    </div>
  );
}
