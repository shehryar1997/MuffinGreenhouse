const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "long", year: "numeric" })

export const formatPostDate = (iso: string) => fmt.format(new Date(iso))
