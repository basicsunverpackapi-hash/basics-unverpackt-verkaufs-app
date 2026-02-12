import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offlineClient } from '@/components/offlineClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Package, Upload, User } from 'lucide-react';
import { toast } from 'sonner';

export default function Bearbeiten() {
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

  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => offlineClient.entities.Product.list('-created_date', 100)
  });

  const { data: sellers = [] } = useQuery({
    queryKey: ['sellers'],
    queryFn: () => offlineClient.entities.Seller.list('-created_date', 100)
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
      // Konvertiere Bild zu Base64 für lokale Speicherung
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image_url: reader.result });
        toast.success('Bild lokal gespeichert');
        setUploading(false);
      };
      reader.onerror = () => {
        toast.error('Fehler beim Laden des Bildes');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Fehler beim Verarbeiten des Bildes');
      setUploading(false);
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
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="products" className="text-base">
            <Package className="w-4 h-4 mr-2" />
            Produkte
          </TabsTrigger>
          <TabsTrigger value="sellers" className="text-base">
            <User className="w-4 h-4 mr-2" />
            Verkäufer
          </TabsTrigger>
        </TabsList>

        {/* Produkte Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-700 dark:to-orange-700 rounded-2xl p-6 shadow-lg text-white flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold">Produkte bearbeiten</h2>
              <p className="text-amber-100 dark:text-amber-200 mt-2">Produkte verwalten und erstellen</p>
            </div>
            <Button onClick={() => openDialog()} className="bg-white dark:bg-slate-100 text-amber-700 hover:bg-amber-50 dark:hover:bg-slate-200 font-bold shadow-lg rounded-xl px-6 py-3">
              <Plus className="w-5 h-5 mr-2" />
              Neues Produkt
            </Button>
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
            <Button onClick={() => openSellerDialog()} className="bg-white dark:bg-slate-100 text-blue-700 hover:bg-blue-50 dark:hover:bg-slate-200 font-bold shadow-lg rounded-xl px-6 py-3">
              <Plus className="w-5 h-5 mr-2" />
              Neuer Verkäufer
            </Button>
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