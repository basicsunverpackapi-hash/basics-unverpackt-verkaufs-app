import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Calculator, Euro, Scale } from 'lucide-react';

export default function SaleDialog({ product, open, onClose, onComplete }) {
  const [mode, setMode] = useState('weight'); // 'weight' oder 'money'
  const [inputValue, setInputValue] = useState('');
  const [receivedMoney, setReceivedMoney] = useState('');

  if (!product) return null;

  const weight = mode === 'weight' ? parseFloat(inputValue) || 0 : (parseFloat(inputValue) || 0) / product.price_per_kg;
  const totalPrice = weight * product.price_per_kg;
  const change = receivedMoney ? parseFloat(receivedMoney) - totalPrice : 0;

  const handleComplete = () => {
    if (weight > 0) {
      onComplete({
        product_id: product.id,
        product_name: product.name,
        weight_kg: weight,
        price_per_kg: product.price_per_kg,
        total_price: totalPrice
      });
      setInputValue('');
      setReceivedMoney('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{product.name}</DialogTitle>
          <p className="text-sm text-gray-500">{product.price_per_kg?.toFixed(2)} € / kg</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              onClick={() => setMode('weight')}
              variant={mode === 'weight' ? 'default' : 'outline'}
              className={mode === 'weight' ? 'flex-1 bg-green-600' : 'flex-1'}
            >
              <Scale className="w-4 h-4 mr-2" />
              Gewicht
            </Button>
            <Button
              onClick={() => setMode('money')}
              variant={mode === 'money' ? 'default' : 'outline'}
              className={mode === 'money' ? 'flex-1 bg-green-600' : 'flex-1'}
            >
              <Euro className="w-4 h-4 mr-2" />
              Betrag
            </Button>
          </div>

          {/* Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {mode === 'weight' ? 'Gewicht (kg)' : 'Betrag (€)'}
            </label>
            <Input
              type="number"
              step="0.01"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={mode === 'weight' ? '0.00 kg' : '0.00 €'}
              className="text-lg"
              autoFocus
            />
          </div>

          {/* Calculation Display */}
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Gewicht:</span>
                <span className="font-semibold">{weight.toFixed(3)} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Preis:</span>
                <span className="text-xl font-bold text-green-600">{totalPrice.toFixed(2)} €</span>
              </div>
            </div>
          </Card>

          {/* Change Calculator */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Rückgeldrechner
            </label>
            <Input
              type="number"
              step="0.01"
              value={receivedMoney}
              onChange={(e) => setReceivedMoney(e.target.value)}
              placeholder="Erhaltener Betrag..."
              className="mb-2"
            />
            {receivedMoney && (
              <Card className={`p-3 ${change >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
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
            <Button variant="outline" onClick={onClose} className="flex-1">
              Abbrechen
            </Button>
            <Button 
              onClick={handleComplete} 
              disabled={weight <= 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Verkauf abschließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}