import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offlineClient } from '@/components/offlineClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wallet, Plus, TrendingUp, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfDay, isToday } from 'date-fns';
import { de } from 'date-fns/locale';

export default function Kasse() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialAmount, setInitialAmount] = useState('');
  const [note, setNote] = useState('');
  const queryClient = useQueryClient();

  const { data: cashEntries = [] } = useQuery({
    queryKey: ['cashRegister'],
    queryFn: () => offlineClient.entities.CashRegister.list('-date', 1000)
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => offlineClient.entities.Sale.list('-date', 1000)
  });

  const addCashMutation = useMutation({
    mutationFn: (data) => offlineClient.entities.CashRegister.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashRegister'] });
      toast.success('Kasseneintrag hinzugefügt');
      setDialogOpen(false);
      setInitialAmount('');
      setNote('');
    }
  });

  const handleAddInitialAmount = (e) => {
    e.preventDefault();
    const currentSeller = JSON.parse(localStorage.getItem('currentSeller') || '{}');
    
    addCashMutation.mutate({
      seller_name: currentSeller.name || 'Unbekannt',
      amount: parseFloat(initialAmount),
      type: 'initial',
      date: new Date().toISOString(),
      note: note || undefined
    });
  };

  // Berechne Kassensummen
  const cashSales = sales.filter(sale => sale.payment_method === 'Bargeld');
  
  const totalInitial = cashEntries
    .filter(entry => entry.type === 'initial')
    .reduce((sum, entry) => sum + (entry.amount || 0), 0);
  
  const totalFromSales = cashSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  
  const totalCash = totalInitial + totalFromSales;

  // Gruppiere nach Verkäufer
  const sellerStats = {};
  
  cashEntries.filter(entry => entry.type === 'initial').forEach(entry => {
    if (!sellerStats[entry.seller_name]) {
      sellerStats[entry.seller_name] = { initial: 0, sales: 0 };
    }
    sellerStats[entry.seller_name].initial += entry.amount || 0;
  });

  cashSales.forEach(sale => {
    if (!sellerStats[sale.seller_name]) {
      sellerStats[sale.seller_name] = { initial: 0, sales: 0 };
    }
    sellerStats[sale.seller_name].sales += sale.total_amount || 0;
  });

  // Heutige Einträge
  const todayEntries = cashEntries.filter(entry => isToday(new Date(entry.date)));
  const todaySales = cashSales.filter(sale => isToday(new Date(sale.date)));

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl p-6 shadow-lg text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">Kasse</h2>
            <p className="text-green-100 mt-2">Kassenstand und Übersicht</p>
          </div>
          <Button 
            onClick={() => setDialogOpen(true)}
            className="bg-white text-green-700 hover:bg-green-50 font-bold shadow-lg rounded-xl px-6 py-3"
          >
            <Plus className="w-5 h-5 mr-2" />
            Kassenbestand erfassen
          </Button>
        </div>
      </div>

      {/* Gesamtübersicht */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">Kassenstand gesamt</p>
                <p className="text-3xl font-bold text-blue-900">{totalCash.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">Barverkäufe</p>
                <p className="text-3xl font-bold text-green-900">{totalFromSales.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-700 font-medium">Anfangsbestand</p>
                <p className="text-3xl font-bold text-purple-900">{totalInitial.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pro Verkäufer */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4">Übersicht pro Verkäufer</h3>
          <div className="space-y-3">
            {Object.entries(sellerStats).map(([seller, stats]) => (
              <div key={seller} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{seller}</p>
                    <p className="text-sm text-gray-500">
                      Anfang: {stats.initial.toFixed(2)} € | Verkäufe: {stats.sales.toFixed(2)} €
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {(stats.initial + stats.sales).toFixed(2)} €
                  </p>
                  <p className="text-xs text-gray-500">Gesamt</p>
                </div>
              </div>
            ))}
            {Object.keys(sellerStats).length === 0 && (
              <p className="text-center text-gray-500 py-8">Noch keine Einträge vorhanden</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Heutige Aktivitäten */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Heutige Aktivitäten
          </h3>
          <div className="space-y-2">
            {todayEntries.map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <p className="font-medium">{entry.seller_name}</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(entry.date), 'HH:mm', { locale: de })} Uhr
                    {entry.note && ` - ${entry.note}`}
                  </p>
                </div>
                <p className="text-lg font-bold text-blue-600">+{entry.amount.toFixed(2)} €</p>
              </div>
            ))}
            {todayEntries.length === 0 && (
              <p className="text-center text-gray-500 py-4">Noch keine Kasseneinträge heute</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog für Kassenbestand */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kassenbestand erfassen</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAddInitialAmount} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Betrag in Kasse (€) *</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                placeholder="0.00"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Notiz (optional)</label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="z.B. Anfangsbestand"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)} 
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Hinzufügen
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}