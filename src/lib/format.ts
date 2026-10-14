export function money(amount: number, currency = "PKR", language = "en-PK") {
  return new Intl.NumberFormat(language, {
    style: "currency",
    currency,
    minimumFractionDigits: amount % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}
export function dateTime(value: number, timezone = "Asia/Karachi") {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(value);
}
