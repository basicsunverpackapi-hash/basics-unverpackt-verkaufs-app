// Offline Storage Manager
const STORAGE_KEY = 'basics_unverpackt_offline_data';
const SYNC_QUEUE_KEY = 'basics_unverpackt_sync_queue';

// Initiale Seed-Daten für Produkte (Ihre originalen Produkte)
const SEED_PRODUCTS = [
  {
    id: 'seed_1',
    name: 'Reis',
    price_per_unit: 3.0,
    unit_grams: 1000,
    purchase_price_per_kg: 3.0,
    image_url: '',
    active: true,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    _isSeed: true
  },
  {
    id: 'seed_2',
    name: 'Schoko Crunchy',
    price_per_unit: 9.5,
    unit_grams: 1000,
    purchase_price_per_kg: null,
    image_url: null,
    active: true,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    _isSeed: true
  },
  {
    id: 'seed_3',
    name: 'Penne',
    price_per_unit: 2.7,
    unit_grams: 1000,
    purchase_price_per_kg: null,
    image_url: null,
    active: true,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    _isSeed: true
  },
  {
    id: 'seed_4',
    name: 'Sanddorn Gummibärchen',
    price_per_unit: 1.75,
    unit_grams: 100,
    purchase_price_per_kg: null,
    image_url: null,
    active: true,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    _isSeed: true
  },
  {
    id: 'seed_5',
    name: 'Haferflocken',
    price_per_unit: 2.3,
    unit_grams: 1000,
    purchase_price_per_kg: null,
    image_url: null,
    active: true,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    _isSeed: true
  },
  {
    id: 'seed_6',
    name: 'Spaghetti',
    price_per_unit: 12.0,
    unit_grams: 5000,
    purchase_price_per_kg: null,
    image_url: null,
    active: true,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    _isSeed: true
  }
];

export const offlineStorage = {
  // Initiale Daten beim ersten Laden setzen
  initializeSeedData() {
    const storage = this.getStorage();
    
    // Seed-Produkte nur initialisieren, wenn noch keine vorhanden sind
    if (!storage.Product || storage.Product.length === 0) {
      storage.Product = [...SEED_PRODUCTS];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
      console.log('Seed-Produkte initialisiert:', SEED_PRODUCTS.length);
    }
  },
  // Daten lokal speichern
  saveLocal(entityName, data) {
    try {
      const storage = this.getStorage();
      if (!storage[entityName]) {
        storage[entityName] = [];
      }
      storage[entityName] = data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    } catch (error) {
      console.error('Fehler beim lokalen Speichern:', error);
    }
  },

  // Lokale Daten abrufen
  getLocal(entityName) {
    try {
      const storage = this.getStorage();
      
      // Seed-Daten für Produkte initialisieren wenn leer
      if (entityName === 'Product' && (!storage[entityName] || storage[entityName].length === 0)) {
        this.initializeSeedData();
        return this.getStorage().Product || [];
      }
      
      return storage[entityName] || [];
    } catch (error) {
      console.error('Fehler beim Abrufen lokaler Daten:', error);
      return [];
    }
  },

  // Gesamten Storage abrufen
  getStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      return {};
    }
  },

  // Storage leeren
  clearStorage() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SYNC_QUEUE_KEY);
  },

  // Operation zur Sync-Queue hinzufügen
  addToSyncQueue(operation) {
    try {
      const queue = this.getSyncQueue();
      operation.queueId = Date.now() + Math.random();
      operation.timestamp = new Date().toISOString();
      queue.push(operation);
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Fehler beim Hinzufügen zur Sync-Queue:', error);
    }
  },

  // Sync-Queue abrufen
  getSyncQueue() {
    try {
      const data = localStorage.getItem(SYNC_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  },

  // Sync-Queue leeren
  clearSyncQueue() {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify([]));
  },

  // Einzelnes Item aus Entity erstellen
  createLocalItem(entityName, data) {
    const items = this.getLocal(entityName);
    const newItem = {
      ...data,
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      _isLocal: true
    };
    items.unshift(newItem); // Am Anfang einfügen für neueste zuerst
    this.saveLocal(entityName, items);
    console.log(`Lokales Item erstellt für ${entityName}:`, newItem);
    console.log(`Gesamtanzahl ${entityName}:`, items.length);
    return newItem;
  },

  // Einzelnes Item aktualisieren
  updateLocalItem(entityName, id, updates) {
    const items = this.getLocal(entityName);
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = {
        ...items[index],
        ...updates,
        updated_date: new Date().toISOString()
      };
      this.saveLocal(entityName, items);
      return items[index];
    }
    return null;
  },

  // Einzelnes Item löschen
  deleteLocalItem(entityName, id) {
    const items = this.getLocal(entityName);
    const filtered = items.filter(item => item.id !== id);
    this.saveLocal(entityName, filtered);
  }
};

// Online-Status prüfen
export const isOnline = () => {
  return typeof window !== 'undefined' ? navigator.onLine : true;
};