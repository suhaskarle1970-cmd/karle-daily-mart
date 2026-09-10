import { useCallback, useEffect, useRef, useState } from "react";
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
  featured: false,
};

const UNITS = ["g", "kg", "ml", "l", "pcs"];

const DEFAULT_SIZE = {
  unit: "kg",
  amount: "",
  price: "",
  mrp: "",
};

const DEFAULT_TYPE = {
  name: "",
  sizes: [DEFAULT_SIZE],
};

function createEmptySize() {
  return { ...DEFAULT_SIZE };
}

function createEmptyType() {
  return {
    name: "",
    sizes: [createEmptySize()],
  };
}

/* =========================================================
   HELPERS
========================================================= */

function isValidNonNegativeNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return false;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0;
}

function normalizeOptionalNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

/* =========================================================
   VARIANT EDITOR
========================================================= */

function VariantEditor({ variants, onChange }) {
  const updateRow = useCallback(
    (index, field, value) => {
      onChange(
        variants.map((variant, rowIndex) =>
          rowIndex === index
            ? {
                ...variant,
                [field]: value,
              }
            : variant,
        ),
      );
    },
    [variants, onChange],
  );

  const addRow = useCallback(() => {
    onChange([
      ...variants,
      createEmptySize(),
    ]);
  }, [variants, onChange]);

  const removeRow = useCallback(
    (index) => {
      onChange(
        variants.filter(
          (_, rowIndex) => rowIndex !== index,
        ),
      );
    },
    [variants, onChange],
  );

  return (
    <div className="variant-editor">
      {variants.length === 0 && (
        <p className="form-help">
          No sizes added — product will use the standard
          price above.
        </p>
      )}

      {variants.map((variant, index) => (
        <div
          className="variant-row"
          key={`variant-${index}`}
        >
          <input
            type="number"
            min="0"
            step="any"
            placeholder="Amount"
            value={variant.amount}
            onChange={(e) =>
              updateRow(
                index,
                "amount",
                e.target.value,
              )
            }
          />

          <select
            value={variant.unit}
            onChange={(e) =>
              updateRow(
                index,
                "unit",
                e.target.value,
              )
            }
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
            onChange={(e) =>
              updateRow(
                index,
                "price",
                e.target.value,
              )
            }
          />

          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="MRP ₹"
            value={variant.mrp ?? ""}
            onChange={(e) =>
              updateRow(
                index,
                "mrp",
                e.target.value,
              )
            }
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

  const [searchInput, setSearchInput] = useState("");
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
     CAMERA STATE
  ========================================================= */

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const cameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  const fileInputRef = useRef(null);

  /* =========================================================
     LOAD CATEGORIES
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        const { data } = await api.get("/categories", {
          params: {
            includeInactive: true,
          },
        });

        if (mounted) {
          setCategories(data.categories || []);
        }
      } catch {
        if (mounted) {
          setCategories([]);
        }
      }
    }

    loadCategories();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
     SEARCH DEBOUNCE
  ========================================================= */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  /* =========================================================
     LOAD PRODUCTS
  ========================================================= */

  const loadProducts = useCallback(async () => {
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
      setProducts([]);
      setPagination(null);
      setStatus("error");
    }
  }, [page, search, categoryFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  /* =========================================================
     IMAGE PREVIEW CLEANUP
  ========================================================= */

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  /* =========================================================
     CAMERA CLEANUP
  ========================================================= */

  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());

      cameraStreamRef.current = null;
    }

    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
  }, []);

  const closeCamera = useCallback(() => {
    stopCamera();
    setCameraOpen(false);
    setCameraError("");
  }, [stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  /* =========================================================
     FORM RESET
  ========================================================= */

  function resetForm() {
    setForm({ ...EMPTY_FORM });

    setVariants([]);

    setPricingType("standard");

    setTypes([createEmptyType()]);

    setImageFile(null);
    setImagePreview("");

    setError("");
  }

  /* =========================================================
     OPEN CREATE
  ========================================================= */

  function openCreate() {
    closeCamera();
    resetForm();

    setModal({
      mode: "create",
    });
  }

  /* =========================================================
     OPEN EDIT
  ========================================================= */

  function openEdit(product) {
    closeCamera();

    const currentPricingType = product.pricingType || "standard";

    setForm({
      name: product.name || "",
      price: product.price ?? "",
      mrp: product.mrp ?? "",
      category: product.category?._id || "",
      description: product.description || "",
      barcode: product.barcode || "",
      active: product.active !== false,
      featured: product.featured === true,
    });

    setVariants(
      Array.isArray(product.variants)
        ? product.variants.map((variant) => ({
            unit: variant.unit || "kg",
            amount: variant.amount ?? "",
            price: variant.price ?? "",
            mrp: variant.mrp ?? "",
          }))
        : [],
    );

    setPricingType(currentPricingType);

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

    setModal({
      mode: "edit",
      data: product,
    });
  }

  /* =========================================================
     CLOSE MODAL
  ========================================================= */

  function closeModal() {
    if (saving) return;

    closeCamera();
    setModal(null);
    setError("");
  }

  /* =========================================================
     FORM UPDATE
  ========================================================= */

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /* =========================================================
     PRICING TYPE
  ========================================================= */

  function handlePricingTypeChange(value) {
    setPricingType(value);
    setError("");

    if (value === "standard") {
      setTypes([createEmptyType()]);
    }

    if (value === "type-based") {
      setVariants([]);
      setTypes([createEmptyType()]);

      setForm((current) => ({
        ...current,
        price: "",
        mrp: "",
      }));
    }
  }

  /* =========================================================
     STANDARD VARIANTS
  ========================================================= */

  function validateStandardVariants() {
    const seen = new Set();

    for (const variant of variants) {
      if (
        !isValidNonNegativeNumber(variant.amount) ||
        Number(variant.amount) <= 0
      ) {
        return "Every size needs a positive amount.";
      }

      if (!isValidNonNegativeNumber(variant.price)) {
        return "Every size needs a valid price.";
      }

      if (
        variant.mrp !== "" &&
        variant.mrp !== null &&
        variant.mrp !== undefined
      ) {
        if (!isValidNonNegativeNumber(variant.mrp)) {
          return "Every MRP must be a valid number.";
        }

        if (Number(variant.mrp) < Number(variant.price)) {
          return "MRP cannot be lower than selling price.";
        }
      }

      const key = `${Number(variant.amount)}-${variant.unit}`;

      if (seen.has(key)) {
        return `Duplicate size found: ${variant.amount} ${variant.unit}.`;
      }

      seen.add(key);
    }

    return null;
  }

  /* =========================================================
     TYPE-BASED VALIDATION
  ========================================================= */

  function validateTypes() {
    if (!types.length) {
      return "Add at least one product type.";
    }

    const typeNames = new Set();

    for (const type of types) {
      const typeName = String(type.name || "").trim();

      if (!typeName) {
        return "Every product type needs a name.";
      }

      const normalizedName = typeName.toLowerCase();

      if (typeNames.has(normalizedName)) {
        return `Duplicate product type: ${typeName}.`;
      }

      typeNames.add(normalizedName);

      if (!Array.isArray(type.sizes) || type.sizes.length === 0) {
        return `Add at least one size for ${typeName}.`;
      }

      const sizeKeys = new Set();

      for (const size of type.sizes) {
        if (
          !isValidNonNegativeNumber(size.amount) ||
          Number(size.amount) <= 0
        ) {
          return `Every size in ${typeName} needs a positive amount.`;
        }

        if (!isValidNonNegativeNumber(size.price)) {
          return `Every size in ${typeName} needs a valid price.`;
        }

        if (size.mrp !== "" && size.mrp !== null && size.mrp !== undefined) {
          if (!isValidNonNegativeNumber(size.mrp)) {
            return `Every MRP in ${typeName} must be valid.`;
          }

          if (Number(size.mrp) < Number(size.price)) {
            return `MRP cannot be lower than selling price for ${typeName}.`;
          }
        }

        const sizeKey = `${Number(size.amount)}-${size.unit}`;

        if (sizeKeys.has(sizeKey)) {
          return `Duplicate size ${size.amount} ${size.unit} in ${typeName}.`;
        }

        sizeKeys.add(sizeKey);
      }
    }

    return null;
  }

  /* =========================================================
     FORM VALIDATION
  ========================================================= */

  function validateForm() {
    const name = form.name.trim();

    if (!name) {
      return "Product name is required.";
    }

    if (name.length > 150) {
      return "Product name cannot exceed 150 characters.";
    }

    if (!form.category) {
      return "Please select a category.";
    }

    if (pricingType === "standard") {
      if (form.price === "" && variants.length === 0) {
        return "Enter a product price or add at least one size.";
      }

      if (form.price !== "" && !isValidNonNegativeNumber(form.price)) {
        return "Price must be a valid non-negative number.";
      }

      if (form.mrp !== "" && form.mrp !== null && form.mrp !== undefined) {
        if (!isValidNonNegativeNumber(form.mrp)) {
          return "MRP must be a valid non-negative number.";
        }

        if (Number(form.mrp) < Number(form.price || 0)) {
          return "MRP cannot be lower than selling price.";
        }
      }

      return validateStandardVariants();
    }

    return validateTypes();
  }

  /* =========================================================
     BUILD FORM DATA
  ========================================================= */

  function buildFormData() {
    const fd = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      fd.append(key, value ?? "");
    });

    fd.append("pricingType", pricingType);

    fd.append(
      "variants",
      JSON.stringify(
        pricingType === "standard"
          ? variants.map((variant) => ({
              unit: variant.unit,
              amount: Number(variant.amount),
              price: Number(variant.price),
              mrp: normalizeOptionalNumber(variant.mrp),
            }))
          : [],
      ),
    );

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
                mrp: normalizeOptionalNumber(size.mrp),
              })),
            }))
          : [],
      ),
    );

    if (imageFile) {
      fd.append("image", imageFile);
    }

    return fd;
  }

  /* =========================================================
     SAVE
  ========================================================= */

  async function handleSave(e) {
    e.preventDefault();

    if (saving) return;

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const fd = buildFormData();

      if (modal.mode === "create") {
        await api.post("/products", fd);
      } else {
        await api.put(`/products/${modal.data._id}`, fd);
      }

      closeCamera();
      setModal(null);
      setError("");

      await loadProducts();
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
      `Delete "${product.name}"?\n\nThis will also remove its product image from Cloudinary if your server is configured to do so.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/products/${product._id}`);

      await loadProducts();
    } catch (err) {
      window.alert(err.response?.data?.message || "Could not delete product.");
    }
  }

  /* =========================================================
     TOGGLE ACTIVE
  ========================================================= */

  async function toggleActive(product) {
    const nextActive = !product.active;

    try {
      const fd = new FormData();

      fd.append("active", String(nextActive));

      await api.put(`/products/${product._id}`, fd);

      setProducts((current) =>
        current.map((item) =>
          item._id === product._id
            ? {
                ...item,
                active: nextActive,
              }
            : item,
        ),
      );
    } catch (err) {
      window.alert(err.response?.data?.message || "Could not update status.");
    }
  }

  /* =========================================================
     TOGGLE FEATURED
  ========================================================= */

  async function toggleFeatured(product) {
    const nextFeatured = !product.featured;

    try {
      const fd = new FormData();

      fd.append("featured", String(nextFeatured));

      await api.put(`/products/${product._id}`, fd);

      setProducts((current) =>
        current.map((item) =>
          item._id === product._id
            ? {
                ...item,
                featured: nextFeatured,
              }
            : item,
        ),
      );
    } catch (err) {
      window.alert(
        err.response?.data?.message || "Could not update featured status.",
      );
    }
  }

  /* =========================================================
     IMAGE UPLOAD
  ========================================================= */

  function handleImageChange(e) {
    const file = e.target.files?.[0];

    e.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      return;
    }

    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setImageFile(file);
    setImagePreview(previewUrl);
    setError("");
  }

  function removeImage() {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(null);
    setImagePreview("");
  }

  /* =========================================================
     CAMERA
  ========================================================= */

  async function openCamera() {
    if (cameraOpen) return;

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
      } else if (err.name === "SecurityError") {
        setCameraError(
          "Camera access requires a secure connection (HTTPS or localhost).",
        );
      } else {
        setCameraError(
          "Unable to open the camera. Please check your browser permissions.",
        );
      }
    }
  }

  /* =========================================================
     ATTACH CAMERA STREAM
  ========================================================= */

  useEffect(() => {
    if (!cameraOpen || !cameraVideoRef.current || !cameraStreamRef.current) {
      return;
    }

    const video = cameraVideoRef.current;

    video.srcObject = cameraStreamRef.current;

    video.play().catch(() => {});

    return () => {
      video.srcObject = null;
    };
  }, [cameraOpen]);

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

        if (imagePreview && imagePreview.startsWith("blob:")) {
          URL.revokeObjectURL(imagePreview);
        }

        const previewUrl = URL.createObjectURL(file);

        setImageFile(file);
        setImagePreview(previewUrl);
        setError("");

        closeCamera();
      },
      "image/jpeg",
      0.9,
    );
  }

  /* =========================================================
     TYPE HELPERS
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

  function addType() {
    setTypes((current) => [...current, createEmptyType()]);
  }

  function removeType(typeIndex) {
    setTypes((current) => current.filter((_, index) => index !== typeIndex));
  }

  function updateTypeSize(typeIndex, sizeIndex, field, value) {
    setTypes((current) =>
      current.map((type, index) => {
        if (index !== typeIndex) {
          return type;
        }

        return {
          ...type,
          sizes: type.sizes.map((size, currentSizeIndex) =>
            currentSizeIndex === sizeIndex
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

  function removeTypeSize(typeIndex, sizeIndex) {
    setTypes((current) =>
      current.map((type, index) =>
        index === typeIndex
          ? {
              ...type,
              sizes: type.sizes.filter(
                (_, currentSizeIndex) => currentSizeIndex !== sizeIndex,
              ),
            }
          : type,
      ),
    );
  }

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

        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Add product
        </button>
      </div>

      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Search products…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Search products"
        />

        <select
          value={categoryFilter}
          onChange={(e) => {
            setPage(1);
            setCategoryFilter(e.target.value);
          }}
          aria-label="Filter by category"
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
          <div>
            <p className="field-error">Couldn't load products.</p>

            <button
              type="button"
              className="btn btn-outline"
              onClick={loadProducts}
            >
              Try again
            </button>
          </div>
        )}

        {status === "ready" && (
          <>
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col"></th>
                    <th scope="col">Name</th>
                    <th scope="col">Category</th>
                    <th scope="col">Price</th>
                    <th scope="col">Options</th>
                    <th scope="col">Featured</th>
                    <th scope="col">Status</th>
                    <th scope="col"></th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => {
                    const isTypeBased = product.pricingType === "type-based";

                    const typeCount = Array.isArray(product.types)
                      ? product.types.length
                      : 0;

                    const variantCount = Array.isArray(product.variants)
                      ? product.variants.length
                      : 0;

                    return (
                      <tr key={product._id}>
                        <td>
                          {product.imageUrl ? (
                            <img
                              className="thumb"
                              src={product.imageUrl}
                              alt=""
                              loading="lazy"
                            />
                          ) : (
                            <span>—</span>
                          )}
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
                            type="button"
                            className={`badge ${
                              product.featured
                                ? "badge-active"
                                : "badge-inactive"
                            }`}
                            onClick={() => toggleFeatured(product)}
                            aria-label={`${
                              product.featured ? "Remove" : "Add"
                            } ${product.name} ${
                              product.featured
                                ? "from featured products"
                                : "to featured products"
                            }`}
                          >
                            {product.featured ? "Featured" : "No"}
                          </button>
                        </td>

                        <td>
                          <button
                            type="button"
                            className={`badge ${
                              product.active ? "badge-active" : "badge-inactive"
                            }`}
                            onClick={() => toggleActive(product)}
                            aria-label={`Set ${product.name} ${
                              product.active ? "inactive" : "active"
                            }`}
                          >
                            {product.active ? "Active" : "Inactive"}
                          </button>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => openEdit(product)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
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
                      <td colSpan={8}>No products found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* =================================================
                PAGINATION
            ================================================= */}

            {pagination && pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Previous
                </button>

                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* =====================================================
          PRODUCT MODAL
      ===================================================== */}

      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <form className="modal-card" onSubmit={handleSave}>
            <h2>{modal.mode === "create" ? "Add product" : "Edit product"}</h2>

            <div className="form-grid">
              {/* NAME */}

              <label>
                Name
                <input
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  required
                  maxLength={150}
                  autoComplete="off"
                />
              </label>

              {/* PRICING TYPE */}

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

              {/* STANDARD */}

              {pricingType === "standard" && (
                <>
                  <label>
                    Price (₹)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => updateForm("price", e.target.value)}
                      required={variants.length === 0}
                    />
                  </label>

                  <label>
                    MRP (₹)
                    <span className="form-help-inline">— optional</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.mrp}
                      onChange={(e) => updateForm("mrp", e.target.value)}
                      placeholder="e.g. 120"
                    />
                  </label>

                  <div className="form-full">
                    <label>Sizes / quantities</label>

                    <VariantEditor variants={variants} onChange={setVariants} />
                  </div>
                </>
              )}

              {/* TYPE BASED */}

              {pricingType === "type-based" && (
                <div className="form-full">
                  <label>Product Types / Quality</label>

                  <p className="form-help">
                    Example: Rice → Kolam, Basmati, HMT. Each type can have its
                    own sizes and prices.
                  </p>

                  {types.map((type, typeIndex) => (
                    <div className="type-editor" key={`type-${typeIndex}`}>
                      <div className="type-editor-header">
                        <input
                          type="text"
                          placeholder="Type name e.g. Kolam Rice"
                          value={type.name}
                          onChange={(e) =>
                            updateTypeName(typeIndex, e.target.value)
                          }
                          maxLength={100}
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

                      <strong className="type-editor-title">
                        Sizes & Prices
                      </strong>

                      {type.sizes.map((size, sizeIndex) => (
                        <div
                          className="variant-row"
                          key={`type-${typeIndex}-size-${sizeIndex}`}
                        >
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
                          />

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
                            value={size.price}
                            onChange={(e) =>
                              updateTypeSize(
                                typeIndex,
                                sizeIndex,
                                "price",
                                e.target.value,
                              )
                            }
                          />

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
                          />

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

                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => addTypeSize(typeIndex)}
                      >
                        + Add size
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={addType}
                  >
                    + Add product type
                  </button>
                </div>
              )}

              {/* CATEGORY */}

              <label>
                Category
                <select
                  value={form.category}
                  onChange={(e) => updateForm("category", e.target.value)}
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

              {/* BARCODE */}

              <label>
                Barcode
                <input
                  value={form.barcode}
                  onChange={(e) => updateForm("barcode", e.target.value)}
                  placeholder="For billing software reference"
                  maxLength={100}
                  inputMode="numeric"
                />
              </label>

              {/* DESCRIPTION */}

              <label className="form-full">
                Description
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  maxLength={1000}
                />
              </label>

              {/* IMAGE */}

              <div className="product-image-upload form-full">
                <label className="form-label">Product image</label>

                <div className="image-upload-options">
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

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  hidden
                />

                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Product preview" />

                    <button type="button" onClick={removeImage}>
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* ACTIVE */}

              <label className="form-grid-check">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => updateForm("active", e.target.checked)}
                />
                Active
              </label>

              {/* FEATURED */}

              <label className="form-grid-check">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => updateForm("featured", e.target.checked)}
                />
                Show in Featured Products
              </label>

              {/* ERROR */}

              {error && (
                <p className="field-error form-full" role="alert">
                  {error}
                </p>
              )}
            </div>

            {/* ACTIONS */}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={closeModal}
                disabled={saving}
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

          {/* ===================================================
              CAMERA MODAL
          =================================================== */}

          {cameraOpen && (
            <div
              className="camera-modal-backdrop"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  closeCamera();
                }
              }}
            >
              <div
                className="camera-modal"
                onMouseDown={(e) => e.stopPropagation()}
              >
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

                <div className="camera-preview-container">
                  <video
                    ref={cameraVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="camera-video"
                  />

                  <div className="camera-frame" aria-hidden="true" />

                  {cameraError && (
                    <div className="camera-error" role="alert">
                      {cameraError}
                    </div>
                  )}
                </div>

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