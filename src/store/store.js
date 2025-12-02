// src/store/store.js - UPDATED VERSION WITH REMITTANCE
import { configureStore, combineReducers } from "@reduxjs/toolkit";

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

// ===================== PAYOUT SLICES =====================
import payoutReducer from "../page/Payout/slices/payoutSlice";

// ===================== REMITTANCE SLICES =====================
import remittanceFormReducer from "../page/Remittance/slices/remittanceFormSlice";
import remittanceCurrenciesReducer from "../page/Remittance/slices/remittanceCurrenciesSlice";
import remittancePaymentReducer from "../page/Remittance/slices/remittancePaymentSlice";
import remittanceTransactionsReducer from "../page/Remittance/slices/remittanceTransactionsSlice";
import remittancePartnersReducer from "../page/Remittance/slices/remittancePartnersSlice";

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

    // Card Payment actions
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
    "payout/setFileValue",

    // ===================== REMITTANCE THUNK ACTIONS =====================
    "remittance/fetchInitialData/pending",
    "remittance/fetchInitialData/fulfilled",
    "remittance/fetchInitialData/rejected",
    "remittance/fetchPayoutCurrencies/pending",
    "remittance/fetchPayoutCurrencies/fulfilled",
    "remittance/fetchPayoutCurrencies/rejected",
    "remittance/fetchBankAccountDetails/pending",
    "remittance/fetchBankAccountDetails/fulfilled",
    "remittance/fetchBankAccountDetails/rejected",
    "remittance/fetchOriginatingPartner/pending",
    "remittance/fetchOriginatingPartner/fulfilled",
    "remittance/fetchOriginatingPartner/rejected",
    "remittance/fetchPayoutPartnerByCurrency/pending",
    "remittance/fetchPayoutPartnerByCurrency/fulfilled",
    "remittance/fetchPayoutPartnerByCurrency/rejected",
    "remittance/fetchExchangeRate/pending",
    "remittance/fetchExchangeRate/fulfilled",
    "remittance/fetchExchangeRate/rejected",
    "remittance/fetchManualAccountDetails/pending",
    "remittance/fetchManualAccountDetails/fulfilled",
    "remittance/fetchManualAccountDetails/rejected",
    "remittance/fetchBeneficiaries/pending",
    "remittance/fetchBeneficiaries/fulfilled",
    "remittance/fetchBeneficiaries/rejected",
    "remittance/fetchBeneficiaryByCode/pending",
    "remittance/fetchBeneficiaryByCode/fulfilled",
    "remittance/fetchBeneficiaryByCode/rejected",
    "remittance/fetchBeneficiaryBanks/pending",
    "remittance/fetchBeneficiaryBanks/fulfilled",
    "remittance/fetchBeneficiaryBanks/rejected",
    "remittance/fetchIncomeSources/pending",
    "remittance/fetchIncomeSources/fulfilled",
    "remittance/fetchIncomeSources/rejected",
    "remittance/fetchOccupations/pending",
    "remittance/fetchOccupations/fulfilled",
    "remittance/fetchOccupations/rejected",
    "remittance/fetchTransferPurposes/pending",
    "remittance/fetchTransferPurposes/fulfilled",
    "remittance/fetchTransferPurposes/rejected",
    "remittance/submitManualDepositTransaction/pending",
    "remittance/submitManualDepositTransaction/fulfilled",
    "remittance/submitManualDepositTransaction/rejected",
    "remittance/submitBankTransferTransaction/pending",
    "remittance/submitBankTransferTransaction/fulfilled",
    "remittance/submitBankTransferTransaction/rejected",
    "remittance/submitCardDepositTransaction/pending",
    "remittance/submitCardDepositTransaction/fulfilled",
    "remittance/submitCardDepositTransaction/rejected",
    "remittance/confirmTransaction/pending",
    "remittance/confirmTransaction/fulfilled",
    "remittance/confirmTransaction/rejected",
    "remittance/sendPasscode/pending",
    "remittance/sendPasscode/fulfilled",
    "remittance/sendPasscode/rejected",
    "remittance/verifyPasscode/pending",
    "remittance/verifyPasscode/fulfilled",
    "remittance/verifyPasscode/rejected",
    "remittance/validatePromocode/pending",
    "remittance/validatePromocode/fulfilled",
    "remittance/validatePromocode/rejected",
    "remittance/generateReceipt/pending",
    "remittance/generateReceipt/fulfilled",
    "remittance/generateReceipt/rejected",
    "remittance/calculateAmounts/pending",
    "remittance/calculateAmounts/fulfilled",
    "remittance/calculateAmounts/rejected",
    "remittance/clearRemittanceCache/pending",
    "remittance/clearRemittanceCache/fulfilled",
    "remittance/clearRemittanceCache/rejected",

    // Remittance slice actions that might contain non-serializable data
    "remittanceForm/setPopupContent",
    "remittanceForm/setPaymentInitiationData",
    "remittancePayment/setManualDepositFormData",
    "remittancePayment/setBankTransferFormData",
    "remittancePayment/setCardTransferFormData",
    "remittancePayment/setBeneficiaryCodeData",
    "remittancePayment/setManualDepositFile",
    "remittanceTransactions/setTransactionDetails",
    "remittanceTransactions/setReceiptData",
    "remittanceTransactions/addRecentTransaction",
    "remittancePartners/setOriginatingPartnerData",
    "remittancePartners/setPayoutPartnerData",
    "remittancePartners/setPartnerByCurrency",
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

    // Card Payment paths
    "cardPayment.checkout",
    "cardPayment.currentPayment",
    "cardPayment.session",
    "cardPayment.paymentResult",

    "payout.formValues.invoice_file",

    // ===================== REMITTANCE PATHS =====================
    // Remittance Form paths
    "remittanceForm.exchangeRateCache",
    "remittanceForm.popupContent.details",
    "remittanceForm.paymentInitiationData",
    "remittanceForm.selectedBeneficiary",

    // Remittance Currencies paths
    "remittanceCurrencies.sendCurrency",
    "remittanceCurrencies.receiveCurrency",
    "remittanceCurrencies.payoutCurrenciesData",
    "remittanceCurrencies.bankAccountDetails",
    "remittanceCurrencies.manualAccountDetails",
    "remittanceCurrencies.aedAccountDetails",
    "remittanceCurrencies.bankDetails",

    // Remittance Payment paths
    "remittancePayment.paymentMethod",
    "remittancePayment.paymentMethodRef",
    "remittancePayment.manualDepositFormData",
    "remittancePayment.bankTransferFormData",
    "remittancePayment.cardTransferFormData",
    "remittancePayment.beneficiaryCodeData",
    "remittancePayment.fileUpload.manualDeposit",
    "remittancePayment.fileUpload.preview",

    // Remittance Transactions paths
    "remittanceTransactions.transactionDetails",
    "remittanceTransactions.receiptData",
    "remittanceTransactions.apiResponses",
    "remittanceTransactions.recentTransactions",
    "remittanceTransactions.receiptGeneration.downloadUrl",

    // Remittance Partners paths
    "remittancePartners.originatingPartner.data",
    "remittancePartners.originatingPartner.logo",
    "remittancePartners.payoutPartner.data",
    "remittancePartners.payoutPartner.logo",
    "remittancePartners.defaultLogos",
    "remittancePartners.partnersByCurrency",
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
    currencyAccounts: currencyAccountsReducer,

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

    // Card Payment slice
    cardPayment: cardPaymentReducer,

    // Team slice
    team: teamReducer,
    teamMember: teamMemberReducer,

    // Beneficiaries
    beneficiaries: beneficiariesReducer,
    addBeneficiary: addBeneficiaryReducer,
    modal: modalReducer,

    // Remittance slices
    remittanceForm: remittanceFormReducer,
    remittanceCurrencies: remittanceCurrenciesReducer,
    remittancePayment: remittancePaymentReducer,
    remittanceTransactions: remittanceTransactionsReducer,
    remittancePartners: remittancePartnersReducer,

    // payout
    payout: payoutReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: customSerializableCheck,
      immutableCheck: {
        warnAfter: 100,
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
});

