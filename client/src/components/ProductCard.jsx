import { Link } from "react-router-dom";
import { formatCurrency } from "../utils/format";
import { useCart } from "../context/CartContext";
import "./ProductCard.css";

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const hasVariants = product.variants && product.variants.length > 0;
  const cheapestVariant = hasVariants
    ? product.variants.reduce((min, v) => (v.price < min.price ? v : min), product.variants[0])
    : null;

  function handleAdd() {
    if (hasVariants) {
      // Multiple sizes exist — force the customer to choose one on the detail page
      // rather than silently picking the cheapest for them.
      return;
    }
    addItem(product, 1);
  }

  return (
    <div className="product-card">
      <Link to={`/products/${product._id}`} className="product-card-image-link">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-card-image-placeholder" aria-hidden="true">
            No image
          </div>
        )}
      </Link>
      <div className="product-card-body">
        <Link to={`/products/${product._id}`} className="product-card-name">
          {product.name}
        </Link>
        <p className="product-card-price">
          {hasVariants ? (
            <>From {formatCurrency(cheapestVariant.price)}</>
          ) : (
            formatCurrency(product.price)
          )}
        </p>
        {hasVariants ? (
          <Link to={`/products/${product._id}`} className="btn btn-outline product-card-add">
            Select size
          </Link>
        ) : (
          <button type="button" className="btn btn-primary product-card-add" onClick={handleAdd}>
            Add to cart
          </button>
        )}
      </div>
    </div>
  );
}
