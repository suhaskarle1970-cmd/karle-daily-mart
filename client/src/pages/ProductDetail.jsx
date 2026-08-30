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
  const [selectedType, setSelectedType] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setProduct(null);
    setSelectedType(null);
    setSelectedVariant(null);
    setQuantity(1);
    setAdded(false);
    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        if (cancelled) return;
        const fetchedProduct = data.product;
        if (!fetchedProduct) {
          setStatus("error");
          return;
        }
        setProduct(fetchedProduct);
        const isTypeBased =
          fetchedProduct.pricingType === "type-based" &&
          Array.isArray(fetchedProduct.types) &&
          fetchedProduct.types.length > 0;
        if (isTypeBased) {
          const firstType = fetchedProduct.types[0];
          setSelectedType(firstType);
          const firstSize =
            Array.isArray(firstType.sizes) && firstType.sizes.length > 0
              ? firstType.sizes[0]
              : null;
          setSelectedVariant(firstSize);
        } else {
          setSelectedType(null);
          const firstVariant =
            Array.isArray(fetchedProduct.variants) &&
            fetchedProduct.variants.length > 0
              ? fetchedProduct.variants[0]
              : null;
          setSelectedVariant(firstVariant);
        }
        setStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to load product:", error);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);
  if (status === "loading") {
    return <div className="container section">Loading…</div>;
  }
  if (status === "error" || !product) {
    return (
      <div className="container section">
        {" "}
        <ErrorState message="We couldn't find that product." />{" "}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          {" "}
          <Link to="/products" className="btn btn-outline">
            {" "}
            Back to shop{" "}
          </Link>{" "}
        </div>{" "}
      </div>
    );
  }
  const isTypeBased =
    product.pricingType === "type-based" &&
    Array.isArray(product.types) &&
    product.types.length > 0;
  const hasVariants =
    !isTypeBased &&
    Array.isArray(product.variants) &&
    product.variants.length > 0;
  /* * --------------------------------------------------------- * CURRENT PRICE * --------------------------------------------------------- */ const displayPrice =
    isTypeBased
      ? Number(selectedVariant?.price || 0)
      : hasVariants
        ? Number(selectedVariant?.price || 0)
        : Number(product.price || 0);
  const displayMrp = isTypeBased
    ? Number(selectedVariant?.mrp || 0)
    : hasVariants
      ? Number(selectedVariant?.mrp || 0)
      : Number(product.mrp || 0);
  const hasDiscount = displayMrp > displayPrice && displayMrp > 0;
  const discountPct = hasDiscount
    ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100)
    : 0;
  /* * --------------------------------------------------------- * TYPE CHANGE * --------------------------------------------------------- */ function handleTypeChange(
    type,
  ) {
    setSelectedType(type);
    const firstSize =
      Array.isArray(type.sizes) && type.sizes.length > 0 ? type.sizes[0] : null;
    setSelectedVariant(firstSize);
    setAdded(false);
  }
  /* * --------------------------------------------------------- * SIZE / VARIANT CHANGE * --------------------------------------------------------- */ function handleVariantChange(
    variant,
  ) {
    setSelectedVariant(variant);
    setAdded(false);
  }
  /* * --------------------------------------------------------- * ADD TO CART * --------------------------------------------------------- */ function handleAdd() {
    if (isTypeBased) {
      if (!selectedType || !selectedVariant) {
        return;
      }
      addItem(product, quantity, selectedVariant, selectedType);
      setAdded(true);
      return;
    }
    addItem(product, quantity, selectedVariant, null);
    setAdded(true);
  }
  return (
    <div className="container section pd">
      {" "}
      {/* ===================================================== PRODUCT IMAGE ===================================================== */}{" "}
      <div className="pd-image">
        {" "}
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} />
        ) : (
          <div className="product-card-image-placeholder"> No image </div>
        )}{" "}
      </div>{" "}
      {/* ===================================================== PRODUCT INFORMATION ===================================================== */}{" "}
      <div className="pd-info">
        {" "}
        {product.category?.name && (
          <p className="pd-category"> {product.category.name} </p>
        )}{" "}
        <h1>{product.name}</h1>{" "}
        {/* ================================================= PRICE ================================================= */}{" "}
        <div className="pd-price-section">
          {" "}
          <span className="pd-price">
            {" "}
            {formatCurrency(displayPrice)}{" "}
          </span>{" "}
          {hasDiscount && (
            <>
              {" "}
              <span className="pd-mrp">
                {" "}
                {formatCurrency(displayMrp)}{" "}
              </span>{" "}
              <span className="pd-discount"> {discountPct}% off </span>{" "}
            </>
          )}{" "}
        </div>{" "}
        {/* ================================================= TYPE-BASED PRODUCTS ================================================= */}{" "}
        {isTypeBased && (
          <div className="pd-variants">
            {" "}
            <label className="pd-variants-label"> Select Type </label>{" "}
            <div className="pd-variant-options">
              {" "}
              {product.types.map((type, index) => {
                const isSelected = selectedType?.name === type.name;
                return (
                  <button
                    type="button"
                    key={`${type.name}-${index}`}
                    className={`pd-variant-btn ${isSelected ? "selected" : ""}`}
                    onClick={() => handleTypeChange(type)}
                  >
                    {" "}
                    <span className="pd-variant-size"> {type.name} </span>{" "}
                  </button>
                );
              })}{" "}
            </div>{" "}
          </div>
        )}{" "}
        {/* ================================================= TYPE-BASED SIZES ================================================= */}{" "}
        {isTypeBased &&
          selectedType &&
          Array.isArray(selectedType.sizes) &&
          selectedType.sizes.length > 0 && (
            <div className="pd-variants">
              {" "}
              <label className="pd-variants-label"> Select Size </label>{" "}
              <div className="pd-variant-options">
                {" "}
                {selectedType.sizes.map((size, index) => {
                  const label = `${size.amount} ${size.unit}`;
                  const isSelected =
                    selectedVariant?.unit === size.unit &&
                    Number(selectedVariant?.amount) === Number(size.amount);
                  const sizePrice = Number(size.price || 0);
                  const sizeMrp = Number(size.mrp || 0);
                  const sizeHasDiscount = sizeMrp > sizePrice && sizeMrp > 0;
                  const sizeDiscount = sizeHasDiscount
                    ? Math.round(((sizeMrp - sizePrice) / sizeMrp) * 100)
                    : 0;
                  return (
                    <button
                      type="button"
                      key={`${label}-${index}`}
                      className={`pd-variant-btn ${isSelected ? "selected" : ""}`}
                      onClick={() => handleVariantChange(size)}
                    >
                      {" "}
                      <span className="pd-variant-size"> {label} </span>{" "}
                      <span className="pd-variant-price">
                        {" "}
                        {formatCurrency(sizePrice)}{" "}
                      </span>{" "}
                      {sizeHasDiscount && (
                        <span className="pd-variant-price-row">
                          {" "}
                          <span className="pd-variant-mrp">
                            {" "}
                            {formatCurrency(sizeMrp)}{" "}
                          </span>{" "}
                          <span className="pd-variant-discount">
                            {" "}
                            {sizeDiscount}% off{" "}
                          </span>{" "}
                        </span>
                      )}{" "}
                    </button>
                  );
                })}{" "}
              </div>{" "}
            </div>
          )}{" "}
        {/* ================================================= STANDARD PRODUCT SIZES ================================================= */}{" "}
        {!isTypeBased && hasVariants && (
          <div className="pd-variants">
            {" "}
            <label className="pd-variants-label"> Select Size </label>{" "}
            <div className="pd-variant-options">
              {" "}
              {product.variants.map((variant, index) => {
                const label = `${variant.amount} ${variant.unit}`;
                const isSelected =
                  selectedVariant?.unit === variant.unit &&
                  Number(selectedVariant?.amount) === Number(variant.amount);
                const variantPrice = Number(variant.price || 0);
                const variantMrp = Number(variant.mrp || 0);
                const variantHasDiscount =
                  variantMrp > variantPrice && variantMrp > 0;
                const variantDiscount = variantHasDiscount
                  ? Math.round(((variantMrp - variantPrice) / variantMrp) * 100)
                  : 0;
                return (
                  <button
                    type="button"
                    key={`${label}-${index}`}
                    className={`pd-variant-btn ${isSelected ? "selected" : ""}`}
                    onClick={() => handleVariantChange(variant)}
                  >
                    {" "}
                    <span className="pd-variant-size"> {label} </span>{" "}
                    <span className="pd-variant-price">
                      {" "}
                      {formatCurrency(variantPrice)}{" "}
                    </span>{" "}
                    {variantHasDiscount && (
                      <span className="pd-variant-price-row">
                        {" "}
                        <span className="pd-variant-mrp">
                          {" "}
                          {formatCurrency(variantMrp)}{" "}
                        </span>{" "}
                        <span className="pd-variant-discount">
                          {" "}
                          {variantDiscount}% off{" "}
                        </span>{" "}
                      </span>
                    )}{" "}
                  </button>
                );
              })}{" "}
            </div>{" "}
          </div>
        )}{" "}
        {/* ================================================= DESCRIPTION ================================================= */}{" "}
        {product.description && (
          <p className="pd-description"> {product.description} </p>
        )}{" "}
        {/* ================================================= QUANTITY ================================================= */}{" "}
        <div className="pd-quantity">
          {" "}
          <label htmlFor="qty"> Quantity </label>{" "}
          <div className="pd-quantity-control">
            {" "}
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
            >
              {" "}
              −{" "}
            </button>{" "}
            <span id="qty"> {quantity} </span>{" "}
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Increase quantity"
            >
              {" "}
              +{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
        {/* ================================================= ADD TO CART ================================================= */}{" "}
        <button
          type="button"
          className="btn btn-primary pd-add"
          onClick={handleAdd}
          disabled={isTypeBased && (!selectedType || !selectedVariant)}
        >
          {" "}
          {added ? "Added ✓" : "Add to cart"}{" "}
        </button>{" "}
        {/* ================================================= VIEW CART ================================================= */}{" "}
        {added && (
          <Link to="/cart" className="pd-cart-link">
            {" "}
            View cart →{" "}
          </Link>
        )}{" "}
      </div>{" "}
    </div>
  );
}
