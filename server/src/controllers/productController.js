import Product from "../models/Product.js";
import { uploadImageBuffer, deleteImage } from "../config/cloudinary.js";

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 60;

const DEPARTMENTS = [
  "grocery-kitchen",
  "snacks-drinks",
  "beauty-personal-care",
  "household-essentials",
  "stationery",
];

/* =========================================================
   HELPERS
========================================================= */

function parseNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function parseVariants(raw) {
  if (raw === undefined || raw === null || raw === "") {
    return [];
  }

  let parsed;

  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    throw Object.assign(
      new Error("Variants must be valid JSON."),
      { status: 400 },
    );
  }

  if (!Array.isArray(parsed)) {
    throw Object.assign(
      new Error("Variants must be an array."),
      { status: 400 },
    );
  }

  return parsed.map((v, i) => {
    const unit = String(v.unit || "").trim();
    const amount = Number(v.amount);
    const price = Number(v.price);

    const mrp =
      v.mrp === undefined || v.mrp === null || v.mrp === ""
        ? null
        : Number(v.mrp);

    /* UNIT */

    if (!["g", "kg", "ml", "l", "pcs"].includes(unit)) {
      throw Object.assign(
        new Error(
          `Variant ${i + 1}: unit must be g, kg, ml, l, or pcs.`,
        ),
        { status: 400 },
      );
    }

    /* AMOUNT */

    if (!Number.isFinite(amount) || amount <= 0) {
      throw Object.assign(
        new Error(
          `Variant ${i + 1}: amount must be a positive number.`,
        ),
        { status: 400 },
      );
    }

    /* SELLING PRICE */

    if (!Number.isFinite(price) || price < 0) {
      throw Object.assign(
        new Error(
          `Variant ${i + 1}: price must be a valid number.`,
        ),
        { status: 400 },
      );
    }

    /* MRP */

    if (
      mrp !== null &&
      (!Number.isFinite(mrp) || mrp < 0)
    ) {
      throw Object.assign(
        new Error(
          `Variant ${i + 1}: MRP must be a valid number.`,
        ),
        { status: 400 },
      );
    }

    /* MRP CANNOT BE LOWER THAN SELLING PRICE */

    if (mrp !== null && mrp < price) {
      throw Object.assign(
        new Error(
          `Variant ${i + 1}: MRP cannot be lower than selling price.`,
        ),
        { status: 400 },
      );
    }

    return {
      unit,
      amount,
      price,
      mrp,
    };
  });
}

function parseProductTypes(raw) {
  if (raw === undefined || raw === null || raw === "") {
    return [];
  }

  let parsed;

  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    throw Object.assign(new Error("Product types must be valid JSON."), {
      status: 400,
    });
  }

  if (!Array.isArray(parsed)) {
    throw Object.assign(new Error("Product types must be an array."), {
      status: 400,
    });
  }

  return parsed.map((type, typeIndex) => {
    const name = String(type.name || "").trim();

    if (!name) {
      throw Object.assign(
        new Error(`Product type ${typeIndex + 1}: name is required.`),
        { status: 400 },
      );
    }

    if (!Array.isArray(type.sizes) || type.sizes.length === 0) {
      throw Object.assign(
        new Error(
          `Product type ${typeIndex + 1}: at least one size is required.`,
        ),
        { status: 400 },
      );
    }

    const sizes = type.sizes.map((size, sizeIndex) => {
      const unit = String(size.unit || "").trim();
      const amount = Number(size.amount);
      const price = Number(size.price);

      const mrp =
        size.mrp === undefined || size.mrp === null || size.mrp === ""
          ? null
          : Number(size.mrp);

      // UNIT
      if (!["g", "kg", "ml", "l", "pcs"].includes(unit)) {
        throw Object.assign(
          new Error(`${name} - Size ${sizeIndex + 1}: invalid unit.`),
          { status: 400 },
        );
      }

      // AMOUNT
      if (!Number.isFinite(amount) || amount <= 0) {
        throw Object.assign(
          new Error(
            `${name} - Size ${sizeIndex + 1}: amount must be positive.`,
          ),
          { status: 400 },
        );
      }

      // PRICE
      if (!Number.isFinite(price) || price < 0) {
        throw Object.assign(
          new Error(`${name} - Size ${sizeIndex + 1}: price must be valid.`),
          { status: 400 },
        );
      }

      // MRP
      if (mrp !== null && (!Number.isFinite(mrp) || mrp < 0)) {
        throw Object.assign(
          new Error(`${name} - Size ${sizeIndex + 1}: MRP must be valid.`),
          { status: 400 },
        );
      }

      // MRP cannot be lower than selling price
      if (mrp !== null && mrp < price) {
        throw Object.assign(
          new Error(
            `${name} - Size ${sizeIndex + 1}: MRP cannot be lower than selling price.`,
          ),
          { status: 400 },
        );
      }

      return {
        unit,
        amount,
        price,
        mrp,
      };
    });

    return {
      name,
      sizes,
    };
  });
}

