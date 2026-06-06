import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offlineClient } from '@/components/offlineClient';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import SaleDialog from '../components/SaleDialog';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { centsToMoney, formatMoney, moneyToCents } from '@/lib/money';

export default function Produkte() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pullDistance = useRef(0);

  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => offlineClient.entities.Product.list('-created_date', 100)
  });

  const createSaleMutation = useMutation({
    mutationFn: async (saleData) => {
      const newSale = await offlineClient.entities.Sale.create(saleData);
      
      // Sofort den Cache mit den aktuellen lokalen Daten aktualisieren
      const updatedSales = await offlineClient.entities.Sale.list('-date', 100);
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['products'] });
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (window.scrollY === 0 && startY.current > 0) {
      const currentY = e.touches[0].clientY;
      pullDistance.current = Math.max(0, currentY - startY.current);
      
      if (pullDistance.current > 80 && !isRefreshing) {
        handleRefresh();
      }
    }
  };

  const handleTouchEnd = () => {
    startY.current = 0;
    pullDistance.current = 0;
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleSaleComplete = async (saleItem, paymentMethod) => {
    try {
      const saleCents = saleItem?.total_price_cents ?? moneyToCents(saleItem?.total_price);
      if (!saleItem || !saleItem.product_id || saleCents <= 0) {
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
        total_amount: centsToMoney(saleCents),
        total_amount_cents: saleCents,
        payment_method: paymentMethod,
        seller_name: currentSeller.name
      };
      
      // Bei Bargeld-Zahlung auch CashRegister-Eintrag erstellen
      if (paymentMethod === 'Bargeld') {
        await offlineClient.entities.CashRegister.create({
          seller_name: currentSeller.name,
          amount: centsToMoney(saleCents),
          amount_cents: saleCents,
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
    <div className="space-y-6" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {/* Pull to Refresh Indicator */}
      {isRefreshing && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center py-4"
        >
          <RefreshCw className="w-6 h-6 animate-spin text-green-600 dark:text-green-400" />
        </motion.div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5 select-none" />
        <Input
          type="text"
          placeholder="Produkt suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-12 text-base rounded-xl border-2 focus:border-green-500 dark:focus:border-green-400 shadow-sm dark:bg-slate-800 dark:text-white dark:border-slate-700"
        />
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden dark:bg-slate-800 dark:border-slate-700">
              <Skeleton className="w-full h-48 dark:bg-slate-700" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2 dark:bg-slate-700" />
                <Skeleton className="h-3 w-1/2 dark:bg-slate-700" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-12 text-center dark:bg-slate-800 dark:border-slate-700">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400 dark:text-gray-500 select-none" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">Keine Produkte gefunden</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <Card 
              key={product.id} 
              className="group overflow-hidden hover:shadow-2xl dark:hover:shadow-green-900/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 border-gray-100 dark:border-slate-700 hover:border-green-400 dark:hover:border-green-600 rounded-2xl flex flex-col bg-white dark:bg-slate-800"
              onClick={() => handleProductClick(product)}
            >
              <div className="aspect-square relative overflow-hidden flex items-center justify-center">
                {product.image_url ? (
                  <div className="relative w-full h-full">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 select-none"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3">
                      <p className="text-white font-bold text-base md:text-lg drop-shadow-lg line-clamp-2">{product.name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-500 via-emerald-600 to-green-600 dark:from-green-600 dark:via-emerald-700 dark:to-green-700 flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow duration-300 p-4">
                    <span className="text-xl md:text-2xl font-extrabold text-white text-center leading-tight break-words drop-shadow-lg line-clamp-3 select-none">
                      {product.name}
                    </span>
                  </div>
                )}
              </div>
              <CardContent className="p-4 bg-white dark:bg-slate-800">
                <div className="flex flex-col gap-1">
                  {product.image_url && (
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">{product.name}</h3>
                  )}
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-green-600 dark:text-green-400">
                      {formatMoney(product.price_per_unit)}€
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-semibold whitespace-nowrap">
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