// ===================== STORE INITIALIZATION =====================
const initializeAuthState = () => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authtoken");
    const customerId = localStorage.getItem("authcustomer_id");

    if (token && customerId) {
      // ✅ FIXED: Use action creator instead of string type
      store.dispatch(
        setAuthState({
          token,
          customerId,
          isAuthenticated: true,
          isInitialized: true,
        })
      );
    } else {
      // ✅ FIXED: Use action creator instead of string type
      store.dispatch(setInitialized(true));
    }

    syncAdditionalStorageStates();
  }
};

const syncAdditionalStorageStates = () => {
  const statesToSync = [
    {
      key: "kyc_status",
      action: setVerificationStatus, // ✅ FIXED: Use action creator
      transform: (value) => ({ kycStatus: value }),
    },
    {
      key: "bank_approve_status",
      action: setVerificationStatus, // ✅ FIXED: Use action creator
      transform: (value) => ({ bankStatus: value }),
    },
    {
      key: "is_owner_login",
      action: setVerificationStatus, // ✅ FIXED: Use action creator
      transform: (value) => ({ isOwnerLogin: value === "1" }),
    },
  ];

  statesToSync.forEach(({ key, action, transform }) => {
    const value = localStorage.getItem(key);
    if (value !== null) {
      const payload = transform ? transform(value) : value;
      // ✅ FIXED: Use action creator instead of string type
      store.dispatch(action(payload));
    }
  });
};

