// src/store/store.js - With persistence but without rehydration UI
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  createTransform,
} from "redux-persist";
import storage from "redux-persist/lib/storage"; // localStorage
import sessionStorage from "redux-persist/lib/storage/session"; // sessionStorage

// ===================== ACTION CREATOR IMPORTS =====================
import {
  setAuthState,
  setInitialized,
  setVerificationStatus,
} from "../features/Auth/slices/authSlice";

// ===================== AUTH AND RELATED SLICES =====================
import authReducer from "../features/Auth/slices/authSlice";
import kycReducer from "../features/Auth/slices/kycSlice";
import countryReducer from "../features/Auth/slices/countrySlice";
import partnerReducer from "../features/Auth/slices/partnerSlice";
import hostnameReducer from "../features/Auth/slices/hostnameSlice";
import uiReducer from "../features/Auth/slices/uiSlice";
import downloadReducer from "../features/Auth/slices/downloadSlice";
import forgotPasswordReducer from "../features/Auth/slices/forgotPasswordSlice";
import signupReducer from "../features/Auth/slices/signupSlice";
import institutionRegistrationReducer from "../features/Auth/slices/institutionRegistrationSlice";
import currencyAccountsReducer from "../features/Auth/SignUp/SelectCurrencyAccount/currencyAccountsSlice";

// ===================== DASHBOARD AND COMPONENTS =====================
import headerReducer from "../components/Dashboard/Header/headerSlice";
import homeReducer from "../page/Home/HomeSlice";
import navigationSectionReducer from "../components/Dashboard/Navigation/NavigateSectionSlice";
import plaidReducer from "../components/ZapPlaidLink/plaidSlice";
import accountReducer from "../components/Dashboard/Account/AccountSummary/AccountSlice";
import transactionReducer from "../components/Dashboard/Account/Transaction/TransactionSlice";
import transferReducer from "../page/Transfer/transferSlice";

// ===================== BENEFICIARIES =====================
import beneficiariesReducer from "../page/Beneficiary/MyBeneficiaries/BeneficiariesSlice";
import addBeneficiaryReducer from "../page/Beneficiary/AddBeneficiary/addBeneficiarySlice";
import modalReducer from "../page/Beneficiary/MyBeneficiaries/ModalSlice";
import beneficiariesHeaderReducer from "../components/RequestRemit/Header/BeneficiariesHeaderSlice";
import beneficiariesHomepageReducer from "../page/RequestRemit/Homepage/beneficiaryHomepageSlice";
import beneficiaryNavigationReducer from "../components/RequestRemit/Navigation/Slices/BeneficiaryNavigationSlice";
import beneficiaryTransactionReducer from "../page/RequestRemit/Transactions/BeneficiaryTransactionSlice";
import beneficiarySendersReducer from "../page/RequestRemit/Senders/Slice/beneficiarySendersSlice";

// ===================== DEPOSIT SLICES =====================
import depositReducer from "../page/Deposit/slices/depositSlice";
import currencyReducer from "../page/Deposit/slices/currencySlice";
import bankAccountReducer from "../page/Deposit/slices/bankAccountSlice";
import uiDepositReducer from "../page/Deposit/slices/uiSlice";
import bankLinkReducer from "../page/Deposit/slices/bankLinkSlice";

// ===================== CONVERSION SLICES =====================
import conversionReducer from "../page/Conversion/slice/ConversionSlice";

// ===================== CARD PAYMENT SLICES =====================
import cardPaymentReducer from "../page/Deposit/slices/cardPaymentSlice";

// ===================== TEAM SLICES =====================
import teamReducer from "../page/Team/Slice/teamSlice";
import teamMemberReducer from "../page/Team/Slice/teamMemberSlice";

// ===================== PAYOUT SLICES =====================
import payoutReducer from "../page/Payout/slices/payoutSlice";

// ===================== BANK LETTER ======================
import bankLetterReducer from "../page/BankLetter/slices/bankLetterSlice";

// ===================== LOCATION SLICE ======================
import locationReducer from "../features/Auth/slices/locationSlice";

// ===================== REMITTANCE SLICES =====================
import remittanceReducer from "../page/Remittance/slices/remittanceSlice";
import remittanceStaticDataReducer from "../page/Remittance/slices/staticDataSlice";

// ===================== TRANSFORMS FOR NON-SERIALIZABLE DATA =====================

/**
 * Transform to handle File objects and Dates in remittance state
 */
