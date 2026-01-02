// src/utils/partnerStorage.js
export const PARTNER_STORAGE_KEYS = {
  CONFIG: "partnerConfig",
  CONFIG_TIMESTAMP: "partnerConfigTimestamp",
  HEADER_COLOR: "header_color",
  TEXT_COLOR: "text_color",
  PARTNER_LOGO: "partner_logo",
  PARTNER_NAME: "partner_name",
  PRIMARY_COLOR: "primary_color",
  SECONDARY_COLOR: "secondary_color",
  BACKGROUND_COLOR: "background_color",
  CURRENT_PARTNER_ID: "current_partner_id",
  IS_WHITE_LABELLED: "iswhitelabelledpartner",
  WHITE_LABELLED_ID: "whitelabelledpartnerid",
  IS_PARTNER_PACKAGE: "isPartnerPackageModule",
  WHITE_LABELLED_CUSTOMER_ID: "whitelabelled_customer_partnerid",
};

export const getPartnerStorage = (key) => {
  try {
    const value = localStorage.getItem(key);
    if (!value) return null;

    // Try to parse JSON, otherwise return raw value
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return null;
  }
};

export const setPartnerStorage = (key, value) => {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else if (typeof value === "object") {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, value.toString());
    }

    // Dispatch storage event for components listening to localStorage changes
    window.dispatchEvent(new Event("storage"));
    return true;
  } catch (error) {
    console.error("Error writing to localStorage:", error);
    return false;
  }
};

export const clearPartnerStorage = () => {
  Object.values(PARTNER_STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
  window.dispatchEvent(new Event("storage"));
};

export const getPartnerIdFromStorage = () => {
  // Check multiple possible sources for partner ID
  return (
    getPartnerStorage(PARTNER_STORAGE_KEYS.WHITE_LABELLED_ID) ||
    getPartnerStorage(PARTNER_STORAGE_KEYS.WHITE_LABELLED_CUSTOMER_ID) ||
    "0"
  );
};

export const cachePartnerConfig = (config) => {
  if (!config) return false;

  // Store complete config
  setPartnerStorage(PARTNER_STORAGE_KEYS.CONFIG, config);
  setPartnerStorage(PARTNER_STORAGE_KEYS.CONFIG_TIMESTAMP, Date.now());

  // Store individual properties for backward compatibility
  if (config.header_color) {
    setPartnerStorage(PARTNER_STORAGE_KEYS.HEADER_COLOR, config.header_color);
  }
  if (config.text_color) {
    setPartnerStorage(PARTNER_STORAGE_KEYS.TEXT_COLOR, config.text_color);
  }
  if (config.logo_url) {
    setPartnerStorage(PARTNER_STORAGE_KEYS.PARTNER_LOGO, config.logo_url);
  }
  if (config.partner_name) {
    setPartnerStorage(PARTNER_STORAGE_KEYS.PARTNER_NAME, config.partner_name);
  }
  if (config.primary_color) {
    setPartnerStorage(PARTNER_STORAGE_KEYS.PRIMARY_COLOR, config.primary_color);
  }

  return true;
};

export const getCachedPartnerConfig = () => {
  const config = getPartnerStorage(PARTNER_STORAGE_KEYS.CONFIG);
  const timestamp = getPartnerStorage(PARTNER_STORAGE_KEYS.CONFIG_TIMESTAMP);

  if (!config || !timestamp) return null;

  // Check if cache is stale (older than 1 hour)
  const now = Date.now();
  const cacheAge = now - parseInt(timestamp);
  const MAX_CACHE_AGE = 60 * 60 * 1000; // 1 hour

  if (cacheAge > MAX_CACHE_AGE) {
    clearPartnerStorage();
    return null;
  }

  return config;
};
