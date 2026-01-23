import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offlineClient } from '@/components/offlineClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import React from 'react';
import { Wallet, Plus, TrendingUp, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfDay, isToday } from 'date-fns';
import { de } from 'date-fns/locale';

export default function Kasse() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [emptyDialogOpen, setEmptyDialogOpen] = useState(false);
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false);
  const [initialAmount, setInitialAmount] = useState('');
  const [correctionAmount, setCorrectionAmount] = useState('');
  const [note, setNote] = useState('');
  const [emptyMode, setEmptyMode] = useState('remaining'); // 'remaining' oder 'taken'
  const [emptyAmount, setEmptyAmount] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const queryClient = useQueryClient();

  const { data: cashEntries = [] } = useQuery({
    queryKey: ['cashRegister'],
    queryFn: () => offlineClient.entities.CashRegister.list('-date', 1000)
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => offlineClient.entities.Sale.list('-date', 1000)
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => offlineClient.entities.Purchase.list('-date', 1000)
  });

  // Check Admin Status
  React.useEffect(() => {
    const seller = localStorage.getItem('currentSeller');
    if (seller) {
      const parsed = JSON.parse(seller);
      setIsAdmin(parsed.is_admin || false);
    }
  }, []);

  const addCashMutation = useMutation({
    mutationFn: (data) => offlineClient.entities.CashRegister.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashRegister'] });
      toast.success('Kasseneintrag hinzugefügt');
      setDialogOpen(false);
      setEmptyDialogOpen(false);
      setCorrectionDialogOpen(false);
      setInitialAmount('');
      setCorrectionAmount('');
      setEmptyAmount('');
      setNote('');
    }
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (id) => offlineClient.entities.CashRegister.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashRegister'] });
      toast.success('Eintrag gelöscht');
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

  const handleEmptyCash = (e) => {
    e.preventDefault();
    const currentSeller = JSON.parse(localStorage.getItem('currentSeller') || '{}');
    
    let amountToDeduct = 0;
    if (emptyMode === 'remaining') {
      // Benutzer gibt an, wieviel übrig bleiben soll
      amountToDeduct = -(totalCash - parseFloat(emptyAmount || 0));
    } else {
      // Benutzer gibt an, wieviel entnommen wurde
      amountToDeduct = -parseFloat(emptyAmount || 0);
    }
    
    addCashMutation.mutate({
      seller_name: currentSeller.name || 'Unbekannt',
      amount: amountToDeduct,
      type: 'empty',
      date: new Date().toISOString(),
      note: note || `${emptyMode === 'remaining' ? 'Kasse teilweise entleert' : 'Entnahme'}`
    });
  };

  const handleCorrection = (e) => {
    e.preventDefault();
    const currentSeller = JSON.parse(localStorage.getItem('currentSeller') || '{}');
    const correctionValue = parseFloat(correctionAmount) - totalCash;
    
    addCashMutation.mutate({
      seller_name: currentSeller.name || 'Unbekannt',
      amount: correctionValue,
      type: 'correction',
      date: new Date().toISOString(),
      note: note || `Korrektur auf ${parseFloat(correctionAmount).toFixed(2)} €`
    });
  };

  // Berechne Kassensummen (inkl. Ladeneinkäufe)
  const cashSales = sales.filter(sale => sale.payment_method === 'Bargeld');
  const cashPurchases = purchases.filter(p => p.payment_method === 'Bargeld');
  
  const totalFromEntries = cashEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
  const totalFromSales = cashSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const totalFromPurchases = cashPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const totalCash = totalFromEntries + totalFromSales - totalFromPurchases;

  // Gruppiere nach Verkäufer
  const sellerStats = {};
  
  cashEntries.forEach(entry => {
    if (!sellerStats[entry.seller_name]) {
      sellerStats[entry.seller_name] = { entries: 0, sales: 0 };
    }
    sellerStats[entry.seller_name].entries += entry.amount || 0;
  });

  cashSales.forEach(sale => {
    if (!sellerStats[sale.seller_name]) {
      sellerStats[sale.seller_name] = { entries: 0, sales: 0 };
    }
    sellerStats[sale.seller_name].sales += sale.total_amount || 0;
  });

  // Alle Aktivitäten (neueste zuerst)
  const allActivities = [
    ...cashEntries.map(e => ({ ...e, activityType: 'entry' })),
    ...cashPurchases.map(p => ({ ...p, activityType: 'purchase' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl p-4 sm:p-6 shadow-lg text-white">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Kasse</h2>
            <p className="text-green-100 mt-2 text-sm sm:text-base">Kassenstand und Übersicht</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => setDialogOpen(true)}
              className="bg-white text-green-700 hover:bg-green-50 font-bold shadow-lg rounded-xl px-3 py-2 sm:px-4 sm:py-3 flex-1 sm:flex-none text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
              <span className="hidden sm:inline">Bestand erfassen</span>
              <span className="sm:hidden">Bestand</span>
            </Button>
            <Button 
              onClick={() => setCorrectionDialogOpen(true)}
              className="bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-lg rounded-xl px-3 py-2 sm:px-4 sm:py-3 flex-1 sm:flex-none text-sm sm:text-base"
            >
              Korrigieren
            </Button>
            <Button 
              onClick={() => setEmptyDialogOpen(true)}
              className="bg-red-600 text-white hover:bg-red-700 font-bold shadow-lg rounded-xl px-3 py-2 sm:px-4 sm:py-3 flex-1 sm:flex-none text-sm sm:text-base"
            >
              Entleeren
            </Button>
          </div>
        </div>
      </div>

      {/* Kassenstand gesamt */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-300 border-2 shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <p className="text-lg text-green-700 font-semibold mb-1">Kassenstand gesamt</p>
              <p className="text-5xl font-bold text-green-900">{totalCash.toFixed(2)} €</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pro Verkäufer */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4">Übersicht pro Verkäufer</h3>
          <div className="space-y-3">
            {Object.entries(sellerStats).map(([seller, stats]) => (
              <div key={seller} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{seller}</p>
                    <p className="text-sm text-gray-500">
                      Einträge: {stats.entries.toFixed(2)} € | Verkäufe: {stats.sales.toFixed(2)} €
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {(stats.entries + stats.sales).toFixed(2)} €
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

      {/* Aktivitäten */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Aktivitäten (letzte 50)
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {allActivities.map(activity => {
              if (activity.activityType === 'entry') {
                return (
                  <div key={`entry-${activity.id}`} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex-1">
                      <p className="font-medium">{activity.seller_name}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(activity.date), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr
                        {activity.note && ` - ${activity.note}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`text-lg font-bold ${activity.amount >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {activity.amount >= 0 ? '+' : ''}{activity.amount.toFixed(2)} €
                      </p>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Diesen Eintrag wirklich löschen?')) {
                              deleteEntryMutation.mutate(activity.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-100 h-8 w-8 p-0"
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={`purchase-${activity.id}`} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex-1">
                      <p className="font-medium">{activity.seller_name}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(activity.date), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr - Einkauf: {activity.item_name}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-red-600">-{activity.amount.toFixed(2)} €</p>
                  </div>
                );
              }
            })}
            {allActivities.length === 0 && (
              <p className="text-center text-gray-500 py-4">Noch keine Aktivitäten vorhanden</p>
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

      {/* Dialog für Kasse entleeren */}
      <Dialog open={emptyDialogOpen} onOpenChange={setEmptyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-orange-600">Geld aus Kasse entnehmen</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Aktueller Kassenstand: <span className="font-bold">{totalCash.toFixed(2)} €</span>
              </p>
            </div>

            <form onSubmit={handleEmptyCash} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Modus wählen</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={emptyMode === 'remaining' ? 'default' : 'outline'}
                    onClick={() => setEmptyMode('remaining')}
                    className="flex-1"
                  >
                    Rest angeben
                  </Button>
                  <Button
                    type="button"
                    variant={emptyMode === 'taken' ? 'default' : 'outline'}
                    onClick={() => setEmptyMode('taken')}
                    className="flex-1"
                  >
                    Entnahme angeben
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {emptyMode === 'remaining' ? 'Wie viel soll übrig bleiben? (€)' : 'Wie viel wurde entnommen? (€)'}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={emptyAmount}
                  onChange={(e) => setEmptyAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  autoFocus
                />
                {emptyAmount && (
                  <p className="text-sm text-gray-600 mt-2">
                    {emptyMode === 'remaining' 
                      ? `Entnommen werden: ${(totalCash - parseFloat(emptyAmount || 0)).toFixed(2)} €`
                      : `Neuer Kassenstand: ${(totalCash - parseFloat(emptyAmount || 0)).toFixed(2)} €`
                    }
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Notiz (optional)</label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="z.B. Einzahlung zur Bank"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setEmptyDialogOpen(false);
                    setEmptyAmount('');
                    setNote('');
                  }} 
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Bestätigen
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog für Korrektur */}
      <Dialog open={correctionDialogOpen} onOpenChange={setCorrectionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kassenstand korrigieren</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Aktueller Kassenstand: <span className="font-bold">{totalCash.toFixed(2)} €</span>
              </p>
            </div>

            <form onSubmit={handleCorrection} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Neuer Kassenstand (€) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={correctionAmount}
                  onChange={(e) => setCorrectionAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  autoFocus
                />
                {correctionAmount && (
                  <p className="text-sm text-gray-600 mt-2">
                    Differenz: <span className={parseFloat(correctionAmount) - totalCash >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {(parseFloat(correctionAmount) - totalCash).toFixed(2)} €
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Notiz (optional)</label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Grund der Korrektur"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setCorrectionDialogOpen(false);
                    setCorrectionAmount('');
                    setNote('');
                  }} 
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Korrigieren
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}