const remittanceTransform = createTransform(
  // Transform state before persisting (inbound)
  (inboundState, key) => {
    if (!inboundState) return inboundState;

    // Create a deep copy to avoid mutating the original state
    const transformedState = JSON.parse(
      JSON.stringify(inboundState, (key, value) => {
        // Handle File objects
        if (value instanceof File) {
          return {
            __type: "File",
            name: value.name,
            type: value.type,
            size: value.size,
            lastModified: value.lastModified,
          };
        }
        // Handle Date objects
        if (value instanceof Date) {
          return {
            __type: "Date",
            value: value.toISOString(),
          };
        }
        return value;
      }),
    );

    return transformedState;
  },
  // Transform state after rehydrating (outbound)
  (outboundState, key) => {
    if (!outboundState) return outboundState;

    // Reconstruct Date objects
    const reconstructDates = (obj) => {
      if (!obj || typeof obj !== "object") return obj;

      Object.keys(obj).forEach((key) => {
        const value = obj[key];

        if (value && typeof value === "object") {
          if (value.__type === "Date") {
            obj[key] = new Date(value.value);
          } else if (value.__type === "File") {
            // Keep file metadata, actual File object can't be reconstructed
            obj[key] = {
              ...value,
              isRestored: true,
              restoredFromStorage: true,
            };
          } else {
            reconstructDates(value);
          }
        }
      });
      return obj;
    };

    return reconstructDates(outboundState);
  },
  { whitelist: ["remittance"] },
);

/**
 * Transform for exchange rate cache to handle expiration dates
 */
const cacheTransform = createTransform(
  (inboundState, key) => {
    if (inboundState?.exchangeRateCache) {
      const transformedCache = {};
      Object.entries(inboundState.exchangeRateCache).forEach(
        ([cacheKey, cacheValue]) => {
          transformedCache[cacheKey] = {
            ...cacheValue,
            expiresAt:
              cacheValue.expiresAt instanceof Date
                ? cacheValue.expiresAt.toISOString()
                : cacheValue.expiresAt,
          };
        },
      );
      return { ...inboundState, exchangeRateCache: transformedCache };
    }
    return inboundState;
  },
  (outboundState, key) => {
    if (outboundState?.exchangeRateCache) {
      const reconstructedCache = {};
      Object.entries(outboundState.exchangeRateCache).forEach(
        ([cacheKey, cacheValue]) => {
          reconstructedCache[cacheKey] = {
            ...cacheValue,
            expiresAt: cacheValue.expiresAt
              ? new Date(cacheValue.expiresAt)
              : null,
          };
        },
      );
      return { ...outboundState, exchangeRateCache: reconstructedCache };
    }
    return outboundState;
  },
);

// ===================== PERSIST CONFIGURATIONS =====================

/**
 * Remittance slice specific persistence config
 */
const remittancePersistConfig = {
  key: "remittance",
  storage,
  whitelist: [
    "formData",
    "bankAccounts",
    "transactionResult",
    "customerType",
    "manualAccountDetails",
    "exchangeRateCache",
    "promoCodeValidation",
    "currencies",
    "purposes",
    "incomeSources",
    "occupations",
    "paymentMethods",
  ],
  blacklist: ["loading", "error", "verification"],
  transforms: [remittanceTransform, cacheTransform],
  version: 1,
  debug: process.env.NODE_ENV !== "production",
};

/**
 * Beneficiaries slice persistence config
 */
const beneficiariesPersistConfig = {
  key: "beneficiaries",
  storage,
  whitelist: [
    "beneficiaries",
    "selectedBeneficiary",
    "selectedBank",
    "beneficiaryBanks",
  ],
  version: 1,
};

/**
 * Currency slice persistence config
 */
const currencyPersistConfig = {
  key: "currency",
  storage,
  whitelist: [
    "currencies",
    "paymentMethods",
    "selectedCurrency",
    "usdBankAccounts",
    "aedAccountDetails",
  ],
  version: 1,
};

/**
 * Account slice persistence config
 */
const accountPersistConfig = {
  key: "account",
  storage,
  whitelist: ["accounts", "transactions", "balances"],
  version: 1,
};

/**
 * Transaction slice persistence config
 */
const transactionPersistConfig = {
  key: "transaction",
  storage,
  whitelist: ["recentTransactions", "transactionHistory"],
  version: 1,
};

// ===================== CREATE PERSISTED REDUCERS =====================

