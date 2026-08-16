export function formatCurrency(amount) {
  return `₹${Number(amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function buildWhatsAppMessage({ storeName, customerName, mobile, address, items, total }) {
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
    const subtotal = item.price * item.quantity;
    const itemLabel = item.variant ? `${item.name} (${item.variant})` : item.name;
    lines.push(`${idx + 1}. ${itemLabel}`);
    lines.push(`Quantity: ${item.quantity}`);
    lines.push(`Price: ${formatCurrency(item.price)}`);
    lines.push(`Subtotal: ${formatCurrency(subtotal)}`);
    lines.push("");
  });

  lines.push(`Total: ${formatCurrency(total)}`);
  lines.push("");
  lines.push("Please confirm my order.");

  return lines.join("\n");
}

export function buildWhatsAppLink(whatsappNumber, message) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${whatsappNumber}?text=${encoded}`;
}
