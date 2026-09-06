import { memo, useCallback } from "react";
import { Link } from "react-router-dom";

import { formatCurrency } from "../utils/format";
import { useCart } from "../context/CartContext";

import "./ProductCard.css";

/* ============================================================
   CONSTANTS
============================================================ */

const CLOUDINARY_HOST = "res.cloudinary.com";

/* ============================================================
   CLOUDINARY IMAGE OPTIMIZATION
============================================================ */

function getOptimizedImageUrl(url, width = 400) {
  if (!url || !url.includes(CLOUDINARY_HOST)) {
    return url;
  }

  return url.replace(
    "/upload/",
    `/upload/f_auto,q_auto,w_${width},c_limit/`,
  );
}

/* ============================================================
   CHEAPEST STANDARD VARIANT
============================================================ */

function getCheapestVariant(variants) {
  if (!Array.isArray(variants) || variants.length === 0) {
    return null;
  }

  let cheapest = variants[0];
  let cheapestPrice = Number(cheapest?.price ?? Infinity);

  for (let i = 1; i < variants.length; i += 1) {
    const variant = variants[i];
    const price = Number(variant?.price ?? Infinity);

    if (price < cheapestPrice) {
      cheapest = variant;
      cheapestPrice = price;
    }
  }

  return cheapest;
}

/* ============================================================
   CHEAPEST TYPE-BASED SIZE
   ------------------------------------------------------------
   Finds the cheapest size across all product types in one pass.

   Instead of:
     types
       -> flatMap
       -> create new objects
       -> reduce

   we directly inspect the sizes.
============================================================ */

function getCheapestTypeSize(types) {
  if (!Array.isArray(types) || types.length === 0) {
    return null;
  }

  let cheapest = null;
  let cheapestPrice = Infinity;

  for (const type of types) {
    if (!Array.isArray(type?.sizes)) {
      continue;
    }

    for (const size of type.sizes) {
      const price = Number(size?.price ?? Infinity);

      if (price < cheapestPrice) {
        cheapestPrice = price;

        cheapest = {
          ...size,
          typeName: type.name,
        };
      }
    }
  }

  return cheapest;
}

/* ============================================================
   PRODUCT CARD
============================================================ */

function ProductCard({ product }) {
  const { addItem } = useCart();

  /* ============================================================
     PRODUCT TYPE DETECTION
  ============================================================ */

  const isTypeBased =
    product.pricingType === "type-based" &&
    Array.isArray(product.types) &&
    product.types.length > 0;

  /* ============================================================
     STANDARD VARIANTS
  ============================================================ */

  const hasVariants =
    !isTypeBased &&
    Array.isArray(product.variants) &&
    product.variants.length > 0;

  /* ============================================================
     CHEAPEST VARIANT
  ============================================================ */

  const cheapestVariant = hasVariants
    ? getCheapestVariant(product.variants)
    : null;

  /* ============================================================
     CHEAPEST TYPE-BASED SIZE
  ============================================================ */

  const cheapestTypeSize = isTypeBased
    ? getCheapestTypeSize(product.types)
    : null;

  /* ============================================================
     DISPLAY PRICE
  ============================================================ */

  let displayPrice = Number(product.price ?? 0);
  let displayMrp = Number(product.mrp ?? 0);

  let displaySize = null;
  let displayType = null;

  /* ============================================================
     TYPE-BASED PRODUCT
  ============================================================ */

  if (isTypeBased && cheapestTypeSize) {
    displayPrice = Number(cheapestTypeSize.price ?? 0);
    displayMrp = Number(cheapestTypeSize.mrp ?? 0);

    displaySize = cheapestTypeSize;
    displayType = cheapestTypeSize.typeName;
  }

  /* ============================================================
     STANDARD PRODUCT WITH VARIANTS
  ============================================================ */

  else if (hasVariants && cheapestVariant) {
    displayPrice = Number(cheapestVariant.price ?? 0);
    displayMrp = Number(cheapestVariant.mrp ?? 0);

    displaySize = cheapestVariant;
  }

  /* ============================================================
     DISCOUNT
  ============================================================ */

  const hasDiscount =
    displayMrp > displayPrice &&
    displayMrp > 0;

  const discountPct = hasDiscount
    ? Math.round(
        ((displayMrp - displayPrice) /
          displayMrp) *
          100,
      )
    : 0;

  /* ============================================================
     PRODUCT REQUIRES OPTIONS
  ============================================================ */

  const requiresSelection =
    isTypeBased || hasVariants;

  /* ============================================================
     DIRECT ADD TO CART
  ============================================================ */

  const handleAdd = useCallback(() => {
    if (requiresSelection) {
      return;
    }

    addItem(product, 1, null, null);
  }, [
    addItem,
    product,
    requiresSelection,
  ]);

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <article className="product-card">
      {/* IMAGE */}

      <div className="product-card-img-wrap">
        {product.imageUrl ? (
          <img
            src={getOptimizedImageUrl(
              product.imageUrl,
              400,
            )}
            srcSet={`
              ${getOptimizedImageUrl(
                product.imageUrl,
                300,
              )} 300w,
              ${getOptimizedImageUrl(
                product.imageUrl,
                400,
              )} 400w,
              ${getOptimizedImageUrl(
                product.imageUrl,
                600,
              )} 600w
            `}
            sizes="(max-width: 480px) 45vw, (max-width: 900px) 30vw, 250px"
            alt={product.name}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className="product-card-img-placeholder"
            aria-hidden="true"
          />
        )}

        {/* DISCOUNT BADGE */}

        {hasDiscount && (
          <span className="badge-discount">
            {discountPct}% off
          </span>
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

        <Link
          to={`/products/${product._id}`}
          className="product-card-name"
        >
          {product.name}
        </Link>

        {/* CATEGORY */}

        {product.category?.name && (
          <p className="product-card-desc">
            {product.category.name}
          </p>
        )}

        {/* TYPE INFORMATION */}

        {isTypeBased && displayType && (
          <p className="variant-preview">
            Starting from{" "}
            <strong>{displayType}</strong>
          </p>
        )}

        {/* RATING */}

        {product.rating !== undefined &&
          product.rating !== null &&
          Number(product.rating) > 0 && (
            <div className="rating-row">
              <span className="rating-pill">
                ★{" "}
                {Number(product.rating).toFixed(1)}
              </span>

              {Number(product.ratingCount) > 0 && (
                <span className="rating-count">
                  (
                  {Number(
                    product.ratingCount,
                  ).toLocaleString()}
                  )
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

              <span className="price-off">
                {discountPct}% off
              </span>
            </>
          )}
        </div>

        {/* SIZE PREVIEW */}

        {displaySize && (
          <p className="variant-preview">
            Starting from{" "}
            <strong>
              {displaySize.amount}{" "}
              {displaySize.unit}
            </strong>
          </p>
        )}

        {/* DELIVERY */}

        <p className="offer-tag">
          Home delivery on orders above{" "}
          <span>₹500</span>
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

/* ============================================================
   MEMOIZED PRODUCT CARD
   ------------------------------------------------------------
   Prevents unnecessary re-renders when the parent component
   re-renders but this product has not changed.
============================================================ */

export default memo(ProductCard);