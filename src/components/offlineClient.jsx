import { base44 } from '@/api/base44Client';
import { offlineStorage, isOnline } from '@/components/offlineStorage';

// Offline-fähiger Wrapper für base44 Client
export const offlineClient = {
  entities: {}
};

const entityNames = ['Product', 'Sale', 'ShoppingList', 'Debt', 'Seller', 'CashRegister', 'Purchase'];

entityNames.forEach(entityName => {
  offlineClient.entities[entityName] = {
    // Liste abrufen
    async list(sort, limit) {
      let data;
      
      if (isOnline()) {
        try {
          data = await base44.entities[entityName].list(sort, limit);
          // Online-Daten lokal speichern
          offlineStorage.saveLocal(entityName, data);
          return data;
        } catch (error) {
          console.warn(`Online-Abruf fehlgeschlagen für ${entityName}, nutze lokale Daten`, error);
          data = offlineStorage.getLocal(entityName);
        }
      } else {
        // Offline: Lokale Daten zurückgeben
        data = offlineStorage.getLocal(entityName);
      }
      
      // Lokale Sortierung anwenden
      if (sort && data.length > 0) {
        const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
        const sortOrder = sort.startsWith('-') ? -1 : 1;
        
        data = [...data].sort((a, b) => {
          const aVal = a[sortField];
          const bVal = b[sortField];
          if (aVal === bVal) return 0;
          if (aVal > bVal) return sortOrder;
          return -sortOrder;
        });
      }
      
      // Limit anwenden
      if (limit && data.length > limit) {
        data = data.slice(0, limit);
      }
      
      return data;
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
      let newItem;

      if (isOnline()) {
        try {
          newItem = await base44.entities[entityName].create(data);
          console.log(`${entityName} erfolgreich auf Server erstellt:`, newItem.id);
          // Lokale Daten aktualisieren
          const localData = offlineStorage.getLocal(entityName);
          // Prüfe ob Item bereits existiert (verhindere Duplikate)
          const existingIndex = localData.findIndex(item => item.id === newItem.id);
          if (existingIndex === -1) {
            localData.unshift(newItem); // Am Anfang einfügen für neueste zuerst
          } else {
            localData[existingIndex] = newItem; // Aktualisiere existierendes Item
          }
          offlineStorage.saveLocal(entityName, localData);
          return newItem; // WICHTIG: Gib Server-Item zurück
        } catch (error) {
          console.error(`Online-Erstellung fehlgeschlagen für ${entityName}, speichere lokal`, error);
          // Fallback auf lokale Erstellung
          newItem = offlineStorage.createLocalItem(entityName, data);
          offlineStorage.addToSyncQueue({
            type: 'create',
            entityName,
            data: newItem
          });
          return newItem;
        }
      } else {
        // Offline: Lokal erstellen und zur Sync-Queue hinzufügen
        newItem = offlineStorage.createLocalItem(entityName, data);
        offlineStorage.addToSyncQueue({
          type: 'create',
          entityName,
          data: newItem
        });
        return newItem;
      }
    },

    // Aktualisieren
    async update(id, updates) {
      if (isOnline()) {
        try {
          const result = await base44.entities[entityName].update(id, updates);
          console.log(`${entityName} erfolgreich auf Server aktualisiert:`, id);
          // Lokale Daten aktualisieren
          offlineStorage.updateLocalItem(entityName, id, updates);
          return result;
        } catch (error) {
          console.error(`Online-Update fehlgeschlagen für ${entityName}, speichere lokal`, error);
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
          console.log(`${entityName} erfolgreich vom Server gelöscht:`, id);
          // Lokal auch löschen
          offlineStorage.deleteLocalItem(entityName, id);
        } catch (error) {
          console.error(`Online-Löschung fehlgeschlagen für ${entityName}, speichere lokal`, error);
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