// src/store/store.js - FIXED VERSION
import { configureStore } from '@reduxjs/toolkit';

// ===================== AUTH AND RELATED SLICES =====================
import authReducer from '../features/Auth/slices/authSlice';
import kycReducer from '../features/Auth/slices/kycSlice';
import countryReducer from '../features/Auth/slices/countrySlice';
import partnerReducer from '../features/Auth/slices/partnerSlice';
import hostnameReducer from '../features/Auth/slices/hostnameSlice';
import uiReducer from '../features/Auth/slices/uiSlice';
import downloadReducer from '../features/Auth/slices/downloadSlice';
import forgotPasswordReducer from '../features/Auth/slices/forgotPasswordSlice';
import signupReducer from '../features/Auth/slices/signupSlice';
import institutionRegistrationReducer from '../features/Auth/slices/institutionRegistrationSlice';

// ===================== DASHBOARD AND COMPONENTS =====================
import headerReducer from '../components/Dashboard/Header/headerSlice';
import homeReducer from '../page/Home/HomeSlice';
import navigationSectionReducer from '../components/Dashboard/Navigation/NavigateSectionSlice';
import plaidReducer from '../components/ZapPlaidLink/plaidSlice';
import accountReducer from '../components/Dashboard/Account/AccountSummary/AccountSlice';
import transactionReducer from '../components/Dashboard/Account/Transaction/TransactionSlice';

// ===================== BENEFICIARIES =====================
import beneficiariesReducer from "../page/Beneficiary/MyBeneficiaries/BeneficiariesSlice";
import addBeneficiaryReducer from "../page/Beneficiary/AddBeneficiary/addBeneficiarySlice";
import modalReducer from "../page/Beneficiary/MyBeneficiaries/ModalSlice";

// ===================== CUSTOM SERIALIZABLE CHECK =====================
const customSerializableCheck = {
  ignoredActions: [
    'auth/setPlaidStatus',
    'kyc/initiatePlaidFlow/fulfilled',
    'ui/openModal',
    'persist/PERSIST',
    'institutionRegistration/setFile',
    'institutionRegistration/uploadFile/fulfilled',
    'institutionRegistration/uploadFile/rejected',
    'countries/fetchCountries/fulfilled',
    'signup/fetchTermsAndConditions/fulfilled',
    'signup/fetchTermsAndConditions/rejected',
    'signup/setTermsAccepted',
    'beneficiaries/fetchBeneficiaries/fulfilled',
    'beneficiaries/deleteBeneficiary/fulfilled',
    'beneficiaries/toggleBeneficiaryVisibility/fulfilled',
    'modal/showDeleteModal',
    'modal/hideDeleteModal',
    // Add auth thunk actions to ignore
    'auth/initializeApp/pending',
    'auth/initializeApp/fulfilled',
    'auth/initializeApp/rejected',
    'auth/generatePasscode/pending',
    'auth/generatePasscode/fulfilled',
    'auth/generatePasscode/rejected',
    'auth/verifyPasscode/pending',
    'auth/verifyPasscode/fulfilled',
    'auth/verifyPasscode/rejected',
    'auth/generateOTP/pending',
    'auth/generateOTP/fulfilled',
    'auth/generateOTP/rejected',
    'auth/verifyOTP/pending',
    'auth/verifyOTP/fulfilled',
    'auth/verifyOTP/rejected',
    'auth/initiatePlaid/pending',
    'auth/initiatePlaid/fulfilled',
    'auth/initiatePlaid/rejected',
    'auth/processPlaidKycCallback/pending',
    'auth/processPlaidKycCallback/fulfilled',
    'auth/processPlaidKycCallback/rejected',
    'auth/login/pending',
    'auth/login/fulfilled',
    'auth/login/rejected',
    'auth/logout/pending',
    'auth/logout/fulfilled',
    'auth/logout/rejected',
  ],
  ignoredPaths: [
    'kyc.plaid',
    'auth.plaidStatus',
    'ui.modal.modalProps.customComponent',
    'institutionRegistration.formData.user_image',
    'institutionRegistration.formData.owner_details',
    'countries.countries',
    'signup.metadata.termsConditions',
    'signup.formData.terms_and_conditions',
    'signup.metadata.termsError',
    'signup.metadata.nationalities',
    'signup.metadata.genders',
    'account',
    'transaction',
    'beneficiaries.beneficiaries',
    'modal.deleteModal',
    // Add paths that might contain non-serializable data
    'auth.error',
    'auth.user',
    'auth.ownerDetails',
    'auth.staffInfo',
    'auth.whiteLabelInfo',
    'auth.modalData',
    'plaid',
    'header',
    'home',
    'navigateSection',
  ],
};

