import mongoose from "mongoose";

export const DEPARTMENTS = [
  "grocery-kitchen",
  "snacks-drinks",
  "beauty-personal-care",
  "household-essentials",
];

export const DEPARTMENT_LABELS = {
  "grocery-kitchen": "Grocery & Kitchen",
  "snacks-drinks": "Snacks & Drinks",
  "beauty-personal-care": "Beauty & Personal Care",
  "household-essentials": "Household Essentials",
};

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    department: { type: String, enum: [...DEPARTMENTS, null], default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ department: 1, active: 1 });

export default mongoose.model("Category", categorySchema);
