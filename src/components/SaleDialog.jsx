import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowRight, Banknote } from 'lucide-react';

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{product.name}</DialogTitle>
          <p className="text-sm text-gray-500">
            {product.price_per_unit?.toFixed(2)} € / {product.unit_grams}g
          </p>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex gap-2">
              <Button
                onClick={() => setMode('weight')}
                variant={mode === 'weight' ? 'default' : 'outline'}
                className={mode === 'weight' ? 'flex-1 bg-green-600' : 'flex-1'}
              >
                Gewicht
              </Button>
              <Button
                onClick={() => setMode('money')}
                variant={mode === 'money' ? 'default' : 'outline'}
                className={mode === 'money' ? 'flex-1 bg-green-600' : 'flex-1'}
              >
                Betrag
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
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Preis</p>
                <p className="text-3xl font-bold text-green-600">{totalPrice.toFixed(2)} €</p>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Abbrechen
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={weightKg <= 0}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Weiter <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Price Summary */}
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Zu zahlen</p>
                <p className="text-3xl font-bold text-green-600">{totalPrice.toFixed(2)} €</p>
                <p className="text-sm text-gray-500 mt-1">{(weightKg * 1000).toFixed(0)} g</p>
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
                <Card className={`p-3 mt-3 ${change >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{change >= 0 ? 'Rückgeld:' : 'Fehlbetrag:'}</span>
                    <span className={`text-xl font-bold ${change >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {Math.abs(change).toFixed(2)} €
                    </span>
                  </div>
                </Card>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Zurück
              </Button>
              <Button 
                onClick={handlePassend}
                variant="outline"
                className="flex-1"
              >
                Passend
              </Button>
              <Button 
                onClick={handleComplete} 
                disabled={!receivedMoney || change < 0}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Abschließen
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}