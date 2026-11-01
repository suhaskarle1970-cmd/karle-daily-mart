import { memo, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

/* ============================================================
   CONSTANTS & HELPERS
============================================================ */

const CLOUDINARY_HOST = "res.cloudinary.com";

function formatCurrency(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
}

function getOptimizedImageUrl(url, width = 400) {
  if (!url || typeof url !== "string" || !url.includes(CLOUDINARY_HOST)) {
    return url;
  }
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_limit/`);
}

function getCheapestVariant(variants) {
  if (!Array.isArray(variants) || variants.length === 0) return null;
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

function getCheapestTypeSize(types) {
  if (!Array.isArray(types) || types.length === 0) return null;
  let cheapest = null;
  let cheapestPrice = Infinity;

  for (const type of types) {
    if (!Array.isArray(type?.sizes)) continue;
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

function getTotalSizeCount(isTypeBased, types, hasVariants, variants) {
  if (isTypeBased && Array.isArray(types)) {
    return types.reduce(
      (acc, t) => acc + (Array.isArray(t?.sizes) ? t.sizes.length : 0),
      0,
    );
  }
  if (hasVariants && Array.isArray(variants)) {
    return variants.length;
  }
  return 0;
}

function getStandardPackLabel(product) {
  if (product.weight && String(product.weight).trim()) {
    return String(product.weight).trim();
  }
  if (product.amount && product.unit) {
    return `${product.amount} ${product.unit}`;
  }
  if (product.unit && String(product.unit).trim()) {
    const unitStr = String(product.unit).trim();
    return /^\d/.test(unitStr) ? unitStr : `1 ${unitStr}`;
  }
  return "1 Unit";
}

const CARD_STYLES = `
.product-card.dm-card,
.dm-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  min-width: 0;
  background: #ffffff;
  border: 1px solid #e3e8e4;
  border-radius: 14px;
  overflow: hidden;
  box-sizing: border-box;
  box-shadow: 0 2px 8px rgba(16, 36, 24, 0.04);
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
  font-family: "Inter", system-ui, -apple-system, sans-serif;
}
.dm-card:hover {
  transform: translateY(-4px);
  border-color: #1f6b4a;
  box-shadow: 0 14px 28px rgba(16, 36, 24, 0.09);
  z-index: 2;
}
.dm-card.is-out-of-stock { opacity: 0.85; }
.dm-card-media {
  position: relative;
  aspect-ratio: 4 / 3;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fcfdfc;
  border-bottom: 1px solid #eef2ef;
  padding: 6px;
  box-sizing: border-box;
  text-decoration: none;
  overflow: hidden;
}
.dm-card-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
}
.dm-card:hover .dm-card-img { transform: scale(1.06); }
.dm-card-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #f3f6f4 0%, #e6ece8 100%);
  border-radius: 8px;
  color: #6c7a70;
  font-size: 13px;
  font-weight: 700;
}
.dm-discount-badge {
  position: absolute;
  top: 9px;
  left: 9px;
  z-index: 3;
  background: linear-gradient(135deg, #1b8057 0%, #135c3e 100%);
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(19, 92, 62, 0.25);
}
.dm-featured-badge {
  position: absolute;
  top: 9px;
  right: 9px;
  z-index: 3;
  background: linear-gradient(135deg, #fff8e6 0%, #ffecb8 100%);
  border: 1px solid #f0c96b;
  color: #8a5300;
  font-size: 10px;
  font-weight: 800;
  padding: 4px 7px;
  border-radius: 6px;
}
.dm-oos-overlay {
  position: absolute;
  inset: 0;
  z-index: 4;
  background: rgba(255, 255, 255, 0.68);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.dm-oos-pill {
  background: rgba(22, 32, 25, 0.88);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 5px 11px;
  border-radius: 999px;
}
.dm-card-body {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  padding: 11px 12px 12px;
  box-sizing: border-box;
  background: #ffffff;
}
.dm-card-category {
  font-size: 10.5px;
  font-weight: 700;
  color: #1f6b4a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dm-card-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.35;
  min-height: 2.7em;
  max-height: 2.7em;
  margin: 0 0 8px 0;
  color: #162019;
  text-decoration: none;
}
.dm-card-title:hover { color: #1f6b4a; }
.dm-pack-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  width: 100%;
  height: 28px;
  padding: 0 9px;
  margin-bottom: 10px;
  background: #f6f8f6;
  border: 1px solid #e2e8e4;
  border-radius: 6px;
  box-sizing: border-box;
  text-decoration: none;
}
.dm-pack-selectable {
  background: #f2f8f5;
  border-color: #c5dfd0;
  cursor: pointer;
}
.dm-pack-text {
  font-size: 11px;
  font-weight: 600;
  color: #364239;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dm-pack-arrow { font-size: 11px; color: #1f6b4a; }
.dm-card-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 9px;
  width: 100%;
}
.dm-price-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dm-price-line {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 5px;
  line-height: 1.1;
}
.dm-price-from { font-size: 11px; font-weight: 500; color: #626d65; }
.dm-price-current { font-size: 19px; font-weight: 800; color: #111814; letter-spacing: -0.35px; }
.dm-price-mrp { font-size: 12px; font-weight: 500; color: #848f87; text-decoration: line-through; }
.dm-savings-line { display: flex; align-items: center; min-height: 20px; }
.dm-save-tag {
  font-size: 10.5px;
  font-weight: 700;
  color: #146c43;
  background: #e6f4ec;
  padding: 2px 7px;
  border-radius: 4px;
}
.dm-best-price-tag {
  font-size: 10.5px;
  font-weight: 600;
  color: #5d6960;
  background: #f1f4f2;
  padding: 2px 7px;
  border-radius: 4px;
}
.dm-cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  box-sizing: border-box;
}
.dm-cta-add {
  background: linear-gradient(135deg, #1f6b4a 0%, #155238 100%);
  color: #ffffff;
  border: 1px solid #155238;
  transition: opacity 0.15s ease, background 0.15s ease;
}
.dm-cta-add.is-added {
  background: linear-gradient(135deg, #146c43 0%, #0f5132 100%) !important;
}
.dm-cta-options {
  background: #f1f8f4;
  color: #144932;
  border: 1.5px solid #9ad0b3;
}
.dm-cta-disabled {
  background: #edf0ee;
  color: #848f87;
  border: 1px solid #dce2de;
  cursor: not-allowed;
}
`;

/* ============================================================
   SINGLE PRODUCT CARD COMPONENT
============================================================ */

export function ProductCard({ product, onAddItem }) {
  const [justAdded, setJustAdded] = useState(false);
  const cart = useCart();

  // Resolve the cart add function whether passed via prop or directly from CartContext
  const addToCart = onAddItem || cart?.addItem || cart?.addToCart || cart?.add;

  if (!product) return null;

  const isOutOfStock =
    product.active === false ||
    product.inStock === false ||
    (product.stock !== undefined &&
      product.stock !== null &&
      Number(product.stock) <= 0);

  const isTypeBased =
    product.pricingType === "type-based" &&
    Array.isArray(product.types) &&
    product.types.length > 0;

  const hasVariants =
    !isTypeBased &&
    Array.isArray(product.variants) &&
    product.variants.length > 0;

  const cheapestVariant = hasVariants
    ? getCheapestVariant(product.variants)
    : null;
  const cheapestTypeSize = isTypeBased
    ? getCheapestTypeSize(product.types)
    : null;

  let displayPrice = Number(product.price ?? 0);
  let displayMrp = Number(product.mrp ?? 0);
  let displaySize = null;
  let displayType = null;

  if (isTypeBased && cheapestTypeSize) {
    displayPrice = Number(cheapestTypeSize.price ?? 0);
    displayMrp = Number(cheapestTypeSize.mrp ?? 0);
    displaySize = cheapestTypeSize;
    displayType = cheapestTypeSize.typeName;
  } else if (hasVariants && cheapestVariant) {
    displayPrice = Number(cheapestVariant.price ?? 0);
    displayMrp = Number(cheapestVariant.mrp ?? 0);
    displaySize = cheapestVariant;
  }

  const hasDiscount = displayMrp > displayPrice && displayMrp > 0;
  const discountPct = hasDiscount
    ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100)
    : 0;
  const savingsAmount = hasDiscount
    ? Math.max(0, displayMrp - displayPrice)
    : 0;

  const totalOptionsCount = getTotalSizeCount(
    isTypeBased,
    product.types,
    hasVariants,
    product.variants,
  );

  const categoryName =
    product.category?.name || product.categoryData?.name || "";

  let basePackText = getStandardPackLabel(product);
  if (displayType && displaySize) {
    basePackText = `${displayType} • ${displaySize.amount} ${displaySize.unit}`;
  } else if (displaySize) {
    basePackText = `${displaySize.amount} ${displaySize.unit}`;
  } else if (displayType) {
    basePackText = displayType;
  }

  const optionsCountLabel =
    totalOptionsCount > 1 ? `${totalOptionsCount} sizes` : "";

  const handleAdd = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isOutOfStock || !addToCart) return;

      const variantLabel = displaySize
        ? `${displaySize.amount} ${displaySize.unit}`
        : "";

      // Enrich product with resolved price/MRP and cart fields so any CartContext signature works
      const productPayload = {
        ...product,
        productId: product._id,
        price: displayPrice,
        mrp: displayMrp,
        type: displayType || "",
        variant: variantLabel,
        quantity: 1,
      };

      const fnStr = addToCart.toString();
      const paramHeader = fnStr.slice(0, fnStr.indexOf("{")).toLowerCase();
      const expectsVariantObject =
        /\.amount\b|\.unit\b/.test(fnStr) && Boolean(displaySize);
      const variantArg = expectsVariantObject
        ? displaySize
        : variantLabel || null;

      if (/,\s*(\{|options|opts|config)/.test(paramHeader)) {
        // Matches: addItem(product, { quantity, type, variant, size, price, mrp })
        addToCart(productPayload, {
          quantity: 1,
          type: displayType || "",
          variant: variantLabel,
          size: displaySize,
          price: displayPrice,
          mrp: displayMrp,
        });
      } else if (
        paramHeader.indexOf("type") !== -1 &&
        paramHeader.indexOf("variant") !== -1 &&
        paramHeader.indexOf("type") < paramHeader.indexOf("variant")
      ) {
        // Matches: addItem(product, quantity, type, variant)
        addToCart(productPayload, 1, displayType || null, variantArg);
      } else {
        // Matches: addItem(product, quantity, variant, type) or addItem(itemObj)
        addToCart(productPayload, 1, variantArg, displayType || null);
      }

      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1200);
    },
    [
      addToCart,
      product,
      isOutOfStock,
      displayPrice,
      displayMrp,
      displayType,
      displaySize,
    ],
  );

  return (
    <article
      className={`product-card dm-card ${isOutOfStock ? "is-out-of-stock" : ""}`}
    >
      <style>{CARD_STYLES}</style>
      <Link
        to={`/products/${product._id}`}
        className="dm-card-media"
        aria-label={product.name}
      >
        {product.imageUrl ? (
          <img
            src={getOptimizedImageUrl(product.imageUrl, 600)}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="dm-card-img"
          />
        ) : (
          <div className="dm-card-placeholder" aria-hidden="true">
            <span>Daily Mart</span>
          </div>
        )}

        {hasDiscount && !isOutOfStock && (
          <span className="dm-discount-badge">{discountPct}% OFF</span>
        )}

        {Boolean(product.featured) && !isOutOfStock && (
          <span className="dm-featured-badge">★ Featured</span>
        )}

        {isOutOfStock && (
          <div className="dm-oos-overlay">
            <span className="dm-oos-pill">Out of Stock</span>
          </div>
        )}
      </Link>

      <div className="dm-card-body">
        <div className="dm-card-category" title={categoryName || "Daily Mart"}>
          {categoryName || "Daily Essentials"}
        </div>

        <Link
          to={`/products/${product._id}`}
          className="dm-card-title"
          title={product.name}
        >
          {product.name}
        </Link>

        <Link
          to={`/products/${product._id}`}
          className={`dm-pack-box ${totalOptionsCount > 1 ? "dm-pack-selectable" : ""}`}
          title={
            totalOptionsCount > 1
              ? `Click to view all ${totalOptionsCount} sizes`
              : basePackText
          }
        >
          <span className="dm-pack-text">
            {basePackText}
            {optionsCountLabel ? ` • ${optionsCountLabel}` : ""}
          </span>
          {totalOptionsCount > 1 && (
            <span className="dm-pack-arrow" aria-hidden="true">
              ▾
            </span>
          )}
        </Link>

        <div className="dm-card-footer">
          <div className="dm-price-block">
            <div className="dm-price-line">
              <span className="dm-price-current">
                {formatCurrency(displayPrice)}
              </span>
              {hasDiscount && (
                <span className="dm-price-mrp">
                  {formatCurrency(displayMrp)}
                </span>
              )}
            </div>

            <div className="dm-savings-line">
              {hasDiscount && savingsAmount > 0 ? (
                <span className="dm-save-tag">
                  Save {formatCurrency(savingsAmount)}
                </span>
              ) : (
                <span className="dm-best-price-tag">DailyMart Price</span>
              )}
            </div>
          </div>

          {isOutOfStock ? (
            <button
              type="button"
              className="dm-cta-btn dm-cta-disabled"
              disabled
            >
              Out of Stock
            </button>
          ) : (
            <button
              type="button"
              className={`dm-cta-btn dm-cta-add ${justAdded ? "is-added" : ""}`}
              onClick={handleAdd}
            >
              {justAdded ? <span>✓ Added</span> : <span>+ Add to Cart</span>}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default memo(ProductCard);
