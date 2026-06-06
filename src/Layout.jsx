import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Package, ShoppingCart, BarChart3, ClipboardList, Settings, User as UserIcon, Wallet, ShoppingBag, Download } from 'lucide-react';
import { offlineClient } from '@/components/offlineClient';
import { registerServiceWorker } from '@/components/registerServiceWorker';
import InstallAppButton from '@/components/InstallAppButton';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Layout({ children, currentPageName }) {
  const [currentSeller, setCurrentSeller] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const { data: shoppingList = [] } = useQuery({
    queryKey: ['shoppingList'],
    queryFn: () => offlineClient.entities.ShoppingList.list()
  });

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    localStorage.removeItem('sellerSystemEnabled');

    const seller = localStorage.getItem('currentSeller');
    if (!seller && currentPageName !== 'Auth') {
      navigate(createPageUrl('Auth'));
      return;
    }

    if (!seller) return;

    try {
      const parsed = JSON.parse(seller);

      if (parsed?.is_admin === true && sessionStorage.getItem('adminUnlocked') !== 'true') {
        localStorage.removeItem('currentSeller');
        setCurrentSeller(null);
        navigate(createPageUrl('Auth'));
        return;
      }

      setCurrentSeller(parsed);
    } catch (error) {
      console.error('Fehler beim Parsen des Verkaeufers:', error);
      localStorage.removeItem('currentSeller');
      navigate(createPageUrl('Auth'));
    }
  }, [currentPageName, navigate]);

  const isAdmin = currentSeller?.is_admin === true && sessionStorage.getItem('adminUnlocked') === 'true';

  const handleSwitchSeller = () => {
    sessionStorage.removeItem('adminUnlocked');
    localStorage.removeItem('currentSeller');
    setCurrentSeller(null);
    navigate(createPageUrl('Auth'));
  };

  const menuItems = [
    { name: 'Produkte', icon: Package, path: 'Produkte' },
    { name: 'Verkaeufe', icon: ShoppingCart, path: 'Verk\u00e4ufe' },
    { name: 'Buchhaltung', icon: BarChart3, path: 'Analyse' },
    { name: 'Merkzettel', icon: ClipboardList, path: 'Merkzettel', badge: shoppingList.length },
    { name: 'Kasse', icon: Wallet, path: 'Kasse' },
    { name: isAdmin ? 'Admin' : 'Admin-Code', icon: Settings, path: 'Bearbeiten' },
    { name: 'Kaufen', icon: ShoppingBag, path: 'Kaufen' },
    { name: 'Installieren', icon: Download, path: 'Installieren' }
  ];

  if (currentPageName === 'Auth' || !currentSeller) {
    return children;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-green-200/50 dark:border-slate-700/50 sticky top-0 z-50 shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img
                src={`${import.meta.env.BASE_URL}icon.svg`}
                alt="Basics Unverpackt Logo"
                className="w-11 h-11 rounded-xl shadow-lg shadow-green-200 dark:shadow-green-900 object-cover"
              />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  Basics Unverpackt {isAdmin && <span className="text-red-600 dark:text-red-400 text-sm"> Admin</span>}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <InstallAppButton label="App" />
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg text-sm border border-green-300 dark:border-green-700">
                <UserIcon className="w-4 h-4 text-green-700 dark:text-green-400 no-select" />
                <span className="text-green-600 dark:text-green-400 font-medium mr-1">Verkaeufer:</span>
                <span className="font-bold text-green-800 dark:text-green-300">{currentSeller?.name}</span>
              </div>
              <Button
                onClick={handleSwitchSeller}
                variant="outline"
                className="bg-white/80 hover:bg-green-50 border-green-300 text-green-800 font-semibold"
              >
                Verkaeufer wechseln
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 overscroll-none">
        {shoppingList.length > 0 && currentPageName !== 'Merkzettel' && (
          <div className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center gap-3 text-orange-900 dark:text-orange-300">
              <div className="p-2 bg-orange-200 dark:bg-orange-900/50 rounded-lg">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-base">
                  {shoppingList.length} {shoppingList.length === 1 ? 'Produkt muss' : 'Produkte muessen'} nachbestellt werden
                </span>
                <p className="text-sm text-orange-700 dark:text-orange-400 mt-0.5">Bitte zeitnah bestellen</p>
              </div>
            </div>
          </div>
        )}
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            {children}
          </PageTransition>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-green-200/50 dark:border-slate-700/50 z-50 shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-around items-center">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.path;
              return (
                <Link
                  key={item.path}
                  to={createPageUrl(item.path)}
                  className={`flex flex-col items-center py-2 px-3 min-w-[60px] transition-all duration-200 no-select relative ${
                    isActive
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
                  }`}
                >
                  {item.badge > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-1.5 py-0 h-5 min-w-[20px] text-xs font-bold shadow-md">
                      {item.badge}
                    </Badge>
                  )}
                  <Icon className={`w-6 h-6 mb-1 no-select transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  <span className="text-xs font-medium no-select">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}

