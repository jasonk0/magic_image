import { ApiConfig, GeneratedImage, CustomModel } from "@/types";

const STORAGE_KEYS = {
  API_CONFIG: "ai-drawing-api-config",
  HISTORY: "ai-drawing-history",
  CUSTOM_MODELS: "ai-drawing-custom-models",
};

// IndexedDB 配置
const DB_NAME = "MagicImageDB";
const DB_VERSION = 1;
const STORES = {
  API_CONFIG: "apiConfig",
  HISTORY: "history",
  CUSTOM_MODELS: "customModels",
};

// IndexedDB 工具类
class IndexedDBStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (typeof window === "undefined") return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建 API 配置存储
        if (!db.objectStoreNames.contains(STORES.API_CONFIG)) {
          db.createObjectStore(STORES.API_CONFIG);
        }

        // 创建历史记录存储
        if (!db.objectStoreNames.contains(STORES.HISTORY)) {
          const historyStore = db.createObjectStore(STORES.HISTORY, {
            keyPath: "id",
          });
          historyStore.createIndex("createdAt", "createdAt", { unique: false });
        }

        // 创建自定义模型存储
        if (!db.objectStoreNames.contains(STORES.CUSTOM_MODELS)) {
          db.createObjectStore(STORES.CUSTOM_MODELS, { keyPath: "id" });
        }
      };
    });
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async set(storeName: string, key: string, value: any): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(value, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async add(storeName: string, value: any): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.add(value);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

const idbStorage = new IndexedDBStorage();

// 数据迁移函数：从localStorage迁移到IndexedDB
const migrateFromLocalStorage = async () => {
  if (typeof window === "undefined") return;

  try {
    // 迁移API配置
    const apiConfigData = localStorage.getItem(STORAGE_KEYS.API_CONFIG);
    if (apiConfigData) {
      const apiConfig = JSON.parse(apiConfigData);
      await idbStorage.set(
        STORES.API_CONFIG,
        STORAGE_KEYS.API_CONFIG,
        apiConfig
      );
      localStorage.removeItem(STORAGE_KEYS.API_CONFIG);
      console.log("API配置已迁移到IndexedDB");
    }

    // 迁移历史记录
    const historyData = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (historyData) {
      const history = JSON.parse(historyData);
      for (const item of history) {
        await idbStorage.add(STORES.HISTORY, item);
      }
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
      console.log("历史记录已迁移到IndexedDB");
    }

    // 迁移自定义模型
    const customModelsData = localStorage.getItem(STORAGE_KEYS.CUSTOM_MODELS);
    if (customModelsData) {
      const customModels = JSON.parse(customModelsData);
      for (const model of customModels) {
        await idbStorage.add(STORES.CUSTOM_MODELS, model);
      }
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_MODELS);
      console.log("自定义模型已迁移到IndexedDB");
    }
  } catch (error) {
    console.error("数据迁移失败:", error);
  }
};

// 初始化存储并执行数据迁移
const initializeStorage = async () => {
  await idbStorage.init();
  await migrateFromLocalStorage();
};

// 在模块加载时初始化
if (typeof window !== "undefined") {
  initializeStorage();
}

export const storage = {
  // API 配置相关操作
  getApiConfig: async (): Promise<ApiConfig | null> => {
    if (typeof window === "undefined") return null;
    try {
      return await idbStorage.get<ApiConfig>(
        STORES.API_CONFIG,
        STORAGE_KEYS.API_CONFIG
      );
    } catch (error) {
      console.error("获取API配置失败:", error);
      return null;
    }
  },

  setApiConfig: async (key: string, baseUrl: string): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      const apiConfig: ApiConfig = {
        key,
        baseUrl,
        createdAt: new Date().toISOString(),
      };
      await idbStorage.set(
        STORES.API_CONFIG,
        STORAGE_KEYS.API_CONFIG,
        apiConfig
      );
    } catch (error) {
      console.error("设置API配置失败:", error);
    }
  },

  removeApiConfig: async (): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      await idbStorage.delete(STORES.API_CONFIG, STORAGE_KEYS.API_CONFIG);
    } catch (error) {
      console.error("删除API配置失败:", error);
    }
  },

  // 历史记录相关操作
  getHistory: async (): Promise<GeneratedImage[]> => {
    if (typeof window === "undefined") return [];
    try {
      const history = await idbStorage.getAll<GeneratedImage>(STORES.HISTORY);
      // 按创建时间倒序排列
      return history.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error("获取历史记录失败:", error);
      return [];
    }
  },

  addToHistory: async (image: GeneratedImage): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      await idbStorage.add(STORES.HISTORY, image);
    } catch (error) {
      console.error("添加历史记录失败:", error);
    }
  },

  clearHistory: async (): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      await idbStorage.clear(STORES.HISTORY);
    } catch (error) {
      console.error("清空历史记录失败:", error);
    }
  },

  removeFromHistory: async (id: string): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      await idbStorage.delete(STORES.HISTORY, id);
    } catch (error) {
      console.error("删除历史记录失败:", error);
    }
  },

  // 自定义模型相关操作
  getCustomModels: async (): Promise<CustomModel[]> => {
    if (typeof window === "undefined") return [];
    try {
      return await idbStorage.getAll<CustomModel>(STORES.CUSTOM_MODELS);
    } catch (error) {
      console.error("获取自定义模型失败:", error);
      return [];
    }
  },

  addCustomModel: async (model: CustomModel): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      await idbStorage.add(STORES.CUSTOM_MODELS, model);
    } catch (error) {
      console.error("添加自定义模型失败:", error);
    }
  },

  removeCustomModel: async (id: string): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      await idbStorage.delete(STORES.CUSTOM_MODELS, id);
    } catch (error) {
      console.error("删除自定义模型失败:", error);
    }
  },

  updateCustomModel: async (
    id: string,
    updated: Partial<CustomModel>
  ): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      const existingModel = await idbStorage.get<CustomModel>(
        STORES.CUSTOM_MODELS,
        id
      );
      if (existingModel) {
        const updatedModel = { ...existingModel, ...updated };
        await idbStorage.set(STORES.CUSTOM_MODELS, id, updatedModel);
      }
    } catch (error) {
      console.error("更新自定义模型失败:", error);
    }
  },
};
