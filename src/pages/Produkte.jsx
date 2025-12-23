import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import SaleDialog from '../components/SaleDialog';
import { toast } from 'sonner';

export default function Produkte() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-created_date', 100)
  });

  const createSaleMutation = useMutation({
    mutationFn: (saleData) => base44.entities.Sale.create(saleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Verkauf erfolgreich erfasst!');
    }
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && product.active !== false;
  });

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleSaleComplete = async (saleItem) => {
    const saleData = {
      date: new Date().toISOString(),
      items: [saleItem],
      total_amount: saleItem.total_price,
      payment_method: 'Bargeld'
    };
    createSaleMutation.mutate(saleData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Produkte</h2>
        <p className="text-gray-600 mt-1">Übersicht aller verfügbaren Produkte</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Produkt suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="w-full h-48" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600">Keine Produkte gefunden</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Card 
              key={product.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleProductClick(product)}
            >
              <div className="aspect-square bg-gradient-to-br from-green-100 to-emerald-100 relative">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl text-green-600 font-bold">
                      {product.name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-green-600">
                    {product.price_per_unit?.toFixed(2)} € / {product.unit_grams >= 1000 ? `${(product.unit_grams / 1000).toFixed(product.unit_grams % 1000 === 0 ? 0 : 1)} kg` : `${product.unit_grams}g`}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SaleDialog
        product={selectedProduct}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onComplete={handleSaleComplete}
      />
    </div>
  );
}