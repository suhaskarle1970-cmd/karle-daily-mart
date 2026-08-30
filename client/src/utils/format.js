export function formatCurrency(amount) {
  return `₹${Number(amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function buildWhatsAppMessage({
  storeName,
  customerName,
  mobile,
  address,
  items,
  subtotal,
  deliveryCharge,
  total,
}) {
  const lines = [
    `Hello ${storeName},`,
    "",
    "I would like to place an order.",
    "",
    `Customer Name: ${customerName}`,
    `Mobile: ${mobile}`,
    "",
    "Delivery Address:",
    address,
    "",
    "Order:",
    "",
  ];

  items.forEach((item, idx) => {
    const itemSubtotal = Number(item.price || 0) * Number(item.quantity || 0);
    const itemLabel = [item.name, item.type, item.variant]
      .filter(Boolean)
      .join(" - ");

    lines.push(`${idx + 1}. ${itemLabel}`);
    lines.push(`Quantity: ${item.quantity}`);
    lines.push(`Price: ${formatCurrency(item.price)}`);
    lines.push(`Subtotal: ${formatCurrency(itemSubtotal)}`);
    lines.push("");
  });

  lines.push("----------------------------");
  lines.push(`Subtotal: ${formatCurrency(subtotal)}`);
  lines.push(`Delivery Charges: ${formatCurrency(deliveryCharge)}`);
  lines.push(`Total: ${formatCurrency(total)}`);
  lines.push("----------------------------");
  lines.push("");
  lines.push("Please confirm my order.");

  return lines.join("\n");
}

export function buildWhatsAppLink(phone, message) {
  const cleanPhone = String(phone || "").replace(/\D/g, "");

  if (!cleanPhone) {
    throw new Error("Invalid WhatsApp number.");
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}