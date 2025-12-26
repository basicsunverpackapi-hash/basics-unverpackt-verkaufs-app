import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Package, ShoppingCart, BarChart3, ClipboardList, Settings, CheckCircle, RefreshCw } from 'lucide-react';
import { offlineClient } from '@/components/offlineClient';
import { offlineSync } from '@/components/offlineSync';
import { isOnline } from '@/components/offlineStorage';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

export default function Layout({ children, currentPageName }) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [online, setOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);

  const { data: shoppingList = [] } = useQuery({
    queryKey: ['shoppingList'],
    queryFn: () => offlineClient.entities.ShoppingList.list()
  });

  // Online/Offline Status überwachen
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const menuItems = [
    { name: 'Produkte', icon: Package, path: 'Produkte' },
    { name: 'Verkäufe', icon: ShoppingCart, path: 'Verkäufe' },
    { name: 'Analyse', icon: BarChart3, path: 'Analyse' },
    { name: 'Merkzettel', icon: ClipboardList, path: 'Merkzettel', badge: shoppingList.length },
    { name: 'Bearbeiten', icon: Settings, path: 'Bearbeiten' }
  ];

  const handleSync = async () => {
    if (!isOnline()) {
      toast.error('Keine Internetverbindung verfügbar');
      return;
    }
    
    setSyncing(true);
    try {
      const result = await offlineSync.sync();
      setLastSync(new Date());
      if (result.success) {
        toast.success(result.message || 'Daten erfolgreich synchronisiert');
      } else {
        toast.error(result.message || 'Synchronisation fehlgeschlagen');
      }
    } catch (error) {
      toast.error('Synchronisation fehlgeschlagen');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-green-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">Basics Unverpackt</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Warenwirtschaft</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!online && (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="hidden sm:inline">Offline</span>
                </div>
              )}
              <button
                onClick={handleSync}
                disabled={syncing || !online}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline font-medium">Sync...</span>
                  </>
                ) : lastSync ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">Sync</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">Sync</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white/60 backdrop-blur-md border-b border-green-200/50 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto scrollbar-hide">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.path;
              return (
                <Link
                  key={item.path}
                  to={createPageUrl(item.path)}
                  className={`flex items-center gap-2 px-5 py-4 border-b-3 whitespace-nowrap transition-all duration-200 relative group ${
                    isActive
                      ? 'border-green-600 text-green-700 font-semibold bg-green-50/50'
                      : 'border-transparent text-gray-600 hover:text-green-600 hover:bg-green-50/30'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                  <span className="text-sm">{item.name}</span>
                  {item.badge > 0 && (
                    <Badge className="ml-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-2 py-0.5 h-5 text-xs font-bold shadow-md animate-pulse">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {shoppingList.length > 0 && currentPageName !== 'Merkzettel' && (
          <div className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center gap-3 text-orange-900">
              <div className="p-2 bg-orange-200 rounded-lg">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-base">
                  {shoppingList.length} {shoppingList.length === 1 ? 'Produkt muss' : 'Produkte müssen'} nachbestellt werden
                </span>
                <p className="text-sm text-orange-700 mt-0.5">Bitte zeitnah bestellen</p>
              </div>
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}