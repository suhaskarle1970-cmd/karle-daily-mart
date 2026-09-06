import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../services/api";
import { formatCurrency } from "../utils/format";
import { useCart } from "../context/CartContext";
import { ErrorState } from "../components/States";

import "./ProductDetail.css";

/* =========================================================
   HELPERS
========================================================= */

function isTypeBasedProduct(product) {
  return (
    product?.pricingType === "type-based" &&
    Array.isArray(product.types) &&
    product.types.length > 0
  );
}

function hasProductVariants(product) {
  return (
    !isTypeBasedProduct(product) &&
    Array.isArray(product?.variants) &&
    product.variants.length > 0
  );
}

function getFirstVariant(product) {
  if (!Array.isArray(product?.variants)) {
    return null;
  }

  return product.variants[0] || null;
}

function getFirstType(product) {
  if (!Array.isArray(product?.types)) {
    return null;
  }

  return product.types[0] || null;
}

function getFirstTypeSize(type) {
  if (!Array.isArray(type?.sizes)) {
    return null;
  }

  return type.sizes[0] || null;
}

function getSafeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function getDiscount(price, mrp) {
  const safePrice = getSafeNumber(price);
  const safeMrp = getSafeNumber(mrp);

  if (safeMrp <= safePrice || safeMrp <= 0) {
    return {
      hasDiscount: false,
      discountPct: 0,
    };
  }

  return {
    hasDiscount: true,
    discountPct: Math.round(
      ((safeMrp - safePrice) / safeMrp) * 100,
    ),
  };
}

function getVariantLabel(variant) {
  if (!variant) {
    return "";
  }

  return `${variant.amount} ${variant.unit}`;
}

/* =========================================================
   VARIANT PRICE OPTION
========================================================= */

function VariantOption({
  variant,
  index,
  selected,
  onSelect,
}) {
  const label = getVariantLabel(variant);

  const price = getSafeNumber(variant?.price);
  const mrp = getSafeNumber(variant?.mrp);

  const { hasDiscount, discountPct } = getDiscount(
    price,
    mrp,
  );

  return (
    <button
      type="button"
      key={`${label}-${index}`}
      className={`pd-variant-btn ${
        selected ? "selected" : ""
      }`}
      onClick={() => onSelect(variant)}
    >
      <span className="pd-variant-size">
        {label}
      </span>

      <span className="pd-variant-price">
        {formatCurrency(price)}
      </span>

      {hasDiscount && (
        <span className="pd-variant-price-row">
          <span className="pd-variant-mrp">
            {formatCurrency(mrp)}
          </span>

          <span className="pd-variant-discount">
            {discountPct}% off
          </span>
        </span>
      )}
    </button>
  );
}

