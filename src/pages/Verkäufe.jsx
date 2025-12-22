import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Calendar, Package, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function Verkäufe() {
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-date', 100)
  });

  const deleteSaleMutation = useMutation({
    mutationFn: (id) => base44.entities.Sale.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Verkauf storniert');
    }
  });

  const handleCancel = (sale) => {
    if (confirm('Verkauf wirklich stornieren?')) {
      deleteSaleMutation.mutate(sale.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Verkäufe</h2>
          <p className="text-gray-600 mt-1">Übersicht aller getätigten Verkäufe</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {sales.length} Verkäufe
        </Badge>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sales.length === 0 ? (
        <Card className="p-12 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Noch keine Verkäufe vorhanden</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sales.map((sale) => (
            <Card key={sale.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">
                          {format(new Date(sale.date), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{sale.payment_method}</Badge>
                        <span className="text-sm text-gray-500">
                          {sale.items?.length || 0} Artikel
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {sale.total_amount?.toFixed(2)} €
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCancel(sale)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t pt-4 space-y-2">
                  {sale.items?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="font-medium">{item.product_name}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            {(item.weight_kg * 1000)?.toFixed(0)} g
                          </span>
                        </div>
                      </div>
                      <span className="font-semibold text-green-600">
                        {item.total_price?.toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}