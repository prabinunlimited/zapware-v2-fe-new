// src/store/store.js - UPDATED VERSION WITH CARD PAYMENT
import { configureStore, combineReducers } from "@reduxjs/toolkit";

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

// ===================== DEPOSIT SLICES =====================
import depositReducer from "../page/Deposit/slices/depositSlice";
import currencyReducer from "../page/Deposit/slices/currencySlice";
import bankAccountReducer from "../page/Deposit/slices/bankAccountSlice";
import uiDepositReducer from "../page/Deposit/slices/uiSlice";
import bankLinkReducer from "../page/Deposit/slices/bankLinkSlice";

// ===================== CARD PAYMENT SLICES =====================
import cardPaymentReducer from "../page/Deposit/slices/cardPaymentSlice";


// ===================== TEAM SLICES =====================
import teamReducer from "../page/Team/Slice/teamSlice";
import teamMemberReducer from "../page/Team/Slice/teamMemberSlice";

// ===================== TEAM SLICES =====================
import payoutReducer from "../page/Payout/slices/payoutSlice";

//====================== Bank Letter =====================
import bankLetterReducer from "../page/BankLetter/slices/bankLetterSlice";

// ===================== CUSTOM SERIALIZABLE CHECK =====================
const customSerializableCheck = {
  ignoredActions: [
    "auth/setPlaidStatus",
    "kyc/initiatePlaidFlow/fulfilled",
    "ui/openModal",
    "persist/PERSIST",
    "institutionRegistration/setFile",
    "institutionRegistration/uploadFile/fulfilled",
    "institutionRegistration/uploadFile/rejected",
    "countries/fetchCountries/fulfilled",
    "signup/fetchTermsAndConditions/fulfilled",
    "signup/fetchTermsAndConditions/rejected",
    "signup/setTermsAccepted",
    "beneficiaries/fetchBeneficiaries/fulfilled",
    "beneficiaries/deleteBeneficiary/fulfilled",
    "beneficiaries/toggleBeneficiaryVisibility/fulfilled",
    "modal/showDeleteModal",
    "modal/hideDeleteModal",
    
    // Auth thunk actions to ignore
    "auth/initializeApp/pending",
    "auth/initializeApp/fulfilled",
    "auth/initializeApp/rejected",
    "auth/generatePasscode/pending",
    "auth/generatePasscode/fulfilled",
    "auth/generatePasscode/rejected",
    "auth/verifyPasscode/pending",
    "auth/verifyPasscode/fulfilled",
    "auth/verifyPasscode/rejected",
    "auth/generateOTP/pending",
    "auth/generateOTP/fulfilled",
    "auth/generateOTP/rejected",
    "auth/verifyOTP/pending",
    "auth/verifyOTP/fulfilled",
    "auth/verifyOTP/rejected",
    "auth/initiatePlaid/pending",
    "auth/initiatePlaid/fulfilled",
    "auth/initiatePlaid/rejected",
    "auth/processPlaidKycCallback/pending",
    "auth/processPlaidKycCallback/fulfilled",
    "auth/processPlaidKycCallback/rejected",
    "auth/login/pending",
    "auth/login/fulfilled",
    "auth/login/rejected",
    "auth/logout/pending",
    "auth/logout/fulfilled",
    "auth/logout/rejected",

    // Deposit related actions
    "deposit/submitDeposit/pending",
    "deposit/submitDeposit/fulfilled",
    "deposit/submitDeposit/rejected",
    "deposit/fetchManualAccountDetails/pending",
    "deposit/fetchManualAccountDetails/fulfilled",
    "deposit/fetchManualAccountDetails/rejected",
    
    // Currency slice actions
    "currency/fetchCurrencyOptions/pending",
    "currency/fetchCurrencyOptions/fulfilled",
    "currency/fetchCurrencyOptions/rejected",
    "currency/fetchUSDBankAccounts/pending",
    "currency/fetchUSDBankAccounts/fulfilled",
    "currency/fetchUSDBankAccounts/rejected",
    "currency/fetchAEDAccountDetails/pending",
    "currency/fetchAEDAccountDetails/fulfilled",
    "currency/fetchAEDAccountDetails/rejected",
    "currency/fetchPaymentMethodsByCurrency/pending",
    "currency/fetchPaymentMethodsByCurrency/fulfilled",
    "currency/fetchPaymentMethodsByCurrency/rejected",
    
    "bankAccounts/fetchUSDBankAccounts/pending",
    "bankAccounts/fetchUSDBankAccounts/fulfilled",
    "bankAccounts/fetchUSDBankAccounts/rejected",
    "bankAccounts/fetchAEDAccountDetails/pending",
    "bankAccounts/fetchAEDAccountDetails/fulfilled",
    "bankAccounts/fetchAEDAccountDetails/rejected",

    // ✅ ADDED: Card Payment actions
    "cardPayment/createAdyenSession/pending",
    "cardPayment/createAdyenSession/fulfilled",
    "cardPayment/createAdyenSession/rejected",
    "cardPayment/createAdyenSessionIframe/pending",
    "cardPayment/createAdyenSessionIframe/fulfilled",
    "cardPayment/createAdyenSessionIframe/rejected",
    "cardPayment/processPaymentResult/pending",
    "cardPayment/processPaymentResult/fulfilled",
    "cardPayment/processPaymentResult/rejected",
    "cardPayment/completePayment/pending",
    "cardPayment/completePayment/fulfilled",
    "cardPayment/completePayment/rejected",
    "cardPayment/setCheckout",
    "cardPayment/setPaymentStatus",
    "cardPayment/setCurrentPayment",
    "cardPayment/setShowPaymentForm",
    "payout/setFileValue"
  ],
  ignoredPaths: [
    "kyc.plaid",
    "auth.plaidStatus",
    "ui.modal.modalProps.customComponent",
    "institutionRegistration.formData.user_image",
    "institutionRegistration.formData.owner_details",
    "countries.countries",
    "signup.metadata.termsConditions",
    "signup.formData.terms_and_conditions",
    "signup.metadata.termsError",
    "signup.metadata.nationalities",
    "signup.metadata.genders",
    "account",
    "transaction",
    "beneficiaries.beneficiaries",
    "modal.deleteModal",
    
    // Auth paths that might contain non-serializable data
    "auth.error",
    "auth.user",
    "auth.ownerDetails",
    "auth.staffInfo",
    "auth.whiteLabelInfo",
    "auth.modalData",
    "plaid",
    "header",
    "home",
    "navigateSection",

    // Deposit related paths
    "deposit.transactionSuccess",
    
    // Currency slice paths
    "currency.currencies",
    "currency.paymentMethods",
    "currency.usdBankAccounts", 
    "currency.aedAccountDetails",
    "currency.rawData",
    
    "bankAccounts.usdBankAccounts",
    "bankAccounts.aedAccountDetails",

    // ✅ ADDED: Card Payment paths
    "cardPayment.checkout",
    "cardPayment.currentPayment",
    "cardPayment.session",
    "cardPayment.paymentResult",

    "payout.formValues.invoice_file"
  ],
};

