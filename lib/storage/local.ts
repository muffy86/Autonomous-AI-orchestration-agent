export class LocalStorage {
  private db: any;
  
  async init() {
    if (typeof window === 'undefined') return;
    const { openDB } = await import('idb');
    this.db = await openDB('ai-agent', 1, {
      upgrade(db) {
        db.createObjectStore('tasks');
        db.createObjectStore('conversations');
        db.createObjectStore('cache');
      }
    });
  }
  
  async set(store: string, key: string, value: any) {
    return await this.db.put(store, value, key);
  }
  
  async get(store: string, key: string) {
    return await this.db.get(store, key);
  }
  
  async getAll(store: string) {
    return await this.db.getAll(store);
  }
}

export const localStorage = new LocalStorage();
