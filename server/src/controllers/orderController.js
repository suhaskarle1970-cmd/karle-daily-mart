import Order from "../models/Order.js";
import StoreConfig from "../models/Config.js";

export async function createOrder(req, res, next) {
  try {
    const { customerName, mobile, address, items } = req.body;

    if (
      !customerName ||
      !mobile ||
      !address ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "Missing required order fields.",
      });
    }

    /*
     * =========================================================
     * CALCULATE SUBTOTAL FROM ORDER ITEMS
     * =========================================================
     */

    const subtotal = items.reduce((sum, item) => {
      const price = Number(item.price);
      const quantity = Number(item.quantity);

      if (
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isFinite(quantity) ||
        quantity < 1
      ) {
        throw Object.assign(new Error("Invalid order item."), { status: 400 });
      }

      return sum + price * quantity;
    }, 0);

    /*
     * =========================================================
     * GET DELIVERY SETTINGS
     * =========================================================
     */

    let config = await StoreConfig.findOne().lean();

    if (!config) {
      config = await StoreConfig.create({});
      config = config.toObject();
    }

    const delivery = config.delivery || {};

    const enabled = delivery.enabled ?? true;

    const minimumOrderAmount = Number(delivery.minimumOrderAmount ?? 500);

    const chargePerAmount = Number(delivery.chargePerAmount ?? 500);

    const chargePerAmountValue = Number(delivery.chargePerAmountValue ?? 20);

    let deliveryCharge = 0;

    if (enabled) {
      if (subtotal < minimumOrderAmount) {
        deliveryCharge = 20;
      } else {
        deliveryCharge =
          Math.ceil(subtotal / chargePerAmount) * chargePerAmountValue;
      }
    }

    /*
     * =========================================================
     * FINAL TOTAL
     * =========================================================
     */

    const total = subtotal + deliveryCharge;

    /*
     * =========================================================
     * CREATE ORDER
     * =========================================================
     */

    const order = await Order.create({
      customerName,
      mobile,
      address,
      items,
      subtotal,
      deliveryCharge,
      total,
    });

    res.status(201).json({
      order,
    });
  } catch (err) {
    next(err);
  }
}

export async function listOrders(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 20),
    );

    const [orders, total] = await Promise.all([
      Order.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      Order.countDocuments(),
    ]);

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}
