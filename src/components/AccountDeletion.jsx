import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Trash2 } from 'lucide-react';
import { offlineClient } from '@/components/offlineClient';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AccountDeletion() {
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const currentSeller = JSON.parse(localStorage.getItem('currentSeller') || '{}');
      
      if (currentSeller.id) {
        // Verkäufer aus der Datenbank löschen
        await offlineClient.entities.Seller.delete(currentSeller.id);
        
        // Lokale Daten löschen
        localStorage.removeItem('currentSeller');
        
        toast.success('Ihr Konto wurde erfolgreich gelöscht');
        
        // Zur Anmeldeseite weiterleiten
        navigate(createPageUrl('Auth'));
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Kontos:', error);
      toast.error('Fehler beim Löschen des Kontos');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-red-200 dark:border-red-900 dark:bg-slate-800">
      <CardHeader>
        <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 select-none" />
          Gefahrenzone
        </CardTitle>
        <CardDescription className="dark:text-gray-400">
          Permanente Aktionen, die nicht rückgängig gemacht werden können
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full select-none">
              <Trash2 className="w-4 h-4 mr-2 select-none" />
              Verkäuferkonto löschen
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="dark:bg-slate-800 dark:border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="dark:text-white">Sind Sie absolut sicher?</AlertDialogTitle>
              <AlertDialogDescription className="dark:text-gray-400">
                Diese Aktion kann nicht rückgängig gemacht werden. Ihr Verkäuferkonto wird dauerhaft gelöscht.
                Alle Ihre zugehörigen Daten bleiben jedoch in der Datenbank erhalten.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 select-none">
                Abbrechen
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 select-none"
              >
                {isDeleting ? 'Wird gelöscht...' : 'Ja, Konto löschen'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}