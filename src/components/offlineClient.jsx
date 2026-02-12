import { offlineStorage } from '@/components/offlineStorage';

// Vollständig offline Client ohne Server-Abhängigkeit
export const offlineClient = {
  entities: {}
};

const entityNames = ['Product', 'Sale', 'ShoppingList', 'Debt', 'Seller', 'CashRegister', 'Purchase'];

entityNames.forEach(entityName => {
  offlineClient.entities[entityName] = {
    // Liste abrufen (nur lokal)
    async list(sort, limit) {
      let data = offlineStorage.getLocal(entityName);
      
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
      return data.filter(item => {
        return Object.entries(query).every(([key, value]) => {
          return item[key] === value;
        });
      });
    },

    // Erstellen (nur lokal)
    async create(data) {
      const newItem = offlineStorage.createLocalItem(entityName, data);
      return newItem;
    },

    // Aktualisieren (nur lokal)
    async update(id, updates) {
      const updated = offlineStorage.updateLocalItem(entityName, id, updates);
      return updated;
    },

    // Löschen (nur lokal)
    async delete(id) {
      offlineStorage.deleteLocalItem(entityName, id);
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