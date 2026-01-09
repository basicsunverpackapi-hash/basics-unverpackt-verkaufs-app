// Offline Storage Manager
const STORAGE_KEY = 'basics_unverpackt_offline_data';
const SYNC_QUEUE_KEY = 'basics_unverpackt_sync_queue';

export const offlineStorage = {
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