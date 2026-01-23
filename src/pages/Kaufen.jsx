import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { offlineClient } from '@/components/offlineClient';
import { toast } from 'sonner';
import { ShoppingBag, Euro, CreditCard, Banknote } from 'lucide-react';

export default function KaufenPage() {
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [currentSeller] = useState(() => {
    const seller = localStorage.getItem('currentSeller');
    return seller ? JSON.parse(seller) : null;
  });

  const queryClient = useQueryClient();

  const createPurchaseMutation = useMutation({
    mutationFn: async (purchaseData) => {
      const purchase = await offlineClient.entities.Purchase.create(purchaseData);
      
      // Wenn Bargeld, erstelle CashRegister Entry mit negativem Betrag
      if (purchaseData.payment_method === 'Bargeld') {
        await offlineClient.entities.CashRegister.create({
          seller_name: purchaseData.seller_name,
          amount: -purchaseData.amount,
          type: 'correction',
          date: new Date().toISOString(),
          note: `Einkauf: ${purchaseData.item_name}`
        });
      }
      
      return purchase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['cashRegister'] });
      toast.success('Einkauf erfolgreich gespeichert!');
      // Reset form
      setItemName('');
      setAmount('');
      setPaymentMethod(null);
    },
    onError: (error) => {
      toast.error('Fehler beim Speichern: ' + error.message);
    }
  });

  const handleSave = () => {
    const amountNum = parseFloat(amount);

    // Validierung
    if (!itemName.trim()) {
      toast.error('Bitte Artikelname eingeben');
      return;
    }
    if (!amount || amountNum <= 0 || !isFinite(amountNum)) {
      toast.error('Bitte gültigen Betrag eingeben');
      return;
    }
    if (!paymentMethod) {
      toast.error('Bitte Zahlungsmethode wählen');
      return;
    }

    const purchaseData = {
      date: new Date().toISOString(),
      item_name: itemName.trim(),
      amount: amountNum,
      payment_method: paymentMethod,
      seller_name: currentSeller?.name || 'Unbekannt'
    };

    createPurchaseMutation.mutate(purchaseData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl border-2 border-orange-200">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b-2 border-orange-200">
          <CardTitle className="text-2xl font-bold text-orange-800 flex items-center gap-3">
            <ShoppingBag className="w-7 h-7" />
            Einkauf für Basics Unverpackt
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Artikelname */}
          <div className="space-y-2">
            <Label htmlFor="itemName" className="text-base font-semibold">
              Artikel / Material
            </Label>
            <Input
              id="itemName"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="z.B. Schlauch, Regale, Putzmittel..."
              className="text-lg"
              autoFocus
            />
          </div>

          {/* Betrag */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-base font-semibold">
              Betrag (€)
            </Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && itemName && amount && parseFloat(amount) > 0 && paymentMethod) {
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
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'hover:bg-orange-50'
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

          {/* Info Box */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Hinweis:</strong> Dieser Einkauf wird als Ausgabe in der Kasse und Analyse berücksichtigt.
            </p>
          </div>

          {/* Speichern Button */}
          <Button
            onClick={handleSave}
            disabled={createPurchaseMutation.isPending || !itemName || !amount || parseFloat(amount) <= 0 || !paymentMethod}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg"
          >
            {createPurchaseMutation.isPending ? 'Speichern...' : 'Einkauf speichern'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}