/* =========================================================
   LIST PRODUCTS
========================================================= */

export async function listProducts(req, res, next) {
  try {
    const page = Math.max(
      1,
      parseInt(req.query.page, 10) || 1,
    );

    const limit = Math.min(
      PAGE_SIZE_MAX,
      Math.max(
        1,
        parseInt(req.query.limit, 10) || PAGE_SIZE_DEFAULT,
      ),
    );

    const {
      category,
      search,
      includeInactive,
    } = req.query;

    const filter =
      includeInactive === "true"
        ? {}
        : { active: true };

    if (category) {
      filter.category = category;
    }

    if (search && search.trim()) {
      filter.$text = {
        $search: search.trim(),
      };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate(
          "category",
          "name slug department",
        )
        .sort(
          search
            ? { score: { $meta: "textScore" } }
            : { createdAt: -1 },
        )
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Product.countDocuments(filter),
    ]);

    res.json({
      products,

      pagination: {
        page,
        limit,
        total,
        totalPages:
          Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

/* =========================================================
   GET SINGLE PRODUCT
========================================================= */

export async function getProduct(req, res, next) {
  try {
    const product = await Product.findById(
      req.params.id,
    ).populate(
      "category",
      "name slug department",
    );

    if (
      !product ||
      (!product.active && !req.admin)
    ) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    res.json({ product });
  } catch (err) {
    next(err);
  }
}

/* =========================================================
   CREATE PRODUCT
========================================================= */

export async function createProduct(req, res, next) {
  try {
    const {
      name,
      price,
      mrp,
      category,
      description,
      barcode,
      active,
      pricingType,
    } = req.body;

    // ============================================================
    // BASIC REQUIRED FIELDS
    // ============================================================

    if (!name || !category) {
      return res.status(400).json({
        message: "Name and category are required.",
      });
    }

    const finalPricingType =
      pricingType === "type-based" ? "type-based" : "standard";

    // ============================================================
    // PARSE PRODUCT TYPES
    // ============================================================

    const productTypes = parseProductTypes(req.body.types);

    // ============================================================
    // PRICE
    // ============================================================

    let parsedPrice = null;

    if (finalPricingType === "standard") {
      if (price === undefined || price === "") {
        return res.status(400).json({
          message: "Price is required for standard products.",
        });
      }

      parsedPrice = parseNumber(price);

      if (parsedPrice === null || parsedPrice < 0) {
        return res.status(400).json({
          message: "Price must be a valid number.",
        });
      }
    }

    // ============================================================
    // MRP
    // ============================================================

    let parsedMrp = null;

    if (mrp !== undefined && mrp !== null && mrp !== "") {
      parsedMrp = parseNumber(mrp);

      if (parsedMrp === null || parsedMrp < 0) {
        return res.status(400).json({
          message: "MRP must be a valid number.",
        });
      }

      // Only compare product-level MRP for standard products
      if (finalPricingType === "standard" && parsedMrp < parsedPrice) {
        return res.status(400).json({
          message: "MRP cannot be lower than selling price.",
        });
      }
    }

    // ============================================================
    // VARIANTS
    // ============================================================

    const variants = parseVariants(req.body.variants);

    // ============================================================
    // VALIDATE TYPE-BASED PRODUCT
    // ============================================================

    if (finalPricingType === "type-based") {
      if (!Array.isArray(productTypes) || productTypes.length === 0) {
        return res.status(400).json({
          message: "At least one product type is required.",
        });
      }

      for (const type of productTypes) {
        if (!type.name) {
          return res.status(400).json({
            message: "Every product type must have a name.",
          });
        }

        if (!Array.isArray(type.sizes) || type.sizes.length === 0) {
          return res.status(400).json({
            message: `At least one size is required for ${type.name}.`,
          });
        }
      }
    }

    // ============================================================
    // IMAGE
    // ============================================================

    let imageUrl = "";
    let imagePublicId = "";

    if (req.file) {
      const uploaded = await uploadImageBuffer(req.file.buffer, {
        folder: "products",
      });

      imageUrl = uploaded.url;
      imagePublicId = uploaded.publicId;
    }

    // ============================================================
    // CREATE PRODUCT
    // ============================================================

    const product = await Product.create({
      name: name.trim(),

      // Important:
      // Type-based products don't have a product-level price.
      price: parsedPrice ?? 0,

      // Product-level MRP is only meaningful for standard products
      mrp: finalPricingType === "standard" ? parsedMrp : null,

      variants: finalPricingType === "standard" ? variants : [],

      pricingType: finalPricingType,

      types: finalPricingType === "type-based" ? productTypes : [],

      category,

      description: description || "",

      barcode: barcode || "",

      active:
        active === undefined ? true : active === "true" || active === true,

      imageUrl,

      imagePublicId,
    });

    return res.status(201).json({
      product,
    });
  } catch (err) {
    next(err);
  }
}

/* =========================================================
   UPDATE PRODUCT
========================================================= */

export async function updateProduct(req, res, next) {
  try {
    const product =
      await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    const {
      name,
      price,
      mrp,
      category,
      description,
      barcode,
      active,
      pricingType,
    } = req.body;

    /* NAME */

    if (name !== undefined) {
      product.name = name.trim();
    }

    /* PRICE */

    let newPrice = Number(product.price);

    if (price !== undefined) {
      const parsedPrice = parseNumber(price);

      if (
        parsedPrice === null ||
        parsedPrice < 0
      ) {
        return res.status(400).json({
          message:
            "Price must be a valid number.",
        });
      }

      newPrice = parsedPrice;
      product.price = parsedPrice;
    }

    /* MRP */

    let newMrp = product.mrp;

    if (mrp !== undefined) {
      newMrp =
        mrp === null || mrp === ""
          ? null
          : parseNumber(mrp);

      if (
        mrp !== null &&
        mrp !== "" &&
        newMrp === null
      ) {
        return res.status(400).json({
          message:
            "MRP must be a valid number.",
        });
      }

      if (
        newMrp !== null &&
        newMrp < newPrice
      ) {
        return res.status(400).json({
          message:
            "MRP cannot be lower than selling price.",
        });
      }

      product.mrp = newMrp;
    } else {
    
      if (
        newMrp !== null &&
        newMrp !== undefined &&
        newMrp < newPrice
      ) {
        return res.status(400).json({
          message:
            "Selling price cannot be higher than the current MRP. Update the MRP first.",
        });
      }
    }

    /* OTHER FIELDS */

    if (category !== undefined) {
      product.category = category;
    }

    if (description !== undefined) {
      product.description = description;
    }

    if (barcode !== undefined) {
      product.barcode = barcode;
    }

    if (active !== undefined) {
      product.active =
        active === "true" ||
        active === true;
    }

    /* VARIANTS */

    if (req.body.variants !== undefined) {
      product.variants = parseVariants(
        req.body.variants,
      );
    }

    if (req.body.types !== undefined) {
      product.types = parseProductTypes(req.body.types);
    }

    if (pricingType !== undefined) {
      product.pricingType =
        pricingType === "type-based" ? "type-based" : "standard";
    }

    /* IMAGE */

    if (req.file) {
      const oldPublicId =
        product.imagePublicId;

      const uploaded =
        await uploadImageBuffer(
          req.file.buffer,
          {
            folder: "products",
          },
        );

      product.imageUrl = uploaded.url;
      product.imagePublicId =
        uploaded.publicId;

      if (oldPublicId) {
        await deleteImage(oldPublicId);
      }
    }

    await product.save();

    res.json({
      product,
    });
  } catch (err) {
    next(err);
  }
}

/* =========================================================
   DELETE PRODUCT
========================================================= */

export async function deleteProduct(req, res, next) {
  try {
    const product =
      await Product.findByIdAndDelete(
        req.params.id,
      );

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    if (product.imagePublicId) {
      await deleteImage(
        product.imagePublicId,
      );
    }

    res.json({
      message: "Product deleted.",
    });
  } catch (err) {
    next(err);
  }
}

/* =========================================================
   HOMEPAGE PRODUCTS
========================================================= */

/* =========================================================
   HOMEPAGE PRODUCTS
========================================================= */

export async function getHomepageProducts(req, res, next) {
  try {

    const result = await Product.aggregate([
      /* =====================================================
         ACTIVE PRODUCTS
      ===================================================== */

      {
        $match: {
          active: true,
        },
      },

      /* =====================================================
         CATEGORY
      ===================================================== */

      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryData",
        },
      },

      {
        $unwind: "$categoryData",
      },

      /* =====================================================
         ACTIVE CATEGORIES
      ===================================================== */

      {
        $match: {
          "categoryData.active": true,
          "categoryData.department": {
            $in: DEPARTMENTS,
          },
        },
      },

      /* =====================================================
         NEWEST FIRST
      ===================================================== */

      {
        $sort: {
          createdAt: -1,
        },
      },

      /* =====================================================
         CREATE:
         - featured
         - department products
      ===================================================== */

      {
        $facet: {
          /* ================================================
             FEATURED PRODUCTS
          ================================================= */

          featured: [
            {
              $limit: 6,
            },
          ],

          /* ================================================
             DEPARTMENT PRODUCTS
          ================================================= */

          departments: [
            {
              $group: {
                _id: "$categoryData.department",

                products: {
                  $push: {
                    _id: "$_id",
                    name: "$name",
                    barcode: "$barcode",
                    price: "$price",
                    mrp: "$mrp",
                    variants: "$variants",
                    pricingType: "$pricingType",
                    types: "$types",
                    description: "$description",
                    imageUrl: "$imageUrl",
                    imagePublicId: "$imagePublicId",
                    active: "$active",
                    createdAt: "$createdAt",

                    category: {
                      _id: "$categoryData._id",
                      name: "$categoryData.name",
                      slug: "$categoryData.slug",
                      department: "$categoryData.department",
                    },
                  },
                },
              },
            },

            {
              $project: {
                _id: 1,
                products: {
                  $slice: ["$products", 6],
                },
              },
            },
          ],
        },
      },
    ]);

    /* =========================================================
       RESULT
    ========================================================= */

    const aggregationResult = result[0] || {};

    const featured = aggregationResult.featured || [];

    const departmentProducts = {};

    /*
      Initialize ALL departments.

      This means the frontend always receives:

      {
        "grocery-kitchen": [],
        "snacks-drinks": [],
        "beauty-personal-care": [],
        "household-essentials": [],
        "stationery": []
      }

      even when a department has no products.
    */

    for (const department of DEPARTMENTS) {
      departmentProducts[department] = [];
    }

    /*
      Put the products into their correct department.
    */

    for (const department of aggregationResult.departments || []) {
      departmentProducts[department._id] =
        department.products || [];
    }

    /* =========================================================
       RESPONSE
    ========================================================= */

    res.json({
      featured,
      departments: departmentProducts,
    });
  } catch (err) {
    next(err);
  }
}