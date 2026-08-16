import mongoose from "mongoose";

// A variant represents one purchasable size of a product, e.g. "1 kg" at
// ₹260 vs "500 g" at ₹140. Optional — products with no variants just use
// the top-level `price` as today (single-size product).
const variantSchema = new mongoose.Schema(
  {
    unit: { type: String, required: true, enum: ["g", "kg", "ml", "l", "pcs"] },
    amount: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    barcode: { type: String, trim: true, default: "" }, // kept for the client's billing software, unused in ordering
    price: { type: Number, required: true, min: 0 }, // base/display price; used directly when variants is empty
    variants: { type: [variantSchema], default: [] },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Search + list performance for a large catalogue.
productSchema.index({ name: "text", description: "text" });
productSchema.index({ category: 1, active: 1 });
productSchema.index({ barcode: 1 });
productSchema.index({ createdAt: -1 });

export default mongoose.model("Product", productSchema);
