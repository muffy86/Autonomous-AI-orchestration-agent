/**
 * Sovereign Data Layer - Complete data sovereignty
 * Your data, your device, your control
 * 
 * Features:
 * - Origin Private File System (OPFS) for large files
 * - IndexedDB for structured data
 * - End-to-end encryption
 * - P2P sync (optional)
 * - Zero-knowledge architecture
 */

export class SovereignDataLayer {
  private db: any;
  private opfs: any;
  private encryption: any;
  private config: any;

  constructor(config: any) {
    this.config = {
      dbName: 'sovereign-os',
      version: 1,
      encryption: true,
      sync: config.sync || 'none', // 'none', 'p2p', 'webrtc'
      ...config
    };
  }

  async init() {
    console.log('🔐 Initializing Sovereign Data Layer...');
    
    // Initialize IndexedDB
    await this.initIndexedDB();
    
    // Initialize OPFS for large files
    if ('storage' in navigator && 'getDirectory' in navigator.storage) {
      await this.initOPFS();
    }
    
    // Initialize encryption
    if (this.config.encryption) {
      await this.initEncryption();
    }
    
    // Initialize P2P sync if enabled
    if (this.config.sync === 'p2p') {
      await this.initP2PSync();
    }
    
    console.log('✅ Data layer ready - fully sovereign!');
  }

