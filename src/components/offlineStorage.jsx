const DB_NAME = 'basics_unverpackt_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'entities';
const LEGACY_STORAGE_KEY = 'basics_unverpackt_offline_data';
const LEGACY_SYNC_QUEUE_KEY = 'basics_unverpackt_sync_queue';

const ENTITY_NAMES = ['Product', 'Sale', 'ShoppingList', 'Debt', 'Seller', 'CashRegister', 'Purchase'];

const nowIso = () => new Date().toISOString();

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `local_${crypto.randomUUID()}`;
  }
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

const SEED_PRODUCTS = [
  {
    id: 'seed_1',
    name: 'Reis',
    price_per_unit: 3.0,
    unit_grams: 1000,
    purchase_price_per_kg: 3.0,
    image_url: '',
    active: true,
    created_date: nowIso(),
    updated_date: nowIso(),
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
    created_date: nowIso(),
    updated_date: nowIso(),
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
    created_date: nowIso(),
    updated_date: nowIso(),
    _isSeed: true
  },
  {
    id: 'seed_4',
    name: 'Sanddorn Gummibaerchen',
    price_per_unit: 1.75,
    unit_grams: 100,
    purchase_price_per_kg: null,
    image_url: null,
    active: true,
    created_date: nowIso(),
    updated_date: nowIso(),
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
    created_date: nowIso(),
    updated_date: nowIso(),
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
    created_date: nowIso(),
    updated_date: nowIso(),
    _isSeed: true
  }
];

const readLegacyStorage = () => {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.warn('Legacy-Speicher konnte nicht gelesen werden:', error);
    return {};
  }
};

const saveLegacyEntity = (entityName, items) => {
  try {
    const storage = readLegacyStorage();
    storage[entityName] = items;
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error('Fallback-Speicher konnte nicht geschrieben werden:', error);
  }
};

class IndexedEntityStore {
  constructor() {
    this.dbPromise = null;
    this.readyPromise = null;
  }

  isAvailable() {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }

  openDb() {
    if (!this.isAvailable()) return Promise.resolve(null);
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'entityName' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => console.warn('IndexedDB-Upgrade wartet auf ein anderes offenes App-Fenster.');
    });

    return this.dbPromise;
  }

  async withStore(mode, callback) {
    const db = await this.openDb();
    if (!db) return callback(null);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      let callbackResult;

      transaction.oncomplete = () => resolve(callbackResult);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);

      callbackResult = callback(store);
    });
  }

  async readEntity(entityName) {
    if (!this.isAvailable()) {
      return readLegacyStorage()[entityName] || [];
    }

    try {
      const db = await this.openDb();
      const record = await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const request = transaction.objectStore(STORE_NAME).get(entityName);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      return Array.isArray(record?.items) ? record.items : [];
    } catch (error) {
      console.error(`IndexedDB-Lesen fuer ${entityName} fehlgeschlagen:`, error);
      return readLegacyStorage()[entityName] || [];
    }
  }

  async writeEntity(entityName, items) {
    const cleanItems = Array.isArray(items) ? items : [];

    if (!this.isAvailable()) {
      saveLegacyEntity(entityName, cleanItems);
      return;
    }

    try {
      await this.withStore('readwrite', (store) => {
        store.put({
          entityName,
          items: cleanItems,
          updated_at: nowIso()
        });
      });
      saveLegacyEntity(entityName, cleanItems);
    } catch (error) {
      console.error(`IndexedDB-Schreiben fuer ${entityName} fehlgeschlagen:`, error);
      saveLegacyEntity(entityName, cleanItems);
    }
  }

  async readAll() {
    const result = {};

    if (!this.isAvailable()) {
      return readLegacyStorage();
    }

    try {
      const db = await this.openDb();
      const records = await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const request = transaction.objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      records.forEach((record) => {
        if (record?.entityName) {
          result[record.entityName] = Array.isArray(record.items) ? record.items : [];
        }
      });
      return result;
    } catch (error) {
      console.error('IndexedDB-Gesamtspeicher konnte nicht gelesen werden:', error);
      return readLegacyStorage();
    }
  }

  async clear() {
    if (this.isAvailable()) {
      await this.withStore('readwrite', (store) => {
        store.clear();
      });
    }
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_SYNC_QUEUE_KEY);
  }

  async ensureReady() {
    if (this.readyPromise) return this.readyPromise;

    this.readyPromise = (async () => {
      const current = await this.readAll();
      const legacy = readLegacyStorage();

      for (const entityName of ENTITY_NAMES) {
        if ((!current[entityName] || current[entityName].length === 0) && Array.isArray(legacy[entityName]) && legacy[entityName].length > 0) {
          await this.writeEntity(entityName, legacy[entityName]);
        }
      }

      const products = await this.readEntity('Product');
      if (products.length === 0) {
        await this.writeEntity('Product', [...SEED_PRODUCTS]);
      }
    })();

    return this.readyPromise;
  }
}

const entityStore = new IndexedEntityStore();

export const offlineStorage = {
  async initializeSeedData() {
    await entityStore.ensureReady();
  },

  async saveLocal(entityName, data) {
    await entityStore.ensureReady();
    await entityStore.writeEntity(entityName, data);
  },

  async getLocal(entityName) {
    await entityStore.ensureReady();
    return entityStore.readEntity(entityName);
  },

  async getStorage() {
    await entityStore.ensureReady();
    return entityStore.readAll();
  },

  async clearStorage() {
    await entityStore.clear();
    entityStore.readyPromise = null;
  },

  addToSyncQueue() {
    // Die App ist bewusst lokal-only. Es wird keine Sync-Queue mehr aufgebaut.
  },

  getSyncQueue() {
    return [];
  },

  clearSyncQueue() {
    localStorage.removeItem(LEGACY_SYNC_QUEUE_KEY);
  },

  async createLocalItem(entityName, data) {
    const items = await this.getLocal(entityName);
    const item = {
      ...data,
      id: data?.id || createId(),
      created_date: data?.created_date || nowIso(),
      updated_date: nowIso(),
      _isLocal: true
    };

    await this.saveLocal(entityName, [item, ...items]);
    return item;
  },

  async updateLocalItem(entityName, id, updates) {
    const items = await this.getLocal(entityName);
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) return null;

    const updated = {
      ...items[index],
      ...updates,
      updated_date: nowIso()
    };

    items[index] = updated;
    await this.saveLocal(entityName, items);
    return updated;
  },

  async deleteLocalItem(entityName, id) {
    const items = await this.getLocal(entityName);
    await this.saveLocal(entityName, items.filter((item) => item.id !== id));
  }
};

export const isOnline = () => false;
