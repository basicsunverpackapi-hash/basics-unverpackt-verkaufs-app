import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ShoppingCart, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function Verkäufe() {
  const [cart, setCart] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [weight, setWeight] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bargeld');

  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-name', 100)
  });

  const createSaleMutation = useMutation({
    mutationFn: (saleData) => base44.entities.Sale.create(saleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Verkauf erfolgreich erfasst!');
      setCart([]);
      setSelectedProductId('');
      setWeight('');
    }
  });

  const activeProducts = products.filter(p => p.active !== false);

  const addToCart = () => {
    if (!selectedProductId || !weight || parseFloat(weight) <= 0) {
      toast.error('Bitte Produkt und Gewicht auswählen');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    const weightNum = parseFloat(weight);
    const totalPrice = weightNum * product.price_per_kg;

    setCart([...cart, {
      product_id: product.id,
      product_name: product.name,
      weight_kg: weightNum,
      price_per_kg: product.price_per_kg,
      total_price: totalPrice
    }]);

    setSelectedProductId('');
    setWeight('');
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.total_price, 0);
  };

  const completeSale = async () => {
    if (cart.length === 0) {
      toast.error('Warenkorb ist leer');
      return;
    }

    const saleData = {
      date: new Date().toISOString(),
      items: cart,
      total_amount: getTotalAmount(),
      payment_method: paymentMethod
    };

    createSaleMutation.mutate(saleData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Verkäufe erfassen</h2>
        <p className="text-gray-600 mt-1">Neue Verkäufe erfassen und Warenkorb verwalten</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Add to Cart */}
        <Card>
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
                      {product.name} ({product.price_per_kg?.toFixed(2)} €/kg)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Gewicht (kg)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <Button onClick={addToCart} className="w-full bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Zum Warenkorb hinzufügen
            </Button>
          </CardContent>
        </Card>

        {/* Cart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Warenkorb ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Warenkorb ist leer</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-gray-600">
                        {item.weight_kg.toFixed(2)} kg × {item.price_per_kg.toFixed(2)} €
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-green-600">
                        {item.total_price.toFixed(2)} €
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-3 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Gesamt:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {getTotalAmount().toFixed(2)} €
                    </span>
                  </div>

                  <div className="mb-4">
                    <label className="text-sm font-medium mb-2 block">Zahlungsmethode</label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bargeld">Bargeld</SelectItem>
                        <SelectItem value="EC-Karte">EC-Karte</SelectItem>
                        <SelectItem value="Kreditkarte">Kreditkarte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={completeSale}
                    disabled={createSaleMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Verkauf abschließen
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}