/* =========================================================
   PRODUCT DETAIL
========================================================= */

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState("loading");

  const [selectedVariant, setSelectedVariant] =
    useState(null);

  const [selectedType, setSelectedType] =
    useState(null);

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  /* =======================================================
     LOAD PRODUCT
  ======================================================= */

  useEffect(() => {
    const controller = new AbortController();

    async function loadProduct() {
      setStatus("loading");
      setProduct(null);

      setSelectedType(null);
      setSelectedVariant(null);
      setQuantity(1);
      setAdded(false);

      try {
        const { data } = await api.get(
          `/products/${id}`,
          {
            signal: controller.signal,
          },
        );

        if (controller.signal.aborted) {
          return;
        }

        const fetchedProduct = data?.product;

        if (!fetchedProduct) {
          setStatus("error");
          return;
        }

        setProduct(fetchedProduct);

        /* -----------------------------------------------
           TYPE-BASED PRODUCT
        ------------------------------------------------ */

        if (isTypeBasedProduct(fetchedProduct)) {
          const firstType =
            getFirstType(fetchedProduct);

          const firstSize =
            getFirstTypeSize(firstType);

          setSelectedType(firstType);
          setSelectedVariant(firstSize);
        }

        /* -----------------------------------------------
           STANDARD PRODUCT / VARIANTS
        ------------------------------------------------ */

        else {
          setSelectedType(null);
          setSelectedVariant(
            getFirstVariant(fetchedProduct),
          );
        }

        setStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error(
          "Failed to load product:",
          error,
        );

        setStatus("error");
      }
    }

    loadProduct();

    return () => {
      controller.abort();
    };
  }, [id]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (status === "loading") {
    return (
      <div className="container section">
        Loading…
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (status === "error" || !product) {
    return (
      <div className="container section">
        <ErrorState
          message="We couldn't find that product."
        />

        <div
          style={{
            textAlign: "center",
            marginTop: 16,
          }}
        >
          <Link
            to="/products"
            className="btn btn-outline"
          >
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  /* =======================================================
     PRODUCT TYPE
  ======================================================= */

  const isTypeBased =
    isTypeBasedProduct(product);

  const hasVariants =
    hasProductVariants(product);

  /* =======================================================
     CURRENT PRICE
  ======================================================= */

  const displayPrice = getSafeNumber(
    selectedVariant?.price ??
      (!isTypeBased && !hasVariants
        ? product.price
        : 0),
  );

  const displayMrp = getSafeNumber(
    selectedVariant?.mrp ??
      (!isTypeBased && !hasVariants
        ? product.mrp
        : 0),
  );

  const {
    hasDiscount,
    discountPct,
  } = getDiscount(
    displayPrice,
    displayMrp,
  );

  /* =======================================================
     TYPE CHANGE
  ======================================================= */

  function handleTypeChange(type) {
    setSelectedType(type);

    const firstSize =
      getFirstTypeSize(type);

    setSelectedVariant(firstSize);
    setAdded(false);
  }

  /* =======================================================
     VARIANT CHANGE
  ======================================================= */

  function handleVariantChange(variant) {
    setSelectedVariant(variant);
    setAdded(false);
  }

  /* =======================================================
     ADD TO CART
  ======================================================= */

  function handleAdd() {
    if (isTypeBased) {
      if (
        !selectedType ||
        !selectedVariant
      ) {
        return;
      }

      addItem(
        product,
        quantity,
        selectedVariant,
        selectedType,
      );

      setAdded(true);
      return;
    }

    addItem(
      product,
      quantity,
      selectedVariant,
      null,
    );

    setAdded(true);
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="container section pd">

      {/* =====================================================
          PRODUCT IMAGE
      ===================================================== */}

      <div className="pd-image">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
          />
        ) : (
          <div className="product-card-image-placeholder">
            No image
          </div>
        )}
      </div>

      {/* =====================================================
          PRODUCT INFORMATION
      ===================================================== */}

      <div className="pd-info">

        {/* CATEGORY */}

        {product.category?.name && (
          <p className="pd-category">
            {product.category.name}
          </p>
        )}

        {/* PRODUCT NAME */}

        <h1>{product.name}</h1>

        {/* ===================================================
            PRICE
        =================================================== */}

        <div className="pd-price-section">
          <span className="pd-price">
            {formatCurrency(displayPrice)}
          </span>

          {hasDiscount && (
            <>
              <span className="pd-mrp">
                {formatCurrency(displayMrp)}
              </span>

              <span className="pd-discount">
                {discountPct}% off
              </span>
            </>
          )}
        </div>

        {/* ===================================================
            TYPE-BASED PRODUCT TYPES
        =================================================== */}

        {isTypeBased && (
          <div className="pd-variants">
            <label className="pd-variants-label">
              Select Type
            </label>

            <div className="pd-variant-options">
              {product.types.map(
                (type, index) => {
                  const isSelected =
                    selectedType?.name ===
                    type.name;

                  return (
                    <button
                      type="button"
                      key={`${type.name}-${index}`}
                      className={`pd-variant-btn ${
                        isSelected
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleTypeChange(type)
                      }
                    >
                      <span className="pd-variant-size">
                        {type.name}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </div>
        )}

        {/* ===================================================
            TYPE-BASED SIZES
        =================================================== */}

        {isTypeBased &&
          selectedType &&
          Array.isArray(
            selectedType.sizes,
          ) &&
          selectedType.sizes.length > 0 && (
            <div className="pd-variants">
              <label className="pd-variants-label">
                Select Size
              </label>

              <div className="pd-variant-options">
                {selectedType.sizes.map(
                  (size, index) => (
                    <VariantOption
                      key={`${size.amount}-${size.unit}-${index}`}
                      variant={size}
                      index={index}
                      selected={
                        selectedVariant?.unit ===
                          size.unit &&
                        getSafeNumber(
                          selectedVariant?.amount,
                        ) ===
                          getSafeNumber(
                            size.amount,
                          )
                      }
                      onSelect={
                        handleVariantChange
                      }
                    />
                  ),
                )}
              </div>
            </div>
          )}

        {/* ===================================================
            STANDARD PRODUCT SIZES
        =================================================== */}

        {!isTypeBased &&
          hasVariants && (
            <div className="pd-variants">
              <label className="pd-variants-label">
                Select Size
              </label>

              <div className="pd-variant-options">
                {product.variants.map(
                  (variant, index) => (
                    <VariantOption
                      key={`${variant.amount}-${variant.unit}-${index}`}
                      variant={variant}
                      index={index}
                      selected={
                        selectedVariant?.unit ===
                          variant.unit &&
                        getSafeNumber(
                          selectedVariant?.amount,
                        ) ===
                          getSafeNumber(
                            variant.amount,
                          )
                      }
                      onSelect={
                        handleVariantChange
                      }
                    />
                  ),
                )}
              </div>
            </div>
          )}

        {/* ===================================================
            DESCRIPTION
        =================================================== */}

        {product.description && (
          <p className="pd-description">
            {product.description}
          </p>
        )}

        {/* ===================================================
            QUANTITY
        =================================================== */}

        <div className="pd-quantity">
          <label htmlFor="qty">
            Quantity
          </label>

          <div className="pd-quantity-control">
            <button
              type="button"
              onClick={() =>
                setQuantity((q) =>
                  Math.max(1, q - 1),
                )
              }
              aria-label="Decrease quantity"
            >
              −
            </button>

            <span id="qty">
              {quantity}
            </span>

            <button
              type="button"
              onClick={() =>
                setQuantity((q) => q + 1)
              }
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>

        {/* ===================================================
            ADD TO CART
        =================================================== */}

        <button
          type="button"
          className="btn btn-primary pd-add"
          onClick={handleAdd}
          disabled={
            isTypeBased &&
            (!selectedType ||
              !selectedVariant)
          }
        >
          {added
            ? "Added ✓"
            : "Add to cart"}
        </button>

        {/* ===================================================
            VIEW CART
        =================================================== */}

        {added && (
          <Link
            to="/cart"
            className="pd-cart-link"
          >
            View cart →
          </Link>
        )}
      </div>
    </div>
  );
}
