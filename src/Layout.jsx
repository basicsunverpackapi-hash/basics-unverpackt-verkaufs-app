import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Package, ShoppingCart, BarChart3, ClipboardList, Settings, LogOut, User as UserIcon, Wallet } from 'lucide-react';
import { offlineClient } from '@/components/offlineClient';
import { registerServiceWorker } from '@/components/registerServiceWorker';

import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const [currentSeller, setCurrentSeller] = useState(null);
  const navigate = useNavigate();

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
    const seller = localStorage.getItem('currentSeller');
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
  }, [currentPageName, navigate]);





  const handleLogout = () => {
    localStorage.removeItem('currentSeller');
    setCurrentSeller(null);
    navigate(createPageUrl('Auth'));
  };

  const menuItems = [
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



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-green-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69497159d48abdc10af18a00/0ae839f41_basics.png" 
                alt="Basics Unverpackt Logo" 
                className="w-11 h-11 rounded-xl shadow-lg shadow-green-200 object-cover"
              />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">Basics Unverpackt</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Warenwirtschaft</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Current User */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-lg text-sm border border-green-300">
                <UserIcon className="w-4 h-4 text-green-700" />
                <span className="text-green-600 font-medium mr-1">Verkäufer:</span>
                <span className="font-bold text-green-800">{currentSeller?.name}</span>
              </div>

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