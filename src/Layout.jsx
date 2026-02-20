import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Package, ShoppingCart, BarChart3, ClipboardList, Settings, LogOut, User as UserIcon, Wallet } from 'lucide-react';
import { offlineClient } from '@/components/offlineClient';
import { registerServiceWorker } from '@/components/registerServiceWorker';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';

import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const [currentSeller, setCurrentSeller] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const { data: shoppingList = [] } = useQuery({
    queryKey: ['shoppingList'],
    queryFn: () => offlineClient.entities.ShoppingList.list()
  });

  // Service Worker registrieren
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Check if user is logged in + Initial Data Load
  useEffect(() => {
    const sellerSystemEnabled = localStorage.getItem('sellerSystemEnabled') !== 'false';
    const seller = localStorage.getItem('currentSeller');
    
    if (!sellerSystemEnabled) {
      // Verkäufer-System deaktiviert - Standard-Verkäufer setzen
      if (!seller) {
        localStorage.setItem('currentSeller', JSON.stringify({ name: 'Standard', id: 'default' }));
        setCurrentSeller({ name: 'Standard', id: 'default' });
      } else {
        try {
          setCurrentSeller(JSON.parse(seller));
        } catch (error) {
          localStorage.setItem('currentSeller', JSON.stringify({ name: 'Standard', id: 'default' }));
          setCurrentSeller({ name: 'Standard', id: 'default' });
        }
      }
    } else {
      // Verkäufer-System aktiviert - normale Logik
      if (!seller && currentPageName !== 'Auth') {
        navigate(createPageUrl('Auth'));
      } else if (seller) {
        try {
          setCurrentSeller(JSON.parse(seller));
        } catch (error) {
          console.error('Fehler beim Parsen des Verkäufers:', error);
          localStorage.removeItem('currentSeller');
          navigate(createPageUrl('Auth'));
        }
      }
    }
  }, [currentPageName, navigate]);





  const handleLogout = () => {
    localStorage.removeItem('currentSeller');
    setCurrentSeller(null);
    navigate(createPageUrl('Auth'));
  };

  const isAdmin = currentSeller?.is_admin === true;

  const menuItems = isAdmin ? [
    { name: 'Bearbeiten', icon: Settings, path: 'Bearbeiten' }
  ] : [
    { name: 'Produkte', icon: Package, path: 'Produkte' },
    { name: 'Verkäufe', icon: ShoppingCart, path: 'Verkäufe' },
    { name: 'Buchhaltung', icon: BarChart3, path: 'Analyse' },
    { name: 'Merkzettel', icon: ClipboardList, path: 'Merkzettel', badge: shoppingList.length },
    { name: 'Kasse', icon: Wallet, path: 'Kasse' },
    { name: 'Bearbeiten', icon: Settings, path: 'Bearbeiten' },
    { name: 'Kaufen', icon: ShoppingBag, path: 'Kaufen' }
  ];

  // Don't show layout on auth page
  if (currentPageName === 'Auth' || !currentSeller) {
    return children;
  }

  // Admin redirect
  useEffect(() => {
    if (isAdmin && currentPageName !== 'Bearbeiten') {
      navigate(createPageUrl('Bearbeiten'));
    }
  }, [isAdmin, currentPageName, navigate]);



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-green-200/50 dark:border-slate-700/50 sticky top-0 z-50 shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69497159d48abdc10af18a00/0ae839f41_basics.png" 
                alt="Basics Unverpackt Logo" 
                className="w-11 h-11 rounded-xl shadow-lg shadow-green-200 dark:shadow-green-900 object-cover"
              />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                Basics Unverpackt {isAdmin && <span className="text-red-600 dark:text-red-400 text-sm">• Admin</span>}
              </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Current User - nur anzeigen wenn Verkäufer-System aktiv */}
              {localStorage.getItem('sellerSystemEnabled') !== 'false' && (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg text-sm border border-green-300 dark:border-green-700">
                    <UserIcon className="w-4 h-4 text-green-700 dark:text-green-400 no-select" />
                    <span className="text-green-600 dark:text-green-400 font-medium mr-1">Verkäufer:</span>
                    <span className="font-bold text-green-800 dark:text-green-300">{currentSeller?.name}</span>
                  </div>

                  {/* Logout Button */}
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="icon"
                    className="hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700 no-select"
                  >
                    <LogOut className="w-4 h-4 no-select" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 overscroll-none">
        {shoppingList.length > 0 && currentPageName !== 'Merkzettel' && (
          <div className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center gap-3 text-orange-900 dark:text-orange-300">
              <div className="p-2 bg-orange-200 dark:bg-orange-900/50 rounded-lg">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-base">
                  {shoppingList.length} {shoppingList.length === 1 ? 'Produkt muss' : 'Produkte müssen'} nachbestellt werden
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

      {/* Bottom Navigation */}
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