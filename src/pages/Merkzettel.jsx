import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offlineClient } from '../components/offlineClient.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Trash2, ClipboardList, User, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function Merkzettel() {
  const [activeTab, setActiveTab] = useState('reorder');
  
  // Nachbestellung
  const [selectedProductId, setSelectedProductId] = useState('');
  const [estimatedKg, setEstimatedKg] = useState('');
  const [reorderNotes, setReorderNotes] = useState('');

  // Schulden
  const [debtName, setDebtName] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtNotes, setDebtNotes] = useState('');

  const queryClient = useQueryClient();

  const { data: shoppingList = [] } = useQuery({
    queryKey: ['shoppingList'],
    queryFn: () => offlineClient.entities.ShoppingList.list('-created_date', 100)
  });

  const { data: debts = [] } = useQuery({
    queryKey: ['debts'],
    queryFn: () => offlineClient.entities.Debt.list('-created_date', 100)
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => offlineClient.entities.Product.list('-name', 100)
  });

  const addReorderMutation = useMutation({
    mutationFn: (data) => offlineClient.entities.ShoppingList.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoppingList'] });
      toast.success('Produkt zum Merkzettel hinzugefügt');
      setSelectedProductId('');
      setEstimatedKg('');
      setReorderNotes('');
    }
  });

  const deleteReorderMutation = useMutation({
    mutationFn: (id) => offlineClient.entities.ShoppingList.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoppingList'] });
      toast.success('Produkt entfernt');
    }
  });

  const addDebtMutation = useMutation({
    mutationFn: (data) => offlineClient.entities.Debt.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      toast.success('Schuld eingetragen');
      setDebtName('');
      setDebtAmount('');
      setDebtNotes('');
    }
  });

  const updateDebtMutation = useMutation({
    mutationFn: ({ id, data }) => offlineClient.entities.Debt.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      toast.success('Schuld aktualisiert');
    }
  });

  const deleteDebtMutation = useMutation({
    mutationFn: (id) => offlineClient.entities.Debt.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      toast.success('Schuld gelöscht');
    }
  });

  const handleAddReorder = () => {
    if (!selectedProductId) {
      toast.error('Bitte wähle zuerst ein Produkt aus');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    
    addReorderMutation.mutate({
      product_id: product.id,
      product_name: product.name,
      notes: reorderNotes || undefined
    });
  };

  const handleAddDebt = () => {
    if (!debtName || !debtAmount) {
      toast.error('Bitte Name und Betrag eingeben');
      return;
    }

    addDebtMutation.mutate({
      name: debtName,
      amount: parseFloat(debtAmount),
      notes: debtNotes || undefined,
      paid: false
    });
  };

  const activeProducts = products.filter(p => p.active !== false);
  const unpaidDebts = debts.filter(d => !d.paid);
  const totalDebt = unpaidDebts.reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-6 shadow-lg text-white">
        <h2 className="text-3xl font-bold">Merkzettel</h2>
        <p className="text-pink-100 mt-2">Nachbestellungen und Schulden verwalten</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="reorder">
            <ClipboardList className="w-4 h-4 mr-2" />
            Nachbestellung
          </TabsTrigger>
          <TabsTrigger value="debts">
            <User className="w-4 h-4 mr-2" />
            Schulden
          </TabsTrigger>
        </TabsList>

        {/* Nachbestellung Tab */}
        <TabsContent value="reorder" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Produkt hinzufügen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Produkt</label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Produkt wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeProducts.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Notizen</label>
                  <Textarea
                    value={reorderNotes}
                    onChange={(e) => setReorderNotes(e.target.value)}
                    placeholder="Optional..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleAddReorder}
                  disabled={addReorderMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Hinzufügen
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Nachbestellungen ({shoppingList.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {shoppingList.length === 0 ? (
                  <div className="text-center py-12">
                    <ClipboardList className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">Keine Nachbestellungen</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shoppingList.map((item) => (
                      <div key={item.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{item.product_name}</h4>
                          {item.notes && (
                            <p className="text-sm text-gray-600">{item.notes}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteReorderMutation.mutate(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Schulden Tab */}
        <TabsContent value="debts" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Neue Schuld eintragen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Name</label>
                  <Input
                    value={debtName}
                    onChange={(e) => setDebtName(e.target.value)}
                    placeholder="Name der Person"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Betrag (€)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={debtAmount}
                    onChange={(e) => setDebtAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Notizen</label>
                  <Textarea
                    value={debtNotes}
                    onChange={(e) => setDebtNotes(e.target.value)}
                    placeholder="Optional..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleAddDebt}
                  disabled={addDebtMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Schuld eintragen
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Offene Schulden ({unpaidDebts.length})
                  </span>
                  <span className="text-2xl font-bold text-red-600">
                    {totalDebt.toFixed(2)} €
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {unpaidDebts.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">Keine offenen Schulden</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {unpaidDebts.map((debt) => (
                      <div key={debt.id} className="flex items-start justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-lg">{debt.name}</h4>
                            <span className="text-xl font-bold text-red-600">
                              {debt.amount?.toFixed(2)} €
                            </span>
                          </div>
                          {debt.notes && (
                            <p className="text-sm text-gray-600">{debt.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateDebtMutation.mutate({ id: debt.id, data: { paid: true } })}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteDebtMutation.mutate(debt.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}