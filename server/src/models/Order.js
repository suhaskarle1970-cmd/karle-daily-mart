import mongoose from "mongoose";

// Lightweight record of orders placed via WhatsApp — not an order management
// system. Kept simple on purpose: no status workflow, no payment, no delivery
// tracking. Exists so the client has a record beyond WhatsApp chat history.
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    variant: { type: String, default: "" }, // e.g. "1 kg" — blank for single-size products
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    mobile: { type: String, required: true },
    address: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);
