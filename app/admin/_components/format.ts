// Display formatting shared by the admin pages. Dates are always shown in Karachi time, whatever the server's zone is.

const TZ = "Asia/Karachi"

const dateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" })
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
})

export const fmtDate = (value: string | Date | null | undefined) => (value ? dateFmt.format(new Date(value)) : "—")
export const fmtDateTime = (value: string | Date | null | undefined) => (value ? dateTimeFmt.format(new Date(value)) : "—")

export const fmtNumber = (value: number | string | null | undefined) => Number(value ?? 0).toLocaleString("en-PK")

/** "Rs 12,500". Decimals only show when the amount has them. */
export const rs = (value: number | string | null | undefined) =>
  `Rs ${Number(value ?? 0).toLocaleString("en-PK", { maximumFractionDigits: 2 })}`

export const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-PK")} ${n === 1 ? one : many}`
