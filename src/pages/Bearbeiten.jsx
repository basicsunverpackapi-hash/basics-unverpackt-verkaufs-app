import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offlineClient } from '@/components/offlineClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Package, Upload, User, Download, FileUp, Database, Settings as SettingsIcon, Power, PowerOff, ShoppingCart, Wallet, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

export default function Bearbeiten() {
  const [currentSeller, setCurrentSeller] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price_per_unit: '',
    unit_grams: '1000',
    purchase_price_per_kg: '',
    image_url: '',
    active: true
  });
  const [priceMode, setPriceMode] = useState('gram'); // 'gram' oder 'kg'
  const [uploading, setUploading] = useState(false);

  // Verkäufer-State
  const [sellerDialogOpen, setSellerDialogOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState(null);
  const [sellerName, setSellerName] = useState('');

  // Backup State
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Settings State
  const [sellerSystemEnabled, setSellerSystemEnabled] = useState(true);

  useEffect(() => {
    const enabled = localStorage.getItem('sellerSystemEnabled');
    setSellerSystemEnabled(enabled !== 'false');
    
    const seller = localStorage.getItem('currentSeller');
    if (seller) {
      setCurrentSeller(JSON.parse(seller));
    }
  }, []);

  const isAdmin = currentSeller?.is_admin === true;

  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => offlineClient.entities.Product.list('-created_date', 100)
  });

  const { data: sellers = [] } = useQuery({
    queryKey: ['sellers'],
    queryFn: () => offlineClient.entities.Seller.list('-created_date', 100)
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => offlineClient.entities.Sale.list('-created_date', 1000)
  });

  const { data: shoppingList = [] } = useQuery({
    queryKey: ['shoppingList'],
    queryFn: () => offlineClient.entities.ShoppingList.list()
  });

  const { data: debts = [] } = useQuery({
    queryKey: ['debts'],
    queryFn: () => offlineClient.entities.Debt.list()
  });

  const { data: cashRegister = [] } = useQuery({
    queryKey: ['cashRegister'],
    queryFn: () => offlineClient.entities.CashRegister.list('-created_date', 1000)
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => offlineClient.entities.Purchase.list('-created_date', 1000)
  });



  const createProductMutation = useMutation({
    mutationFn: (data) => offlineClient.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produkt erstellt');
      closeDialog();
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => offlineClient.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produkt aktualisiert');
      closeDialog();
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => offlineClient.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produkt gelöscht');
    }
  });

  const createSellerMutation = useMutation({
    mutationFn: (data) => offlineClient.entities.Seller.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      toast.success('Verkäufer erstellt');
      closeSellerDialog();
    }
  });

  const updateSellerMutation = useMutation({
    mutationFn: ({ id, data }) => offlineClient.entities.Seller.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      toast.success('Verkäufer aktualisiert');
      closeSellerDialog();
    }
  });

  const deleteSellerMutation = useMutation({
    mutationFn: (id) => offlineClient.entities.Seller.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      toast.success('Verkäufer gelöscht');
    }
  });

  const deleteSaleMutation = useMutation({
    mutationFn: async (sale) => {
      // Lösche den Verkauf
      await offlineClient.entities.Sale.delete(sale.id);
      
      // Korrigiere die Kasse wenn Bargeld
      if (sale.payment_method === 'Bargeld') {
        // Erstelle einen Korrektur-Eintrag in der Kasse (negativer Betrag)
        await offlineClient.entities.CashRegister.create({
          seller_name: sale.seller_name,
          amount: -sale.total_amount,
          type: 'correction',
          date: new Date().toISOString(),
          note: `Verkauf storniert: ${new Date(sale.date).toLocaleString('de-DE')}`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['cashRegister'] });
      toast.success('Verkauf gelöscht und Kasse korrigiert');
    }
  });

  const deleteCashRegisterMutation = useMutation({
    mutationFn: (id) => offlineClient.entities.CashRegister.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashRegister'] });
      toast.success('Kassen-Eintrag gelöscht');
    }
  });

  const deletePurchaseMutation = useMutation({
    mutationFn: (id) => offlineClient.entities.Purchase.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast.success('Einkauf gelöscht');
    }
  });



  const openDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      // Prüfe ob unit_grams ein Vielfaches von 1000 ist (also volle kg)
      const isKgMode = product.unit_grams >= 1000 && product.unit_grams % 1000 === 0;
      setFormData({
        name: product.name || '',
        price_per_unit: product.price_per_unit || '',
        unit_grams: isKgMode ? (product.unit_grams / 1000).toString() : (product.unit_grams || '1000').toString(),
        purchase_price_per_kg: product.purchase_price_per_kg || '',
        image_url: product.image_url || '',
        active: product.active !== false
      });
      setPriceMode(isKgMode ? 'kg' : 'gram');
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price_per_unit: '',
        unit_grams: '1000',
        purchase_price_per_kg: '',
        image_url: '',
        active: true
      });
      setPriceMode('gram');
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
  };

  const openSellerDialog = (seller = null) => {
    if (seller) {
      setEditingSeller(seller);
      setSellerName(seller.name || '');
    } else {
      setEditingSeller(null);
      setSellerName('');
    }
    setSellerDialogOpen(true);
  };

  const closeSellerDialog = () => {
    setSellerDialogOpen(false);
    setEditingSeller(null);
    setSellerName('');
  };

  const handleSellerSubmit = (e) => {
    e.preventDefault();
    const data = { name: sellerName };
    
    if (editingSeller) {
      updateSellerMutation.mutate({ id: editingSeller.id, data });
    } else {
      createSellerMutation.mutate(data);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Konvertiere zu Base64 für lokale Speicherung
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image_url: reader.result });
        toast.success('Bild gespeichert');
        setUploading(false);
      };
      reader.onerror = () => {
        toast.error('Bild-Upload fehlgeschlagen');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Bild-Upload fehlgeschlagen');
      setUploading(false);
    }
  };

  const handleExportData = () => {
    setIsExporting(true);
    try {
      // Sammle alle Daten
      const backup = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: {
          products,
          sellers,
          sales,
          shoppingList,
          debts,
          cashRegister,
          purchases
        }
      };

      // Erstelle Download
      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `basics-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Backup erfolgreich exportiert');
    } catch (error) {
      console.error('Export-Fehler:', error);
      toast.error('Fehler beim Exportieren');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.version || !backup.data) {
        throw new Error('Ungültiges Backup-Format');
      }

      // Bestätigung
      if (!confirm(`Möchten Sie wirklich ${Object.values(backup.data).flat().length} Datensätze importieren? Dies überschreibt NICHT vorhandene Daten, sondern fügt neue hinzu.`)) {
        setIsImporting(false);
        return;
      }

      // Importiere Daten
      let imported = 0;
      
      if (backup.data.sellers?.length) {
        await offlineClient.entities.Seller.bulkCreate(backup.data.sellers.map(s => ({
          name: s.name
        })));
        imported += backup.data.sellers.length;
      }
      
      if (backup.data.products?.length) {
        await offlineClient.entities.Product.bulkCreate(backup.data.products.map(p => ({
          name: p.name,
          price_per_unit: p.price_per_unit,
          unit_grams: p.unit_grams,
          purchase_price_per_kg: p.purchase_price_per_kg,
          image_url: p.image_url,
          active: p.active
        })));
        imported += backup.data.products.length;
      }

      if (backup.data.sales?.length) {
        await offlineClient.entities.Sale.bulkCreate(backup.data.sales.map(s => ({
          date: s.date,
          items: s.items,
          total_amount: s.total_amount,
          payment_method: s.payment_method,
          seller_name: s.seller_name
        })));
        imported += backup.data.sales.length;
      }

      if (backup.data.shoppingList?.length) {
        await offlineClient.entities.ShoppingList.bulkCreate(backup.data.shoppingList);
        imported += backup.data.shoppingList.length;
      }

      if (backup.data.debts?.length) {
        await offlineClient.entities.Debt.bulkCreate(backup.data.debts);
        imported += backup.data.debts.length;
      }

      if (backup.data.cashRegister?.length) {
        await offlineClient.entities.CashRegister.bulkCreate(backup.data.cashRegister);
        imported += backup.data.cashRegister.length;
      }

      if (backup.data.purchases?.length) {
        await offlineClient.entities.Purchase.bulkCreate(backup.data.purchases);
        imported += backup.data.purchases.length;
      }

      // Cache invalidieren
      queryClient.invalidateQueries();

      toast.success(`${imported} Datensätze erfolgreich importiert!`);
      
      // Seite neu laden um alle Daten zu aktualisieren
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Import-Fehler:', error);
      toast.error('Fehler beim Importieren: ' + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const toggleSellerSystem = () => {
    const newState = !sellerSystemEnabled;
    
    if (!newState) {
      // Deaktivieren
      if (confirm('Möchten Sie das Verkäufer-System wirklich deaktivieren? Die App wird dann ohne Verkäufer-Auswahl starten.')) {
        localStorage.setItem('sellerSystemEnabled', 'false');
        localStorage.setItem('currentSeller', JSON.stringify({ name: 'Standard', id: 'default' }));
        setSellerSystemEnabled(false);
        toast.success('Verkäufer-System deaktiviert');
        setTimeout(() => window.location.reload(), 500);
      }
    } else {
      // Aktivieren
      if (confirm('Möchten Sie das Verkäufer-System aktivieren? Die App wird beim nächsten Start nach einem Verkäufer fragen.')) {
        localStorage.setItem('sellerSystemEnabled', 'true');
        localStorage.removeItem('currentSeller');
        setSellerSystemEnabled(true);
        toast.success('Verkäufer-System aktiviert');
        setTimeout(() => window.location.reload(), 500);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let pricePerUnit = parseFloat(formData.price_per_unit);
    let unitGrams = parseFloat(formData.unit_grams);
    
    // Wenn Preis pro kg eingegeben wurde, in Preis pro unitGrams umrechnen
    if (priceMode === 'kg') {
      // unitGrams ist hier die Anzahl der kg (z.B. 1, 2, etc.)
      const kgAmount = unitGrams; // Speichere die kg-Menge
      unitGrams = kgAmount * 1000; // Umrechnung in Gramm: 1 kg = 1000g, 2 kg = 2000g
      pricePerUnit = pricePerUnit; // Der Preis bleibt wie eingegeben (Preis für die kg-Menge)
    }
    
    const data = {
      ...formData,
      price_per_unit: pricePerUnit,
      unit_grams: unitGrams,
      purchase_price_per_kg: formData.purchase_price_per_kg ? parseFloat(formData.purchase_price_per_kg) : undefined
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };



  return (
    <div className="space-y-6">
      <Tabs defaultValue={isAdmin ? "sales" : "products"} className="w-full">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-3'} mb-6`}>
          {isAdmin && (
            <TabsTrigger value="sales" className="text-base bg-red-50 data-[state=active]:bg-red-100">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Verkäufe
            </TabsTrigger>
          )}
          <TabsTrigger value="products" className="text-base">
            <Package className="w-4 h-4 mr-2" />
            Produkte
          </TabsTrigger>
          <TabsTrigger value="sellers" className="text-base">
            <User className="w-4 h-4 mr-2" />
            Verkäufer
          </TabsTrigger>
          <TabsTrigger value="backup" className="text-base">
            <Database className="w-4 h-4 mr-2" />
            Backup
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="settings" className="text-base">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Einstellungen
            </TabsTrigger>
          )}
        </TabsList>

        {/* Produkte Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-700 dark:to-orange-700 rounded-2xl p-6 shadow-lg text-white flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold">Produkte bearbeiten</h2>
              <p className="text-amber-100 dark:text-amber-200 mt-2">Produkte verwalten und erstellen</p>
            </div>
            {isAdmin && (
              <Button onClick={() => openDialog()} className="bg-white dark:bg-slate-100 text-amber-700 hover:bg-amber-50 dark:hover:bg-slate-200 font-bold shadow-lg rounded-xl px-6 py-3">
                <Plus className="w-5 h-5 mr-2" />
                Neues Produkt
              </Button>
            )}
          </div>



          {/* Products List */}
          <div className="grid gap-4">
        {products.map((product) => (
          <Card key={product.id} className="hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {product.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-lg dark:text-white">{product.name}</h3>
                      {product.purchase_price_per_kg && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          EK: {product.purchase_price_per_kg.toFixed(2)} €/kg
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {product.price_per_unit?.toFixed(2)} € / {product.unit_grams >= 1000 ? `${(product.unit_grams / 1000).toFixed(product.unit_grams % 1000 === 0 ? 0 : 1)} kg` : `${product.unit_grams}g`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {isAdmin && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openDialog(product)}
                        className="no-select"
                      >
                        <Pencil className="w-4 h-4 no-select" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (confirm('Produkt wirklich löschen?')) {
                            deleteProductMutation.mutate(product.id);
                          }
                        }}
                        className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 no-select"
                      >
                        <Trash2 className="w-4 h-4 no-select" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

            {products.length === 0 && (
              <Card className="p-12 text-center dark:bg-slate-800 dark:border-slate-700">
                <Package className="w-16 h-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">Keine Produkte vorhanden</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Erstelle dein erstes Produkt</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Verkäufer Tab */}
        <TabsContent value="sellers" className="space-y-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 rounded-2xl p-6 shadow-lg text-white flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold">Verkäufer bearbeiten</h2>
              <p className="text-blue-100 dark:text-blue-200 mt-2">Verkäufer verwalten und erstellen</p>
            </div>
            {isAdmin && (
              <Button onClick={() => openSellerDialog()} className="bg-white dark:bg-slate-100 text-blue-700 hover:bg-blue-50 dark:hover:bg-slate-200 font-bold shadow-lg rounded-xl px-6 py-3">
                <Plus className="w-5 h-5 mr-2" />
                Neuer Verkäufer
              </Button>
            )}
          </div>

          {/* Sellers List */}
          <div className="grid gap-4">
            {sellers.map((seller) => (
              <Card key={seller.id} className="hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg dark:text-white">{seller.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Erstellt am {new Date(seller.created_date).toLocaleDateString('de-DE')}
                      </p>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      {isAdmin && (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openSellerDialog(seller)}
                            className="no-select"
                          >
                            <Pencil className="w-4 h-4 no-select" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (confirm('Verkäufer wirklich löschen? Dies löscht auch alle zugehörigen Daten (Verkäufe, Kasse, etc.).')) {
                                deleteSellerMutation.mutate(seller.id);
                              }
                            }}
                            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 no-select"
                          >
                            <Trash2 className="w-4 h-4 no-select" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {sellers.length === 0 && (
              <Card className="p-12 text-center dark:bg-slate-800 dark:border-slate-700">
                <User className="w-16 h-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">Keine Verkäufer vorhanden</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Erstelle den ersten Verkäufer</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Backup Tab */}
        <TabsContent value="backup" className="space-y-6">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 rounded-2xl p-6 shadow-lg text-white">
            <div>
              <h2 className="text-3xl font-bold">Datensicherung</h2>
              <p className="text-purple-100 dark:text-purple-200 mt-2">Daten sichern und wiederherstellen</p>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Export Card */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold dark:text-white mb-2">Daten exportieren</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Erstellen Sie eine Sicherungskopie aller Daten (Produkte, Verkäufe, Verkäufer, Kasse, etc.). 
                      Die Datei wird als JSON heruntergeladen und kann später wiederhergestellt werden.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
                      <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                        📊 Aktuelle Datenmenge:
                      </p>
                      <ul className="text-sm text-blue-700 dark:text-blue-400 mt-2 space-y-1">
                        <li>• {products.length} Produkte</li>
                        <li>• {sellers.length} Verkäufer</li>
                        <li>• {sales.length} Verkäufe</li>
                        <li>• {cashRegister.length} Kassen-Einträge</li>
                        <li>• {purchases.length} Einkäufe</li>
                        <li>• {debts.length} Schulden</li>
                        <li>• {shoppingList.length} Merkzettel-Einträge</li>
                      </ul>
                    </div>
                    <Button
                      onClick={handleExportData}
                      disabled={isExporting}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isExporting ? 'Exportiere...' : 'Backup erstellen'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Import Card - nur für Admin */}
            {isAdmin && (
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <FileUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold dark:text-white mb-2">Daten importieren</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Stellen Sie Daten aus einer Sicherungsdatei wieder her. Die importierten Daten werden zu den vorhandenen Daten hinzugefügt.
                    </p>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mb-4">
                      <p className="text-sm text-amber-800 dark:text-amber-300 font-medium mb-1">
                        ⚠️ Wichtige Hinweise:
                      </p>
                      <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                        <li>• Der Import fügt Daten hinzu (überschreibt nicht)</li>
                        <li>• Nur JSON-Dateien aus dieser App verwenden</li>
                        <li>• Großer Import kann einige Sekunden dauern</li>
                      </ul>
                    </div>
                    <label>
                      <Button
                        disabled={isImporting}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                        type="button"
                        onClick={() => document.getElementById('import-file-input')?.click()}
                      >
                        <FileUp className="w-4 h-4 mr-2" />
                        {isImporting ? 'Importiere...' : 'Backup hochladen'}
                      </Button>
                      <input
                        id="import-file-input"
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="hidden"
                        disabled={isImporting}
                      />
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            )}

            {/* Info Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-2">💡 Tipps für Datensicherung</h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-2">
                      <li>✓ Erstellen Sie regelmäßig Backups (z.B. täglich oder wöchentlich)</li>
                      <li>✓ Speichern Sie Backups an sicheren Orten (Cloud, USB-Stick, etc.)</li>
                      <li>✓ Testen Sie gelegentlich die Wiederherstellung</li>
                      <li>✓ Behalten Sie mehrere Backup-Versionen</li>
                      <li>✓ Die App läuft komplett offline - Backups sind Ihre einzige Sicherheit!</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Tab - nur für Admin sichtbar */}
        {isAdmin && (
          <TabsContent value="sales" className="space-y-6">
            <div className="bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 rounded-2xl p-6 shadow-lg text-white">
              <div>
                <h2 className="text-3xl font-bold">🔐 Verkäufe Verwaltung</h2>
                <p className="text-red-100 dark:text-red-200 mt-2">Verkäufe verwalten und löschen</p>
              </div>
            </div>

            {/* Verkäufe Verwaltung */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Verkäufe ({sales.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sales.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">Keine Verkäufe vorhanden</p>
                ) : (
                  sales.slice(0, 100).map((sale) => (
                    <div key={sale.id} className="flex items-start justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 rounded-lg hover:shadow-md transition-shadow border border-gray-200 dark:border-slate-600">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-lg text-gray-900 dark:text-white">
                            {new Date(sale.date).toLocaleDateString('de-DE', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric' 
                            })}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">•</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {new Date(sale.date).toLocaleTimeString('de-DE', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })} Uhr
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            sale.payment_method === 'Bargeld' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {sale.payment_method === 'Bargeld' ? '💵 Bargeld' : '💳 Karte'}
                          </span>
                          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {sale.total_amount?.toFixed(2)} €
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <strong>Verkäufer:</strong> {sale.seller_name} • <strong>{sale.items?.length || 0}</strong> Artikel
                        </div>
                        {sale.items && sale.items.length > 0 && (
                          <div className="mt-2 pl-4 border-l-2 border-gray-300 dark:border-gray-600 space-y-1">
                            {sale.items.map((item, idx) => (
                              <div key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                                • {item.product_name} ({(item.weight_kg * 1000).toFixed(0)}g) - {item.total_price?.toFixed(2)} €
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Verkauf wirklich löschen?\n\nDatum: ${new Date(sale.date).toLocaleString('de-DE')}\nBetrag: ${sale.total_amount?.toFixed(2)} €\nZahlung: ${sale.payment_method}\nVerkäufer: ${sale.seller_name}\n${sale.payment_method === 'Bargeld' ? '\n⚠️ Die Kasse wird automatisch korrigiert!' : ''}`)) {
                            deleteSaleMutation.mutate(sale);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 ml-4"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Kassen Verwaltung */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Kassen-Einträge ({cashRegister.filter(e => e.type !== 'sale').length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cashRegister.filter(e => e.type !== 'sale').length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">Keine Einträge vorhanden</p>
                ) : (
                  cashRegister.filter(e => e.type !== 'sale').slice(0, 50).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900 dark:text-white">{entry.seller_name}</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 uppercase">
                            {entry.type}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span className={`font-bold ${entry.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {entry.amount >= 0 ? '+' : ''}{entry.amount?.toFixed(2)} €
                          </span>
                          {' • '}
                          {new Date(entry.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          {' '}
                          {new Date(entry.date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                        </div>
                        {entry.note && (
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            📝 {entry.note}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (confirm('Eintrag wirklich löschen?')) {
                            deleteCashRegisterMutation.mutate(entry.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Einkäufe Verwaltung (Buchhaltung) */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Einkäufe / Buchhaltung ({purchases.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {purchases.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">Keine Einkäufe vorhanden</p>
                ) : (
                  purchases.slice(0, 50).map((purchase) => (
                    <div key={purchase.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg hover:shadow-sm transition-shadow border border-orange-200 dark:border-orange-700">
                      <div className="flex-1">
                        <div className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                          {purchase.item_name}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            purchase.payment_method === 'Bargeld' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {purchase.payment_method}
                          </span>
                          <span className="text-lg font-bold text-red-600 dark:text-red-400">
                            -{purchase.amount?.toFixed(2)} €
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {purchase.seller_name} • {new Date(purchase.date).toLocaleDateString('de-DE')} {new Date(purchase.date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Einkauf wirklich löschen?\n\nArtikel: ${purchase.item_name}\nBetrag: ${purchase.amount?.toFixed(2)} €\nZahlung: ${purchase.payment_method}`)) {
                            deletePurchaseMutation.mutate(purchase.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="bg-gradient-to-r from-gray-600 to-slate-600 dark:from-gray-700 dark:to-slate-700 rounded-2xl p-6 shadow-lg text-white">
            <div>
              <h2 className="text-3xl font-bold">Einstellungen</h2>
              <p className="text-gray-100 dark:text-gray-200 mt-2">App-Konfiguration</p>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Verkäufer-System Toggle - nur für Admin */}
            {isAdmin && (
              <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${sellerSystemEnabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                      {sellerSystemEnabled ? (
                        <Power className="w-6 h-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <PowerOff className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold dark:text-white mb-2">Verkäufer-System</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {sellerSystemEnabled ? (
                        <>
                          Das Verkäufer-System ist <strong className="text-green-600 dark:text-green-400">aktiviert</strong>. 
                          Die App fragt beim Start nach dem Verkäufer und speichert Verkäufe mit Verkäufernamen.
                        </>
                      ) : (
                        <>
                          Das Verkäufer-System ist <strong className="text-red-600 dark:text-red-400">deaktiviert</strong>. 
                          Die App startet direkt ohne Verkäufer-Auswahl.
                        </>
                      )}
                    </p>
                    
                    {sellerSystemEnabled ? (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 mb-4">
                        <p className="text-sm text-green-800 dark:text-green-300 font-medium mb-2">
                          ✓ Vorteile des Verkäufer-Systems:
                        </p>
                        <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                          <li>• Mehrere Verkäufer können die App nutzen</li>
                          <li>• Verkäufe werden mit Verkäufername gespeichert</li>
                          <li>• Kassen-Verwaltung pro Verkäufer</li>
                          <li>• Auswertungen nach Verkäufer möglich</li>
                        </ul>
                      </div>
                    ) : (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">
                          ℹ️ Ohne Verkäufer-System:
                        </p>
                        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                          <li>• App startet schneller (kein Login)</li>
                          <li>• Einfacher für Einzelnutzung</li>
                          <li>• Alle Verkäufe unter "Standard"</li>
                        </ul>
                      </div>
                    )}

                    <Button
                      onClick={toggleSellerSystem}
                      className={sellerSystemEnabled 
                        ? "bg-red-600 hover:bg-red-700 text-white" 
                        : "bg-green-600 hover:bg-green-700 text-white"
                      }
                    >
                      {sellerSystemEnabled ? (
                        <>
                          <PowerOff className="w-4 h-4 mr-2" />
                          Verkäufer-System deaktivieren
                        </>
                      ) : (
                        <>
                          <Power className="w-4 h-4 mr-2" />
                          Verkäufer-System aktivieren
                        </>
                      )}
                    </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Seller Dialog */}
      <Dialog open={sellerDialogOpen} onOpenChange={setSellerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSeller ? 'Verkäufer bearbeiten' : 'Neuer Verkäufer'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSellerSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name *</label>
              <Input
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="Name des Verkäufers"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeSellerDialog} className="flex-1">
                Abbrechen
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                {editingSeller ? 'Speichern' : 'Erstellen'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Produkt bearbeiten' : 'Neues Produkt'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    setPriceMode('gram');
                    setFormData({ ...formData, unit_grams: '1000' });
                  }}
                  variant={priceMode === 'gram' ? 'default' : 'outline'}
                  className={`flex-1 ${priceMode === 'gram' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                >
                  Preis pro Gramm
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setPriceMode('kg');
                    setFormData({ ...formData, unit_grams: '1' });
                  }}
                  variant={priceMode === 'kg' ? 'default' : 'outline'}
                  className={`flex-1 ${priceMode === 'kg' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                >
                  Preis pro Kilo
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Preis (€) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_per_unit}
                    onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                    required
                  />
                </div>
                {priceMode === 'gram' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">pro Gramm *</label>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      value={formData.unit_grams}
                      onChange={(e) => setFormData({ ...formData, unit_grams: e.target.value })}
                      placeholder="z.B. 100 oder 1000"
                      required
                    />
                  </div>
                )}
                {priceMode === 'kg' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">pro Kilo *</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={formData.unit_grams}
                      onChange={(e) => setFormData({ ...formData, unit_grams: e.target.value })}
                      placeholder="z.B. 1 oder 2"
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Einkaufspreis pro kg (€)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.purchase_price_per_kg}
                onChange={(e) => setFormData({ ...formData, purchase_price_per_kg: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Bild hochladen</label>
              <div className="flex gap-2">
                <label className="flex-1">
                  <div className="border-2 border-dashed rounded-lg p-3 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {uploading ? 'Lädt hoch...' : 'Bild wählen'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
              {formData.image_url && (
                <div className="mt-2">
                  <img src={formData.image_url} alt="Vorschau" className="w-24 h-24 object-cover rounded-lg" />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeDialog} className="flex-1">
                Abbrechen
              </Button>
              <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                {editingProduct ? 'Speichern' : 'Erstellen'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>


    </div>
  );
}