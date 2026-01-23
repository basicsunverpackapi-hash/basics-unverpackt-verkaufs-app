import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { offlineClient } from '@/components/offlineClient';
import { toast } from 'sonner';
import { Package, Euro, CreditCard, Banknote } from 'lucide-react';

export default function VerkaufenPage() {
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [receivedMoney, setReceivedMoney] = useState('');
  const [currentSeller] = useState(() => {
    const seller = localStorage.getItem('currentSeller');
    return seller ? JSON.parse(seller) : null;
  });

  const queryClient = useQueryClient();

  const createSaleMutation = useMutation({
    mutationFn: async (saleData) => {
      const sale = await offlineClient.entities.Sale.create(saleData);
      
      // Wenn Bargeld, erstelle CashRegister Entry
      if (saleData.payment_method === 'Bargeld') {
        await offlineClient.entities.CashRegister.create({
          seller_name: saleData.seller_name,
          amount: saleData.total_amount,
          type: 'sale',
          date: new Date().toISOString()
        });
      }
      
      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['cashRegister'] });
      toast.success('Verkauf erfolgreich gespeichert!');
      // Reset form
      setProductName('');
      setPrice('');
      setPaymentMethod(null);
      setReceivedMoney('');
    },
    onError: (error) => {
      toast.error('Fehler beim Speichern: ' + error.message);
    }
  });

  const handleSave = () => {
    const priceNum = parseFloat(price);

    // Validierung
    if (!productName.trim()) {
      toast.error('Bitte Produktname eingeben');
      return;
    }
    if (!price || priceNum <= 0 || !isFinite(priceNum)) {
      toast.error('Bitte gültigen Preis eingeben');
      return;
    }
    if (!paymentMethod) {
      toast.error('Bitte Zahlungsmethode wählen');
      return;
    }
    if (paymentMethod === 'Bargeld' && (!receivedMoney || parseFloat(receivedMoney) < priceNum)) {
      toast.error('Erhaltener Betrag muss mindestens dem Verkaufspreis entsprechen');
      return;
    }

    const saleData = {
      date: new Date().toISOString(),
      items: [{
        product_id: 'custom',
        product_name: productName.trim(),
        weight_kg: 1,
        price_per_kg: 0,
        total_price: priceNum
      }],
      total_amount: priceNum,
      payment_method: paymentMethod,
      seller_name: currentSeller?.name || 'Unbekannt'
    };

    createSaleMutation.mutate(saleData);
  };

  const change = receivedMoney && paymentMethod === 'Bargeld' 
    ? (parseFloat(receivedMoney) - parseFloat(price || 0)).toFixed(2) 
    : null;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl border-2 border-green-200">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
          <CardTitle className="text-2xl font-bold text-green-800 flex items-center gap-3">
            <Package className="w-7 h-7" />
            Manueller Verkauf
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Produktname */}
          <div className="space-y-2">
            <Label htmlFor="productName" className="text-base font-semibold">
              Produktname / Beschreibung
            </Label>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="z.B. Schlauch, neue Kasse..."
              className="text-lg"
              autoFocus
            />
          </div>

          {/* Preis */}
          <div className="space-y-2">
            <Label htmlFor="price" className="text-base font-semibold">
              Preis (€)
            </Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && productName && price && parseFloat(price) > 0) {
                    handleSave();
                  }
                }}
                placeholder="0.00"
                className="text-lg pl-10"
              />
            </div>
          </div>

          {/* Zahlungsmethode */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Zahlungsmethode</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={paymentMethod === 'Bargeld' ? 'default' : 'outline'}
                className={`h-16 text-base font-semibold ${
                  paymentMethod === 'Bargeld'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'hover:bg-green-50'
                }`}
                onClick={() => setPaymentMethod('Bargeld')}
              >
                <Banknote className="w-5 h-5 mr-2" />
                Bargeld
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'Karte' ? 'default' : 'outline'}
                className={`h-16 text-base font-semibold ${
                  paymentMethod === 'Karte'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'hover:bg-blue-50'
                }`}
                onClick={() => setPaymentMethod('Karte')}
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Karte
              </Button>
            </div>
          </div>

          {/* Erhaltener Betrag bei Bargeld */}
          {paymentMethod === 'Bargeld' && (
            <div className="space-y-2 bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
              <Label htmlFor="receivedMoney" className="text-base font-semibold">
                Erhaltener Betrag (€)
              </Label>
              <Input
                id="receivedMoney"
                type="number"
                step="0.01"
                value={receivedMoney}
                onChange={(e) => setReceivedMoney(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && receivedMoney && change >= 0) {
                    handleSave();
                  }
                }}
                placeholder="0.00"
                className="text-lg"
              />
              {change !== null && change >= 0 && (
                <div className="mt-3 p-3 bg-green-100 rounded-lg border border-green-300">
                  <p className="text-sm text-green-700 font-medium">Rückgeld</p>
                  <p className="text-2xl font-bold text-green-800">{change} €</p>
                </div>
              )}
            </div>
          )}

          {/* Speichern Button */}
          <Button
            onClick={handleSave}
            disabled={createSaleMutation.isPending || !productName || !price || parseFloat(price) <= 0 || !paymentMethod}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
          >
            {createSaleMutation.isPending ? 'Speichern...' : 'Verkauf speichern'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}