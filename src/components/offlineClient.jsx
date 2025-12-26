import { base44 } from '@/api/base44Client';
import { offlineStorage, isOnline } from './offlineStorage.js';

// Offline-fähiger Wrapper für base44 Client
export const offlineClient = {
  entities: {}
};

const entityNames = ['Product', 'Sale', 'ShoppingList', 'Debt'];

entityNames.forEach(entityName => {
  offlineClient.entities[entityName] = {
    // Liste abrufen
    async list(sort, limit) {
      if (isOnline()) {
        try {
          const data = await base44.entities[entityName].list(sort, limit);
          // Online-Daten lokal speichern
          offlineStorage.saveLocal(entityName, data);
          return data;
        } catch (error) {
          console.warn(`Online-Abruf fehlgeschlagen für ${entityName}, nutze lokale Daten`, error);
          return offlineStorage.getLocal(entityName);
        }
      } else {
        // Offline: Lokale Daten zurückgeben
        return offlineStorage.getLocal(entityName);
      }
    },

    // Filtern (nur lokal)
    async filter(query, sort, limit) {
      const data = await this.list(sort, limit);
      // Einfache Filterung (kann erweitert werden)
      return data.filter(item => {
        return Object.entries(query).every(([key, value]) => {
          return item[key] === value;
        });
      });
    },

    // Erstellen
    async create(data) {
      if (isOnline()) {
        try {
          const result = await base44.entities[entityName].create(data);
          // Lokale Daten aktualisieren
          const localData = offlineStorage.getLocal(entityName);
          localData.push(result);
          offlineStorage.saveLocal(entityName, localData);
          return result;
        } catch (error) {
          console.warn(`Online-Erstellung fehlgeschlagen für ${entityName}, speichere lokal`, error);
          // Fallback auf lokale Erstellung
          const newItem = offlineStorage.createLocalItem(entityName, data);
          offlineStorage.addToSyncQueue({
            type: 'create',
            entityName,
            data: { ...data, id: newItem.id }
          });
          return newItem;
        }
      } else {
        // Offline: Lokal erstellen und zur Sync-Queue hinzufügen
        const newItem = offlineStorage.createLocalItem(entityName, data);
        offlineStorage.addToSyncQueue({
          type: 'create',
          entityName,
          data: { ...data, id: newItem.id }
        });
        return newItem;
      }
    },

    // Aktualisieren
    async update(id, updates) {
      if (isOnline()) {
        try {
          const result = await base44.entities[entityName].update(id, updates);
          // Lokale Daten aktualisieren
          offlineStorage.updateLocalItem(entityName, id, updates);
          return result;
        } catch (error) {
          console.warn(`Online-Update fehlgeschlagen für ${entityName}, speichere lokal`, error);
          const updated = offlineStorage.updateLocalItem(entityName, id, updates);
          offlineStorage.addToSyncQueue({
            type: 'update',
            entityName,
            id,
            data: updates
          });
          return updated;
        }
      } else {
        // Offline: Lokal aktualisieren und zur Sync-Queue hinzufügen
        const updated = offlineStorage.updateLocalItem(entityName, id, updates);
        offlineStorage.addToSyncQueue({
          type: 'update',
          entityName,
          id,
          data: updates
        });
        return updated;
      }
    },

    // Löschen
    async delete(id) {
      if (isOnline()) {
        try {
          await base44.entities[entityName].delete(id);
          // Lokal auch löschen
          offlineStorage.deleteLocalItem(entityName, id);
        } catch (error) {
          console.warn(`Online-Löschung fehlgeschlagen für ${entityName}, speichere lokal`, error);
          offlineStorage.deleteLocalItem(entityName, id);
          offlineStorage.addToSyncQueue({
            type: 'delete',
            entityName,
            id
          });
        }
      } else {
        // Offline: Lokal löschen und zur Sync-Queue hinzufügen
        offlineStorage.deleteLocalItem(entityName, id);
        offlineStorage.addToSyncQueue({
          type: 'delete',
          entityName,
          id
        });
      }
    },

    // Bulk-Operationen
    async bulkCreate(items) {
      const results = [];
      for (const item of items) {
        const result = await this.create(item);
        results.push(result);
      }
      return results;
    }
  };
});

// Auth-Methoden (nur online verfügbar)
offlineClient.auth = base44.auth;
offlineClient.integrations = base44.integrations;
offlineClient.users = base44.users;