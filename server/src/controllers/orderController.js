import Order from "../models/Order.js";

// Records an order at the moment the customer clicks "Place Order on
// WhatsApp" — this is a log, not an order-management system. Best-effort:
// if it fails, the customer's WhatsApp flow still proceeds on the frontend.
export async function createOrder(req, res, next) {
  try {
    const { customerName, mobile, address, items, total } = req.body;
    if (!customerName || !mobile || !address || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Missing required order fields." });
    }
    const order = await Order.create({ customerName, mobile, address, items, total });
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
