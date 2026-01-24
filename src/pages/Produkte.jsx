import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offlineClient } from '@/components/offlineClient';
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
    queryFn: () => offlineClient.entities.Product.list('-created_date', 100)
  });

  const createSaleMutation = useMutation({
    mutationFn: async (saleData) => {
      console.log('Erstelle Verkauf offline:', saleData);
      const newSale = await offlineClient.entities.Sale.create(saleData);
      console.log('Verkauf erstellt:', newSale);
      
      // Sofort den Cache mit den aktuellen lokalen Daten aktualisieren
      const updatedSales = await offlineClient.entities.Sale.list('-date', 100);
      console.log('Aktualisierte Sales-Liste:', updatedSales);
      queryClient.setQueryData(['sales'], updatedSales);
      
      // Queries neu laden erzwingen
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      
      return newSale;
    },
    onSuccess: () => {
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

  const handleSaleComplete = async (saleItem, paymentMethod) => {
    try {
      if (!saleItem || !saleItem.product_id || !saleItem.total_price) {
        toast.error('Ungültige Verkaufsdaten');
        return;
      }

      const currentSeller = JSON.parse(localStorage.getItem('currentSeller') || '{}');
      if (!currentSeller.name) {
        toast.error('Kein Verkäufer angemeldet');
        return;
      }

      const saleData = {
        date: new Date().toISOString(),
        items: [saleItem],
        total_amount: Number(saleItem.total_price),
        payment_method: paymentMethod,
        seller_name: currentSeller.name
      };
      
      // Bei Bargeld-Zahlung auch CashRegister-Eintrag erstellen
      if (paymentMethod === 'Bargeld') {
        await offlineClient.entities.CashRegister.create({
          seller_name: currentSeller.name,
          amount: Number(saleItem.total_price),
          type: 'sale',
          date: new Date().toISOString(),
          note: `Verkauf: ${saleItem.product_name}`
        });
        queryClient.invalidateQueries({ queryKey: ['cashRegister'] });
      }
      
      createSaleMutation.mutate(saleData);
    } catch (error) {
      console.error('Fehler beim Verkaufsabschluss:', error);
      toast.error('Fehler beim Speichern des Verkaufs');
    }
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Produkt suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-12 text-base rounded-xl border-2 focus:border-green-500 shadow-sm"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <Card 
              key={product.id} 
              className="group overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 border-gray-100 hover:border-green-400 rounded-2xl flex flex-col bg-white"
              onClick={() => handleProductClick(product)}
            >
              <div className="aspect-square relative overflow-hidden flex items-center justify-center">
                {product.image_url ? (
                  <div className="relative w-full h-full">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4">
                      <p className="text-white font-bold text-xl md:text-2xl drop-shadow-lg">{product.name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-500 via-emerald-600 to-green-600 flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow duration-300 p-8">
                    <span className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white text-center leading-tight break-words drop-shadow-lg w-full" style={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: '3',
                      WebkitBoxOrient: 'vertical',
                      wordBreak: 'break-word',
                      hyphens: 'auto',
                      overflow: 'hidden'
                    }}>
                      {product.name}
                    </span>
                  </div>
                )}
              </div>
              <CardContent className="p-6 bg-white">
                <div className="flex flex-col gap-2">
                  {product.image_url && (
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{product.name}</h3>
                  )}
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-green-600">
                      {product.price_per_unit?.toFixed(2)}€
                    </span>
                    <span className="text-xl text-gray-500 font-semibold whitespace-nowrap">
                      {product.unit_grams >= 1000 ? `${(product.unit_grams / 1000).toFixed(product.unit_grams % 1000 === 0 ? 0 : 1)}kg` : `${product.unit_grams}g`}
                    </span>
                  </div>
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