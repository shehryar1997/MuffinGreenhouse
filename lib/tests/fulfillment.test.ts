// Unit tests for overseas fulfilment (lib/fulfillment.ts). Run with: npm run test:unit
import { test } from "node:test"
import assert from "node:assert/strict"
import { OVERSEAS_LEAD_DAYS, addDays, cartHasOverseas, formatEta, leadTimeDays, orderLeadTimeDays, toDateColumn } from "@/lib/fulfillment"

const inStock = { product: { fulfillmentType: "in_stock" as const } }
const temu = { product: { fulfillmentType: "overseas" as const } }
const slowTemu = { product: { fulfillmentType: "overseas" as const, leadTimeDays: 21 } }

test("in-stock and untyped products have no lead time", () => {
  assert.equal(leadTimeDays({}), 0)
  assert.equal(leadTimeDays(inStock.product), 0)
})

test("overseas products default to 14 days unless they set their own", () => {
  assert.equal(leadTimeDays(temu.product), OVERSEAS_LEAD_DAYS)
  assert.equal(leadTimeDays(slowTemu.product), 21)
})

test("a mixed cart is overseas and its slowest line sets the date", () => {
  assert.equal(cartHasOverseas([inStock]), false)
  assert.equal(cartHasOverseas([inStock, temu]), true)
  assert.equal(orderLeadTimeDays([inStock]), 0)
  assert.equal(orderLeadTimeDays([inStock, temu, slowTemu]), 21)
})

test("addDays counts calendar days and toDateColumn/formatEta agree on the date", () => {
  const from = new Date("2026-09-24T09:00:00Z") // 14:00 in Karachi
  const eta = addDays(from, 14)
  assert.equal(toDateColumn(eta), "2026-10-08")
  assert.match(formatEta(eta), /8/)
  assert.equal(formatEta("2026-10-08"), formatEta(eta))
})

test("addDays uses the Karachi calendar date, not the server's", () => {
  const lateEvening = new Date("2026-09-24T20:30:00Z") // already 25 Sep 01:30 in Karachi
  assert.equal(toDateColumn(addDays(lateEvening, 14)), "2026-10-09")
})

import { parseFulfillmentCell, parseLeadTimeCell } from "@/lib/fulfillment"
import { columnsFor, recordToFormData } from "@/lib/product-import"

test("a sheet cell only ever means overseas when it says so; blank or unknown is no setting", () => {
  for (const yes of ["Ships from overseas", "overseas", "  OVERSEAS ", "Temu", "ships from Overseas (Temu)"]) {
    assert.equal(parseFulfillmentCell(yes), "overseas", yes)
  }
  for (const stock of ["in stock", "In_Stock", "local"]) assert.equal(parseFulfillmentCell(stock), "in_stock", stock)
  for (const none of ["", "  ", undefined, null, "maybe", "yes", "n/a"]) assert.equal(parseFulfillmentCell(none as string), null, String(none))
})

test("lead time cell: whole days 1-90, anything else falls back to the default", () => {
  assert.equal(parseLeadTimeCell("21"), 21)
  for (const bad of ["", "0", "91", "2.5", "two weeks", undefined]) assert.equal(parseLeadTimeCell(bad as string), null, String(bad))
})

const lookups = { categories: ["Pots"], useCaseTags: [] }
const base = { name: "Terracotta Pot", sku: "POT-1", category_name: "Pots", description: "A breathable pot for houseplants.", variant_1_name: "Standard", variant_1_price: "450" }

test("import: no fulfilment column, or a blank cell, imports as in stock without an error", () => {
  for (const record of [base, { ...base, fulfillment_type: "" }, { ...base, fulfillment_type: "???" }]) {
    const out = recordToFormData(record, lookups)
    assert.ok("formData" in out)
    if ("formData" in out) assert.equal(out.formData.has("fulfillment_type"), false)
  }
})

test("import: only an overseas cell marks the product, with its optional lead time", () => {
  const out = recordToFormData({ ...base, fulfillment_type: "Ships from overseas", lead_time_days: "18" }, lookups)
  assert.ok("formData" in out)
  if ("formData" in out) {
    assert.equal(out.formData.get("fulfillment_type"), "overseas")
    assert.equal(out.formData.get("lead_time_days"), "18")
  }
})

test("the import template and headers understand the new columns", () => {
  assert.ok(columnsFor(1).includes("fulfillment_type"))
})
