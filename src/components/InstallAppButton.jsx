import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const isStandalone = () => (
  window.matchMedia?.('(display-mode: standalone)').matches ||
  window.navigator.standalone === true
);

export default function InstallAppButton({ className, label = 'App installieren' }) {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => (
    typeof window !== 'undefined' ? isStandalone() : false
  ));

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      toast.success('App installiert');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      toast.info('Falls kein Dialog erscheint: Chrome/Edge-Menue oeffnen und "App installieren" oder "Zum Startbildschirm" waehlen.');
      return;
    }

    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  if (installed) return null;

  return (
    <Button
      onClick={handleInstall}
      variant="outline"
      className={cn('bg-white/90 hover:bg-green-50 border-green-300 text-green-800 font-semibold whitespace-nowrap', className)}
    >
      <Download className="w-4 h-4 mr-2" />
      <span>{label}</span>
    </Button>
  );
}