// ===================== STORE UTILITIES =====================
export const storeHealthCheck = () => {
  const state = store.getState();

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
      isProcessing:
        state.cardPayment?.sessionLoading ||
        state.cardPayment?.paymentProcessing,
    },
    // Remittance health check
    remittance: {
      formInitialized: state.remittanceForm ? true : false,
      currenciesLoaded: state.remittanceCurrencies?.payoutCurrenciesData?.length > 0,
      paymentMethods: state.remittancePayment ? true : false,
      transactionsReady: state.remittanceTransactions ? true : false,
      partnersLoaded: state.remittancePartners ? true : false,
    },
  };
};

export const resetStore = () => {
  if (typeof window !== "undefined") {
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
  }
};

// ===================== STORE SUBSCRIPTIONS =====================
if (process.env.NODE_ENV !== "production") {
  store.subscribe(() => {
    const state = store.getState();
    persistCriticalStates(state);
  });
}

const persistCriticalStates = (state) => {
  if (state.auth.isAuthenticated && state.auth.token && state.auth.customerId) {
    try {
      if (state.auth.token !== localStorage.getItem("authtoken")) {
        localStorage.setItem("authtoken", state.auth.token);
      }
      if (state.auth.customerId !== localStorage.getItem("authcustomer_id")) {
        localStorage.setItem("authcustomer_id", state.auth.customerId);
      }

      if (state.auth.kycStatus) {
        localStorage.setItem("kyc_status", state.auth.kycStatus);
      }
      if (state.auth.bankApproveStatus) {
        localStorage.setItem(
          "bank_approve_status",
          state.auth.bankApproveStatus
        );
      }

      if (state.auth.isOwnerLogin) {
        localStorage.setItem("is_owner_login", "1");
      }
    } catch (error) {
      // Error handling without console log
    }
  }
};

// ===================== STORE INITIALIZATION CALL =====================
if (typeof window !== "undefined") {
  setTimeout(() => {
    initializeAuthState();

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

export const getCurrencyState = () => store.getState().currency;
export const getSelectedCurrency = () =>
  store.getState().currency.selectedCurrency;
export const getPaymentMethods = () => store.getState().currency.paymentMethods;

export const getCardPaymentState = () => store.getState().cardPayment;
export const getCardPaymentSession = () => store.getState().cardPayment.session;
export const isCardPaymentProcessing = () =>
  store.getState().cardPayment.sessionLoading ||
  store.getState().cardPayment.paymentProcessing;
export const isPaymentCompleted = () =>
  store.getState().cardPayment.isPaymentCompleted;
export const isPaymentFailed = () =>
  store.getState().cardPayment.isPaymentFailed;

// ===================== REMITTANCE UTILITIES =====================
export const getRemittanceState = () => ({
  form: store.getState().remittanceForm,
  currencies: store.getState().remittanceCurrencies,
  payment: store.getState().remittancePayment,
  transactions: store.getState().remittanceTransactions,
  partners: store.getState().remittancePartners,
});

export const getRemittanceForm = () => store.getState().remittanceForm;
export const getRemittanceCurrencies = () =>
  store.getState().remittanceCurrencies;
export const getRemittancePayment = () => store.getState().remittancePayment;
export const getRemittanceTransactions = () =>
  store.getState().remittanceTransactions;
export const getRemittancePartners = () => store.getState().remittancePartners;

// Check if remittance is ready
export const isRemittanceReady = () => {
  const state = store.getState();
  return (
    state.remittanceForm?.isInitialized !== false &&
    state.remittanceCurrencies?.payoutCurrenciesData?.length > 0 &&
    state.auth.isAuthenticated
  );
};

// Get remittance exchange rate
export const getRemittanceExchangeRate = () => {
  const state = store.getState();
  return {
    rate: state.remittanceCurrencies?.exchangeRateData?.rate || 0,
    loading: state.remittanceCurrencies?.exchangeRateData?.loading || false,
    error: state.remittanceCurrencies?.exchangeRateData?.error || null,
  };
};

// Get current remittance step
export const getRemittanceStep = () => {
  return store.getState().remittanceForm?.step || 1;
};

export default store;