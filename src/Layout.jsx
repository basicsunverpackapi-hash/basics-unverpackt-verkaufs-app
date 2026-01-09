import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Package, ShoppingCart, BarChart3, ClipboardList, Settings, CheckCircle, RefreshCw, LogOut, User as UserIcon, Wallet } from 'lucide-react';
import { offlineClient } from '@/components/offlineClient';
import { offlineSync } from '@/components/offlineSync';
import { isOnline } from '@/components/offlineStorage';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Layout({ children, currentPageName }) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [online, setOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncError, setSyncError] = useState(false);
  const [currentSeller, setCurrentSeller] = useState(null);
  const navigate = useNavigate();

  const { data: shoppingList = [] } = useQuery({
    queryKey: ['shoppingList'],
    queryFn: () => offlineClient.entities.ShoppingList.list()
  });

  // Check if user is logged in
  useEffect(() => {
    const seller = localStorage.getItem('currentSeller');
    if (!seller && currentPageName !== 'Auth') {
      navigate(createPageUrl('Auth'));
    } else if (seller) {
      setCurrentSeller(JSON.parse(seller));
    }
  }, [currentPageName, navigate]);

  // Ausstehende Operationen überwachen
  useEffect(() => {
    const updatePendingCount = () => {
      const queue = offlineSync.getSyncQueue();
      setPendingCount(queue.length);
    };
    
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Online/Offline Status überwachen & Auto-Sync
  useEffect(() => {
    const handleOnline = async () => {
      setOnline(true);
      // Auto-Sync bei Verbindungswiederherstellung
      const queue = offlineSync.getSyncQueue();
      if (queue.length > 0) {
        toast.info(`${queue.length} ausstehende Änderungen werden synchronisiert...`);
        setTimeout(() => handleSync(true), 1000);
      }
    };
    
    const handleOffline = () => {
      setOnline(false);
      toast.warning('Offline-Modus aktiv - Änderungen werden lokal gespeichert');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentSeller');
    setCurrentSeller(null);
    navigate(createPageUrl('Auth'));
  };

  const menuItems = [
    { name: 'Produkte', icon: Package, path: 'Produkte' },
    { name: 'Verkäufe', icon: ShoppingCart, path: 'Verkäufe' },
    { name: 'Analyse', icon: BarChart3, path: 'Analyse' },
    { name: 'Merkzettel', icon: ClipboardList, path: 'Merkzettel', badge: shoppingList.length },
    ...(currentSeller?.is_admin ? [{ name: 'Kasse', icon: Wallet, path: 'Kasse' }] : []),
    { name: 'Bearbeiten', icon: Settings, path: 'Bearbeiten' }
  ];

  // Don't show layout on auth page
  if (currentPageName === 'Auth' || !currentSeller) {
    return children;
  }

  const handleSync = async (isAutoSync = false) => {
    if (!isOnline()) {
      toast.error('Keine Internetverbindung verfügbar');
      return;
    }
    
    setSyncing(true);
    setSyncError(false);
    
    try {
      const result = await offlineSync.sync();
      setLastSync(new Date());
      setPendingCount(0);
      
      if (result.success) {
        if (!isAutoSync) {
          toast.success(result.message || 'Daten erfolgreich synchronisiert');
        } else {
          toast.success('Automatische Synchronisierung erfolgreich');
        }
        setSyncError(false);
      } else {
        toast.error(result.message || 'Synchronisation fehlgeschlagen');
        setSyncError(true);
      }
    } catch (error) {
      toast.error('Synchronisation fehlgeschlagen: ' + error.message);
      setSyncError(true);
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
              {/* Current User */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
                <UserIcon className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-700">{currentSeller?.name}</span>
              </div>

              {/* Status-Anzeigen */}
              {!online ? (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="hidden sm:inline">Offline</span>
                </div>
              ) : pendingCount > 0 ? (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="hidden sm:inline">{pendingCount} ausstehend</span>
                </div>
              ) : syncError ? (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="hidden sm:inline">Fehler</span>
                </div>
              ) : lastSync ? (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                  <CheckCircle className="w-3 h-3" />
                  <span className="hidden sm:inline">Synchronisiert</span>
                </div>
              ) : null}

              {/* Sync Button */}
              <button
                onClick={() => handleSync(false)}
                disabled={syncing || !online}
                className="relative flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline font-medium">Sync...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">Sync</span>
                    {pendingCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                        {pendingCount}
                      </span>
                    )}
                  </>
                )}
              </button>

              {/* Logout Button */}
              <Button
                onClick={handleLogout}
                variant="outline"
                size="icon"
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
              >
                <LogOut className="w-4 h-4" />
              </Button>
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