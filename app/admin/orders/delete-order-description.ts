// Deleting orders: only orders that never became a sale (unpaid and not shipped: tests, duplicates, no-shows) can
// be deleted. Paid, shipped and delivered orders are the shop's sales record (and carry the customer's reviews),
// so they are kept; cancel an order instead if it didn't go ahead.
export function canDeleteOrder(order: { status: string; payment_status: string }): boolean {
  return order.payment_status !== "paid" && order.status !== "shipped" && order.status !== "delivered"
}

export const ORDER_KEPT_MESSAGE =
  "Paid, shipped and delivered orders are kept as your sales record, so they can't be deleted. Cancel the order instead if it didn't go ahead."

// Confirmation text for deleting an order. Says what happens to the stock, which depends on the order's status.
export function deleteOrderDescription(orderNumber: string, status: string): string {
  const stock = status === "cancelled" ? "Its stock was already returned when it was cancelled." : "Its plants will go back in stock."
  return `Permanently delete order ${orderNumber}?\n\nThis removes it and its items from your order list, the customer's history and revenue totals. The customer is not e-mailed. ${stock}\n\nThis cannot be undone.`
}