// ===================== STORE CONFIGURATION =====================
export const store = configureStore({
  reducer: {
    // Auth and core functionality
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

    // Dashboard and components
    header: headerReducer,
    home: homeReducer,
    navigateSection: navigationSectionReducer,
    plaid: plaidReducer,
    account: accountReducer,
    transaction: transactionReducer,

    // Deposit slices
    deposit: depositReducer,
    currency: currencyReducer,
    bankAccounts: bankAccountReducer,
    uiDeposit: uiDepositReducer,
    bankLink: bankLinkReducer,

    // ✅ ADDED: Card Payment slice
    cardPayment: cardPaymentReducer,

    // ===================== TEAM SLICE =====================
    team: teamReducer,
    teamMember: teamMemberReducer,

    // Beneficiaries
    beneficiaries: beneficiariesReducer,
    addBeneficiary: addBeneficiaryReducer,
    modal: modalReducer,

    // payout
    payout: payoutReducer,

    //bank letter
    bankLetter: bankLetterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: customSerializableCheck,
      immutableCheck: {
        warnAfter: 100, // Increase warning threshold for large state
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
});

// ===================== STORE INITIALIZATION =====================
// Initialize auth state from localStorage without causing circular dependencies
const initializeAuthState = () => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authtoken");
    const customerId = localStorage.getItem("authcustomer_id");

    // Only initialize if we have valid tokens
    if (token && customerId) {
      // Use a simple dispatch without importing thunks to avoid circular dependencies
      store.dispatch({
        type: "auth/setAuthState",
        payload: {
          token,
          customerId,
          isAuthenticated: true,
          isInitialized: true,
        },
      });

      console.log("✅ Auth state initialized from localStorage");
    } else {
      // Mark as initialized even if no auth data exists
      store.dispatch({
        type: "auth/setInitialized",
        payload: true,
      });

      console.log("🔄 Auth initialized - no existing session");
    }

    // Sync any other localStorage states that might be needed
    syncAdditionalStorageStates();
  }
};

