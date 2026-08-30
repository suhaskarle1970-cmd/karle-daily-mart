import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useStoreConfig } from "../hooks/useStoreConfig";
import logoimg from "../../public/favicon.svg";
import "./Navbar.css";

export default function Navbar() {
  const { totalItems } = useCart();
  const { config } = useStoreConfig();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  function handleSearch(e) {
    e.preventDefault();
    navigate(
      query.trim()
        ? `/products?search=${encodeURIComponent(query.trim())}`
        : "/products",
    );
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <img src={logoimg} alt="Daily Mart" />
        </Link>

        <form className="navbar-search" onSubmit={handleSearch} role="search">
          <input
            type="search"
            placeholder="Search for atta, salt, oil..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
