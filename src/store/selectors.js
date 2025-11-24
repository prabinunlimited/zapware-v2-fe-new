// src/store/selectors.js

// ✅ CENTRALIZED AUTH SELECTORS
export const selectAuthToken = (state) => {
  const token = state.auth?.token;

  const isValidToken =
    token &&
    token !== "undefined" &&
    token !== "null" &&
    token !== "false" &&
    typeof token === "string" &&
    token.length > 10;

  if (isValidToken) {
    return token;
  }

  const tempAuthData = state.auth?.tempAuthData;
  if (tempAuthData?.token) {
    return tempAuthData.token;
  }

  try {
    const sessionTempAuth = sessionStorage.getItem("temp_auth_data");
    if (sessionTempAuth) {
      const tempAuth = JSON.parse(sessionTempAuth);
      if (
        tempAuth.token &&
        tempAuth.timestamp &&
        Date.now() - tempAuth.timestamp < 300000
      ) {
        return tempAuth.token;
      }
    }
  } catch (e) {
    // Silent catch
  }

  const storedToken = localStorage.getItem("authtoken");
  const isValidStoredToken =
    storedToken &&
    storedToken !== "undefined" &&
    storedToken !== "null" &&
    storedToken !== "false" &&
    typeof storedToken === "string" &&
    storedToken.length > 10;

  return isValidStoredToken ? storedToken : null;
};

export const selectIsAuthenticated = (state) => {
  const token = selectAuthToken(state);
  const customerId = state.auth?.customerId;

  const isValidCustomerId =
    customerId &&
    customerId !== "undefined" &&
    customerId !== "null" &&
    customerId !== "false" &&
    !isNaN(parseInt(customerId));

  return !!(token && isValidCustomerId);
};

export const selectCustomerId = (state) => state.auth?.customerId;
export const selectIsInitialized = (state) => state.auth?.isInitialized;

// ✅ COMMON UTILITY SELECTORS
export const selectAccounts = (state) => {
  const accounts = state.account?.accounts;
  return Array.isArray(accounts) ? accounts : [];
};

export const selectHasAccounts = (state) => selectAccounts(state).length > 0;