// Sync additional localStorage states to Redux
const syncAdditionalStorageStates = () => {
  const statesToSync = [
    {
      key: "kyc_status",
      action: "auth/setVerificationStatus",
      transform: (value) => ({ kycStatus: value }),
    },
    {
      key: "bank_approve_status",
      action: "auth/setVerificationStatus",
      transform: (value) => ({ bankStatus: value }),
    },
    {
      key: "is_owner_login",
      action: "auth/setVerificationStatus",
      transform: (value) => ({ isOwnerLogin: value === "1" }),
    },
  ];

  statesToSync.forEach(({ key, action, transform }) => {
    const value = localStorage.getItem(key);
    if (value !== null) {
      const payload = transform ? transform(value) : value;
      store.dispatch({
        type: action,
        payload,
      });
    }
  });
};

// ===================== STORE UTILITIES =====================
// Store health check and utilities
export const storeHealthCheck = () => {
  const state = store.getState();
  console.group("🏥 Store Health Check");
  console.log("Store State Structure:", Object.keys(state));
  console.log("Auth State:", {
    isAuthenticated: state.auth.isAuthenticated,
    isInitialized: state.auth.isInitialized,
    hasToken: !!state.auth.token,
    hasCustomerId: !!state.auth.customerId,
  });
  
  // Currency state check
  console.log("Currency State:", {
    currenciesCount: state.currency?.currencies?.length || 0,
    paymentMethodsCount: state.currency?.paymentMethods?.length || 0,
    usdAccountsCount: state.currency?.usdBankAccounts?.length || 0,
    hasAEDDetails: !!state.currency?.aedAccountDetails,
  });

  // ✅ ADDED: Card Payment state check
  console.log("Card Payment State:", {
    hasSession: !!state.cardPayment?.session,
    sessionLoading: state.cardPayment?.sessionLoading || false,
    paymentProcessing: state.cardPayment?.paymentProcessing || false,
    isPaymentCompleted: state.cardPayment?.isPaymentCompleted || false,
    isPaymentFailed: state.cardPayment?.isPaymentFailed || false,
    hasCheckout: !!state.cardPayment?.checkout,
  });
  
  console.log("Store Configuration:", {
    devTools: process.env.NODE_ENV !== "production",
    hasMiddleware: true,
    hasReducers: Object.keys(state).length > 0,
  });
  console.groupEnd();

  return {
    healthy: true,
    reducers: Object.keys(state),
    auth: {
      isAuthenticated: state.auth.isAuthenticated,
      isInitialized: state.auth.isInitialized,
    },
    currency: {
      currenciesCount: state.currency?.currencies?.length || 0,
      paymentMethodsCount: state.currency?.paymentMethods?.length || 0,
    },
    cardPayment: {
      hasSession: !!state.cardPayment?.session,
      isProcessing: state.cardPayment?.sessionLoading || state.cardPayment?.paymentProcessing,
    }
  };
};

// Reset store to initial state (useful for testing and error recovery)
export const resetStore = () => {
  if (typeof window !== "undefined") {
    // Clear all localStorage items related to auth
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
    ];

    authKeys.forEach((key) => localStorage.removeItem(key));

    console.log("🔄 Store reset - all auth data cleared");
  }

  // Note: In a real app, you might want to reload the page or dispatch reset actions
  // This is a lightweight reset that preserves the store structure
};

