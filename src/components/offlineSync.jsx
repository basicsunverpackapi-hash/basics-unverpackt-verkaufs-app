class OfflineOnlySync {
  constructor() {
    this.isSyncing = false;
    this.syncCallbacks = [];
  }

  onSyncStatusChange(callback) {
    this.syncCallbacks.push(callback);
  }

  getSyncQueue() {
    return [];
  }

  async sync() {
    return {
      success: true,
      processed: 0,
      errors: [],
      message: 'Lokaler Offline-Modus: keine Synchronisation erforderlich'
    };
  }
}

export const offlineSync = new OfflineOnlySync();
