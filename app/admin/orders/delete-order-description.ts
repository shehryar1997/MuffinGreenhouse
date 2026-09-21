// Confirmation text for deleting an order. Says what happens to the stock, which depends on the order's status.
export function deleteOrderDescription(orderNumber: string, status: string): string {
  const stock =
    status === "cancelled"
      ? "Its stock was already returned when it was cancelled."
      : status === "shipped" || status === "delivered"
        ? "It has already shipped, so its stock is not returned."
        : "Its plants will go back in stock."
  return `Permanently delete order ${orderNumber}?\n\nThis removes it and its items from your order list, the customer's history and revenue totals. The customer is not e-mailed. ${stock}\n\nThis cannot be undone.`
}
