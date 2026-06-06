import assert from 'node:assert/strict';
import {
  calculateWeightedSaleFromGrams,
  calculateWeightedSaleFromMoney,
  formatCents,
  moneyToCents,
  sumMoneyCents
} from '../src/lib/money.js';

const saleByWeight = calculateWeightedSaleFromGrams({
  pricePerUnit: 1.75,
  unitGrams: 100,
  weightGrams: 250
});

assert.equal(saleByWeight.totalCents, 438, '250g at 1.75 EUR / 100g must round to 4.38 EUR');
assert.equal(saleByWeight.pricePerKg, 17.5, '1.75 EUR / 100g must be 17.50 EUR / kg');

const saleByMoney = calculateWeightedSaleFromMoney({
  pricePerUnit: 3,
  unitGrams: 1000,
  amount: '1.50'
});

assert.equal(saleByMoney.totalCents, 150, 'Money mode must keep the requested cent amount exactly');
assert.equal(saleByMoney.weightGrams, 500, '1.50 EUR at 3.00 EUR/kg must be 500g');

assert.equal(moneyToCents('0.1') + moneyToCents('0.2'), 30, '0.10 + 0.20 must be exactly 30 cents');
assert.equal(formatCents(sumMoneyCents([0.1, 0.2, '0.30'])), '0.60', 'cash sums must be exact cents');
assert.equal(moneyToCents('10,99'), 1099, 'German comma input must parse as cents');

console.log('Calculation checks passed.');
