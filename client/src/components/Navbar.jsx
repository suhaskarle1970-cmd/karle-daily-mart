import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useCart } from "../context/CartContext";
import { useStoreConfig } from "../hooks/useStoreConfig";
import logoimg from "../../public/favicon2.svg";
import "./Navbar.css";

export default function Navbar() {
  const { totalItems } = useCart();
  const { config } = useStoreConfig();

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const urlSearch = searchParams.get("search") || "";
  const [query, setQuery] = useState(urlSearch);
  const isUserTypingRef = useRef(false);

  // Keep Navbar search input synced when URL changes externally
  useEffect(() => {
    if (!isUserTypingRef.current) {
      setQuery(urlSearch);
    }
  }, [urlSearch, location.pathname]);

  // Live debounced search so typing works even without pressing Enter
  useEffect(() => {
    if (!isUserTypingRef.current) return;

    const trimmed = query.trim();

    const timer = window.setTimeout(() => {
      isUserTypingRef.current = false;

      if (trimmed) {
        const params = new URLSearchParams(
          location.pathname === "/products" ? location.search : "",
        );
        params.set("search", trimmed);
        params.delete("page");
        navigate(`/products?${params.toString()}`, {
          replace: location.pathname === "/products",
        });
      } else if (location.pathname === "/products" && urlSearch) {
        const params = new URLSearchParams(location.search);
        params.delete("search");
        params.delete("page");
        const nextQuery = params.toString();
        navigate(nextQuery ? `/products?${nextQuery}` : "/products", {
          replace: true,
        });
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query, location.pathname, location.search, navigate, urlSearch]);

  function handleInputChange(e) {
    isUserTypingRef.current = true;
    setQuery(e.target.value);
  }

  function handleSearch(e) {
    e.preventDefault();
    isUserTypingRef.current = false;

    const trimmed = query.trim();
    if (trimmed) {
      const params = new URLSearchParams(
        location.pathname === "/products" ? location.search : "",
      );
      params.set("search", trimmed);
      params.delete("page");
      navigate(`/products?${params.toString()}`);
    } else {
      navigate("/products");
    }
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <img src={logoimg} alt={config?.storeName || "Daily Mart"} />
        </Link>

        <form className="navbar-search" onSubmit={handleSearch} role="search">
          <input
            type="search"
            placeholder="Search for atta, salt, oil, face wash..."
            value={query}
            onChange={handleInputChange}
            aria-label="Search products"
          />
          <button
            type="submit"
            className="navbar-search-btn"
            aria-label="Search"
          >
            🔍
          </button>
        </form>

        <nav className="navbar-links">
          <Link to="/products">Shop</Link>
          <Link to="/cart" className="navbar-cart">
            Cart
            {totalItems > 0 && (
              <span className="navbar-cart-badge">{totalItems}</span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
