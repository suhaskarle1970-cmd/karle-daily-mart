import Order from "../models/Order.js";

export async function createOrder(req, res, next) {
  try {
    const {
      customerName,
      mobile,
      address,
      items,
      subtotal,
      deliveryCharge,
      total,
    } = req.body;

    if (!customerName || !mobile || !address || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Missing required order fields." });
    }
    const order = await Order.create({
      customerName,
      mobile,
      address,
      items,
      subtotal,
      deliveryCharge,
      total,
    });
    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
}

export async function listOrders(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const [orders, total] = await Promise.all([
      Order.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Order.countDocuments(),
    ]);

    res.json({ orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } });
  } catch (err) {
    next(err);
  }
}
