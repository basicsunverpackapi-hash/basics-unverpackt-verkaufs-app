import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowRight, Banknote, Coins } from 'lucide-react';
import {
  calculateWeightedSaleFromGrams,
  calculateWeightedSaleFromMoney,
  centsToMoney,
  formatCents,
  formatMoney,
  moneyToCents,
  parseDecimalInput
} from '@/lib/money';

export default function SaleDialog({ product, open, onClose, onComplete }) {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState('weight');
  const [inputValue, setInputValue] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bargeld');
  const [receivedMoney, setReceivedMoney] = useState('');

  if (!product) return null;

  const saleCalculation = mode === 'weight'
    ? calculateWeightedSaleFromGrams({
      pricePerUnit: product.price_per_unit,
      unitGrams: product.unit_grams,
      weightGrams: inputValue
    })
    : calculateWeightedSaleFromMoney({
      pricePerUnit: product.price_per_unit,
      unitGrams: product.unit_grams,
      amount: inputValue
    });

  const weightKg = saleCalculation?.weightKg || 0;
  const weightGrams = saleCalculation?.weightGrams || 0;
  const totalCents = saleCalculation?.totalCents || 0;
  const totalPrice = centsToMoney(totalCents);
  const pricePerKg = saleCalculation?.pricePerKg || 0;
  const receivedCents = receivedMoney ? moneyToCents(receivedMoney) : 0;
  const changeCents = receivedMoney ? receivedCents - totalCents : 0;

  const calculateChange = (amountCents) => {
    if (amountCents <= 0) return [];

    const denominations = [
      { cents: 50000, label: '500 EUR Schein' },
      { cents: 20000, label: '200 EUR Schein' },
      { cents: 10000, label: '100 EUR Schein' },
      { cents: 5000, label: '50 EUR Schein' },
      { cents: 2000, label: '20 EUR Schein' },
      { cents: 1000, label: '10 EUR Schein' },
      { cents: 500, label: '5 EUR Schein' },
      { cents: 200, label: '2 EUR' },
      { cents: 100, label: '1 EUR' },
      { cents: 50, label: '50ct' },
      { cents: 20, label: '20ct' },
      { cents: 10, label: '10ct' },
      { cents: 5, label: '5ct' },
      { cents: 2, label: '2ct' },
      { cents: 1, label: '1ct' }
    ];

    const result = [];
    let remainingCents = amountCents;

    denominations.forEach((denom) => {
      const count = Math.floor(remainingCents / denom.cents);
      if (count > 0) {
        result.push({ count, label: denom.label });
        remainingCents -= count * denom.cents;
      }
    });

    return result;
  };

  const changeBreakdown = changeCents > 0 ? calculateChange(changeCents) : [];

  const resetDialog = () => {
    setInputValue('');
    setReceivedMoney('');
    setPaymentMethod('Bargeld');
    setStep(1);
    setMode('weight');
  };

  const handleComplete = () => {
    if (weightKg <= 0 || totalCents <= 0 || !isFinite(weightKg)) return;

    onComplete({
      product_id: product.id,
      product_name: product.name,
      weight_kg: Number(weightKg.toFixed(3)),
      price_per_kg: Number(formatMoney(pricePerKg)),
      total_price: totalPrice,
      total_price_cents: totalCents
    }, paymentMethod);

    resetDialog();
    onClose();
  };

  const handleNext = () => {
    if (weightKg > 0 && totalCents > 0) {
      setStep(2);
    }
  };

  const handlePaymentMethodNext = () => {
    if (paymentMethod === 'Karte') {
      handleComplete();
    } else {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
      setReceivedMoney('');
    } else {
      setStep(1);
    }
  };

  const handlePassend = () => {
    setReceivedMoney(formatCents(totalCents));
    handleComplete();
  };

  return (
    <Dialog open={open} onOpenChange={(dialogOpen) => {
      if (!dialogOpen) {
        resetDialog();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="bg-green-100 border-b-2 border-green-200 p-4 -mt-6 -mx-6 mb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900">{product.name}</DialogTitle>
            <p className="text-gray-600 mt-1 font-medium">
              {formatMoney(product.price_per_unit)} EUR / {product.unit_grams >= 1000 ? `${(product.unit_grams / 1000).toFixed(product.unit_grams % 1000 === 0 ? 0 : 1)} kg` : `${product.unit_grams}g`}
            </p>
          </div>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="flex gap-3 p-1 bg-gray-100 rounded-xl">
              <Button
                type="button"
                onClick={() => setMode('weight')}
                variant="ghost"
                className={`flex-1 rounded-lg transition-all duration-200 ${mode === 'weight' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md' : 'hover:bg-gray-200'}`}
              >
                <span className="font-semibold">Gewicht</span>
              </Button>
              <Button
                type="button"
                onClick={() => setMode('money')}
                variant="ghost"
                className={`flex-1 rounded-lg transition-all duration-200 ${mode === 'money' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md' : 'hover:bg-gray-200'}`}
              >
                <span className="font-semibold">Betrag</span>
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                {mode === 'weight' ? 'Gewicht (Gramm)' : 'Betrag (EUR)'}
              </label>
              <Input
                type="number"
                step={mode === 'weight' ? '1' : '0.01'}
                max={mode === 'money' ? '1000' : undefined}
                value={inputValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setInputValue(mode === 'money' && moneyToCents(value) > 100000 ? '1000' : value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && weightKg > 0 && totalCents > 0) {
                    handleNext();
                  }
                }}
                placeholder={mode === 'weight' ? '0 g' : '0.00 EUR'}
                className="text-lg"
                autoFocus
              />
            </div>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-lg rounded-xl">
              <div className="text-center">
                {mode === 'weight' ? (
                  <>
                    <p className="text-sm font-semibold text-gray-600 mb-2">Zu zahlen</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">{formatCents(totalCents)} EUR</p>
                    <p className="text-base text-gray-600 mt-2 font-medium">fuer {parseDecimalInput(inputValue).toFixed(0)} g</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-gray-600 mb-2">Gewicht ausgeben</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                      {weightKg >= 1
                        ? `${weightKg % 1 === 0 ? weightKg.toFixed(0) : weightKg.toFixed(weightKg < 10 ? 2 : 1)} kg`
                        : `${weightGrams.toFixed(0)} g`}
                    </p>
                    <p className="text-base text-gray-600 mt-2 font-medium">fuer {formatCents(totalCents)} EUR</p>
                  </>
                )}
              </div>
            </Card>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl border-2 hover:bg-gray-100">
                Abbrechen
              </Button>
              <Button
                onClick={handleNext}
                disabled={weightKg <= 0 || totalCents <= 0}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Weiter <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : step === 2 ? (
          <div className="space-y-4">
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-lg rounded-xl">
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-600 mb-2">Zu zahlen</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">{formatCents(totalCents)} EUR</p>
                <p className="text-base text-gray-600 mt-2 font-medium">{weightGrams.toFixed(0)} g</p>
              </div>
            </Card>

            <div>
              <label className="text-sm font-medium mb-2 block">Zahlungsmethode</label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={() => setPaymentMethod('Bargeld')}
                  variant={paymentMethod === 'Bargeld' ? 'default' : 'outline'}
                  className={`h-16 text-lg ${paymentMethod === 'Bargeld' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                >
                  Bargeld
                </Button>
                <Button
                  type="button"
                  onClick={() => setPaymentMethod('Karte')}
                  variant={paymentMethod === 'Karte' ? 'default' : 'outline'}
                  className={`h-16 text-lg ${paymentMethod === 'Karte' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                >
                  Karte
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleBack} className="flex-1 rounded-xl border-2 hover:bg-gray-100">
                Zurueck
              </Button>
              <Button
                onClick={handlePaymentMethodNext}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                {paymentMethod === 'Karte' ? 'Bezahlen' : 'Weiter'} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-lg rounded-xl">
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-600 mb-2">Zu zahlen</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">{formatCents(totalCents)} EUR</p>
                <p className="text-base text-gray-600 mt-2 font-medium">{weightGrams.toFixed(0)} g</p>
              </div>
            </Card>

            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Banknote className="w-4 h-4" />
                Erhaltener Betrag (EUR)
              </label>
              <Input
                type="number"
                step="0.01"
                value={receivedMoney}
                onChange={(e) => setReceivedMoney(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && receivedMoney && changeCents >= 0) {
                    handleComplete();
                  }
                }}
                placeholder="Betrag eingeben..."
                className="text-lg"
                autoFocus
              />
              {receivedMoney && (
                <>
                  <Card className={`p-3 mt-3 ${changeCents >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{changeCents >= 0 ? 'Rueckgeld:' : 'Fehlbetrag:'}</span>
                      <span className={`text-xl font-bold ${changeCents >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {formatCents(Math.abs(changeCents))} EUR
                      </span>
                    </div>
                  </Card>

                  {changeCents > 0 && changeBreakdown.length > 0 && (
                    <Card className="p-3 mt-2 bg-gray-50 border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Coins className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Rueckgeld-Aufteilung:</span>
                      </div>
                      <div className="space-y-1">
                        {changeBreakdown.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-600">{item.count}x {item.label}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button
                onClick={handlePassend}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg py-7 font-bold shadow-xl hover:shadow-2xl transition-all rounded-xl"
              >
                <Banknote className="w-6 h-6 mr-2" />
                Passend bezahlt
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1 rounded-xl border-2 hover:bg-gray-100">
                  Zurueck
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={!receivedMoney || changeCents < 0}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50"
                >
                  Abschliessen
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
