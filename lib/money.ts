export const currency = 'EUR' as const;

export function formatEuro(amount: number, locale: string = 'en') {
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency, currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(amount);
}

export function rentalTotal(hourlyRate: number, duration: number, quantity: number) {
  return Math.round(hourlyRate * 100) * duration * quantity / 100;
}
