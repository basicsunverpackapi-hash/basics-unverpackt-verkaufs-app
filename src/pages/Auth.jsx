import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { offlineClient } from '@/components/offlineClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Auth() {
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [pin, setPin] = useState('');
  const navigate = useNavigate();

  const { data: sellers = [] } = useQuery({
    queryKey: ['sellers'],
    queryFn: () => offlineClient.entities.Seller.list('name', 100)
  });

  const handleLogin = () => {
    if (!selectedSeller) {
      toast.error('Bitte wählen Sie einen Verkäufer aus');
      return;
    }

    if (pin.length !== 4) {
      toast.error('PIN muss 4-stellig sein');
      return;
    }

    if (pin === selectedSeller.pin) {
      localStorage.setItem('currentSeller', JSON.stringify(selectedSeller));
      toast.success(`Willkommen, ${selectedSeller.name}!`);
      navigate(createPageUrl('Produkte'));
      window.location.reload();
    } else {
      toast.error('Falsche PIN');
      setPin('');
    }
  };

  const handlePinInput = (value) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setPin(value);
      if (value.length === 4) {
        setTimeout(() => handleLogin(), 100);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-xl">
          <CardTitle className="text-3xl font-bold">Basics Unverpackt</CardTitle>
          <p className="text-green-50 mt-2">Bitte anmelden</p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {!selectedSeller ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700 mb-4">
                <User className="w-5 h-5" />
                <span className="font-semibold">Wer sind Sie?</span>
              </div>
              {sellers.map((seller) => (
                <Button
                  key={seller.id}
                  onClick={() => setSelectedSeller(seller)}
                  variant="outline"
                  className="w-full h-14 text-lg hover:bg-green-50 hover:border-green-500 transition-all"
                >
                  {seller.name}
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{selectedSeller.name}</h3>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <Lock className="w-4 h-4" />
                  <span className="font-medium">PIN eingeben</span>
                </div>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => handlePinInput(e.target.value)}
                  placeholder="••••"
                  className="text-center text-2xl tracking-widest h-14"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedSeller(null);
                    setPin('');
                  }}
                  className="flex-1"
                >
                  Zurück
                </Button>
                <Button
                  onClick={handleLogin}
                  disabled={pin.length !== 4}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  Anmelden
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}