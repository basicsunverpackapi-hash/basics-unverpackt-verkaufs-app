import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { offlineClient } from '@/components/offlineClient';
import { AlertCircle, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ReorderAlert() {
  const [dismissed, setDismissed] = useState(false);

  const { data: shoppingList = [] } = useQuery({
    queryKey: ['shoppingList'],
    queryFn: () => offlineClient.entities.ShoppingList.list()
  });

  useEffect(() => {
    const storedDismissed = sessionStorage.getItem('reorder_dismissed');
    if (storedDismissed === 'true' && shoppingList.length === 0) {
      sessionStorage.removeItem('reorder_dismissed');
      setDismissed(false);
    } else if (storedDismissed === 'true') {
      setDismissed(true);
    }
  }, [shoppingList]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('reorder_dismissed', 'true');
  };

  if (dismissed || shoppingList.length === 0) return null;

  return (
    <Card className="bg-orange-50 border-orange-200 p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-orange-900 mb-1">
            Nachbestellung erforderlich
          </h3>
          <p className="text-sm text-orange-700">
            {shoppingList.length} {shoppingList.length === 1 ? 'Produkt muss' : 'Produkte muessen'} nachbestellt werden.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
