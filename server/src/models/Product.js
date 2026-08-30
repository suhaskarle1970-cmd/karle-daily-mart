import mongoose from "mongoose";

// ============================================================
// SIZE + PRICE
// ============================================================
// Example:
// 500 g  -> ₹35 selling price -> ₹40 MRP
// 1 kg   -> ₹60 selling price -> ₹70 MRP
// 5 kg   -> ₹290 selling price -> ₹320 MRP
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

// ============================================================
// PRODUCT TYPE
// ============================================================
// Example:
//
// {
//   name: "Kolam Rice",
//   sizes: [
//     { unit: "g", amount: 500, price: 35, mrp: 40 },
//     { unit: "kg", amount: 1, price: 60, mrp: 70 },
//     { unit: "kg", amount: 5, price: 290, mrp: 320 }
//   ]
// }
//
// Another type:
//
// {
//   name: "Basmati Rice",
//   sizes: [
//     { unit: "g", amount: 500, price: 60, mrp: 70 },
//     { unit: "kg", amount: 1, price: 120, mrp: 140 },
//     { unit: "kg", amount: 5, price: 575, mrp: 650 }
//   ]
// }
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

// ============================================================
// OLD / STANDARD VARIANT
// ============================================================
// Used for normal products that don't have different types.
//
// Example:
// 500 g -> ₹35
// 1 kg  -> ₹70
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

    // ----------------------------------------------------------
    // STANDARD VARIANTS
    // ----------------------------------------------------------
    // Used when pricingType === "standard"
    //
    // Example:
    // 500g -> ₹35
    // 1kg  -> ₹70
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

    // ==========================================================
    // PRICING TYPE
    // ==========================================================
    //
    // standard:
    //   Product uses price / mrp / variants
    //
    // type-based:
    //   Product has different types such as:
    //   Kolam Rice
    //   Basmati Rice
    //   Indrayani Rice
    //
    pricingType: {
      type: String,
      enum: ["standard", "type-based"],
      default: "standard",
    },

    // ==========================================================
    // TYPE-BASED PRODUCTS
    // ==========================================================
    //
    // Example:
    //
    // types: [
    //   {
    //     name: "Kolam Rice",
    //     sizes: [
    //       { unit: "g", amount: 500, price: 35, mrp: 40 },
    //       { unit: "kg", amount: 1, price: 60, mrp: 70 }
    //     ]
    //   },
    //
    //   {
    //     name: "Basmati Rice",
    //     sizes: [
    //       { unit: "g", amount: 500, price: 60, mrp: 70 },
    //       { unit: "kg", amount: 1, price: 120, mrp: 140 }
    //     ]
    //   }
    // ]
    //
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
