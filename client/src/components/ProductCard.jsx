import { Link } from "react-router-dom";
import { formatCurrency } from "../utils/format";
import { useCart } from "../context/CartContext";
import "./ProductCard.css";

function getOptimizedImageUrl(url, width = 400) {
  if (!url || !url.includes("res.cloudinary.com")) {
    return url;
  }

  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_limit/`);
}

export default function ProductCard({ product }) {
  const { addItem } = useCart();

  // ============================================================
  // PRODUCT TYPE DETECTION
  // ============================================================

  const isTypeBased =
    product.pricingType === "type-based" &&
    Array.isArray(product.types) &&
    product.types.length > 0;

  // ============================================================
  // STANDARD VARIANTS
  // ============================================================

  const hasVariants =
    !isTypeBased &&
    Array.isArray(product.variants) &&
    product.variants.length > 0;

  // ============================================================
  // TYPE-BASED SIZES
  // ============================================================

  const typeBasedSizes = isTypeBased
    ? product.types.flatMap((type) =>
        Array.isArray(type.sizes)
          ? type.sizes.map((size) => ({
              ...size,
              typeName: type.name,
            }))
          : [],
      )
    : [];

  // ============================================================
  // CHEAPEST STANDARD VARIANT
  // ============================================================

  const cheapestVariant = hasVariants
    ? product.variants.reduce((min, variant) => {
        const minPrice = Number(min?.price ?? Infinity);
        const currentPrice = Number(variant?.price ?? Infinity);

        return currentPrice < minPrice ? variant : min;
      }, product.variants[0])
    : null;

  // ============================================================
  // CHEAPEST TYPE-BASED SIZE
  // ============================================================

  const cheapestTypeSize =
    isTypeBased && typeBasedSizes.length > 0
      ? typeBasedSizes.reduce((min, size) => {
          const minPrice = Number(min?.price ?? Infinity);
          const currentPrice = Number(size?.price ?? Infinity);

          return currentPrice < minPrice ? size : min;
        }, typeBasedSizes[0])
      : null;

  // ============================================================
  // DISPLAY PRICE
  // ============================================================

  let displayPrice = Number(product.price ?? 0);
  let displayMrp = Number(product.mrp ?? 0);

  let displaySize = null;
  let displayType = null;

  // TYPE-BASED PRODUCT
  if (isTypeBased && cheapestTypeSize) {
    displayPrice = Number(cheapestTypeSize.price ?? 0);
    displayMrp = Number(cheapestTypeSize.mrp ?? 0);

    displaySize = cheapestTypeSize;
    displayType = cheapestTypeSize.typeName;
  }

  // STANDARD PRODUCT WITH VARIANTS
  else if (hasVariants && cheapestVariant) {
    displayPrice = Number(cheapestVariant.price ?? 0);
    displayMrp = Number(cheapestVariant.mrp ?? 0);

    displaySize = cheapestVariant;
  }

  // ============================================================
  // DISCOUNT
  // ============================================================

  const hasDiscount = displayMrp > displayPrice && displayMrp > 0;

  const discountPct = hasDiscount
    ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100)
    : 0;

  // ============================================================
  // PRODUCT REQUIRES OPTIONS
  // ============================================================

  const requiresSelection = isTypeBased || hasVariants;

  // ============================================================
  // DIRECT ADD TO CART
  // ============================================================

  function handleAdd() {
    if (requiresSelection) {
      return;
    }

    addItem(product, 1, null, null);
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <article className="product-card">
      {/* IMAGE */}

      <div className="product-card-img-wrap">
        {product.imageUrl ? (
          <img
            src={getOptimizedImageUrl(product.imageUrl, 400)}
            srcSet={`
    ${getOptimizedImageUrl(product.imageUrl, 300)} 300w,
    ${getOptimizedImageUrl(product.imageUrl, 400)} 400w,
    ${getOptimizedImageUrl(product.imageUrl, 600)} 600w
  `}
            sizes="(max-width: 480px) 45vw, (max-width: 900px) 30vw, 250px"
            alt={product.name}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="product-card-img-placeholder" aria-hidden="true" />
        )}

        {/* DISCOUNT BADGE */}

        {hasDiscount && (
          <span className="badge-discount">{discountPct}% off</span>
        )}

        {/* WISHLIST */}

        <button
          type="button"
          className="wishlist-btn"
          aria-label={`Add ${product.name} to wishlist`}
        >
          ♡
        </button>
      </div>

      {/* BODY */}

      <div className="product-card-body">
        {/* PRODUCT NAME */}

        <Link to={`/products/${product._id}`} className="product-card-name">
          {product.name}
        </Link>

        {/* CATEGORY */}

        {product.category?.name && (
          <p className="product-card-desc">{product.category.name}</p>
        )}

        {/* TYPE INFORMATION */}

        {isTypeBased && displayType && (
          <p className="variant-preview">
            Starting from <strong>{displayType}</strong>
          </p>
        )}

        {/* RATING */}

        {product.rating !== undefined &&
          product.rating !== null &&
          Number(product.rating) > 0 && (
            <div className="rating-row">
              <span className="rating-pill">
                ★ {Number(product.rating).toFixed(1)}
              </span>

              {Number(product.ratingCount) > 0 && (
                <span className="rating-count">
                  ({Number(product.ratingCount).toLocaleString()})
                </span>
              )}
            </div>
          )}

        {/* PRICE */}

        <div className="price-row">
          <span className="price-final">
            {requiresSelection && "From "}
            {formatCurrency(displayPrice)}
          </span>

          {hasDiscount && (
            <>
              <span className="price-original">
                {formatCurrency(displayMrp)}
              </span>

              <span className="price-off">{discountPct}% off</span>
            </>
          )}
        </div>

        {/* SIZE PREVIEW */}

        {displaySize && (
          <p className="variant-preview">
            Starting from{" "}
            <strong>
              {displaySize.amount} {displaySize.unit}
            </strong>
          </p>
        )}

        {/* DELIVERY */}

        <p className="offer-tag">
          Home delivery on orders above <span>₹500</span>
        </p>

        {/* CTA */}

        {requiresSelection ? (
          <Link
            to={`/products/${product._id}`}
            className="product-card-add btn-outline-fk"
          >
            Select options
          </Link>
        ) : (
          <button
            type="button"
            className="product-card-add btn-primary-fk"
            onClick={handleAdd}
          >
            Add to cart
          </button>
        )}
      </div>
    </article>
  );
}
