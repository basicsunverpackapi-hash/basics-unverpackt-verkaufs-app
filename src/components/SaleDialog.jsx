import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowRight, Banknote, Coins } from 'lucide-react';

export default function SaleDialog({ product, open, onClose, onComplete }) {
  const [step, setStep] = useState(1); // 1 = Gewicht/Betrag, 2 = Bezahlung
  const [mode, setMode] = useState('weight'); // 'weight' oder 'money'
  const [inputValue, setInputValue] = useState('');
  const [receivedMoney, setReceivedMoney] = useState('');

  if (!product) return null;

  // Preis pro kg berechnen
  const pricePerKg = (product.price_per_unit / product.unit_grams) * 1000;
  
  // Gewicht in kg berechnen
  const weightKg = mode === 'weight' 
    ? (parseFloat(inputValue) || 0) / 1000 
    : (parseFloat(inputValue) || 0) / pricePerKg;
  
  const totalPrice = weightKg * pricePerKg;
  const change = receivedMoney ? parseFloat(receivedMoney) - totalPrice : 0;

  // Rückgeld in Münzen/Scheine aufteilen
  const calculateChange = (amount) => {
    if (amount <= 0) return [];
    const denominations = [
      { value: 500, label: '500€ Schein' },
      { value: 200, label: '200€ Schein' },
      { value: 100, label: '100€ Schein' },
      { value: 50, label: '50€ Schein' },
      { value: 20, label: '20€ Schein' },
      { value: 10, label: '10€ Schein' },
      { value: 5, label: '5€ Schein' },
      { value: 2, label: '2€' },
      { value: 1, label: '1€' },
      { value: 0.50, label: '50ct' },
      { value: 0.20, label: '20ct' },
      { value: 0.10, label: '10ct' },
      { value: 0.05, label: '5ct' },
      { value: 0.02, label: '2ct' },
      { value: 0.01, label: '1ct' }
    ];

    const result = [];
    let remaining = Math.round(amount * 100) / 100;

    for (const denom of denominations) {
      const count = Math.floor(remaining / denom.value);
      if (count > 0) {
        result.push({ count, label: denom.label });
        remaining = Math.round((remaining - count * denom.value) * 100) / 100;
      }
    }

    return result;
  };

  const changeBreakdown = change > 0 ? calculateChange(change) : [];

  const handleComplete = () => {
    if (weightKg > 0) {
      onComplete({
        product_id: product.id,
        product_name: product.name,
        weight_kg: weightKg,
        price_per_kg: pricePerKg,
        total_price: totalPrice
      });
      setInputValue('');
      setReceivedMoney('');
      setStep(1);
      setMode('weight');
      onClose();
    }
  };

  const handleNext = () => {
    if (weightKg > 0) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
    setReceivedMoney('');
  };

  const handlePassend = () => {
    setReceivedMoney(totalPrice.toFixed(2));
    handleComplete();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        setStep(1);
        setInputValue('');
        setReceivedMoney('');
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 -mt-6 -mx-6 mb-4 text-white shadow-lg">
            <DialogTitle className="text-2xl font-bold">{product.name}</DialogTitle>
            <p className="text-green-100 mt-1 font-medium">
              {product.price_per_unit?.toFixed(2)} € / {product.unit_grams >= 1000 ? `${(product.unit_grams / 1000).toFixed(product.unit_grams % 1000 === 0 ? 0 : 1)} kg` : `${product.unit_grams}g`}
            </p>
          </div>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            {/* Mode Toggle */}
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

            {/* Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {mode === 'weight' ? 'Gewicht (Gramm)' : 'Betrag (€)'}
              </label>
              <Input
                type="number"
                step={mode === 'weight' ? '1' : '0.01'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={mode === 'weight' ? '0 g' : '0.00 €'}
                className="text-lg"
                autoFocus
              />
            </div>

            {/* Price Display */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-lg rounded-xl">
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-600 mb-2">Zu zahlen</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">{totalPrice.toFixed(2)} €</p>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl border-2 hover:bg-gray-100">
                Abbrechen
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={weightKg <= 0}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Weiter <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Price Summary */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-lg rounded-xl">
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-600 mb-2">Zu zahlen</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">{totalPrice.toFixed(2)} €</p>
                <p className="text-base text-gray-600 mt-2 font-medium">{(weightKg * 1000).toFixed(0)} g</p>
              </div>
            </Card>

            {/* Rückgeld Rechner */}
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Banknote className="w-4 h-4" />
                Erhaltener Betrag (€)
              </label>
              <Input
                type="number"
                step="0.01"
                value={receivedMoney}
                onChange={(e) => setReceivedMoney(e.target.value)}
                placeholder="Betrag eingeben..."
                className="text-lg"
                autoFocus
              />
              {receivedMoney && (
                <>
                  <Card className={`p-3 mt-3 ${change >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{change >= 0 ? 'Rückgeld:' : 'Fehlbetrag:'}</span>
                      <span className={`text-xl font-bold ${change >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {Math.abs(change).toFixed(2)} €
                      </span>
                    </div>
                  </Card>
                  
                  {change > 0 && changeBreakdown.length > 0 && (
                    <Card className="p-3 mt-2 bg-gray-50 border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Coins className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Rückgeld-Aufteilung:</span>
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

            {/* Actions */}
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
                  Zurück
                </Button>
                <Button 
                  onClick={handleComplete} 
                  disabled={!receivedMoney || change < 0}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50"
                >
                  Abschließen
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}