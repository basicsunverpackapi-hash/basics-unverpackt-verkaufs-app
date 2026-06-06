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
import InstallAppButton from '@/components/InstallAppButton';

const ADMIN_PIN = '0613';

export default function Auth() {
  const [showCreateSeller, setShowCreateSeller] = useState(false);
  const [newSellerName, setNewSellerName] = useState('');
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    localStorage.removeItem('sellerSystemEnabled');
  }, []);

  const { data: sellers = [] } = useQuery({
    queryKey: ['sellers'],
    queryFn: () => offlineClient.entities.Seller.list('name', 100)
  });

  const handleSelectSeller = (seller) => {
    const sellerData = { ...seller, is_admin: false };
    sessionStorage.removeItem('adminUnlocked');
    localStorage.setItem('currentSeller', JSON.stringify(sellerData));
    toast.success(`Willkommen, ${seller.name}!`);
    navigate(createPageUrl('Produkte'));
    window.location.reload();
  };

  const handleAdminLogin = () => {
    if (adminCode.trim() === ADMIN_PIN) {
      const adminSeller = { name: 'Administrator', id: 'admin', is_admin: true };
      sessionStorage.setItem('adminUnlocked', 'true');
      localStorage.setItem('currentSeller', JSON.stringify(adminSeller));
      toast.success('Admin-Zugang gewaehrt');
      navigate(createPageUrl('Bearbeiten'));
      window.location.reload();
      return;
    }

    toast.error('Falscher Code');
    setAdminCode('');
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

      sessionStorage.removeItem('adminUnlocked');
      toast.success('Verkaeufer erfolgreich erstellt!');
      localStorage.setItem('currentSeller', JSON.stringify({ ...newSeller, is_admin: false }));
      navigate(createPageUrl('Produkte'));
      window.location.reload();
    } catch (error) {
      console.error('Fehler beim Erstellen des Verkaeufers:', error);
      toast.error('Fehler beim Erstellen des Verkaeufers');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="fixed top-4 right-4 z-20">
        <InstallAppButton />
      </div>
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
                  Es sind noch keine Verkaeufer angelegt.<br />
                  Bitte erstellen Sie jetzt Ihren ersten Verkaeufer.
                </p>
              </div>
              <Button
                onClick={() => setShowCreateSeller(true)}
                className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                Neuen Verkaeufer hinzufuegen
              </Button>
            </div>
          ) : showCreateSeller ? (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Neuer Verkaeufer</h3>
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
                  Verkaeufer erstellen
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
                  onChange={(e) => setAdminCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAdminLogin();
                    }
                  }}
                  placeholder="****"
                  inputMode="numeric"
                  pattern="[0-9]*"
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
                  Zurueck
                </Button>
                <Button
                  onClick={handleAdminLogin}
                  disabled={adminCode.trim().length !== 4}
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
                + Neuen Verkaeufer hinzufuegen
              </Button>
              <div className="pt-4 border-t border-gray-200">
                <Button
                  onClick={() => setShowAdminCode(true)}
                  variant="outline"
                  className="w-full h-12 text-base border-2 hover:bg-red-50 hover:border-red-500 text-red-600 font-semibold"
                >
                  Administrator-Zugang
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
