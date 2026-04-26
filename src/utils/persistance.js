// src/utils/persistence.js
/**
 * Utility for manual persistence operations
 * Provides methods for saving/loading data to/from storage
 */

export const persistence = {
  /**
   * Save data to storage
   * @param {string} key - Storage key
   * @param {any} data - Data to save
   * @param {boolean} useSession - Use sessionStorage instead of localStorage
   * @param {Object} options - Additional options
   * @returns {boolean} - Success status
   */
  save: (key, data, useSession = false, options = {}) => {
    const storage = useSession ? sessionStorage : localStorage;
    const { compress = false, expiry = null } = options;

    try {
      let valueToStore = data;

      // Add metadata if expiry is set
      if (expiry) {
        valueToStore = {
          data: data,
          metadata: {
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + expiry).toISOString(),
            version: options.version || "1.0",
          },
        };
      }

      // Serialize with type information
      const serialized = JSON.stringify(valueToStore, (key, value) => {
        // Handle special objects
        if (value instanceof Date) {
          return { __type: "Date", value: value.toISOString() };
        }
        if (value instanceof File) {
          return {
            __type: "File",
            name: value.name,
            type: value.type,
            size: value.size,
            lastModified: value.lastModified,
          };
        }
        if (value instanceof RegExp) {
          return { __type: "RegExp", value: value.toString() };
        }
        if (value instanceof Map) {
          return {
            __type: "Map",
            value: Array.from(value.entries()),
          };
        }
        if (value instanceof Set) {
          return {
            __type: "Set",
            value: Array.from(value),
          };
        }
        if (value && typeof value === "object" && value._isAMomentObject) {
          return {
            __type: "Moment",
            value: value.toISOString(),
          };
        }
        return value;
      });

      // Compress if requested (simple base64 encoding for now)
      const finalValue = compress ? btoa(serialized) : serialized;

      storage.setItem(key, finalValue);

      if (process.env.NODE_ENV !== "production") {
        const size = new Blob([finalValue]).size;
        console.log(
          `💾 Saved ${key} (${size} bytes) to ${useSession ? "session" : "local"}Storage`,
        );
      }

      return true;
    } catch (err) {
      console.error(`❌ Failed to save ${key}:`, err);

      // Handle quota exceeded error
      if (err.name === "QuotaExceededError" || err.code === 22) {
        this.handleQuotaExceeded(key, useSession);
      }

      return false;
    }
  },

  /**
   * Load data from storage
   * @param {string} key - Storage key
   * @param {boolean} useSession - Use sessionStorage instead of localStorage
   * @param {Object} options - Additional options
   * @returns {any} - Loaded data or null
   */
  load: (key, useSession = false, options = {}) => {
    const storage = useSession ? sessionStorage : localStorage;
    const { decompress = false, maxAge = null } = options;

    try {
      const serialized = storage.getItem(key);
      if (serialized === null) return null;

      // Decompress if needed
      const deserialized = decompress ? atob(serialized) : serialized;

      // Parse with reviver to reconstruct special objects
      const parsed = JSON.parse(deserialized, (key, value) => {
        // Revive special objects
        if (value && typeof value === "object") {
          if (value.__type === "Date") {
            return new Date(value.value);
          }
          if (value.__type === "File") {
            // Files cannot be reconstructed, return metadata
            return {
              ...value,
              isPlaceholder: true,
              message:
                "File object placeholder - original file needs to be re-uploaded",
            };
          }
          if (value.__type === "RegExp") {
            const match = value.value.match(/\/(.*)\/([gimy]*)/);
            return match
              ? new RegExp(match[1], match[2])
              : new RegExp(value.value);
          }
          if (value.__type === "Map") {
            return new Map(value.value);
          }
          if (value.__type === "Set") {
            return new Set(value.value);
          }
          if (value.__type === "Moment") {
            // Assuming moment is available
            return typeof moment !== "undefined"
              ? moment(value.value)
              : new Date(value.value);
          }
        }
        return value;
      });

      // Check if data has metadata and is expired
      if (parsed && parsed.metadata) {
        const { metadata, data } = parsed;

        if (metadata.expiresAt) {
          const expiresAt = new Date(metadata.expiresAt);
          if (expiresAt < new Date()) {
            console.log(`⚠️ Data for ${key} expired at ${metadata.expiresAt}`);
            this.remove(key, useSession);
            return null;
          }
        }

        if (maxAge) {
          const createdAt = new Date(metadata.createdAt);
          const age = Date.now() - createdAt.getTime();
          if (age > maxAge) {
            console.log(`⚠️ Data for ${key} older than max age (${maxAge}ms)`);
            return null;
          }
        }

        return data;
      }

      if (process.env.NODE_ENV !== "production") {
        const size = new Blob([serialized]).size;
        console.log(
          `📂 Loaded ${key} (${size} bytes) from ${useSession ? "session" : "local"}Storage`,
        );
      }

      return parsed;
    } catch (err) {
      console.error(`❌ Failed to load ${key}:`, err);
      return null;
    }
  },

  /**
   * Remove data from storage
   * @param {string} key - Storage key
   * @param {boolean} useSession - Use sessionStorage instead of localStorage
   */
  remove: (key, useSession = false) => {
    const storage = useSession ? sessionStorage : localStorage;
    storage.removeItem(key);

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `🗑️ Removed ${key} from ${useSession ? "session" : "local"}Storage`,
      );
    }
  },

  /**
   * Clear all app data from storage
   * @param {Object} options - Options for clearing
   */
  clearAll: (options = {}) => {
    const {
      includeSession = true,
      preserveAuth = true,
      preserveKeys = [],
    } = options;

    // Keys to preserve
    const preserveList = [
      ...(preserveAuth ? ["authtoken", "authcustomer_id", "bearertoken"] : []),
      ...preserveKeys,
    ];

    // Clear localStorage
    const allLocalKeys = Object.keys(localStorage);
    allLocalKeys.forEach((key) => {
      if (!preserveList.includes(key) && !key.startsWith("persist:")) {
        localStorage.removeItem(key);
      }
    });

    // Clear sessionStorage if requested
    if (includeSession) {
      const allSessionKeys = Object.keys(sessionStorage);
      allSessionKeys.forEach((key) => {
        if (!preserveList.includes(key)) {
          sessionStorage.removeItem(key);
        }
      });
    }

    console.log("🧹 Cleared all app data from storage");
  },

  /**
   * Get storage usage info
   * @returns {Object} - Storage usage statistics
   */
  getStorageInfo: () => {
    const formatBytes = (bytes) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const getStorageDetails = (storage, type) => {
      const items = [];
      let totalSize = 0;
      const quota = type === "local" ? 5 * 1024 * 1024 : 5 * 1024 * 1024; // 5MB typical quota

      Object.keys(storage).forEach((key) => {
        try {
          const value = storage.getItem(key);
          const size = new Blob([value]).size;
          totalSize += size;
          items.push({
            key,
            size,
            sizeFormatted: formatBytes(size),
            preview: value.substring(0, 50) + (value.length > 50 ? "..." : ""),
          });
        } catch (e) {
          items.push({ key, error: "Could not read" });
        }
      });

      // Sort by size (largest first)
      items.sort((a, b) => (b.size || 0) - (a.size || 0));

      return {
        items,
        totalSize,
        totalSizeFormatted: formatBytes(totalSize),
        quota,
        quotaFormatted: formatBytes(quota),
        usagePercent: (totalSize / quota) * 100,
        itemCount: items.length,
      };
    };

    return {
      localStorage: getStorageDetails(localStorage, "local"),
      sessionStorage: getStorageDetails(sessionStorage, "session"),
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Handle quota exceeded error
   * @param {string} key - Key that caused the error
   * @param {boolean} useSession - Which storage was used
   * @private
   */
  handleQuotaExceeded: (key, useSession) => {
    const storage = useSession ? sessionStorage : localStorage;
    const type = useSession ? "session" : "local";

    console.warn(`⚠️ Storage quota exceeded for ${key} in ${type}Storage`);

    // Try to free up space by removing old items
    const items = [];
    Object.keys(storage).forEach((k) => {
      try {
        const value = storage.getItem(k);
        items.push({
          key: k,
          size: new Blob([value]).size,
          lastAccessed: localStorage.getItem(`${k}_lastAccessed`) || 0,
        });
      } catch (e) {
        // Ignore
      }
    });

    // Sort by last accessed (oldest first) and remove some
    items.sort((a, b) => a.lastAccessed - b.lastAccessed);

    // Remove oldest 20% of items
    const removeCount = Math.max(1, Math.floor(items.length * 0.2));
    items.slice(0, removeCount).forEach((item) => {
      storage.removeItem(item.key);
      console.log(`🗑️ Removed old item ${item.key} to free up space`);
    });
  },

  /**
   * Check if a key exists in storage
   * @param {string} key - Storage key
   * @param {boolean} useSession - Use sessionStorage
   * @returns {boolean}
   */
  exists: (key, useSession = false) => {
    const storage = useSession ? sessionStorage : localStorage;
    return storage.getItem(key) !== null;
  },

  /**
   * Get all keys in storage
   * @param {boolean} useSession - Use sessionStorage
   * @param {string} pattern - Optional pattern to filter keys
   * @returns {string[]}
   */
  getKeys: (useSession = false, pattern = null) => {
    const storage = useSession ? sessionStorage : localStorage;
    const keys = Object.keys(storage);

    if (pattern) {
      const regex = new RegExp(pattern);
      return keys.filter((key) => regex.test(key));
    }

    return keys;
  },

  /**
   * Migrate data from one key to another
   * @param {string} oldKey - Old storage key
   * @param {string} newKey - New storage key
   * @param {boolean} useSession - Use sessionStorage
   * @param {boolean} removeOld - Remove old key after migration
   */
  migrate: (oldKey, newKey, useSession = false, removeOld = true) => {
    const data = persistence.load(oldKey, useSession);
    if (data) {
      persistence.save(newKey, data, useSession);
      if (removeOld) {
        persistence.remove(oldKey, useSession);
      }
      console.log(`🔄 Migrated ${oldKey} to ${newKey}`);
      return true;
    }
    return false;
  },

  /**
   * Batch save multiple items
   * @param {Object} items - Object with key-value pairs
   * @param {boolean} useSession - Use sessionStorage
   */
  saveBatch: (items, useSession = false) => {
    const results = {};
    Object.entries(items).forEach(([key, value]) => {
      results[key] = persistence.save(key, value, useSession);
    });
    return results;
  },

  /**
   * Batch load multiple items
   * @param {string[]} keys - Array of keys to load
   * @param {boolean} useSession - Use sessionStorage
   */
  loadBatch: (keys, useSession = false) => {
    const results = {};
    keys.forEach((key) => {
      results[key] = persistence.load(key, useSession);
    });
    return results;
  },
};

export default persistence;
