import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },

    minimumOrderAmount: {
      type: Number,
      min: 0,
      default: 500,
    },

    firstDeliveryBandAmount: {
      type: Number,
      default: 750,
      min: 0,
    },

    chargePerAmount: {
      type: Number,
      min: 1,
      default: 500,
    },

    chargePerAmountValue: {
      type: Number,
      min: 0,
      default: 20,
    },
  },
  { _id: false },
);

const storeConfigSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      default: "Karke Daily Mart",
    },

    storePhone: {
      type: String,
      default: "",
    },

    storeAddress: {
      type: String,
      default: "",
    },

    storeEmail: {
      type: String,
      default: "",
    },

    whatsappNumber: {
      type: String,
      default: "",
    },

    delivery: {
      type: deliverySchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("StoreConfig", storeConfigSchema);
