// src/features/Remittance/thunks/apiCalls.js
import api from '../../../services/api';
import { getBearerToken } from '../../../services/authService';

/**
 * Get currency symbol
 */
export const getCurrencySymbol = (currencyData) => {
  if (currencyData?.symbol) return currencyData.symbol;
  const symbols = {
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    NPR: '₨',
  };
  return symbols[currencyData] || currencyData;
};

/**
 * Format number with commas
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined || num === '') return '';
  const str = typeof num === 'string' ? num.replace(/,/g, '') : String(num);
  const cleaned = str.replace(/[^0-9.]/g, '');
  const number = parseFloat(cleaned);
  return isNaN(number) ? '' : number.toLocaleString('en-US');
};

/**
 * Parse formatted number
 */
export const parseFormattedNumber = (str) => {
  if (typeof str !== 'string') {
    if (typeof str === 'number') return str;
    str = String(str || '');
  }
  const num = parseFloat(str.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
};

/**
 * Check if transfer is Europe/UK to Kenya
 */
export const isEuropeUKTransfer = (sendCurrency, receiveCurrency) => {
  return (
    (sendCurrency?.value === 'GBP' || sendCurrency?.value === 'EUR') &&
    receiveCurrency?.value === 'KES'
  );
};

/**
 * Get user's full name from localStorage
 */
export const getUserFullName = () => {
  const firstName = localStorage.getItem('firstName') || '';
  const middleName = localStorage.getItem('middleName') || '';
  const lastName = localStorage.getItem('lastName') || '';
  return `${firstName}${middleName ? ` ${middleName}` : ''} ${lastName}`.trim();
};

/**
 * Prepare FormData for submission
 */
export const prepareFormData = (data) => {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (value instanceof File) {
        formData.append(key, value, value.name);
      } else if (typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    }
  });
  
  return formData;
};

/**
 * Handle API errors with consistent formatting
 */
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return {
          message: data?.message || 'Invalid request. Please check your input.',
          details: data,
          status,
        };
      case 401:
        return {
          message: 'Session expired. Please login again.',
          details: data,
          status,
        };
      case 403:
        return {
          message: 'You don\'t have permission to access this resource.',
          details: data,
          status,
        };
      case 404:
        return {
          message: 'The requested resource was not found.',
          details: data,
          status,
        };
      case 422:
        return {
          message: data?.message || 'Validation failed. Please check your input.',
          details: data?.errors || data,
          status,
        };
      case 429:
        return {
          message: 'Too many requests. Please try again later.',
          details: data,
          status,
        };
      case 500:
        return {
          message: 'Server error. Please try again later.',
          details: data,
          status,
        };
      default:
        return {
          message: data?.message || 'An unexpected error occurred.',
          details: data,
          status,
        };
    }
  } else if (error.request) {
    // Request made but no response
    return {
      message: 'Network error. Please check your internet connection.',
      details: null,
      status: null,
    };
  } else {
    // Error setting up request
    return {
      message: error.message || 'An unexpected error occurred.',
      details: null,
      status: null,
    };
  }
};

/**
 * Debounce function for API calls
 */
export const debounceApiCall = (fn, delay) => {
  let timeoutId;
  
  return (...args) => {
    return new Promise((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
};

/**
 * Cache API responses
 */
export class ApiCache {
  constructor(defaultTTL = 300000) { // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }
  
  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    
    // Auto cleanup
    this.cleanup();
  }
  
  get(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  delete(key) {
    this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
  }
  
  cleanup() {
    const now = Date.now();
    
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }
  
  has(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return false;
    }
    
    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

// Create a global cache instance
export const apiCache = new ApiCache();

/**
 * Cached API call with TTL
 */
export const cachedApiCall = async (cacheKey, apiCall, ttl = 300000) => {
  // Check cache first
  const cached = apiCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Make API call
  try {
    const result = await apiCall();
    apiCache.set(cacheKey, result, ttl);
    return result;
  } catch (error) {
    throw error;
  }
};

export default {
  getCurrencySymbol,
  formatNumber,
  parseFormattedNumber,
  isEuropeUKTransfer,
  getUserFullName,
  prepareFormData,
  handleApiError,
  debounceApiCall,
  ApiCache,
  apiCache,
  cachedApiCall,
};