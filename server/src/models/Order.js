import mongoose from "mongoose";

// Lightweight record of orders placed via WhatsApp — not an order management
// system. Kept simple on purpose: no status workflow, no payment, no delivery
// tracking. Exists so the client has a record beyond WhatsApp chat history.
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Example: Kolam Rice
    type: {
      type: String,
      default: "",
      trim: true,
    },

    // Example: 1 kg
    variant: {
      type: String,
      default: "",
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    mobile: { type: String, required: true },
    address: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true },
    subtotal: {
      type: Number,
      required: true,
    },

    deliveryCharge: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);
