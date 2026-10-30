import { parse } from "csv-parse/sync";
import Product from "../models/Product.js";
import Category, {
  DEPARTMENTS,
  DEPARTMENT_LABELS,
} from "../models/Category.js";

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Maps CSV department input or infers from category name, falling back to "grocery-kitchen"
function resolveDepartment(rawDepartment, categoryName) {
  if (rawDepartment) {
    const cleaned = rawDepartment.trim().toLowerCase();
    if (DEPARTMENTS.includes(cleaned)) return cleaned;

    const matchedLabel = Object.entries(DEPARTMENT_LABELS).find(
      ([, label]) => label.toLowerCase() === cleaned,
    );
    if (matchedLabel) return matchedLabel[0];

    const sluggedDept = slugify(cleaned);
    if (DEPARTMENTS.includes(sluggedDept)) return sluggedDept;
  }

  // Basic keyword inference if CSV doesn't include a department column
  const catLower = categoryName.toLowerCase();
  if (
    /snack|drink|beverage|juice|biscuit|chip|chocolate|tea|coffee/.test(
      catLower,
    )
  ) {
    return "snacks-drinks";
  }
  if (
    /beauty|care|soap|shampoo|skin|hair|oral|toothpaste|cosmetic|face/.test(
      catLower,
    )
  ) {
    return "beauty-personal-care";
  }
  if (
    /household|clean|detergent|dish|floor|toilet|freshener|repellent/.test(
      catLower,
    )
  ) {
    return "household-essentials";
  }
  if (/stationery|pen|pencil|notebook|paper|office|school/.test(catLower)) {
    return "stationery";
  }

  return "grocery-kitchen";
}

// CSV columns supported:
// Required: name, price, category
// Optional: barcode, description, department, variantUnit, variantAmount, variantPrice
export async function importProducts(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "CSV file is required.",
      });
    }

    let rows;

    try {
      rows = parse(req.file.buffer.toString("utf-8"), {
        bom: true, // Strips Excel UTF-8 BOM so the first column header isn't corrupted
        columns: (headers) => headers.map((h) => h.trim().toLowerCase()),
        skip_empty_lines: true,
        trim: true,
      });
    } catch (parseErr) {
      return res.status(400).json({
        message: `Could not parse CSV: ${parseErr.message}`,
      });
    }

    const categoryCache = new Map();

    const results = {
      total: rows.length,
      imported: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const row = rows[i];

      try {
        // -----------------------------------------
        // Basic product fields
        // -----------------------------------------
        const name = (row.name || "").trim();
        const priceRaw = (row.price || "").trim();
        const categoryName = (row.category || "").trim();
        const departmentRaw = (row.department || "").trim();
        const barcode = (row.barcode || "").trim();
        const description = (row.description || "").trim();

        // -----------------------------------------
        // Variant fields (CSV headers are lowercase)
        // -----------------------------------------
        const variantUnit = (row.variantunit || "").trim().toLowerCase();
        const variantAmountRaw = (row.variantamount || "").trim();
        const variantPriceRaw = (row.variantprice || "").trim();

        // -----------------------------------------
        // Basic validation
        // -----------------------------------------
        if (!name) {
          throw new Error("Missing product name");
        }

        if (!priceRaw || isNaN(Number(priceRaw))) {
          throw new Error("Missing or invalid price");
        }

        if (!categoryName) {
          throw new Error("Missing category");
        }

        const categorySlug = slugify(categoryName);
        if (!categorySlug) {
          throw new Error("Category name must contain alphanumeric characters");
        }

        const price = Number(priceRaw);
        if (price < 0) {
          throw new Error("Price cannot be negative");
        }

        // -----------------------------------------
        // Variant validation
        // -----------------------------------------
        let variants = [];
        const hasVariantData = Boolean(
          variantUnit || variantAmountRaw || variantPriceRaw,
        );

        if (hasVariantData) {
          if (!["g", "kg", "ml", "l", "pcs"].includes(variantUnit)) {
            throw new Error("Invalid variant unit. Use g, kg, ml, l, or pcs");
          }

          if (
            !variantAmountRaw ||
            isNaN(Number(variantAmountRaw)) ||
            Number(variantAmountRaw) <= 0
          ) {
            throw new Error("Invalid variant amount");
          }

          if (
            variantPriceRaw &&
            (isNaN(Number(variantPriceRaw)) || Number(variantPriceRaw) < 0)
          ) {
            throw new Error("Invalid variant price");
          }

          variants = [
            {
              unit: variantUnit,
              amount: Number(variantAmountRaw),
              price: variantPriceRaw ? Number(variantPriceRaw) : price,
            },
          ];
        }

        // -----------------------------------------
        // Find / create category (cached by slug)
        // -----------------------------------------
        let categoryId = categoryCache.get(categorySlug);

        if (!categoryId) {
          let category = await Category.findOne({ slug: categorySlug });

          if (!category) {
            category = await Category.create({
              name: categoryName,
              slug: categorySlug,
              department: resolveDepartment(departmentRaw, categoryName),
            });
          }

          categoryId = category._id;
          categoryCache.set(categorySlug, categoryId);
        }

        // -----------------------------------------
        // Check existing product by barcode
        // -----------------------------------------
        const existing = barcode ? await Product.findOne({ barcode }) : null;

        // -----------------------------------------
        // Update existing product
        // -----------------------------------------
        if (existing) {
          existing.name = name;
          existing.price = price;
          existing.category = categoryId;

          if (description) {
            existing.description = description;
          }

          // Only overwrite variants if the CSV row actually provided variant data
          if (hasVariantData) {
            existing.variants = variants;
          }

          await existing.save();
          results.updated++;
        }
        // -----------------------------------------
        // Create new product
        // -----------------------------------------
        else {
          await Product.create({
            name,
            price,
            category: categoryId,
            barcode: barcode || undefined, // Avoid storing "" which breaks sparse unique indexes
            description: description || undefined,
            variants,
          });

          results.imported++;
        }
      } catch (rowErr) {
        results.failed++;
        results.errors.push({
          row: rowNum,
          message: rowErr.message,
        });
      }
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
}
