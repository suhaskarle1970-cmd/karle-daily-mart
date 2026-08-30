import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import { LoadingGrid, ErrorState, EmptyState } from "../components/States";
import "./Home.css";
import "./Products.css";

const PAGE_SIZE = 20;

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [status, setStatus] = useState("loading");
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    api.get("/categories").then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search, page]);

  function load() {
    setStatus("loading");
    api
      .get("/products", { params: { category: category || undefined, search: search || undefined, page, limit: PAGE_SIZE } })
      .then(({ data }) => {
        setProducts(data.products);
        setPagination(data.pagination);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }

  function updateParams(next) {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    if (!("page" in next)) params.delete("page");
    setSearchParams(params);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    updateParams({ search: searchInput.trim() });
  }

  return (
    <div className="container section">

      {status === "loading" && <LoadingGrid count={12} />}

      {status === "error" && <ErrorState message="Couldn't load products." onRetry={load} />}

      {status === "ready" && products.length === 0 && (
        <EmptyState
          title="No products found"
          description={search ? `Nothing matched "${search}".` : "Try a different category."}
        />
      )}

      {status === "ready" && products.length > 0 && (
        <>
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-outline"
                disabled={page <= 1}
                onClick={() => updateParams({ page: String(page - 1) })}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="btn btn-outline"
                disabled={page >= pagination.totalPages}
                onClick={() => updateParams({ page: String(page + 1) })}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
