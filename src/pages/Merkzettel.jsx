import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ClipboardList, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function Merkzettel() {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [estimatedKg, setEstimatedKg] = useState('');
  const [notes, setNotes] = useState('');

  const queryClient = useQueryClient();

  const { data: shoppingList = [] } = useQuery({
    queryKey: ['shoppingList'],
    queryFn: () => base44.entities.ShoppingList.list('-created_date', 100)
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-name', 100)
  });

  const addItemMutation = useMutation({
    mutationFn: (data) => base44.entities.ShoppingList.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoppingList'] });
      toast.success('Produkt zum Merkzettel hinzugefügt');
      setSelectedProductId('');
      setEstimatedKg('');
      setNotes('');
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id) => base44.entities.ShoppingList.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoppingList'] });
      toast.success('Produkt entfernt');
    }
  });

  const handleAddItem = () => {
    if (!selectedProductId) {
      toast.error('Bitte wähle ein Produkt aus');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    
    addItemMutation.mutate({
      product_id: product.id,
      product_name: product.name,
      estimated_kg: estimatedKg ? parseFloat(estimatedKg) : undefined,
      notes: notes || undefined
    });
  };

  const activeProducts = products.filter(p => p.active !== false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Merkzettel</h2>
        <p className="text-gray-600 mt-1">Nachbestellungen und Einkaufsliste verwalten</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Add Item Form */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-lg mb-4">Neues Produkt hinzufügen</h3>
            
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
              <label className="text-sm font-medium mb-2 block">Geschätzte Menge (kg)</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={estimatedKg}
                onChange={(e) => setEstimatedKg(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Notizen</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleAddItem}
              disabled={addItemMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Hinzufügen
            </Button>
          </CardContent>
        </Card>

        {/* Shopping List */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Merkzettel ({shoppingList.length})
            </h3>

            {shoppingList.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">Merkzettel ist leer</p>
                <p className="text-sm text-gray-400 mt-1">
                  Füge Produkte hinzu, die nachbestellt werden sollen
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {shoppingList.map((item) => (
                  <div key={item.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{item.product_name}</h4>
                        {item.estimated_kg && (
                          <span className="text-sm text-gray-600">
                            ({item.estimated_kg} kg)
                          </span>
                        )}
                      </div>
                      {item.notes && (
                        <p className="text-sm text-gray-600">{item.notes}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteItemMutation.mutate(item.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
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

      {/* Summary */}
      {shoppingList.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg text-green-900">
                  {shoppingList.length} Produkte auf dem Merkzettel
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Gesamte geschätzte Menge: {shoppingList.reduce((sum, item) => sum + (item.estimated_kg || 0), 0).toFixed(1)} kg
                </p>
              </div>
              <Button className="bg-green-600 hover:bg-green-700">
                <Check className="w-4 h-4 mr-2" />
                Liste exportieren
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}