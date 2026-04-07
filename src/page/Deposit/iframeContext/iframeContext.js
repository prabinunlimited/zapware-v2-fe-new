// src/utils/iframeContext.js
export const isIframe = () => {
  try {
    // Check 1: Is window actually in an iframe?
    const isWindowInIframe = window.self !== window.top;

    // Check 2: Is the route path for an iframe (depositiframe)
    const isDepositIframeRoute =
      window.location.pathname.includes("/depositiframe/");

    // Return true if EITHER condition is met
    return isWindowInIframe || isDepositIframeRoute;
  } catch (e) {
    // Cross-origin error means we're in iframe
    return true;
  }
};

export const getIframeCustomerId = () => {
  if (!isIframe()) return null;

  // Method 1: Extract from URL path (matches your route: depositiframe/:customerId/:authtoken/:uniqueReference/:instructedAmount)
  const pathParts = window.location.pathname.split("/");

  // Find the index of 'depositiframe' in the path
  const depositIframeIndex = pathParts.indexOf("depositiframe");

  if (depositIframeIndex !== -1 && pathParts.length > depositIframeIndex + 1) {
    // The next part after 'depositiframe' is the customerId
    const customerId = pathParts[depositIframeIndex + 1];

    // Validate it's a number (customer IDs are usually numeric)
    if (customerId && /^\d+$/.test(customerId)) {
      console.log("✅ Extracted customerId from URL path:", customerId);
      return customerId;
    }
  }

  // Method 2: Fallback to query parameters (for backward compatibility)
  const urlParams = new URLSearchParams(window.location.search);
  const customerIdFromQuery = urlParams.get("customerId");
  if (customerIdFromQuery) {
    console.log(
      "✅ Extracted customerId from query params:",
      customerIdFromQuery
    );
    return customerIdFromQuery;
  }

  console.warn("⚠️ Could not extract customerId from iframe URL");
  return null;
};

export const getIframeAuthToken = () => {
  if (!isIframe()) return null;

  // Extract auth token from URL path (second parameter after customerId)
  const pathParts = window.location.pathname.split("/");
  const depositIframeIndex = pathParts.indexOf("depositiframe");

  if (depositIframeIndex !== -1 && pathParts.length > depositIframeIndex + 2) {
    const authToken = pathParts[depositIframeIndex + 2];
    if (authToken) {
      console.log("✅ Extracted auth token from URL path");
      return authToken;
    }
  }

  return null;
};

export const getIframeParams = () => {
  if (!isIframe()) return null;

  const pathParts = window.location.pathname.split("/");
  const depositIframeIndex = pathParts.indexOf("depositiframe");

  if (depositIframeIndex === -1) return null;

  return {
    customerId: pathParts[depositIframeIndex + 1] || null,
    authToken: pathParts[depositIframeIndex + 2] || null,
    uniqueReference: pathParts[depositIframeIndex + 3] || null,
    instructedAmount: pathParts[depositIframeIndex + 4] || null,
    fullPath: window.location.pathname,
    queryParams: Object.fromEntries(
      new URLSearchParams(window.location.search)
    ),
  };
};

export const getCustomerId = () => {
  // If in iframe, get from URL path
  const iframeCustomerId = getIframeCustomerId();
  if (iframeCustomerId) {
    return iframeCustomerId;
  }

  // If in main app, get from localStorage
  return localStorage.getItem("authcustomer_id");
};

export const storeCustomerId = (customerId) => {
  if (isIframe()) {
    sessionStorage.setItem("iframe_customer_id", customerId);
  } else {
    localStorage.setItem("authcustomer_id", customerId);
  }
};

export const debugIframeContext = () => {
  const context = {
    isIframe: isIframe(),
    location: window.location.href,
    pathParts: window.location.pathname.split("/"),
    extracted: getIframeParams(),
    routePattern:
      "depositiframe/:customerId/:authtoken/:uniqueReference/:instructedAmount",
    matchesPattern: window.location.pathname.includes("depositiframe"),
  };

  console.log("🔍 IFRAME CONTEXT DEBUG:", context);
  return context;
};