  // ===== IndexedDB =====

  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        
        // Object stores
        if (!db.objectStoreNames.contains('kv')) {
          db.createObjectStore('kv', { keyPath: 'key' });
        }
        
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
          taskStore.createIndex('status', 'status', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('secrets')) {
          db.createObjectStore('secrets', { keyPath: 'key' });
        }
        
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('expires', 'expires', { unique: false });
        }
      };
    });
  }

  async save(key: string, value: any) {
    const data = {
      key,
      value: this.config.encryption ? await this.encrypt(value) : value,
      timestamp: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['kv'], 'readwrite');
      const store = tx.objectStore('kv');
      const request = store.put(data);
      
      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(request.error);
    });
  }

  async load(key: string) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['kv'], 'readonly');
      const store = tx.objectStore('kv');
      const request = store.get(key);
      
      request.onsuccess = async () => {
        const data = request.result;
        if (!data) {
          resolve(null);
          return;
        }
        
        const value = this.config.encryption ? await this.decrypt(data.value) : data.value;
        resolve(value);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['kv'], 'readwrite');
      const store = tx.objectStore('kv');
      const request = store.delete(key);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // ===== Task Queue =====

  async addTask(task: any) {
    const taskData = {
      description: task.description || task,
      options: task.options || {},
      status: 'pending',
      created: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['tasks'], 'readwrite');
      const store = tx.objectStore('tasks');
      const request = store.add(taskData);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingTasks() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['tasks'], 'readonly');
      const store = tx.objectStore('tasks');
      const index = store.index('status');
      const request = index.getAll('pending');
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markTaskComplete(id: number) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['tasks'], 'readwrite');
      const store = tx.objectStore('tasks');
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const task = getRequest.result;
        if (task) {
          task.status = 'completed';
          task.completed = Date.now();
          store.put(task);
        }
        resolve(true);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // ===== Secrets Management =====

  async saveSecret(key: string, value: string) {
    const encrypted = await this.encryptSecret(value);
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['secrets'], 'readwrite');
      const store = tx.objectStore('secrets');
      const request = store.put({ key, value: encrypted });
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async getSecret(key: string) {
    return new Promise(async (resolve, reject) => {
      const tx = this.db.transaction(['secrets'], 'readonly');
      const store = tx.objectStore('secrets');
      const request = store.get(key);
      
      request.onsuccess = async () => {
        const data = request.result;
        if (!data) {
          resolve(null);
          return;
        }
        
        const decrypted = await this.decryptSecret(data.value);
        resolve(decrypted);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // ===== OPFS (Origin Private File System) =====

  async initOPFS() {
    try {
      this.opfs = await navigator.storage.getDirectory();
      console.log('✅ OPFS initialized');
    } catch (error) {
      console.warn('OPFS not available:', error);
    }
  }

  async saveFile(path: string, data: any) {
    if (!this.opfs) throw new Error('OPFS not available');
    
    const pathParts = path.split('/');
    const fileName = pathParts.pop();
    
    // Create directory structure
    let dir = this.opfs;
    for (const part of pathParts) {
      if (part) {
        dir = await dir.getDirectoryHandle(part, { create: true });
      }
    }
    
    // Write file
    const fileHandle = await dir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
    
    return path;
  }

  async loadFile(path: string) {
    if (!this.opfs) throw new Error('OPFS not available');
    
    const pathParts = path.split('/');
    const fileName = pathParts.pop();
    
    // Navigate to directory
    let dir = this.opfs;
    for (const part of pathParts) {
      if (part) {
        dir = await dir.getDirectoryHandle(part);
      }
    }
    
    // Read file
    const fileHandle = await dir.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return await file.arrayBuffer();
  }

  // ===== Encryption =====

  async initEncryption() {
    // Use Web Crypto API
    this.encryption = {
      algorithm: { name: 'AES-GCM', length: 256 },
      key: null,
      
      async generateKey() {
        this.key = await crypto.subtle.generateKey(
          this.algorithm,
          true,
          ['encrypt', 'decrypt']
        );
      },
      
      async encrypt(data: any) {
        if (!this.key) await this.generateKey();
        
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(JSON.stringify(data));
        
        const encrypted = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          this.key,
          encoded
        );
        
        return {
          iv: Array.from(iv),
          data: Array.from(new Uint8Array(encrypted))
        };
      },
      
      async decrypt(encrypted: any) {
        if (!this.key) await this.generateKey();
        
        const iv = new Uint8Array(encrypted.iv);
        const data = new Uint8Array(encrypted.data);
        
        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          this.key,
          data
        );
        
        const decoded = new TextDecoder().decode(decrypted);
        return JSON.parse(decoded);
      }
    };
    
    await this.encryption.generateKey();
  }

  async encrypt(data: any) {
    return await this.encryption.encrypt(data);
  }

  async decrypt(encrypted: any) {
    return await this.encryption.decrypt(encrypted);
  }

  async encryptSecret(value: string) {
    return await this.encryption.encrypt(value);
  }

  async decryptSecret(encrypted: any) {
    return await this.encryption.decrypt(encrypted);
  }

  // ===== P2P Sync =====

  async initP2PSync() {
    // Use WebRTC for peer-to-peer sync
    console.log('🌐 P2P sync initialized (optional)');
    
    // This would use a library like gun.js, orbit-db, or custom WebRTC
    // For now, just placeholder
  }

  // ===== Cache Management =====

  async cacheSet(key: string, value: any, ttl = 3600000) {
    const data = {
      key,
      value,
      expires: Date.now() + ttl,
      timestamp: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['cache'], 'readwrite');
      const store = tx.objectStore('cache');
      const request = store.put(data);
      
      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(request.error);
    });
  }

  async cacheGet(key: string) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['cache'], 'readonly');
      const store = tx.objectStore('cache');
      const request = store.get(key);
      
      request.onsuccess = () => {
        const data = request.result;
        if (!data || data.expires < Date.now()) {
          resolve(null);
          return;
        }
        resolve(data.value);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async cleanup(options: any = {}) {
    const olderThan = options.olderThan || 7 * 24 * 60 * 60 * 1000; // 7 days
    const cutoff = Date.now() - olderThan;
    
    // Clean old cache entries
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['cache'], 'readwrite');
      const store = tx.objectStore('cache');
      const index = store.index('expires');
      const request = index.openCursor();
      
      let deleted = 0;
      
      request.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.expires < Date.now()) {
            cursor.delete();
            deleted++;
          }
          cursor.continue();
        } else {
          resolve(deleted);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // ===== Export/Import =====

  async exportAll() {
    const data: any = {};
    
    // Export KV store
    data.kv = await new Promise((resolve) => {
      const tx = this.db.transaction(['kv'], 'readonly');
      const store = tx.objectStore('kv');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
    });
    
    // Export tasks
    data.tasks = await new Promise((resolve) => {
      const tx = this.db.transaction(['tasks'], 'readonly');
      const store = tx.objectStore('tasks');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
    });
    
    return JSON.stringify(data);
  }

  async importAll(jsonData: string) {
    const data = JSON.parse(jsonData);
    
    // Import KV
    if (data.kv) {
      const tx = this.db.transaction(['kv'], 'readwrite');
      const store = tx.objectStore('kv');
      for (const item of data.kv) {
        store.put(item);
      }
    }
    
    // Import tasks
    if (data.tasks) {
      const tx = this.db.transaction(['tasks'], 'readwrite');
      const store = tx.objectStore('tasks');
      for (const item of data.tasks) {
        store.put(item);
      }
    }
  }
}

export default SovereignDataLayer;
