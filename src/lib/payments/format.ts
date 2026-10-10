const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/** Formats a kobo amount (as stored in `price_kobo` / `amount_kobo`) as Naira. */
export function formatKobo(kobo: number): string {
  return nairaFormatter.format(kobo / 100);
}
