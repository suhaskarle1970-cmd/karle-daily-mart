import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { formatCurrency } from "../utils/format";
import { useCart } from "../context/CartContext";
import { ErrorState } from "../components/States";
import "./ProductDetail.css";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState("loading");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    setStatus("loading");
    setAdded(false);
    setQuantity(1);
    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        setProduct(data.product);
        setSelectedVariant(data.product.variants?.length ? data.product.variants[0] : null);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [id]);

  if (status === "loading") {
    return <div className="container section">Loading…</div>;
  }

  if (status === "error" || !product) {
    return (
      <div className="container section">
        <ErrorState message="We couldn't find that product." />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link to="/products" className="btn btn-outline">Back to shop</Link>
        </div>
      </div>
    );
  }

  const hasVariants = product.variants && product.variants.length > 0;
  const displayPrice = hasVariants ? selectedVariant.price : product.price;

  function handleAdd() {
    addItem(product, quantity, selectedVariant);
    setAdded(true);
  }

  return (
    <div className="container section pd">
      <div className="pd-image">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} />
        ) : (
          <div className="product-card-image-placeholder">No image</div>
        )}
      </div>
      <div className="pd-info">
        {product.category?.name && <p className="pd-category">{product.category.name}</p>}
        <h1>{product.name}</h1>
        <p className="pd-price">{formatCurrency(displayPrice)}</p>
        {product.description && <p className="pd-description">{product.description}</p>}

        {hasVariants && (
          <div className="pd-variants">
            <label>Size</label>
            <div className="pd-variant-options">
              {product.variants.map((v) => {
                const label = `${v.amount} ${v.unit}`;
                const isSelected = selectedVariant && selectedVariant.unit === v.unit && selectedVariant.amount === v.amount;
                return (
                  <button
                    type="button"
                    key={label}
                    className={`pd-variant-btn ${isSelected ? "selected" : ""}`}
                    onClick={() => { setSelectedVariant(v); setAdded(false); }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="pd-quantity">
          <label htmlFor="qty">Quantity</label>
          <div className="pd-quantity-control">
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
            <span id="qty">{quantity}</span>
            <button type="button" onClick={() => setQuantity((q) => q + 1)} aria-label="Increase quantity">+</button>
          </div>
        </div>

        <button className="btn btn-primary pd-add" onClick={handleAdd}>
          {added ? "Added ✓" : "Add to cart"}
        </button>
        {added && (
          <Link to="/cart" className="pd-cart-link">
            View cart →
          </Link>
        )}
      </div>
    </div>
  );
}
