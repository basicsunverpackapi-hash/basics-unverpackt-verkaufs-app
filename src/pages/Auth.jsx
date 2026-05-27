import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { offlineClient } from '@/components/offlineClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Auth() {
  const [showCreateSeller, setShowCreateSeller] = useState(false);
  const [newSellerName, setNewSellerName] = useState('');
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const navigate = useNavigate();

  // Prüfe ob Verkäufer-System aktiviert ist
  React.useEffect(() => {
    const sellerSystemEnabled = localStorage.getItem('sellerSystemEnabled');
    if (sellerSystemEnabled === 'false') {
      // Verkäufer-System ist deaktiviert, direkt zu Produkten
      localStorage.setItem('currentSeller', JSON.stringify({ name: 'Standard', id: 'default' }));
      navigate(createPageUrl('Produkte'));
    }
  }, [navigate]);

  const { data: sellers = [] } = useQuery({
    queryKey: ['sellers'],
    queryFn: () => offlineClient.entities.Seller.list('name', 100)
  });

  const handleSelectSeller = (seller) => {
    // is_admin explizit auf false setzen - nur Admin-PIN-Login darf is_admin=true haben
    const sellerData = { ...seller, is_admin: false };
    localStorage.setItem('currentSeller', JSON.stringify(sellerData));
    toast.success(`Willkommen, ${seller.name}!`);
    navigate(createPageUrl('Produkte'));
    window.location.reload();
  };

  const handleAdminLogin = () => {
    if (adminCode === '0613') {
      const adminSeller = { name: 'Administrator', id: 'admin', is_admin: true };
      localStorage.setItem('currentSeller', JSON.stringify(adminSeller));
      toast.success('Admin-Zugang gewährt');
      navigate(createPageUrl('Bearbeiten'));
      window.location.reload();
    } else {
      toast.error('Falscher Code');
      setAdminCode('');
    }
  };

  const handleCreateSeller = async () => {
    if (!newSellerName.trim()) {
      toast.error('Bitte geben Sie einen Namen ein');
      return;
    }

    try {
      const newSeller = await offlineClient.entities.Seller.create({
        name: newSellerName.trim()
      });
      
      toast.success('Verkäufer erfolgreich erstellt!');
      localStorage.setItem('currentSeller', JSON.stringify(newSeller));
      navigate(createPageUrl('Produkte'));
      window.location.reload();
    } catch (error) {
      console.error('Fehler beim Erstellen des Verkäufers:', error);
      toast.error('Fehler beim Erstellen des Verkäufers');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-xl">
          <CardTitle className="text-3xl font-bold">Basics Unverpackt</CardTitle>
          <p className="text-green-50 mt-2">Wer verkauft?</p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {sellers.length === 0 && !showCreateSeller ? (
            <div className="space-y-4 text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <User className="w-10 h-10 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Willkommen!</h3>
                <p className="text-gray-600 mb-6">
                  Es sind noch keine Verkäufer angelegt.<br />
                  Bitte erstellen Sie jetzt Ihren ersten Verkäufer.
                </p>
              </div>
              <Button
                onClick={() => setShowCreateSeller(true)}
                className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                Neuen Verkäufer hinzufügen
              </Button>
            </div>
          ) : showCreateSeller ? (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Neuer Verkäufer</h3>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Name</label>
                <Input
                  value={newSellerName}
                  onChange={(e) => setNewSellerName(e.target.value)}
                  placeholder="Name eingeben"
                  className="h-12 text-base"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                {sellers.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateSeller(false);
                      setNewSellerName('');
                    }}
                    className="flex-1"
                  >
                    Abbrechen
                  </Button>
                )}
                <Button
                  onClick={handleCreateSeller}
                  disabled={!newSellerName.trim()}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  Verkäufer erstellen
                </Button>
              </div>
            </div>
          ) : showAdminCode ? (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Administrator</h3>
                <p className="text-sm text-gray-600 mt-2">Bitte geben Sie den Admin-Code ein</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Admin-Code</label>
                <Input
                  type="password"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                  placeholder="****"
                  className="h-12 text-base text-center text-2xl tracking-widest"
                  autoFocus
                  maxLength={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAdminCode(false);
                    setAdminCode('');
                  }}
                  className="flex-1"
                >
                  Zurück
                </Button>
                <Button
                  onClick={handleAdminLogin}
                  disabled={adminCode.length !== 4}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                >
                  Anmelden
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700 mb-4">
                <User className="w-5 h-5" />
                <span className="font-semibold">Wer sind Sie?</span>
              </div>
              {sellers.map((seller) => (
                <Button
                  key={seller.id}
                  onClick={() => handleSelectSeller(seller)}
                  variant="outline"
                  className="w-full h-14 text-lg hover:bg-green-50 hover:border-green-500 transition-all"
                >
                  {seller.name}
                </Button>
              ))}
              <Button
                onClick={() => setShowCreateSeller(true)}
                variant="outline"
                className="w-full h-12 text-base border-dashed border-2 hover:bg-green-50 hover:border-green-500 text-gray-600"
              >
                + Neuen Verkäufer hinzufügen
              </Button>
              <div className="pt-4 border-t border-gray-200">
                <Button
                  onClick={() => setShowAdminCode(true)}
                  variant="outline"
                  className="w-full h-12 text-base border-2 hover:bg-red-50 hover:border-red-500 text-red-600 font-semibold"
                >
                  🔐 Administrator-Zugang
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}