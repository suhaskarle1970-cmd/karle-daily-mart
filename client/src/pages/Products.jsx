import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import api from "../services/api";
import ProductCard from "../components/ProductCard";
import {
  LoadingGrid,
  ErrorState,
  EmptyState,
} from "../components/States";

import "./Home.css";
import "./Products.css";

const PAGE_SIZE = 20;

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";

  const parsedPage = Number.parseInt(
    searchParams.get("page") || "1",
    10,
  );

  const page =
    Number.isFinite(parsedPage) && parsedPage > 0
      ? parsedPage
      : 1;

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [status, setStatus] = useState("loading");
  const [searchInput, setSearchInput] = useState(search);

  /*
   * Keep the search field synchronized with the URL.
   *
   * This matters when navigation changes the search query
   * from somewhere other than the form itself.
   */
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  /*
   * LOAD PRODUCTS
   */

  const load = useCallback(async () => {
    setStatus("loading");

    try {
      const { data } = await api.get("/products", {
        params: {
          category: category || undefined,
          search: search || undefined,
          page,
          limit: PAGE_SIZE,
        },
      });

      setProducts(data.products || []);
      setPagination(data.pagination || null);
      setStatus("ready");
    } catch (error) {
      console.error("Failed to load products:", error);

      setStatus("error");
    }
  }, [category, search, page]);

  /*
   * LOAD PRODUCTS WHEN URL FILTERS/PAGE CHANGE
   */

  useEffect(() => {
    load();
  }, [load]);

  /*
   * UPDATE URL PARAMETERS
   */

  function updateParams(next) {
    const params = new URLSearchParams(searchParams);

    Object.entries(next).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    /*
     * Any filter/search change starts from page 1.
     * Explicit pagination changes keep the current page logic.
     */
    if (!Object.prototype.hasOwnProperty.call(next, "page")) {
      params.delete("page");
    }

    setSearchParams(params);
  }

  /*
   * SEARCH
   */

  function handleSearchSubmit(event) {
    event.preventDefault();

    updateParams({
      search: searchInput.trim(),
    });
  }

  /*
   * RENDER
   */

  return (
    <div className="container section">
      {/* =====================================================
          LOADING
      ===================================================== */}

      {status === "loading" && (
        <LoadingGrid count={12} />
      )}

      {/* =====================================================
          ERROR
      ===================================================== */}

      {status === "error" && (
        <ErrorState
          message="Couldn't load products."
          onRetry={load}
        />
      )}

      {/* =====================================================
          EMPTY
      ===================================================== */}

      {status === "ready" && products.length === 0 && (
        <EmptyState
          title="No products found"
          description={
            search
              ? `Nothing matched "${search}".`
              : "Try a different category."
          }
        />
      )}

      {/* =====================================================
          PRODUCTS
      ===================================================== */}

      {status === "ready" && products.length > 0 && (
        <>
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
              />
            ))}
          </div>

          {/* =================================================
              PAGINATION
          ================================================= */}

          {pagination &&
            pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={page <= 1}
                  onClick={() =>
                    updateParams({
                      page: String(page - 1),
                    })
                  }
                >
                  Previous
                </button>

                <span>
                  Page {pagination.page} of{" "}
                  {pagination.totalPages}
                </span>

                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={
                    page >= pagination.totalPages
                  }
                  onClick={() =>
                    updateParams({
                      page: String(page + 1),
                    })
                  }
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