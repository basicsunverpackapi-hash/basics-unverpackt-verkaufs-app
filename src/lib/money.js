const MONEY_SCALE = 100;

export function normalizeDecimalInput(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(',', '.');
}

export function parseDecimalInput(value, fallback = 0) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  const normalized = normalizeDecimalInput(value);
  if (!normalized) return fallback;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function moneyToCents(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.round(value * MONEY_SCALE) : 0;
  }

  const normalized = normalizeDecimalInput(value);
  if (!normalized) return 0;

  const match = normalized.match(/^([+-])?(\d*)(?:\.(\d*))?$/);
  if (!match || (!match[2] && !match[3])) return 0;

  const sign = match[1] === '-' ? -1 : 1;
  const whole = Number(match[2] || '0');
  const fraction = match[3] || '';
  const centsPart = Number(fraction.slice(0, 2).padEnd(2, '0'));
  const roundUp = Number(fraction[2] || '0') >= 5 ? 1 : 0;

  return sign * (whole * MONEY_SCALE + centsPart + roundUp);
}

export function centsToMoney(cents) {
  return (Number(cents) || 0) / MONEY_SCALE;
}

export function roundMoney(value) {
  return centsToMoney(moneyToCents(value));
}

export function formatCents(cents) {
  return centsToMoney(cents).toFixed(2);
}

export function formatMoney(value) {
  return formatCents(moneyToCents(value));
}

export function sumMoneyCents(values) {
  return values.reduce((sum, value) => sum + moneyToCents(value), 0);
}

export function calculateWeightedSaleFromGrams({ pricePerUnit, unitGrams, weightGrams }) {
  const priceCents = moneyToCents(pricePerUnit);
  const unit = parseDecimalInput(unitGrams);
  const grams = parseDecimalInput(weightGrams);

  if (priceCents <= 0 || unit <= 0 || grams <= 0) {
    return null;
  }

  const totalCents = Math.round((priceCents * grams) / unit);
  const pricePerKgCents = Math.round((priceCents * 1000) / unit);

  return {
    weightGrams: grams,
    weightKg: grams / 1000,
    totalCents,
    totalPrice: centsToMoney(totalCents),
    pricePerKg: centsToMoney(pricePerKgCents)
  };
}

export function calculateWeightedSaleFromMoney({ pricePerUnit, unitGrams, amount }) {
  const priceCents = moneyToCents(pricePerUnit);
  const amountCents = moneyToCents(amount);
  const unit = parseDecimalInput(unitGrams);

  if (priceCents <= 0 || unit <= 0 || amountCents <= 0) {
    return null;
  }

  const weightGrams = (amountCents * unit) / priceCents;
  const pricePerKgCents = Math.round((priceCents * 1000) / unit);

  return {
    weightGrams,
    weightKg: weightGrams / 1000,
    totalCents: amountCents,
    totalPrice: centsToMoney(amountCents),
    pricePerKg: centsToMoney(pricePerKgCents)
  };
}