// ===================== STORE CONFIGURATION =====================
export const store = configureStore({
  reducer: {
    // Auth and core functionality
    auth: authReducer,
    kyc: kycReducer,
    countries: countryReducer,
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
    
    // Beneficiaries
    beneficiaries: beneficiariesReducer,
    addBeneficiary: addBeneficiaryReducer,
    modal: modalReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: customSerializableCheck,
      immutableCheck: {
        warnAfter: 100, // Increase warning threshold for large state
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
  // REMOVED problematic enhancers array - let Redux Toolkit handle this
});

// ===================== STORE INITIALIZATION =====================
// Initialize auth state from localStorage without causing circular dependencies
const initializeAuthState = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authtoken');
    const customerId = localStorage.getItem('authcustomer_id');
    
    // Only initialize if we have valid tokens
    if (token && customerId) {
      // Use a simple dispatch without importing thunks to avoid circular dependencies
      store.dispatch({
        type: 'auth/setAuthState',
        payload: {
          token,
          customerId,
          isAuthenticated: true,
          isInitialized: true,
        },
      });
      
      console.log('✅ Auth state initialized from localStorage');
    } else {
      // Mark as initialized even if no auth data exists
      store.dispatch({
        type: 'auth/setInitialized',
        payload: true,
      });
      
      console.log('🔄 Auth initialized - no existing session');
    }
    
    // Sync any other localStorage states that might be needed
    syncAdditionalStorageStates();
  }
};

// Sync additional localStorage states to Redux
const syncAdditionalStorageStates = () => {
  const statesToSync = [
    { key: 'kyc_status', action: 'auth/setVerificationStatus', transform: (value) => ({ kycStatus: value }) },
    { key: 'bank_approve_status', action: 'auth/setVerificationStatus', transform: (value) => ({ bankStatus: value }) },
    { key: 'is_owner_login', action: 'auth/setVerificationStatus', transform: (value) => ({ isOwnerLogin: value === "1" }) },
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
  console.group('🏥 Store Health Check');
  console.log('Store State Structure:', Object.keys(state));
  console.log('Auth State:', {
    isAuthenticated: state.auth.isAuthenticated,
    isInitialized: state.auth.isInitialized,
    hasToken: !!state.auth.token,
    hasCustomerId: !!state.auth.customerId,
  });
  console.log('Store Configuration:', {
    devTools: process.env.NODE_ENV !== 'production',
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
    }
  };
};

// Reset store to initial state (useful for testing and error recovery)
export const resetStore = () => {
  if (typeof window !== 'undefined') {
    // Clear all localStorage items related to auth
    const authKeys = [
      'authtoken',
      'authcustomer_id',
      'bearertoken',
      'bearertoken_timestamp',
      'refreshtoken',
      'kyc_status',
      'bank_approve_status',
      'is_owner_login',
      'ownerDetails',
      'plaidStatus',
      'is_staff_login',
      'staff_id',
      'staff_role',
      'whitelabelled_customer',
      'whitelabelled_customer_partnerid',
      'whitelabelled_customer_partnername',
      'hasSilaBankAccount',
      'customerUuid',
    ];
    
    authKeys.forEach(key => localStorage.removeItem(key));
    
    console.log('🔄 Store reset - all auth data cleared');
  }
  
  // Note: In a real app, you might want to reload the page or dispatch reset actions
  // This is a lightweight reset that preserves the store structure
};

// ===================== STORE SUBSCRIPTIONS =====================
// Subscribe to store changes for debugging and persistence
if (process.env.NODE_ENV !== 'production') {
  store.subscribe(() => {
    const state = store.getState();
    
    // Log auth state changes for debugging
    if (state.auth.isAuthenticated) {
      console.debug('🔐 Auth State Updated:', {
        isAuthenticated: state.auth.isAuthenticated,
        customerId: state.auth.customerId,
        kycStatus: state.auth.kycStatus,
        bankStatus: state.auth.bankApproveStatus,
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
      if (state.auth.token !== localStorage.getItem('authtoken')) {
        localStorage.setItem('authtoken', state.auth.token);
      }
      if (state.auth.customerId !== localStorage.getItem('authcustomer_id')) {
        localStorage.setItem('authcustomer_id', state.auth.customerId);
      }
      
      // Persist verification status
      if (state.auth.kycStatus) {
        localStorage.setItem('kyc_status', state.auth.kycStatus);
      }
      if (state.auth.bankApproveStatus) {
        localStorage.setItem('bank_approve_status', state.auth.bankApproveStatus);
      }
      
      // Persist owner login status
      if (state.auth.isOwnerLogin) {
        localStorage.setItem('is_owner_login', '1');
      }
      
    } catch (error) {
      console.error('❌ Failed to persist state to localStorage:', error);
    }
  }
};

// ===================== STORE INITIALIZATION CALL =====================
// Initialize the store when this module is loaded
if (typeof window !== 'undefined') {
  // Use setTimeout to ensure this runs after the store is fully configured
  setTimeout(() => {
    initializeAuthState();
    
    // Run health check in development
    if (process.env.NODE_ENV !== 'production') {
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

// Export store instance as default
export default store;