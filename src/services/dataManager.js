// src/services/dataManager.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

class UnifiedDataManager {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes
    this.pendingRequests = new Map();
  }

  getCacheKey(endpoint, params) {
    return `${endpoint}-${JSON.stringify(params)}`;
  }

  async fetchWithCache(endpoint, params, fetchFn, options = {}) {
    const cacheKey = this.getCacheKey(endpoint, params);
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    // Return cached data if valid
    if (cached && !options.forceRefresh) {
      if (now - cached.timestamp < (options.ttl || this.ttl)) {
        return cached.data;
      }
      // Stale data - refresh in background
      if (options.staleWhileRevalidate) {
        this.refreshInBackground(cacheKey, fetchFn);
        return cached.data;
      }
    }

    // Prevent duplicate requests
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // Make the request
    const promise = fetchFn();
    this.pendingRequests.set(cacheKey, promise);

    try {
      const data = await promise;
      this.cache.set(cacheKey, {
        data,
        timestamp: now,
        version: (cached?.version || 0) + 1,
      });
      return data;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async refreshInBackground(cacheKey, fetchFn) {
    try {
      const freshData = await fetchFn();
      this.cache.set(cacheKey, {
        data: freshData,
        timestamp: Date.now(),
        version: (this.cache.get(cacheKey)?.version || 0) + 1,
      });
      // Notify subscribers
      this.notifySubscribers(cacheKey, freshData);
    } catch (error) {
      console.error("Background refresh failed:", error);
    }
  }

  invalidate(endpointPattern) {
    for (const [key] of this.cache.entries()) {
      if (key.includes(endpointPattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

export const dataManager = new UnifiedDataManager();
