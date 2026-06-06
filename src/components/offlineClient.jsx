import { offlineStorage } from '@/components/offlineStorage';

export const offlineClient = {
  entities: {}
};

const entityNames = ['Product', 'Sale', 'ShoppingList', 'Debt', 'Seller', 'CashRegister', 'Purchase'];

entityNames.forEach((entityName) => {
  offlineClient.entities[entityName] = {
    async list(sort, limit) {
      let data = await offlineStorage.getLocal(entityName);

      if (sort && data.length > 0) {
        const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
        const sortOrder = sort.startsWith('-') ? -1 : 1;

        data = [...data].sort((a, b) => {
          const aVal = a?.[sortField] ?? '';
          const bVal = b?.[sortField] ?? '';

          if (aVal === bVal) return 0;
          if (aVal > bVal) return sortOrder;
          return -sortOrder;
        });
      }

      const maxItems = Number(limit);
      if (Number.isFinite(maxItems) && maxItems > 0 && data.length > maxItems) {
        data = data.slice(0, maxItems);
      }

      return data;
    },

    async filter(query = {}, sort, limit) {
      const data = await this.list(sort, limit);
      return data.filter((item) => (
        Object.entries(query).every(([key, value]) => item?.[key] === value)
      ));
    },

    async create(data) {
      return offlineStorage.createLocalItem(entityName, data);
    },

    async update(id, updates) {
      return offlineStorage.updateLocalItem(entityName, id, updates);
    },

    async delete(id) {
      await offlineStorage.deleteLocalItem(entityName, id);
    },

    async bulkCreate(items) {
      const results = [];
      for (const item of items) {
        results.push(await this.create(item));
      }
      return results;
    }
  };
});
