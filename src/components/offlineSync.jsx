import { base44 } from '@/api/base44Client';
import { offlineStorage, isOnline } from './offlineStorage';

class OfflineSync {
  constructor() {
    this.isSyncing = false;
    this.syncCallbacks = [];
  }

  // Sync-Status Listener registrieren
  onSyncStatusChange(callback) {
    this.syncCallbacks.push(callback);
  }

  notifySyncStatus(status) {
    this.syncCallbacks.forEach(cb => cb(status));
  }

  // Synchronisierung durchführen
  async sync() {
    if (!isOnline() || this.isSyncing) {
      return { success: false, message: 'Offline oder Sync läuft bereits' };
    }

    this.isSyncing = true;
    this.notifySyncStatus({ syncing: true, progress: 0 });

    try {
      const queue = offlineStorage.getSyncQueue();
      
      if (queue.length === 0) {
        // Auch wenn keine Queue-Items da sind, Online-Daten laden
        await this.downloadAllData();
        this.isSyncing = false;
        this.notifySyncStatus({ syncing: false, progress: 100, success: true });
        return { success: true, message: 'Keine ausstehenden Änderungen' };
      }

      let processed = 0;
      const errors = [];

      // Queue-Items verarbeiten
      for (const operation of queue) {
        try {
          await this.processOperation(operation);
          processed++;
          this.notifySyncStatus({ 
            syncing: true, 
            progress: (processed / queue.length) * 100 
          });
        } catch (error) {
          console.error('Fehler bei Operation:', operation, error);
          errors.push({ operation, error: error.message });
        }
      }

      // Queue leeren, wenn alle erfolgreich
      if (errors.length === 0) {
        offlineStorage.clearSyncQueue();
      }

      // Aktuelle Daten vom Server laden
      await this.downloadAllData();

      this.isSyncing = false;
      this.notifySyncStatus({ 
        syncing: false, 
        progress: 100, 
        success: errors.length === 0,
        errors 
      });

      return {
        success: errors.length === 0,
        processed,
        errors,
        message: errors.length === 0 
          ? `${processed} Änderungen synchronisiert` 
          : `${processed - errors.length}/${processed} Änderungen synchronisiert`
      };

    } catch (error) {
      console.error('Sync-Fehler:', error);
      this.isSyncing = false;
      this.notifySyncStatus({ syncing: false, progress: 0, success: false });
      return { success: false, message: 'Synchronisierung fehlgeschlagen' };
    }
  }

  // Einzelne Operation verarbeiten
  async processOperation(operation) {
    const { type, entityName, data, id } = operation;

    switch (type) {
      case 'create':
        const created = await base44.entities[entityName].create(data);
        // Lokales Temp-Item durch Server-Item ersetzen
        if (data.id && data.id.startsWith('local_')) {
          offlineStorage.deleteLocalItem(entityName, data.id);
        }
        return created;

      case 'update':
        // Nur updaten, wenn es keine lokale ID ist
        if (!id.startsWith('local_')) {
          return await base44.entities[entityName].update(id, data);
        }
        break;

      case 'delete':
        // Nur löschen, wenn es keine lokale ID ist
        if (!id.startsWith('local_')) {
          return await base44.entities[entityName].delete(id);
        }
        break;

      default:
        throw new Error(`Unbekannter Operationstyp: ${type}`);
    }
  }

  // Alle Daten vom Server laden und lokal speichern
  async downloadAllData() {
    try {
      const entities = ['Product', 'Sale', 'ShoppingList', 'Debt'];
      
      for (const entityName of entities) {
        try {
          const data = await base44.entities[entityName].list('-created_date', 1000);
          offlineStorage.saveLocal(entityName, data);
        } catch (error) {
          console.error(`Fehler beim Laden von ${entityName}:`, error);
        }
      }
    } catch (error) {
      console.error('Fehler beim Herunterladen der Daten:', error);
    }
  }
}

export const offlineSync = new OfflineSync();

// Auto-Sync bei Verbindungswiederherstellung
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Internetverbindung wiederhergestellt, starte Sync...');
    setTimeout(() => {
      offlineSync.sync();
    }, 1000);
  });

  window.addEventListener('offline', () => {
    console.log('Keine Internetverbindung - Offline-Modus aktiv');
  });
}