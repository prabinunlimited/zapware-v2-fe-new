// src/features/Auth/slices/authSlice.js - COMPLETE ENHANCED VERSION
import { createSlice } from "@reduxjs/toolkit";

// ===================== CONSTANTS =====================
const KYC_STATUS = {
  PENDING: "0",
  COMPLETED: "1",
  VERIFIED: "2"
};

const BANK_STATUS = {
  PENDING: "0",
  APPROVED: "1",
  REJECTED: "2"
};

const PLAID_STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error"
};

// ===================== UTILITY FUNCTIONS =====================
const getLocalStorageItem = (key) => {
  if (typeof window !== "undefined") {
    const value = localStorage.getItem(key);
    try {
      return JSON.parse(value);
    } catch {
      if (value === "true") return true;
      if (value === "false") return false;
      if (!isNaN(value) && value !== "" && value !== null) return Number(value);
      return value;
    }
  }
  return null;
};

const setLocalStorageItem = (key, value) => {
  if (typeof window !== "undefined") {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else if (typeof value === 'object') {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, value.toString());
    }
  }
};

const clearAuthStorage = () => {
  if (typeof window !== "undefined") {
    const authKeys = [
      "authtoken",
      "authcustomer_id",
      "is_staff_login",
      "staff_id",
      "staff_role",
      "whitelabelled_customer",
      "whitelabelled_customer_partnerid",
      "whitelabelled_customer_partnername",
      "hasSilaBankAccount",
      "customerUuid",
      "plaidStatus",
      "ownerDetails",
      "userEmail",
      "kyc_status",
      "bank_approve_status",
      "is_owner_login",
      "bearertoken",
      "refreshtoken",
      "logoutTime"
    ];
    authKeys.forEach(key => localStorage.removeItem(key));
  }
};

// ===================== INITIAL STATE =====================
const initialState = {
  // Core Auth State
  isInitialized: false,
  isAuthenticated: false,
  isLoading: false,
  isSubmitting: false,

  // User Data
  user: null,
  token: null,
  customerId: null,

  // Verification Status
  kycStatus: null,
  bankApproveStatus: null,
  requiresKycVerification: false,

  // Passcode/OTP State
  isGeneratingPasscode: false,
  isGeneratingOtp: false,
  isVerifyingPasscode: false,
  isVerifyingOtp: false,
  passcode: new Array(6).fill(""),
  otp: new Array(6).fill(""),
  showPasscodeInput: false,
  showOtpInput: false,
  passcodeSent: false,
  otpSent: false,

  // User Preferences
  rememberMe: false,
  customerType: "",
  inputType: "email",
  showCustomerType: "N",

  // Owner/Staff Management
  ownerDetails: null,
  isOwnerLogin: false,
  staffInfo: {
    isStaffLogin: false,
    staffRole: "",
    staffId: "0",
  },

  // White Label Info
  whiteLabelInfo: {
    isWhiteLabelCustomer: false,
    partnerId: 0,
    partnerName: null,
  },

  // Plaid & Bank Integration
  plaidStatus: {
    status: PLAID_STATUS.IDLE,
    url: null,
    message: null,
    error: null
  },
  plaidLoading: false,
  plaidError: null,
  hasSilaBankAccount: false,
  customerUuid: null,

  // UI State
  modalData: {
    isOpen: false,
    title: "",
    message: "",
    type: "success",
    errors: null,
  },

  // Resend Timer
  resendTimer: 60,
  resendAttempts: 3,

  // Error Handling
  error: null,
  lastError: null
};

