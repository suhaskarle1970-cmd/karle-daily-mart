import mongoose from "mongoose";

const sliderSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    imagePublicId: { type: String, default: "" },
    heading: { type: String, trim: true },
    description: { type: String, default: "" },
    ctaText: { type: String, default: "Shop Now" },
    ctaLink: { type: String, default: "/products" },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

sliderSchema.index({ active: 1, order: 1 });

export default mongoose.model("Slider", sliderSchema);