// ===================== STORE SUBSCRIPTIONS =====================
// Subscribe to store changes for debugging and persistence
if (process.env.NODE_ENV !== "production") {
  store.subscribe(() => {
    const state = store.getState();

    // Log auth state changes for debugging
    if (state.auth.isAuthenticated) {
      console.debug("🔐 Auth State Updated:", {
        isAuthenticated: state.auth.isAuthenticated,
        customerId: state.auth.customerId,
        kycStatus: state.auth.kycStatus,
        bankStatus: state.auth.bankApproveStatus,
      });
    }

    // Log currency state changes
    if (state.currency.selectedCurrency) {
      console.debug("💰 Currency State Updated:", {
        selectedCurrency: state.currency.selectedCurrency,
        currenciesCount: state.currency.currencies?.length,
        paymentMethodsCount: state.currency.paymentMethods?.length,
      });
    }

    // ✅ ADDED: Log card payment state changes
    if (state.cardPayment.session || state.cardPayment.paymentProcessing) {
      console.debug("💳 Card Payment State Updated:", {
        hasSession: !!state.cardPayment.session,
        sessionLoading: state.cardPayment.sessionLoading,
        paymentProcessing: state.cardPayment.paymentProcessing,
        isPaymentCompleted: state.cardPayment.isPaymentCompleted,
        isPaymentFailed: state.cardPayment.isPaymentFailed,
      });
    }

    // Auto-persist certain states to localStorage
    persistCriticalStates(state);
  });
}

// Persist critical states to localStorage
const persistCriticalStates = (state) => {
  // Only persist if we have a valid auth state
  if (state.auth.isAuthenticated && state.auth.token && state.auth.customerId) {
    try {
      // Persist auth token and customer ID
      if (state.auth.token !== localStorage.getItem("authtoken")) {
        localStorage.setItem("authtoken", state.auth.token);
      }
      if (state.auth.customerId !== localStorage.getItem("authcustomer_id")) {
        localStorage.setItem("authcustomer_id", state.auth.customerId);
      }

      // Persist verification status
      if (state.auth.kycStatus) {
        localStorage.setItem("kyc_status", state.auth.kycStatus);
      }
      if (state.auth.bankApproveStatus) {
        localStorage.setItem(
          "bank_approve_status",
          state.auth.bankApproveStatus
        );
      }

      // Persist owner login status
      if (state.auth.isOwnerLogin) {
        localStorage.setItem("is_owner_login", "1");
      }
    } catch (error) {
      console.error("❌ Failed to persist state to localStorage:", error);
    }
  }
};

// ===================== STORE INITIALIZATION CALL =====================
// Initialize the store when this module is loaded
if (typeof window !== "undefined") {
  // Use setTimeout to ensure this runs after the store is fully configured
  setTimeout(() => {
    initializeAuthState();

    // Run health check in development
    if (process.env.NODE_ENV !== "production") {
      storeHealthCheck();
    }
  }, 0);
}

// ===================== EXPORT STORE UTILITIES =====================
export const getStoreState = () => store.getState();
export const getAuthState = () => store.getState().auth;
export const getAuthToken = () => store.getState().auth.token;
export const getCustomerId = () => store.getState().auth.customerId;
export const isAuthenticated = () => store.getState().auth.isAuthenticated;

// Currency state utilities
export const getCurrencyState = () => store.getState().currency;
export const getSelectedCurrency = () => store.getState().currency.selectedCurrency;
export const getPaymentMethods = () => store.getState().currency.paymentMethods;

// ✅ ADDED: Card Payment state utilities
export const getCardPaymentState = () => store.getState().cardPayment;
export const getCardPaymentSession = () => store.getState().cardPayment.session;
export const isCardPaymentProcessing = () => 
  store.getState().cardPayment.sessionLoading || store.getState().cardPayment.paymentProcessing;
export const isPaymentCompleted = () => store.getState().cardPayment.isPaymentCompleted;
export const isPaymentFailed = () => store.getState().cardPayment.isPaymentFailed;

// Export store instance as default
export default store;