// ===================== AUTH SLICE =====================
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // ===================== INITIALIZATION & STATE SYNC =====================
    setInitialized: (state, action) => {
      state.isInitialized = action.payload;
    },

    initializeAuth: (state) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("authtoken");
        const customerId = localStorage.getItem("authcustomer_id");

        // ✅ Enhanced validation
        const isValidToken = token && token !== "undefined" && token !== "null" && token !== "false";
        const isValidCustomerId = customerId && customerId !== "undefined" && customerId !== "null";

        if (isValidToken && isValidCustomerId) {
          state.token = token;
          state.customerId = customerId;
          state.isAuthenticated = true;
          console.log('✅ [authSlice] Auth state restored from localStorage');
        } else {
          console.log('❌ [authSlice] Invalid auth data in localStorage, clearing state');
          clearAuthStorage();
          state.token = null;
          state.customerId = null;
          state.isAuthenticated = false;
        }

        state.isInitialized = true;
      }
    },

    setAuthState: (state, action) => {
      const { token, customerId, user, isAuthenticated = true } = action.payload;

      // ✅ Validate inputs
      if (!token || !customerId) {
        console.error('❌ [authSlice] setAuthState called with invalid data');
        return;
      }

      state.token = token;
      state.customerId = customerId;
      state.user = user;
      state.isAuthenticated = isAuthenticated;
      state.isInitialized = true;
      state.error = null;

      // Persist to localStorage
      setLocalStorageItem("authtoken", token);
      setLocalStorageItem("authcustomer_id", customerId);

      console.log('✅ [authSlice] Auth state updated and persisted');
    },

    // ===================== COMPREHENSIVE STATE SYNC =====================
    syncLocalStorageState: (state) => {
      console.log('🔄 [authSlice] syncLocalStorageState called');

      if (typeof window !== "undefined") {
        const token = localStorage.getItem("authtoken");
        const customerId = localStorage.getItem("authcustomer_id");

        console.log('📦 [authSlice] LocalStorage values:', {
          token: !!token,
          customerId,
          hasToken: !!token,
          hasCustomerId: !!customerId
        });

        // ✅ Enhanced validation with type checking
        const isValidToken = token &&
          token !== "undefined" &&
          token !== "null" &&
          token !== "false" &&
          typeof token === "string" &&
          token.length > 10;

        const isValidCustomerId = customerId &&
          customerId !== "undefined" &&
          customerId !== "null" &&
          customerId !== "false" &&
          !isNaN(parseInt(customerId));

        // ✅ Only set authenticated state if BOTH token and customerId are valid
        if (isValidToken && isValidCustomerId) {
          state.token = token;
          state.customerId = customerId;
          state.isAuthenticated = true;
          console.log('✅ [authSlice] Valid auth state restored from localStorage');
        } else {
          // Clear inconsistent state
          console.log('❌ [authSlice] Invalid auth data in localStorage - clearing state');
          state.token = null;
          state.customerId = null;
          state.isAuthenticated = false;

          // Clear invalid storage
          if (!isValidToken) localStorage.removeItem("authtoken");
          if (!isValidCustomerId) localStorage.removeItem("authcustomer_id");
        }

        // Sync staff info
        state.staffInfo = {
          isStaffLogin: localStorage.getItem("is_staff_login") === "1",
          staffRole: localStorage.getItem("staff_role") || "",
          staffId: localStorage.getItem("staff_id") || "0",
        };

        // Sync white label info
        state.whiteLabelInfo = {
          isWhiteLabelCustomer: localStorage.getItem("whitelabelled_customer") === "Y",
          partnerId: parseInt(localStorage.getItem("whitelabelled_customer_partnerid")) || 0,
          partnerName: localStorage.getItem("whitelabelled_customer_partnername"),
        };

        // Sync other states with validation
        state.hasSilaBankAccount = localStorage.getItem("hasSilaBankAccount") === "Y";
        state.customerUuid = localStorage.getItem("customerUuid");

        // Sync Plaid status with error handling
        try {
          const plaidStatus = localStorage.getItem("plaidStatus");
          state.plaidStatus = plaidStatus ? JSON.parse(plaidStatus) : initialState.plaidStatus;
        } catch (error) {
          console.error('❌ [authSlice] Error parsing plaidStatus:', error);
          state.plaidStatus = initialState.plaidStatus;
          localStorage.removeItem("plaidStatus");
        }

        // Sync owner details with error handling
        try {
          const ownerDetails = localStorage.getItem("ownerDetails");
          state.ownerDetails = ownerDetails ? JSON.parse(ownerDetails) : null;
          state.isOwnerLogin = !!state.ownerDetails;
        } catch (error) {
          console.error('❌ [authSlice] Error parsing ownerDetails:', error);
          state.ownerDetails = null;
          state.isOwnerLogin = false;
          localStorage.removeItem("ownerDetails");
        }

        // Sync verification status
        state.kycStatus = localStorage.getItem("kyc_status");
        state.bankApproveStatus = localStorage.getItem("bank_approve_status");
        state.isOwnerLogin = localStorage.getItem("is_owner_login") === "1" || !!state.ownerDetails;
      }

      state.isInitialized = true;
      console.log('🏁 [authSlice] Auth initialization complete');
    },

    // ===================== LOADING STATES =====================
    setLoading: (state, action) => {
      state.isLoading = action.payload;
      if (action.payload) state.error = null;
    },

    setIsGeneratingPasscode: (state, action) => {
      state.isGeneratingPasscode = action.payload;
    },

    setVerifyingOtp: (state, action) => {
      state.isVerifyingOtp = action.payload;
    },

    setVerifyingPasscode: (state, action) => {
      state.isVerifyingPasscode = action.payload;
    },

    setIsSubmitting: (state, action) => {
      state.isSubmitting = action.payload;
    },

    setPlaidLoading: (state, action) => {
      state.plaidLoading = action.payload;
      if (action.payload) state.plaidError = null;
    },

    // ===================== AUTH STATE MANAGEMENT =====================
    clearAuthState: (state) => {
      console.log('🔄 [authSlice] Clearing auth state');
      clearAuthStorage();

      return {
        ...initialState,
        isInitialized: true,
        isAuthenticated: false,
      };
    },

    logoutUser: (state) => {
      console.log('🔄 [authSlice] Logging out user');

      // Clear state
      state.user = null;
      state.token = null;
      state.customerId = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      state.ownerDetails = null;
      state.isOwnerLogin = false;
      state.kycStatus = null;
      state.bankApproveStatus = null;
      state.plaidStatus = initialState.plaidStatus;
      state.plaidLoading = false;
      state.plaidError = null;

      // Clear localStorage
      clearAuthStorage();

      console.log('✅ [authSlice] User logged out successfully');
    },

    // ===================== OTP & PASSCODE MANAGEMENT =====================
    setPasscode: (state, action) => {
      state.passcode = action.payload;
    },

    setOtp: (state, action) => {
      state.otp = action.payload;
    },

    setShowPasscodeInput: (state, action) => {
      state.showPasscodeInput = action.payload;
      if (!action.payload) {
        state.passcode = new Array(6).fill("");
        state.passcodeSent = false;
      }
    },

    setShowOtpInput: (state, action) => {
      state.showOtpInput = action.payload;
      if (!action.payload) {
        state.otp = new Array(6).fill("");
        state.otpSent = false;
      }
    },

    setPasscodeSent: (state, action) => {
      state.passcodeSent = action.payload;
    },

    setOtpSent: (state, action) => {
      state.otpSent = action.payload;
    },

    resetPasscodeState: (state) => {
      state.passcode = new Array(6).fill("");
      state.showPasscodeInput = false;
      state.passcodeSent = false;
      state.isGeneratingPasscode = false;
      state.isVerifyingPasscode = false;
    },

    resetOtpState: (state) => {
      state.otp = new Array(6).fill("");
      state.showOtpInput = false;
      state.otpSent = false;
      state.isGeneratingOtp = false;
      state.isVerifyingOtp = false;
    },

    resetAuthOtpState: (state) => {
      state.isSubmitting = false;
      state.resendTimer = 60;
      state.resendAttempts = 3;
      state.otp = new Array(6).fill("");
      state.modalData = {
        isOpen: false,
        title: "",
        message: "",
        type: "success",
        errors: null,
      };
      state.error = null;
    },

    // ===================== USER PREFERENCES =====================
    setRememberMe: (state, action) => {
      state.rememberMe = action.payload;
    },

    setCustomerType: (state, action) => {
      state.customerType = action.payload;
    },

    setInputType: (state, action) => {
      state.inputType = action.payload;
      // Reset related states when input type changes
      if (action.payload === "email") {
        state.showOtpInput = false;
        state.otpSent = false;
      } else {
        state.showPasscodeInput = false;
        state.passcodeSent = false;
      }
    },

    // ===================== ERROR HANDLING =====================
    setError: (state, action) => {
      state.error = action.payload;
      state.lastError = action.payload;
      state.isLoading = false;
      state.isGeneratingPasscode = false;
      state.isGeneratingOtp = false;
      state.isVerifyingPasscode = false;
      state.isVerifyingOtp = false;
      state.isSubmitting = false;
    },

    clearError: (state) => {
      state.error = null;
    },

    setPlaidError: (state, action) => {
      state.plaidError = action.payload;
      state.plaidLoading = false;
      state.plaidStatus.status = PLAID_STATUS.ERROR;
      state.plaidStatus.error = action.payload;
    },

    // ===================== USER & OWNER MANAGEMENT =====================
    setUser: (state, action) => {
      state.user = action.payload;
    },

    setOwnerDetails: (state, action) => {
      state.ownerDetails = action.payload;
      state.isOwnerLogin = true;
      setLocalStorageItem("ownerDetails", JSON.stringify(action.payload));
      setLocalStorageItem("is_owner_login", "1");
    },

    clearOwnerDetails: (state) => {
      state.ownerDetails = null;
      state.isOwnerLogin = false;
      localStorage.removeItem("ownerDetails");
      localStorage.removeItem("is_owner_login");
    },

    // ===================== VERIFICATION STATUS =====================
    setVerificationStatus: (state, action) => {
      const { kycStatus, bankStatus, isOwnerLogin } = action.payload;

      if (kycStatus !== undefined) {
        state.kycStatus = kycStatus;
        setLocalStorageItem("kyc_status", kycStatus);
      }
      if (bankStatus !== undefined) {
        state.bankApproveStatus = bankStatus;
        setLocalStorageItem("bank_approve_status", bankStatus);
      }
      if (isOwnerLogin !== undefined) {
        state.isOwnerLogin = isOwnerLogin;
        setLocalStorageItem("is_owner_login", isOwnerLogin ? "1" : "0");
      }
    },

    setRequiresKycVerification: (state, action) => {
      state.requiresKycVerification = action.payload;
    },

    // ===================== PLAID MANAGEMENT =====================
    setPlaidStatus: (state, action) => {
      state.plaidStatus = {
        ...state.plaidStatus,
        ...action.payload,
        timestamp: Date.now()
      };
      setLocalStorageItem("plaidStatus", JSON.stringify(state.plaidStatus));
    },

    resetPlaidState: (state) => {
      state.plaidStatus = initialState.plaidStatus;
      state.plaidLoading = false;
      state.plaidError = null;
      localStorage.removeItem("plaidStatus");
    },

    // ===================== MODAL MANAGEMENT =====================
    setModalData: (state, action) => {
      state.modalData = { ...state.modalData, ...action.payload };
    },

    openModal: (state, action) => {
      state.modalData = {
        isOpen: true,
        title: action.payload.title || "",
        message: action.payload.message || "",
        type: action.payload.type || "success",
        errors: action.payload.errors || null,
      };
    },

    closeModal: (state) => {
      state.modalData.isOpen = false;
    },

    // ===================== RESEND TIMER MANAGEMENT =====================
    setResendTimer: (state, action) => {
      state.resendTimer = action.payload;
    },

    setResendAttempts: (state, action) => {
      state.resendAttempts = action.payload;
    },

    decrementTimer: (state) => {
      if (state.resendTimer > 0) {
        state.resendTimer -= 1;
      }
    },

    resetResendTimer: (state) => {
      state.resendTimer = 60;
      state.resendAttempts = 3;
    },

    // ===================== CUSTOMER TYPE MANAGEMENT =====================
    setShowCustomerType: (state, action) => {
      state.showCustomerType = action.payload;
    },

    // ===================== STAFF & WHITE LABEL MANAGEMENT =====================
    setStaffInfo: (state, action) => {
      state.staffInfo = { ...state.staffInfo, ...action.payload };

      if (action.payload.isStaffLogin !== undefined) {
        setLocalStorageItem("is_staff_login", action.payload.isStaffLogin ? "1" : "0");
      }
      if (action.payload.staffRole) {
        setLocalStorageItem("staff_role", action.payload.staffRole);
      }
      if (action.payload.staffId) {
        setLocalStorageItem("staff_id", action.payload.staffId);
      }
    },

    setWhiteLabelInfo: (state, action) => {
      state.whiteLabelInfo = { ...state.whiteLabelInfo, ...action.payload };

      if (action.payload.isWhiteLabelCustomer !== undefined) {
        setLocalStorageItem("whitelabelled_customer", action.payload.isWhiteLabelCustomer ? "Y" : "N");
      }
      if (action.payload.partnerId !== undefined) {
        setLocalStorageItem("whitelabelled_customer_partnerid", action.payload.partnerId.toString());
      }
      if (action.payload.partnerName !== undefined) {
        setLocalStorageItem("whitelabelled_customer_partnername", action.payload.partnerName);
      }
    },

    // ===================== BANK ACCOUNT MANAGEMENT =====================
    setBankAccountInfo: (state, action) => {
      if (action.payload.hasSilaBankAccount !== undefined) {
        state.hasSilaBankAccount = action.payload.hasSilaBankAccount;
        setLocalStorageItem("hasSilaBankAccount", action.payload.hasSilaBankAccount ? "Y" : "N");
      }
      if (action.payload.customerUuid !== undefined) {
        state.customerUuid = action.payload.customerUuid;
        setLocalStorageItem("customerUuid", action.payload.customerUuid);
      }
    },

    // ===================== BULK UPDATE =====================
    updateAuthState: (state, action) => {
      return { ...state, ...action.payload };
    },

    // ===================== SESSION MANAGEMENT =====================
    refreshToken: (state, action) => {
      if (action.payload.token) {
        state.token = action.payload.token;
        setLocalStorageItem("authtoken", action.payload.token);
        console.log('✅ [authSlice] Token refreshed');
      }
    },

    invalidateSession: (state) => {
      console.log('🔄 [authSlice] Invalidating session');
      state.isAuthenticated = false;
      state.token = null;
      clearAuthStorage();
    }
  },

  // ===================== EXTRA REDUCERS =====================
  extraReducers: (builder) => {
    builder
      // Initialize App
      .addCase("auth/initializeApp/pending", (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase("auth/initializeApp/fulfilled", (state) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase("auth/initializeApp/rejected", (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.error = action.payload;
      })

      // Generate Passcode
      .addCase("auth/generatePasscode/pending", (state) => {
        state.isGeneratingPasscode = true;
        state.error = null;
      })
      .addCase("auth/generatePasscode/fulfilled", (state, action) => {
        state.isGeneratingPasscode = false;
        state.error = null;

        // Only set passcode states if not multiple accounts
        if (action.payload?.status !== "multiple_accounts") {
          state.showPasscodeInput = true;
          state.passcodeSent = true;
          state.passcode = new Array(6).fill("");
        }
      })
      .addCase("auth/generatePasscode/rejected", (state, action) => {
        state.isGeneratingPasscode = false;
        state.error = action.payload?.message || "Failed to generate passcode";
        state.showPasscodeInput = false;
        state.passcodeSent = false;
      })

      // Verify Passcode
      .addCase("auth/verifyPasscode/pending", (state) => {
        state.isLoading = true;
        state.isVerifyingPasscode = true;
        state.error = null;
      })
      
      .addCase("auth/verifyPasscode/fulfilled", (state, action) => {
        state.isLoading = false;
        state.isVerifyingPasscode = false;
        state.error = null;

        const payload = action.payload;

        console.log('🔍 [authSlice] verifyPasscode fulfilled payload:', payload);

        // Handle verification status
        if (payload.kyc_status !== undefined) {
          state.kycStatus = payload.kyc_status;
          setLocalStorageItem("kyc_status", payload.kyc_status);
        }
        if (payload.bank_approve_status !== undefined) {
          state.bankApproveStatus = payload.bank_approve_status;
          setLocalStorageItem("bank_approve_status", payload.bank_approve_status);
        }

        // ✅ Handle Plaid redirect - DON'T set auth state, just return the data
        if (payload.requiresPlaidRedirect) {
          state.plaidStatus = {
            status: "pending",
            url: payload.plaidUrl,
            message: "Redirecting to Plaid",
          };
          // Don't set authentication state here - let the component handle the redirect
          return;
        }

        // Handle KYC verification required (but no redirect)
        if (payload.requiresKycVerification) {
          state.requiresKycVerification = true;
          // Don't set authentication state here either
          return;
        }

        // Handle owner login
        if (payload.is_owner_login) {
          state.isOwnerLogin = true;
          state.ownerDetails = {
            owner_id: payload.owner_id,
            owner_role_name: payload.owner_role_name,
          };
          setLocalStorageItem("is_owner_login", "1");
          setLocalStorageItem("owner_id", payload.owner_id);
          setLocalStorageItem("owner_role_name", payload.owner_role_name);
          return;
        }

        // ✅ CRITICAL: Handle successful authentication - ensure customer_id is set
        if (payload.token && payload.customer_id) {
          state.token = payload.token;
          state.customerId = payload.customer_id.toString();
          state.isAuthenticated = true;
          state.user = {
            email: state.user?.email || "",
            customerType: payload.customer_type || "individual",
            isRemittanceOnlyCustomer: payload.isRemittanceOnlyCustomer || false,
          };

          // Set all localStorage items
          setLocalStorageItem("authtoken", payload.token);
          setLocalStorageItem("authcustomer_id", payload.customer_id.toString());
          setLocalStorageItem("kyc_status", payload.kyc_status);
          setLocalStorageItem("bank_approve_status", payload.bank_approve_status);
          setLocalStorageItem("is_staff_login", payload.is_staff_login || "0");
          setLocalStorageItem("staff_role", payload.staff_role || "");
          setLocalStorageItem("staff_id", payload.staff_id || "0");
          setLocalStorageItem("is_owner_login", payload.is_owner_login || "0");
          setLocalStorageItem("owner_id", payload.owner_id || "0");
          setLocalStorageItem("whitelabelled_customer", payload.whitelabelled_customer || "N");
          setLocalStorageItem("whitelabelled_customer_partnerid", payload.whitelabelled_customer_partnerid || "0");
          setLocalStorageItem("whitelabelled_customer_partnername", payload.whitelabelled_customer_partnername || "");

          console.log('✅ [authSlice] Auth state set with customerId:', payload.customer_id);
        } else {
          console.error('❌ [authSlice] Missing token or customer_id in verifyPasscode response:', {
            hasToken: !!payload.token,
            hasCustomerId: !!payload.customer_id,
            payload: payload
          });
        }
      })
      .addCase("auth/verifyPasscode/rejected", (state, action) => {
        state.isLoading = false;
        state.isVerifyingPasscode = false;
        state.error = action.payload || "Verification failed";
        state.showPasscodeInput = true;
      })

      // Generate OTP
      .addCase("auth/generateOTP/pending", (state) => {
        state.isGeneratingOtp = true;
        state.error = null;
      })
      .addCase("auth/generateOTP/fulfilled", (state, action) => {
        state.isGeneratingOtp = false;
        state.error = null;

        if (action.payload?.checkMultipleCustomer === "Y" || action.payload?.requiresCustomerType) {
          state.showCustomerType = "Y";
        } else {
          state.showOtpInput = true;
          state.otpSent = true;
          state.otp = new Array(6).fill("");
        }
      })
      .addCase("auth/generateOTP/rejected", (state, action) => {
        state.isGeneratingOtp = false;
        state.error = action.payload;
        state.showOtpInput = false;
        state.otpSent = false;
      })

      // Verify OTP
      .addCase("auth/verifyOTP/pending", (state) => {
        state.isLoading = true;
        state.isVerifyingOtp = true;
        state.error = null;
      })

      .addCase("auth/verifyOTP/fulfilled", (state, action) => {
        state.isLoading = false;
        state.isVerifyingOtp = false;
        state.error = null;

        const {
          token,
          customer_id,
          kyc_status,
          bank_approve_status,
          isRemittanceOnlyCustomer,
          customer_type,
        } = action.payload;

        console.log('🔍 [authSlice] verifyOTP fulfilled payload:', action.payload);

        // ✅ CRITICAL: Enhanced validation
        if (token && customer_id) {
          state.token = token;
          state.customerId = customer_id.toString(); // Ensure it's a string
          state.isAuthenticated = true;
          state.user = {
            mobile_number: state.user?.mobile_number || "",
            customerType: customer_type,
            isRemittanceOnlyCustomer: isRemittanceOnlyCustomer || false,
          };

          setLocalStorageItem("authtoken", token);
          setLocalStorageItem("authcustomer_id", customer_id.toString());
          setLocalStorageItem("kyc_status", kyc_status);
          setLocalStorageItem("bank_approve_status", bank_approve_status);

          console.log('✅ [authSlice] OTP Auth state set with customerId:', customer_id);
        } else {
          console.error('❌ [authSlice] Missing token or customer_id in verifyOTP response:', {
            hasToken: !!token,
            hasCustomerId: !!customer_id,
            payload: action.payload
          });
        }

        state.kycStatus = kyc_status;
        state.bankApproveStatus = bank_approve_status;
        state.otp = new Array(6).fill("");
        state.showOtpInput = false;
        state.otpSent = false;
      })
      .addCase("auth/verifyOTP/rejected", (state, action) => {
        state.isLoading = false;
        state.isVerifyingOtp = false;
        state.error = action.payload || "OTP verification failed";
        state.showOtpInput = true;
      })

      // Plaid Initiation
      .addCase("auth/initiatePlaid/pending", (state) => {
        state.plaidLoading = true;
        state.plaidError = null;
        state.plaidStatus.status = PLAID_STATUS.LOADING;
      })
      .addCase("auth/initiatePlaid/fulfilled", (state, action) => {
        state.plaidLoading = false;
        state.plaidError = null;
        state.plaidStatus = {
          status: PLAID_STATUS.SUCCESS,
          url: action.payload.url,
          message: action.payload.message,
          timestamp: Date.now()
        };
        setLocalStorageItem("plaidStatus", JSON.stringify(state.plaidStatus));
      })
      .addCase("auth/initiatePlaid/rejected", (state, action) => {
        state.plaidLoading = false;
        state.plaidError = action.payload;
        state.plaidStatus.status = PLAID_STATUS.ERROR;
        state.plaidStatus.error = action.payload;
      })

      // Login
      .addCase("auth/login/fulfilled", (state, action) => {
        state.isLoading = false;
        state.error = null;

        if (action.payload?.is_owner_login) {
          state.isOwnerLogin = true;
          return;
        }

        if (action.payload?.requiresKycVerification) {
          state.requiresKycVerification = true;
          return;
        }

        if (action.payload?.data?.token) {
          state.token = action.payload.data.token;
          state.customerId = action.payload.data.customer_id;
          state.isAuthenticated = true;
          state.user = {
            customerType: action.payload.data.customer_type || "individual",
            isRemittanceOnlyCustomer: action.payload.data.isRemittanceOnlyCustomer || false,
          };
          setLocalStorageItem("authtoken", action.payload.data.token);
          setLocalStorageItem("authcustomer_id", action.payload.data.customer_id);
        }
      })
      .addCase("auth/login/rejected", (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Login failed";
      })

      // Logout
      .addCase("auth/logout/fulfilled", (state) => {
        return {
          ...initialState,
          isInitialized: true,
        };
      });
  },
});

// ===================== SELECTORS =====================
export const selectAuth = (state) => state.auth;

// ✅ Enhanced token selector with validation
export const selectToken = (state) => {
  const token = state.auth.token;

  // Enhanced validation
  const isValidToken = token &&
    token !== "undefined" &&
    token !== "null" &&
    token !== "false" &&
    typeof token === "string" &&
    token.length > 10;

  if (!isValidToken) {
    console.log('🔍 [selectToken] Invalid token in state:', token);

    // Check localStorage as fallback
    const storedToken = localStorage.getItem("authtoken");
    const isValidStoredToken = storedToken &&
      storedToken !== "undefined" &&
      storedToken !== "null" &&
      storedToken !== "false" &&
      typeof storedToken === "string" &&
      storedToken.length > 10;

    if (isValidStoredToken) {
      console.log('🔄 [selectToken] Using valid token from localStorage');
      return storedToken;
    }

    console.log('❌ [selectToken] No valid token found');
    return null;
  }

  console.log('🔍 [selectToken] Returning valid token from state');
  return token;
};

// ✅ Enhanced authentication selector
export const selectIsAuthenticated = (state) => {
  const token = selectToken(state);
  const customerId = state.auth.customerId;

  const isValidCustomerId = customerId &&
    customerId !== "undefined" &&
    customerId !== "null" &&
    customerId !== "false" &&
    !isNaN(parseInt(customerId));

  const isAuthenticated = !!(token && isValidCustomerId);

  console.log('🔍 [selectIsAuthenticated] Check:', {
    hasToken: !!token,
    hasCustomerId: !!customerId,
    isValidCustomerId,
    isAuthenticated
  });

  return isAuthenticated;
};

export const selectBearerToken = (state) => state.auth.bearertoken;
export const selectAuthToken = (state) => state.auth.token;
export const selectCustomerId = (state) => state.auth.customerId;
export const selectKycStatus = (state) => state.auth.kycStatus;
export const selectBankApproveStatus = (state) => state.auth.bankApproveStatus;
export const selectIsOwnerLogin = (state) => state.auth.isOwnerLogin;
export const selectOwnerDetails = (state) => state.auth.ownerDetails;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectIsGeneratingPasscode = (state) => state.auth.isGeneratingPasscode;
export const selectIsGeneratingOtp = (state) => state.auth.isGeneratingOtp;
export const selectIsVerifyingPasscode = (state) => state.auth.isVerifyingPasscode;
export const selectIsVerifyingOtp = (state) => state.auth.isVerifyingOtp;
export const selectPasscode = (state) => state.auth.passcode;
export const selectOtp = (state) => state.auth.otp;
export const selectShowPasscodeInput = (state) => state.auth.showPasscodeInput;
export const selectShowOtpInput = (state) => state.auth.showOtpInput;
export const selectPasscodeSent = (state) => state.auth.passcodeSent;
export const selectOtpSent = (state) => state.auth.otpSent;
export const selectRememberMe = (state) => state.auth.rememberMe;
export const selectCustomerType = (state) => state.auth.customerType;
export const selectInputType = (state) => state.auth.inputType;
export const selectError = (state) => state.auth.error;
export const selectUser = (state) => state.auth.user;
export const selectIsInitialized = (state) => state.auth.isInitialized;
export const selectStaffInfo = (state) => state.auth.staffInfo;
export const selectWhiteLabelInfo = (state) => state.auth.whiteLabelInfo;
export const selectPlaidStatus = (state) => state.auth.plaidStatus;
export const selectHasSilaBankAccount = (state) => state.auth.hasSilaBankAccount;
export const selectCustomerUuid = (state) => state.auth.customerUuid;
export const selectRequiresKycVerification = (state) => state.auth.requiresKycVerification;
export const selectPlaidLoading = (state) => state.auth.plaidLoading;
export const selectPlaidError = (state) => state.auth.plaidError;
export const selectModalData = (state) => state.auth.modalData;
export const selectResendTimer = (state) => state.auth.resendTimer;
export const selectResendAttempts = (state) => state.auth.resendAttempts;
export const selectIsSubmitting = (state) => state.auth.isSubmitting;
export const selectShowCustomerType = (state) => state.auth.showCustomerType;

// Composite selectors
export const selectAuthStatus = (state) => ({
  isAuthenticated: selectIsAuthenticated(state),
  isInitialized: state.auth.isInitialized,
  isLoading: state.auth.isLoading,
  kycStatus: state.auth.kycStatus,
  bankStatus: state.auth.bankApproveStatus,
});

export const selectVerificationStatus = (state) => ({
  kycStatus: state.auth.kycStatus,
  bankApproveStatus: state.auth.bankApproveStatus,
  requiresKycVerification: state.auth.requiresKycVerification,
  plaidStatus: state.auth.plaidStatus,
});

export const selectLoginMethod = (state) => ({
  inputType: state.auth.inputType,
  showPasscodeInput: state.auth.showPasscodeInput,
  showOtpInput: state.auth.showOtpInput,
  passcodeSent: state.auth.passcodeSent,
  otpSent: state.auth.otpSent,
});

// Session validation selector
export const selectIsValidSession = (state) => {
  const token = selectToken(state);
  const customerId = state.auth.customerId;
  const isAuthenticated = selectIsAuthenticated(state);

  return {
    isValid: isAuthenticated,
    hasToken: !!token,
    hasCustomerId: !!customerId,
    token,
    customerId
  };
};

// ===================== ACTIONS =====================
export const {
  initializeAuth,
  setAuthState,
  clearAuthState,
  setLoading,
  setPasscode,
  setOtp,
  setShowPasscodeInput,
  setShowOtpInput,
  setPasscodeSent,
  setOtpSent,
  setVerifyingPasscode,
  setVerifyingOtp,
  setRememberMe,
  setCustomerType,
  setInputType,
  setError,
  clearError,
  setOwnerDetails,
  clearOwnerDetails,
  setPlaidStatus,
  setPlaidLoading,
  setPlaidError,
  setVerificationStatus,
  setRequiresKycVerification,
  syncLocalStorageState,
  resetPasscodeState,
  resetOtpState,
  resetPlaidState,
  logoutUser,
  setIsGeneratingPasscode,
  setModalData,
  openModal,
  closeModal,
  setResendTimer,
  setResendAttempts,
  decrementTimer,
  resetResendTimer,
  resetAuthOtpState,
  setIsSubmitting,
  setInitialized,
  setShowCustomerType,
  setStaffInfo,
  setWhiteLabelInfo,
  setBankAccountInfo,
  setUser,
  updateAuthState,
  refreshToken,
  invalidateSession,
} = authSlice.actions;

export default authSlice.reducer;