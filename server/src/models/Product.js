import mongoose from "mongoose";

const sizePriceSchema = new mongoose.Schema(
  {
    unit: {
      type: String,
      required: true,
      enum: ["g", "kg", "ml", "l", "pcs"],
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Actual selling price for this particular size
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Optional MRP for this particular size
    mrp: {
      type: Number,
      min: 0,
      default: null,
    },
  },
  { _id: false },
);


const productTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Sizes and prices belonging ONLY to this product type
    sizes: {
      type: [sizePriceSchema],
      default: [],
    },
  },
  { _id: false },
);

const variantSchema = new mongoose.Schema(
  {
    unit: {
      type: String,
      required: true,
      enum: ["g", "kg", "ml", "l", "pcs"],
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Actual selling price
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Optional MRP
    mrp: {
      type: Number,
      min: 0,
      default: null,
    },
  },
  { _id: false },
);

// ============================================================
// PRODUCT
// ============================================================
const productSchema = new mongoose.Schema(
  {
    // ----------------------------------------------------------
    // BASIC INFORMATION
    // ----------------------------------------------------------
    name: {
      type: String,
      required: true,
      trim: true,
    },

    barcode: {
      type: String,
      trim: true,
      default: "",
    },

    // Selling price for products without variants
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // MRP for products without variants
    mrp: {
      type: Number,
      min: 0,
      default: null,
    },

    variants: {
      type: [variantSchema],
      default: [],
    },

    // ----------------------------------------------------------
    // CATEGORY
    // ----------------------------------------------------------
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    // ----------------------------------------------------------
    // DESCRIPTION
    // ----------------------------------------------------------
    description: {
      type: String,
      default: "",
    },

    // ----------------------------------------------------------
    // IMAGE
    // ----------------------------------------------------------
    imageUrl: {
      type: String,
      default: "",
    },

    imagePublicId: {
      type: String,
      default: "",
    },

    // ----------------------------------------------------------
    // ACTIVE / INACTIVE
    // ----------------------------------------------------------
    active: {
      type: Boolean,
      default: true,
    },

    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    pricingType: {
      type: String,
      enum: ["standard", "type-based"],
      default: "standard",
    },

    types: {
      type: [productTypeSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// ============================================================
// INDEXES
// ============================================================

// Search products by name and description
productSchema.index({
  name: "text",
  description: "text",
});

// Category filtering
productSchema.index({
  category: 1,
  active: 1,
});

// Barcode lookup
productSchema.index({
  barcode: 1,
});

// Newest products
productSchema.index({
  createdAt: -1,
});

productSchema.index({ active: 1, createdAt: -1 });

export default mongoose.model("Product", productSchema);
