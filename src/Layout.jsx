import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Package, ShoppingCart, BarChart3, ClipboardList, Settings, CheckCircle, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

export default function Layout({ children, currentPageName }) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const { data: shoppingList = [] } = useQuery({
    queryKey: ['shoppingList'],
    queryFn: () => base44.entities.ShoppingList.list()
  });

  const menuItems = [
    { name: 'Produkte', icon: Package, path: 'Produkte' },
    { name: 'Verkäufe', icon: ShoppingCart, path: 'Verkäufe' },
    { name: 'Analyse', icon: BarChart3, path: 'Analyse' },
    { name: 'Merkzettel', icon: ClipboardList, path: 'Merkzettel', badge: shoppingList.length },
    { name: 'Bearbeiten', icon: Settings, path: 'Bearbeiten' }
  ];

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Simuliere Sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastSync(new Date());
      toast.success('Daten erfolgreich synchronisiert');
    } catch (error) {
      toast.error('Synchronisation fehlgeschlagen');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white border-b border-green-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Basics Unverpackt</h1>
            </div>
            
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Synchronisiere...</span>
                </>
              ) : lastSync ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Daten synchronisiert</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Sync</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.path;
              return (
                <Link
                  key={item.path}
                  to={createPageUrl(item.path)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors relative ${
                    isActive
                      ? 'border-green-600 text-green-600 font-medium'
                      : 'border-transparent text-gray-600 hover:text-green-600 hover:border-green-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.name}</span>
                  {item.badge > 0 && (
                    <Badge className="ml-1 bg-orange-500 hover:bg-orange-600 text-white px-1.5 py-0 h-5 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {shoppingList.length > 0 && currentPageName !== 'Merkzettel' && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-800">
              <ClipboardList className="w-5 h-5" />
              <span className="font-medium">
                {shoppingList.length} {shoppingList.length === 1 ? 'Produkt muss' : 'Produkte müssen'} nachbestellt werden
              </span>
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}