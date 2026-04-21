// src/features/Transfer/transferThunks.js - REFACTORED WITH CACHING
import {
  setCustomerBankAccounts,
  setAccountsFetched,
  openConfirmationModal,
  closeConfirmationModal,
} from "./transferSlice";
// import { centralizedApi } from "../../services/api";

// Cache configuration
let pendingAccountFetch = null;
let pendingSearchFetch = null;
let pendingTransferFetch = null;

// ============================================
// FETCH CUSTOMER BANK ACCOUNTS WITH CACHING
// ============================================
export const fetchCustomerBankAccounts =
  (customerId) => async (dispatch, getState) => {
    const { transfer } = getState();

    // Return cached data if available
    if (
      transfer.hasFetchedAccounts &&
      transfer.customerBankAccounts?.length > 0
    ) {
      console.log("💾 Using cached bank accounts");
      return {
        success: true,
        data: transfer.customerBankAccounts,
        fromCache: true,
      };
    }

    // Check for pending request
    if (pendingAccountFetch) {
      console.log("🔄 Reusing pending account fetch request");
      return pendingAccountFetch;
    }

    console.log("🚀 Fetching customer bank accounts for:", customerId);

    const fetchPromise = (async () => {
      try {
        const { auth } = getState();
        const authtoken = auth.token || localStorage.getItem("authtoken");

        const API_URL = import.meta.env.VITE_API_URL;

        const response = await fetch(
          `${API_URL}/bank-account-details/${customerId}`,
          {
            headers: {
              Authorization: `Bearer ${authtoken}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch bank accounts: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();
        const accounts = data.account_details || [];

        // Store in Redux
        dispatch(setCustomerBankAccounts(accounts));
        dispatch(setAccountsFetched(true));

        console.log("✅ Bank accounts fetched successfully:", accounts.length);
        return { success: true, data: accounts };
      } catch (error) {
        console.error("❌ Failed to fetch bank accounts:", error);
        return { success: false, error: error.message };
      } finally {
        pendingAccountFetch = null;
      }
    })();

    pendingAccountFetch = fetchPromise;
    return fetchPromise;
  };

// ============================================
// SEARCH RECEIVER WITH CACHING & DEDUPLICATION
// ============================================
export const searchReceiverByMobile =
  ({ mobile, countryCode }) =>
  async (dispatch, getState) => {
    // Create unique key for this search
    const searchKey = `${countryCode}-${mobile}`;
    const cacheKey = `receiver_search_${searchKey}`;

    // Check sessionStorage cache (5 minute TTL)
    const cachedResult = sessionStorage.getItem(cacheKey);
    if (cachedResult) {
      const { data, timestamp } = JSON.parse(cachedResult);
      const isExpired = Date.now() - timestamp > 5 * 60 * 1000; // 5 minutes

      if (!isExpired) {
        console.log("💾 Using cached receiver search result");
        dispatch(setReceiverDetails(data));
        return { success: true, data, fromCache: true };
      } else {
        sessionStorage.removeItem(cacheKey);
      }
    }

    // Check for pending request with same search
    if (pendingSearchFetch && pendingSearchFetch.searchKey === searchKey) {
      console.log("🔄 Reusing pending search request for:", searchKey);
      return pendingSearchFetch.promise;
    }

    console.log("🔍 Searching for receiver:", { mobile, countryCode });

    const searchPromise = (async () => {
      try {
        const { auth } = getState();
        const authtoken = auth.token || localStorage.getItem("authtoken");

        const API_URL = import.meta.env.VITE_API_URL;

        const response = await fetch(
          `${API_URL}/customers/by-mobile/${mobile}`,
          {
            headers: {
              Authorization: `Bearer ${authtoken}`,
              "Content-Type": "application/json",
            },
          },
        );

        const data = await response.json();

        if (data.success) {
          // Cache in sessionStorage
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({
              data: data.data,
              timestamp: Date.now(),
              searchKey,
            }),
          );

          dispatch(setReceiverDetails(data.data));
          return { success: true, data: data.data };
        } else {
          const errorMessage = data.message || "User not found";
          dispatch(setTransferError(errorMessage));
          return { success: false, error: errorMessage };
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          "Failed to fetch receiver. Please try again.";
        dispatch(setTransferError(errorMessage));
        return { success: false, error: errorMessage };
      } finally {
        pendingSearchFetch = null;
      }
    })();

    pendingSearchFetch = { promise: searchPromise, searchKey };
    return searchPromise;
  };

// ============================================
// EXECUTE TRANSFER WITH DEDUPLICATION
// ============================================
export const executeTransfer = (transferData) => async (dispatch, getState) => {
  // Check for pending transfer
  if (pendingTransferFetch) {
    console.log("🔄 Transfer already in progress, reusing promise");
    return pendingTransferFetch;
  }

  console.log("💸 Executing transfer:", transferData);

  const transferPromise = (async () => {
    try {
      const { auth } = getState();
      const authtoken = auth.token || localStorage.getItem("authtoken");

      const API_URL = import.meta.env.VITE_API_URL;

      const response = await fetch(`${API_URL}/transfer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authtoken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferData),
      });

      const data = await response.json();

      if (data.status === "Success") {
        dispatch(setTransferSuccess());

        // Clear related caches after successful transfer
        sessionStorage.clear(); // Clear all search caches
        dispatch(clearTransferCache()); // Mark accounts as needing refresh

        return { success: true, data };
      } else {
        const errorMessage = data.message || "Transfer failed";
        dispatch(setTransferError(errorMessage));
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "An error occurred during transfer.";
      dispatch(setTransferError(errorMessage));
      return { success: false, error: errorMessage };
    } finally {
      pendingTransferFetch = null;
    }
  })();

  pendingTransferFetch = transferPromise;
  return transferPromise;
};

// ============================================
// CLEAR ALL TRANSFER CACHES
// ============================================
export const clearAllTransferCaches = () => (dispatch) => {
  // Clear sessionStorage search caches
  const keysToRemove = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith("receiver_search_")) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => sessionStorage.removeItem(key));

  // Clear Redux cache flags
  dispatch(clearTransferCache());

  // Reset pending promises
  pendingAccountFetch = null;
  pendingSearchFetch = null;
  pendingTransferFetch = null;

  console.log("🧹 Cleared all transfer caches");
};