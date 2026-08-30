import { useEffect, useState, useRef } from "react";
import api from "../../services/api";
import { formatCurrency } from "../../utils/format";
import "./admin.css";

const EMPTY_FORM = {
  name: "",
  price: "",
  mrp: "",
  category: "",
  description: "",
  barcode: "",
  active: true,
};

const UNITS = ["g", "kg", "ml", "l", "pcs"];

function createEmptySize() {
  return {
    unit: "kg",
    amount: "",
    price: "",
    mrp: "",
  };
}

function createEmptyType() {
  return {
    name: "",
    sizes: [createEmptySize()],
  };
}

/* =========================================================
   STANDARD VARIANT EDITOR
========================================================= */

function VariantEditor({ variants, onChange }) {
  function updateRow(index, field, value) {
    const next = variants.map((variant, i) =>
      i === index
        ? {
            ...variant,
            [field]: value,
          }
        : variant,
    );

    onChange(next);
  }

  function addRow() {
    onChange([
      ...variants,
      {
        unit: "kg",
        amount: "",
        price: "",
        mrp: "",
      },
    ]);
  }

  function removeRow(index) {
    onChange(variants.filter((_, i) => i !== index));
  }

  return (
    <div>
      {variants.length === 0 && (
        <p
          style={{
            fontSize: 12.5,
            color: "var(--color-text-muted)",
            marginBottom: 8,
          }}
        >
          No sizes added — product will use the standard price above.
        </p>
      )}

      {variants.map((variant, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            type="number"
            min="0"
            step="any"
            placeholder="Amount"
            value={variant.amount}
            onChange={(e) => updateRow(index, "amount", e.target.value)}
            style={{
              width: 80,
              padding: "8px 10px",
              border: "1.5px solid var(--color-border)",
              borderRadius: 6,
            }}
          />

          <select
            value={variant.unit}
            onChange={(e) => updateRow(index, "unit", e.target.value)}
            style={{
              padding: "8px 10px",
              border: "1.5px solid var(--color-border)",
              borderRadius: 6,
            }}
          >
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Price ₹"
            value={variant.price}
            onChange={(e) => updateRow(index, "price", e.target.value)}
            style={{
              width: 90,
              padding: "8px 10px",
              border: "1.5px solid var(--color-border)",
              borderRadius: 6,
            }}
          />

          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="MRP ₹"
            value={variant.mrp ?? ""}
            onChange={(e) => updateRow(index, "mrp", e.target.value)}
            style={{
              width: 90,
              padding: "8px 10px",
              border: "1.5px solid var(--color-border)",
              borderRadius: 6,
            }}
          />

          <button
            type="button"
            className="icon-btn danger"
            onClick={() => removeRow(index)}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        className="btn btn-outline"
        onClick={addRow}
        style={{
          padding: "6px 14px",
          fontSize: 13,
        }}
      >
        + Add size
      </button>
    </div>
  );
}

/* =========================================================
   ADMIN PRODUCTS
========================================================= */

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [status, setStatus] = useState("loading");

  const [modal, setModal] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [variants, setVariants] = useState([]);

  const [pricingType, setPricingType] = useState("standard");

  const [types, setTypes] = useState([createEmptyType()]);

  const [imageFile, setImageFile] = useState(null);

  const [imagePreview, setImagePreview] = useState("");

  const [error, setError] = useState("");

  const [saving, setSaving] = useState(false);

  /* =========================================================
   CAMERA
========================================================= */

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const cameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  /* =========================================================
     LOAD CATEGORIES
  ========================================================= */

  useEffect(() => {
    api
      .get("/categories", {
        params: {
          includeInactive: true,
        },
      })
      .then(({ data }) => {
        setCategories(data.categories || []);
      })
      .catch(() => {
        setCategories([]);
      });
  }, []);

  /* =========================================================
     LOAD PRODUCTS
  ========================================================= */

  useEffect(() => {
    loadProducts();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, categoryFilter]);

  async function loadProducts() {
    setStatus("loading");

    try {
      const { data } = await api.get("/products", {
        params: {
          page,
          limit: 20,
          includeInactive: true,
          search: search || undefined,
          category: categoryFilter || undefined,
        },
      });

      setProducts(data.products || []);
      setPagination(data.pagination || null);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  /* =========================================================
     OPEN CREATE
  ========================================================= */

  function openCreate() {
    setForm({
      ...EMPTY_FORM,
    });

    setVariants([]);

    setPricingType("standard");

    setTypes([createEmptyType()]);

    setImageFile(null);
    setImagePreview("");

    setError("");

    closeCamera();

    setModal({
      mode: "create",
    });
  }

  /* =========================================================
     OPEN EDIT
  ========================================================= */

  function openEdit(product) {
    const currentPricingType = product.pricingType || "standard";

    setForm({
      name: product.name || "",
      price: product.price ?? "",
      mrp: product.mrp ?? "",
      category: product.category?._id || "",
      description: product.description || "",
      barcode: product.barcode || "",
      active: product.active !== false,
    });

    /*
     * Standard variants
     */
    setVariants(
      (product.variants || []).map((variant) => ({
        unit: variant.unit || "kg",
        amount: variant.amount ?? "",
        price: variant.price ?? "",
        mrp: variant.mrp ?? "",
      })),
    );

    setPricingType(currentPricingType);

    /*
     * Type-based variants
     */
    if (
      currentPricingType === "type-based" &&
      Array.isArray(product.types) &&
      product.types.length > 0
    ) {
      setTypes(
        product.types.map((type) => ({
          name: type.name || "",
          sizes:
            Array.isArray(type.sizes) && type.sizes.length > 0
              ? type.sizes.map((size) => ({
                  unit: size.unit || "kg",
                  amount: size.amount ?? "",
                  price: size.price ?? "",
                  mrp: size.mrp ?? "",
                }))
              : [createEmptySize()],
        })),
      );
    } else {
      setTypes([createEmptyType()]);
    }

    setImageFile(null);
    setImagePreview("");

    setError("");

    closeCamera();

    setModal({
      mode: "edit",
      data: product,
    });
  }

  /* =========================================================
     PRICING TYPE CHANGE
  ========================================================= */

  function handlePricingTypeChange(value) {
    setPricingType(value);

    setError("");

    if (value === "standard") {
      /*
       * Standard product:
       * price/mrp belong to product OR variants
       */
      setTypes([createEmptyType()]);
    }

    if (value === "type-based") {
      /*
       * Type-based product:
       * price/mrp come from type sizes
       */
      setVariants([]);
      setTypes([createEmptyType()]);
    }
  }

  /* =========================================================
     TYPE NAME UPDATE
  ========================================================= */

  function updateTypeName(typeIndex, value) {
    setTypes((current) =>
      current.map((type, index) =>
        index === typeIndex
          ? {
              ...type,
              name: value,
            }
          : type,
      ),
    );
  }

  /* =========================================================
     ADD TYPE
  ========================================================= */

  function addType() {
    setTypes((current) => [...current, createEmptyType()]);
  }

  /* =========================================================
     REMOVE TYPE
  ========================================================= */

  function removeType(typeIndex) {
    setTypes((current) => current.filter((_, index) => index !== typeIndex));
  }

  /* =========================================================
     UPDATE TYPE SIZE
  ========================================================= */

  function updateTypeSize(typeIndex, sizeIndex, field, value) {
    setTypes((current) =>
      current.map((type, index) => {
        if (index !== typeIndex) {
          return type;
        }

        return {
          ...type,
          sizes: type.sizes.map((size, index) =>
            index === sizeIndex
              ? {
                  ...size,
                  [field]: value,
                }
              : size,
          ),
        };
      }),
    );
  }

  /* =========================================================
     ADD TYPE SIZE
  ========================================================= */

  function addTypeSize(typeIndex) {
    setTypes((current) =>
      current.map((type, index) =>
        index === typeIndex
          ? {
              ...type,
              sizes: [...type.sizes, createEmptySize()],
            }
          : type,
      ),
    );
  }

  /* =========================================================
     REMOVE TYPE SIZE
  ========================================================= */

  function removeTypeSize(typeIndex, sizeIndex) {
    setTypes((current) =>
      current.map((type, index) =>
        index === typeIndex
          ? {
              ...type,
              sizes: type.sizes.filter((_, index) => index !== sizeIndex),
            }
          : type,
      ),
    );
  }

  /* =========================================================
     VALIDATE STANDARD VARIANTS
  ========================================================= */

  function validateStandardVariants() {
    const seen = new Set();

    for (const variant of variants) {
      if (!variant.amount || Number(variant.amount) <= 0) {
        return "Every size needs a positive amount.";
      }

      if (variant.price === "" || Number(variant.price) < 0) {
        return "Every size needs a valid price.";
      }

      if (
        variant.mrp !== "" &&
        variant.mrp != null &&
        Number(variant.mrp) < Number(variant.price)
      ) {
        return "MRP cannot be lower than selling price.";
      }

      const key = `${variant.amount}-${variant.unit}`;

      if (seen.has(key)) {
        return `Duplicate size found: ${variant.amount} ${variant.unit}.`;
      }

      seen.add(key);
    }

    return null;
  }

  /* =========================================================
     VALIDATE TYPE-BASED PRODUCTS
  ========================================================= */

  function validateTypes() {
    if (!types.length) {
      return "Add at least one product type.";
    }

    const typeNames = new Set();

    for (const type of types) {
      const typeName = type.name.trim();

      if (!typeName) {
        return "Every product type needs a name.";
      }

      const normalizedTypeName = typeName.toLowerCase();

      if (typeNames.has(normalizedTypeName)) {
        return `Duplicate product type: ${typeName}.`;
      }

      typeNames.add(normalizedTypeName);

      if (!Array.isArray(type.sizes) || type.sizes.length === 0) {
        return `Add at least one size for ${typeName}.`;
      }

      const sizeKeys = new Set();

      for (const size of type.sizes) {
        if (!size.amount || Number(size.amount) <= 0) {
          return `Every size in ${typeName} needs a positive amount.`;
        }

        if (size.price === "" || Number(size.price) < 0) {
          return `Every size in ${typeName} needs a valid price.`;
        }

        if (
          size.mrp !== "" &&
          size.mrp != null &&
          Number(size.mrp) < Number(size.price)
        ) {
          return `MRP cannot be lower than selling price for ${typeName}.`;
        }

        const sizeKey = `${size.amount}-${size.unit}`;

        if (sizeKeys.has(sizeKey)) {
          return `Duplicate size ${size.amount} ${size.unit} in ${typeName}.`;
        }

        sizeKeys.add(sizeKey);
      }
    }

    return null;
  }

  /* =========================================================
     VALIDATE FORM
  ========================================================= */

  function validateForm() {
    if (!form.name.trim()) {
      return "Product name is required.";
    }

    if (!form.category) {
      return "Please select a category.";
    }

    if (pricingType === "standard") {
      /*
       * Standard product can have:
       *
       * 1. Single price
       * OR
       * 2. Multiple variants
       */

      if (form.price === "" && variants.length === 0) {
        return "Enter a product price or add at least one size.";
      }

      if (form.price !== "" && Number(form.price) < 0) {
        return "Price cannot be negative.";
      }

      if (
        form.mrp !== "" &&
        form.mrp != null &&
        Number(form.mrp) < Number(form.price || 0)
      ) {
        return "MRP cannot be lower than selling price.";
      }

      return validateStandardVariants();
    }

    /*
     * Type-based:
     * price is stored inside types[].sizes[]
     */

    return validateTypes();
  }

  /* =========================================================
     SAVE
  ========================================================= */

  async function handleSave(e) {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const fd = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        fd.append(key, value);
      });

      /*
       * STANDARD VARIANTS
       */

      fd.append(
        "variants",
        JSON.stringify(
          pricingType === "standard"
            ? variants.map((variant) => ({
                unit: variant.unit,
                amount: Number(variant.amount),
                price: Number(variant.price),
                mrp:
                  variant.mrp === "" || variant.mrp == null
                    ? null
                    : Number(variant.mrp),
              }))
            : [],
        ),
      );

      /*
       * PRICING TYPE
       */

      fd.append("pricingType", pricingType);

      /*
       * TYPE-BASED DATA
       */

      fd.append(
        "types",
        JSON.stringify(
          pricingType === "type-based"
            ? types.map((type) => ({
                name: type.name.trim(),

                sizes: type.sizes.map((size) => ({
                  unit: size.unit,
                  amount: Number(size.amount),
                  price: Number(size.price),
                  mrp:
                    size.mrp === "" || size.mrp == null
                      ? null
                      : Number(size.mrp),
                })),
              }))
            : [],
        ),
      );

      /*
       * IMAGE
       */

      if (imageFile) {
        fd.append("image", imageFile);
      }

      /*
       * CREATE
       */

      if (modal.mode === "create") {
        await api.post("/products", fd);
      } else {
        /*
         * EDIT
         */
        await api.put(`/products/${modal.data._id}`, fd);
      }

      setModal(null);

      loadProducts();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save product.");
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     DELETE
  ========================================================= */

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This also removes its image from Cloudinary.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/products/${product._id}`);

      loadProducts();
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete product.");
    }
  }

  /* =========================================================
     TOGGLE ACTIVE
  ========================================================= */

  async function toggleActive(product) {
    try {
      const fd = new FormData();

      fd.append("active", String(!product.active));

      await api.put(`/products/${product._id}`, fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      loadProducts();
    } catch {
      alert("Could not update status.");
    }
  }

  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  /* =========================================================
   IMAGE UPLOAD
========================================================= */

  function handleImageChange(e) {
    const file = e.target.files?.[0] || null;

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    setImageFile(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    setError("");

    // Allow selecting the same image again
    e.target.value = "";
  }

  /* =========================================================
   OPEN CAMERA
========================================================= */

  async function openCamera() {
    try {
      setCameraError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera access is not supported by this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment",
          },
          width: {
            ideal: 1280,
          },
          height: {
            ideal: 720,
          },
        },
        audio: false,
      });

      cameraStreamRef.current = stream;
      setCameraOpen(true);

      // Wait until camera modal/video is mounted
      requestAnimationFrame(() => {
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;

          cameraVideoRef.current.play().catch(() => {});
        }
      });
    } catch (err) {
      console.error("Camera error:", err);

      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setCameraError(
          "Camera permission was denied. Please allow camera access in your browser.",
        );
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera was found on this device.");
      } else if (err.name === "NotReadableError") {
        setCameraError(
          "The camera is already being used by another application.",
        );
      } else {
        setCameraError(
          "Unable to open the camera. Please check your browser permissions.",
        );
      }
    }
  }

  /* =========================================================
   CLOSE CAMERA
========================================================= */

  function closeCamera() {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      cameraStreamRef.current = null;
    }

    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }

    setCameraOpen(false);
    setCameraError("");
  }

  /* =========================================================
   CAPTURE PHOTO
========================================================= */

  function capturePhoto() {
    const video = cameraVideoRef.current;

    if (!video) return;

    if (!video.videoWidth || !video.videoHeight) {
      setCameraError("Camera is not ready yet. Please wait a moment.");
      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError("Could not capture the photo.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Could not create the image.");
          return;
        }

        const file = new File([blob], `product-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        setImageFile(file);

        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);

        setError("");

        closeCamera();
      },
      "image/jpeg",
      0.9,
    );
  }

  /* =========================================================
   CAMERA CLEANUP
========================================================= */

  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="admin-page-header">
        <h1>Products</h1>

        <button className="btn btn-primary" onClick={openCreate}>
          + Add product
        </button>
      </div>

      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div className="admin-toolbar">
        <input
          placeholder="Search products…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />

        <select
          value={categoryFilter}
          onChange={(e) => {
            setPage(1);
            setCategoryFilter(e.target.value);
          }}
        >
          <option value="">All categories</option>

          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* =====================================================
          PRODUCT TABLE
      ===================================================== */}

      <div className="admin-card">
        {status === "loading" && <p>Loading…</p>}

        {status === "error" && (
          <p className="field-error">Couldn't load products.</p>
        )}

        {status === "ready" && (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Options</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => {
                  const isTypeBased = product.pricingType === "type-based";

                  const typeCount = product.types?.length || 0;

                  const variantCount = product.variants?.length || 0;

                  return (
                    <tr key={product._id}>
                      <td>
                        {product.imageUrl ? (
                          <img
                            className="thumb"
                            src={product.imageUrl}
                            alt=""
                          />
                        ) : null}
                      </td>

                      <td>{product.name}</td>

                      <td>{product.category?.name || "—"}</td>

                      <td>
                        {isTypeBased
                          ? "Type-based"
                          : formatCurrency(product.price)}
                      </td>

                      <td>
                        {isTypeBased
                          ? `${typeCount} types`
                          : variantCount
                            ? `${variantCount} sizes`
                            : "Single price"}
                      </td>

                      <td>
                        <button
                          className={`badge ${
                            product.active ? "badge-active" : "badge-inactive"
                          }`}
                          style={{
                            border: "none",
                          }}
                          onClick={() => toggleActive(product)}
                        >
                          {product.active ? "Active" : "Inactive"}
                        </button>
                      </td>

                      <td>
                        <button
                          className="icon-btn"
                          onClick={() => openEdit(product)}
                        >
                          Edit
                        </button>

                        <button
                          className="icon-btn danger"
                          onClick={() => handleDelete(product)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {products.length === 0 && (
                  <tr>
                    <td colSpan={7}>No products found.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* =================================================
                PAGINATION
            ================================================= */}

            {pagination && pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>

                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  className="btn btn-outline"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <form
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSave}
          >
            <h2>{modal.mode === "create" ? "Add product" : "Edit product"}</h2>

            <div className="form-grid">
              {/* =================================================
                  NAME
              ================================================= */}

              <label>
                Name
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </label>

              {/* =================================================
                  PRICING TYPE
              ================================================= */}

              <label>
                Pricing Type
                <select
                  value={pricingType}
                  onChange={(e) => handlePricingTypeChange(e.target.value)}
                >
                  <option value="standard">Standard Price</option>

                  <option value="type-based">Type-based Price</option>
                </select>
              </label>

              {/* =================================================
                  STANDARD PRICE
              ================================================= */}

              {pricingType === "standard" && (
                <>
                  <label>
                    Price (₹)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          price: e.target.value,
                        })
                      }
                      required={variants.length === 0}
                    />
                  </label>

                  <label>
                    MRP (₹)
                    <span
                      style={{
                        fontWeight: 400,
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {" "}
                      — optional
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.mrp}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          mrp: e.target.value,
                        })
                      }
                      placeholder="e.g. 120"
                    />
                  </label>

                  {/* STANDARD SIZES */}

                  <div
                    style={{
                      gridColumn: "1 / -1",
                    }}
                  >
                    <label>Sizes / quantities</label>

                    <VariantEditor variants={variants} onChange={setVariants} />
                  </div>
                </>
              )}

              {/* =================================================
                  TYPE BASED
              ================================================= */}

              {pricingType === "type-based" && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                  }}
                >
                  <label>Product Types / Quality</label>

                  <p
                    style={{
                      fontSize: 12.5,
                      color: "var(--color-text-muted)",
                      margin: "4px 0 12px",
                    }}
                  >
                    Example: Rice → Kolam, Basmati, HMT. Each type can have its
                    own sizes and prices.
                  </p>

                  {types.map((type, typeIndex) => (
                    <div
                      key={typeIndex}
                      style={{
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 14,
                      }}
                    >
                      {/* TYPE NAME */}

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          marginBottom: 12,
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Type name e.g. Kolam Rice"
                          value={type.name}
                          onChange={(e) =>
                            updateTypeName(typeIndex, e.target.value)
                          }
                          style={{
                            flex: 1,
                          }}
                        />

                        {types.length > 1 && (
                          <button
                            type="button"
                            className="icon-btn danger"
                            onClick={() => removeType(typeIndex)}
                          >
                            Remove type
                          </button>
                        )}
                      </div>

                      {/* SIZES */}

                      <strong
                        style={{
                          display: "block",
                          marginBottom: 8,
                          fontSize: 13,
                        }}
                      >
                        Sizes & Prices
                      </strong>

                      {type.sizes.map((size, sizeIndex) => (
                        <div
                          key={sizeIndex}
                          style={{
                            display: "flex",
                            gap: 6,
                            marginBottom: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          {/* AMOUNT */}

                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="Amount"
                            value={size.amount}
                            onChange={(e) =>
                              updateTypeSize(
                                typeIndex,
                                sizeIndex,
                                "amount",
                                e.target.value,
                              )
                            }
                            style={{
                              width: 80,
                              padding: "8px 10px",
                              border: "1.5px solid var(--color-border)",
                              borderRadius: 6,
                            }}
                          />

                          {/* UNIT */}

                          <select
                            value={size.unit}
                            onChange={(e) =>
                              updateTypeSize(
                                typeIndex,
                                sizeIndex,
                                "unit",
                                e.target.value,
                              )
                            }
                            style={{
                              padding: "8px 10px",
                              border: "1.5px solid var(--color-border)",
                              borderRadius: 6,
                            }}
                          >
                            {UNITS.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>

                          {/* PRICE */}

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Price ₹"
                            value={size.price}
                            onChange={(e) =>
                              updateTypeSize(
                                typeIndex,
                                sizeIndex,
                                "price",
                                e.target.value,
                              )
                            }
                            style={{
                              width: 90,
                              padding: "8px 10px",
                              border: "1.5px solid var(--color-border)",
                              borderRadius: 6,
                            }}
                          />

                          {/* MRP */}

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="MRP ₹"
                            value={size.mrp ?? ""}
                            onChange={(e) =>
                              updateTypeSize(
                                typeIndex,
                                sizeIndex,
                                "mrp",
                                e.target.value,
                              )
                            }
                            style={{
                              width: 90,
                              padding: "8px 10px",
                              border: "1.5px solid var(--color-border)",
                              borderRadius: 6,
                            }}
                          />

                          {/* REMOVE SIZE */}

                          {type.sizes.length > 1 && (
                            <button
                              type="button"
                              className="icon-btn danger"
                              onClick={() =>
                                removeTypeSize(typeIndex, sizeIndex)
                              }
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}

                      {/* ADD SIZE */}

                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => addTypeSize(typeIndex)}
                        style={{
                          padding: "6px 14px",
                          fontSize: 13,
                        }}
                      >
                        + Add size
                      </button>
                    </div>
                  ))}

                  {/* ADD TYPE */}

                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={addType}
                    style={{
                      padding: "6px 14px",
                      fontSize: 13,
                    }}
                  >
                    + Add product type
                  </button>
                </div>
              )}

              {/* =================================================
                  CATEGORY
              ================================================= */}

              <label>
                Category
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select category</option>

                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* =================================================
                  BARCODE
              ================================================= */}

              <label>
                Barcode
                <input
                  value={form.barcode}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      barcode: e.target.value,
                    })
                  }
                  placeholder="For billing software reference"
                />
              </label>

              {/* =================================================
                  DESCRIPTION
              ================================================= */}

              <label>
                Description
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                />
              </label>

              {/* =================================================
                  IMAGE
              ================================================= */}

              <div className="product-image-upload">
                <label className="form-label">Product image</label>

                <div className="image-upload-options">
                  {/* TAKE PHOTO */}
                  <button
                    type="button"
                    className="image-upload-option"
                    onClick={openCamera}
                  >
                    <span className="image-upload-icon">📷</span>

                    <span>
                      <strong>Take Photo</strong>
                      <small>Use camera</small>
                    </span>
                  </button>

                  {/* CHOOSE IMAGE */}
                  <button
                    type="button"
                    className="image-upload-option"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="image-upload-icon">🖼️</span>

                    <span>
                      <strong>Choose Image</strong>
                      <small>From device</small>
                    </span>
                  </button>
                </div>

                {/* NORMAL FILE PICKER */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  hidden
                />

                {/* IMAGE PREVIEW */}
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Product preview" />

                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* =================================================
                  ACTIVE
              ================================================= */}

              <label className="form-grid-check">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      active: e.target.checked,
                    })
                  }
                />
                Active
              </label>

              {/* =================================================
                  ERROR
              ================================================= */}

              {error && <p className="field-error">{error}</p>}
            </div>

            {/* =================================================
                MODAL ACTIONS
            ================================================= */}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setModal(null)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>

          {/* =========================================================
    CAMERA MODAL
========================================================= */}

          {cameraOpen && (
            <div className="camera-modal-backdrop" onClick={closeCamera}>
              <div
                className="camera-modal"
                onClick={(e) => e.stopPropagation()}
              >
                {/* HEADER */}

                <div className="camera-modal-header">
                  <div>
                    <h3>Take Product Photo</h3>
                    <p>Position the product inside the frame</p>
                  </div>

                  <button
                    type="button"
                    className="camera-close-btn"
                    onClick={closeCamera}
                    aria-label="Close camera"
                  >
                    ×
                  </button>
                </div>

                {/* CAMERA */}

                <div className="camera-preview-container">
                  <video
                    ref={cameraVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="camera-video"
                  />

                  {/* CAMERA FRAME */}

                  <div className="camera-frame" aria-hidden="true" />

                  {/* ERROR */}

                  {cameraError && (
                    <div className="camera-error">{cameraError}</div>
                  )}
                </div>

                {/* CONTROLS */}

                <div className="camera-controls">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={closeCamera}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="camera-capture-btn"
                    onClick={capturePhoto}
                    disabled={!!cameraError}
                  >
                    <span>●</span>
                    Capture Photo
                  </button>
                </div>
              </div>
            </div>
          )}
          
        </div>
      )}
    </div>
  );
}