// Combine all reducers first
const appReducer = combineReducers({
  // Auth and related slices (not persisted - manually managed)
  auth: authReducer,
  kyc: kycReducer,
  countries: countryReducer,
  transfer: transferReducer,
  partner: partnerReducer,
  hostname: hostnameReducer,
  ui: uiReducer,
  download: downloadReducer,
  forgotPassword: forgotPasswordReducer,
  signup: signupReducer,
  institutionRegistration: institutionRegistrationReducer,
  currencyAccounts: currencyAccountsReducer,

  // Dashboard and components
  header: headerReducer,
  home: homeReducer,
  navigateSection: navigationSectionReducer,
  plaid: plaidReducer,
  account: persistReducer(accountPersistConfig, accountReducer),
  transaction: persistReducer(transactionPersistConfig, transactionReducer),

  // Deposit (partially persisted)
  deposit: depositReducer,
  currency: persistReducer(currencyPersistConfig, currencyReducer),
  bankAccounts: bankAccountReducer,
  uiDeposit: uiDepositReducer,
  bankLink: bankLinkReducer,

  // Card payment
  cardPayment: cardPaymentReducer,

  // Team
  team: teamReducer,
  teamMember: teamMemberReducer,

  // Convert
  conversion: conversionReducer,

  // Beneficiaries (persisted)
  beneficiaries: persistReducer(
    beneficiariesPersistConfig,
    beneficiariesReducer,
  ),
  addBeneficiary: addBeneficiaryReducer,
  modal: modalReducer,
  beneficiariesHeader: beneficiariesHeaderReducer,
  beneficiaryNavigation: beneficiaryNavigationReducer,
  beneficiaryHomepage: beneficiariesHomepageReducer,
  beneficiaryTransaction: beneficiaryTransactionReducer,
  beneficiarySenders: beneficiarySendersReducer,

  // Payout
  payout: payoutReducer,

  // Bank letter
  bankLetter: bankLetterReducer,

  // Location
  location: locationReducer,

  // Remittance reducers (persisted)
  remittance: persistReducer(remittancePersistConfig, remittanceReducer),
  remittanceStatic: remittanceStaticDataReducer,
});

// Root reducer with reset capability
const rootReducer = (state, action) => {
  // Clear all persisted state on logout
  if (
    action.type === "auth/logout/fulfilled" ||
    action.type === "auth/logout" ||
    action.type === "USER_LOGOUT"
  ) {
    // Remove persisted state from storage
    if (typeof window !== "undefined") {
      // Clear all persist storage
      const persistKeys = [
        "persist:remittance",
        "persist:beneficiaries",
        "persist:currency",
        "persist:account",
        "persist:transaction",
        "persist:root",
      ];

      persistKeys.forEach((key) => localStorage.removeItem(key));

      // Clear session storage
      sessionStorage.clear();

      // Clear auth items
      const authKeys = [
        "authtoken",
        "authcustomer_id",
        "bearertoken",
        "bearertoken_timestamp",
        "refreshtoken",
        "kyc_status",
        "bank_approve_status",
        "is_owner_login",
        "ownerDetails",
        "plaidStatus",
        "is_staff_login",
        "staff_id",
        "staff_role",
        "whitelabelled_customer",
        "whitelabelled_customer_partnerid",
        "whitelabelled_customer_partnername",
        "hasSilaBankAccount",
        "customerUuid",
        "isRemittanceOnlyCustomer",
      ];

      authKeys.forEach((key) => localStorage.removeItem(key));
    }

    // Reset state to undefined (which will use initial state)
    return appReducer(undefined, action);
  }

  return appReducer(state, action);
};

// ===================== CUSTOM SERIALIZABLE CHECK =====================
const customSerializableCheck = {
  ignoredActions: [
    // Persist actions
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,

    // ... rest of your ignored actions
  ],
  ignoredPaths: [
    // ... your ignored paths
  ],
};

// ===================== STORE CONFIGURATION =====================
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: customSerializableCheck,
      immutableCheck: { warnAfter: 100 },
    }),
  devTools: process.env.NODE_ENV !== "production",
});

// Create persistor (but we won't use PersistGate in the app)
export const persistor = persistStore(store);

// ===================== STORE UTILITIES =====================
export const storeHealthCheck = () => {
  const state = store.getState();

  return {
    healthy: true,
    timestamp: new Date().toISOString(),
    reducers: Object.keys(state),
    auth: {
      isAuthenticated: state.auth?.isAuthenticated || false,
      isInitialized: state.auth?.isInitialized || false,
    },
    remittance: {
      step: state.remittance?.step || 1,
      hasFormData: Object.keys(state.remittance?.formData || {}).length > 0,
    },
  };
};

export const resetStore = () => {
  store.dispatch({ type: "auth/logout" });
};

// Export store utilities
export const getStoreState = () => store.getState();
export const getAuthState = () => store.getState().auth;
export const getAuthToken = () => store.getState().auth?.token || null;
export const getCustomerId = () => store.getState().auth?.customerId || null;
export const isAuthenticated = () =>
  store.getState().auth?.isAuthenticated || false;

export default store;
