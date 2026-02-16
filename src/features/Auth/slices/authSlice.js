// src/features/Auth/slices/authSlice.js - UPDATED TO USE CENTRALIZED API SERVICE
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { centralizedApi } from "../../../services/api";

// ===================== ASYNC THUNKS =====================
export const fetchUserProfile = createAsyncThunk(
  "auth/fetchUserProfile",
  async ({ customerId }, { rejectWithValue, getState }) => {
    try {
      console.log(`👤 Fetching user profile for customerId: ${customerId}`);

      const userProfile = await centralizedApi.getCustomerProfile(customerId);

      console.log("✅ User profile fetched successfully");
      return userProfile;
    } catch (error) {
      console.error("❌ Error fetching user profile:", error);
      return rejectWithValue(error.message || "Failed to fetch user profile");
    }
  },
);

export const fetchMerchantBeneficiary = createAsyncThunk(
  "auth/fetchMerchantBeneficiary",
  async ({ beneficaryId }, { rejectWithValue, getState }) => {
    try {
      console.log(`👤 Fetching merchant beneficiary for ID: ${beneficaryId}`);

      const bearertoken = localStorage.getItem("bearertoken");

      const response = await axios.get(
        `${API_URL}/beneficiaries/fetch-merchant-benef/${beneficaryId}`,
        {
          headers: { Authorization: `Bearer ${bearertoken}` },
        },
      );

      console.log("✅ Merchant beneficiary fetched successfully");
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching merchant beneficiary:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const fetchProfileData = createAsyncThunk(
  "auth/fetchProfileData",
  async ({ beneficaryId }, { rejectWithValue }) => {
    try {
      console.log(
        `👤 Fetching profile data for beneficiary ID: ${beneficaryId}`,
      );

      const bearertoken = localStorage.getItem("bearertoken");
      const firstName = localStorage.getItem("firstName") || "User";
      const lastName = localStorage.getItem("lastName") || "";

      // Mock API call - replace with actual API
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            first_name: firstName,
            last_name: lastName,
            email: "user@example.com",
          });
        }, 500);
      });
    } catch (error) {
      console.error("❌ Error fetching profile data:", error);
      return rejectWithValue(error.message || "Failed to fetch profile data");
    }
  },
);

export const fetchAllowedModules = createAsyncThunk(
  "auth/fetchAllowedModules",
  async ({ customerId }, { rejectWithValue, getState }) => {
    try {
      console.log(`📦 Fetching allowed modules for customerId: ${customerId}`);

      // Note: This endpoint might need to be added to centralizedApi
      // For now, we'll handle it directly with proper caching
      const cacheKey = `allowed-modules-${customerId}`;
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        try {
          console.log("💾 Using cached allowed modules");
          return JSON.parse(cached);
        } catch (e) {
          // Cache corrupted, continue to fetch
        }
      }

      const api = (await import("../../../services/api")).default;
      const response = await api.get(`/customer/${customerId}/allowed-modules`);

      if (response.data) {
        // Cache for 5 minutes
        sessionStorage.setItem(cacheKey, JSON.stringify(response.data));
        console.log("✅ Allowed modules fetched and cached");
        return response.data;
      }

      throw new Error("Invalid response structure");
    } catch (error) {
      console.error("❌ Error fetching allowed modules:", error);
      return rejectWithValue(
        error.message || "Failed to fetch allowed modules",
      );
    }
  },
);

// ===================== LOGOUT USER ASYNC THUNK =====================
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (token, { rejectWithValue, dispatch }) => {
    const logoutTimestamp = Date.now();

    try {
      console.log("🚪 Starting logout process...");

      // Step 2.1: Store logout timestamp
      localStorage.setItem("logout_time", logoutTimestamp.toString());
      console.log("⏰ Logout timestamp stored");

      // Step 2.2: Get customer ID for API call
      const customerId = localStorage.getItem("authcustomer_id");

      let apiSuccess = false;
      let apiResponse = null;

      // Step 2.3: Call logout API using centralized service
      if (token && customerId) {
        console.log("📤 Calling logout API...");
        try {
          const logoutPayload = {
            customer_id: customerId,
            logout_timestamp: logoutTimestamp,
            device_info: navigator.userAgent,
            logout_reason: "user_initiated",
          };

          // Use centralized API for logout
          await centralizedApi.logout();
          apiSuccess = true;
          console.log("✅ Logout API success via centralized service");
        } catch (apiError) {
          console.warn("⚠️ Logout API error:", apiError.message);
          // Continue with local logout even if API fails
        }
      } else {
        console.log("ℹ️ No token/customer ID, local logout only");
      }

      // Step 2.4: Clear cache for this user
      if (customerId) {
        try {
          centralizedApi.clearCache(`/customer/${customerId}`);
          console.log("🗑️ Cleared user-specific cache");
        } catch (cacheError) {
          console.warn("⚠️ Cache clear error:", cacheError.message);
        }
      }

      // Step 2.5: Clear ONLY authentication tokens
      clearAuthStorage();

      // Step 2.6: Return success
      console.log("🎉 Logout process completed successfully");
      return {
        success: true,
        apiResponse,
        apiSuccess,
        timestamp: logoutTimestamp,
        message: "Logout completed",
      };
    } catch (error) {
      console.error("❌ Logout error:", error);
      // Even on error, clear auth storage
      clearAuthStorage();
      return rejectWithValue({
        message: "Logout process error",
        error: error.message,
        proceedWithCleanup: true, // Signal to proceed with cleanup
      });
    }
  },
);

// ===================== CONSTANTS =====================
const KYC_STATUS = {
  PENDING: "0",
  COMPLETED: "1",
  VERIFIED: "2",
};

const BANK_STATUS = {
  PENDING: "0",
  APPROVED: "1",
  REJECTED: "2",
};

const PLAID_STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
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
    } else if (typeof value === "object") {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, value.toString());
    }
  }
};

const clearAuthStorage = () => {
  if (typeof window !== "undefined") {
    console.log("🚪 Clearing user auth tokens (keeping partner data)...");

    // ============ ONLY CLEAR USER-SPECIFIC DATA ============
    const userTokensToClear = [
      // Authentication tokens
      "authtoken",
      "authcustomer_id",

      // User verification status
      "kyc_status",
      "bank_approve_status",

      // Staff/Owner info
      "is_staff_login",
      "staff_role",
      "staff_id",
      "is_owner_login",
      "owner_id",
      "ownerDetails",

      // User profile data
      "firstName",
      "lastName",
      "middleName",

      // Temporary/session data
      "plaidStatus",
      "hasSilaBankAccount",
      "customerUuid",
      "logout_time",
      "temp_auth_data",
    ];

    // Clear each user token
    userTokensToClear.forEach((key) => {
      const hadValue = localStorage.getItem(key) !== null;
      localStorage.removeItem(key);
      if (hadValue) {
        console.log(`🗑️  Cleared user token: ${key}`);
      }
    });

    // ============ KEEP ALL PARTNER/ORGANIZATION DATA ============
    // These items STAY in localStorage:
    // - bearertoken (partner token)
    // - partner_logo, partnerDetails, partnerConfig
    // - whitelabelled_* items
    // - header_color, text_color, etc.
    // - beneficiary_portal_title
    // - partner_fx_currencies
    // - partner_name

    // ============ CLEAR SESSION STORAGE ============
    sessionStorage.clear();
    console.log("🗑️  Cleared session storage");

    // ============ VERIFY WHAT REMAINS ============
    console.log("✅ User logout complete. Partner data preserved.");

    // Debug: Show what partner data is still there
    const partnerTokens = [
      "bearertoken",
      "partner_logo",
      "partnerDetails",
      "partnerConfig",
      "partnerDetailsTimestamp",
      "partnerConfigTimestamp",
      "whitelabelled_customer_partnerid",
      "whitelabelledpartnerid",
      "whitelabelled_customer_partnername",
      "header_color",
      "text_color",
      "beneficiary_portal_title",
      "partner_fx_currencies",
      "partner_name",
    ];

    const preservedTokens = partnerTokens.filter(
      (key) => localStorage.getItem(key) !== null,
    );

    console.log(
      `🤝 ${preservedTokens.length} partner tokens preserved:`,
      preservedTokens,
    );
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
  bearertoken: null,
  customerId: null,
  tempAuthData: null,

  // Data Fetching Flags
  hasFetchedData: false,
  hasFetchedProfile: false,
  hasFetchedModules: false,

  // Redirect
  isRedirecting: false,

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
    error: null,
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
  lastError: null,

  // Loading States
  loading: {
    profile: false,
    modules: false,
    general: false,
  },

  // Profile Data
  userProfile: null,
  allowedModules: null,

  // Logout State
  logoutState: {
    loading: false,
    error: null,
    success: false,
    timestamp: null,
    partnerTokensPreserved: false,
  },
};

// ===================== AUTH SLICE =====================
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // ===================== DATA FETCHING FLAGS =====================
    setHasFetchedData: (state, action) => {
      state.hasFetchedData = action.payload;
    },

    setHasFetchedProfile: (state, action) => {
      state.hasFetchedProfile = action.payload;
    },

    setHasFetchedModules: (state, action) => {
      state.hasFetchedModules = action.payload;
    },

    resetFetchFlags: (state) => {
      state.hasFetchedData = false;
      state.hasFetchedProfile = false;
      state.hasFetchedModules = false;
    },

    // ===================== REDIRECTION =====================
    setRedirecting: (state, action) => {
      state.isRedirecting = action.payload;
    },

    // ===================== INITIALIZATION & STATE SYNC =====================
    setInitialized: (state, action) => {
      state.isInitialized = action.payload;
    },

    initializeAuth: (state) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("authtoken");
        const customerId = localStorage.getItem("authcustomer_id");

        const isValidToken =
          token &&
          token !== "undefined" &&
          token !== "null" &&
          token !== "false";
        const isValidCustomerId =
          customerId && customerId !== "undefined" && customerId !== "null";

        if (isValidToken && isValidCustomerId) {
          state.token = token;
          state.customerId = customerId;
          state.isAuthenticated = true;
        } else {
          clearAuthStorage();
          state.token = null;
          state.customerId = null;
          state.isAuthenticated = false;
        }

        state.isInitialized = true;
      }
    },

    setAuthState: (state, action) => {
      const {
        token,
        customerId,
        user,
        isAuthenticated = true,
      } = action.payload;

      if (!token || !customerId) {
        return;
      }

      state.token = token;
      state.customerId = customerId;
      state.user = user;
      state.isAuthenticated = isAuthenticated;
      state.isInitialized = true;
      state.error = null;

      setLocalStorageItem("authtoken", token);
      setLocalStorageItem("authcustomer_id", customerId);
    },

    // ===================== OPTIMIZED STATE SYNC =====================
    syncLocalStorageState: (state) => {
      if (typeof window === "undefined") {
        state.isInitialized = true;
        return;
      }

      try {
        const token = localStorage.getItem("authtoken");
        const customerId = localStorage.getItem("authcustomer_id");

        const isValidToken =
          token &&
          token !== "undefined" &&
          token !== "null" &&
          token !== "false" &&
          token.length > 10 &&
          !token.includes("undefined") &&
          !token.includes("null");

        const isValidCustomerId =
          customerId &&
          customerId !== "undefined" &&
          customerId !== "null" &&
          customerId !== "false" &&
          !isNaN(Number(customerId)) &&
          Number(customerId) > 0;

        if (isValidToken && isValidCustomerId) {
          state.token = token;
          state.customerId = customerId;
          state.isAuthenticated = true;
        } else {
          if (!isValidToken) {
            localStorage.removeItem("authtoken");
            state.token = null;
          }
          if (!isValidCustomerId) {
            localStorage.removeItem("authcustomer_id");
            state.customerId = null;
          }
          state.isAuthenticated = false;
        }

        state.isInitialized = true;
      } catch (error) {
        state.isInitialized = true;
        state.isAuthenticated = false;
      }
    },

    // ===================== FORCE SYNC AUTH FROM LOCALSTORAGE =====================
    syncAuthFromLocalStorage: (state) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("authtoken");
        const customerId = localStorage.getItem("authcustomer_id");

        console.log("🔄 Force syncing auth from localStorage:", {
          token: token ? `${token.substring(0, 20)}...` : "Missing",
          customerId,
        });

        const isValidToken =
          token &&
          token !== "undefined" &&
          token !== "null" &&
          token !== "false" &&
          token.length > 10;

        const isValidCustomerId =
          customerId &&
          customerId !== "undefined" &&
          customerId !== "null" &&
          customerId !== "false" &&
          !isNaN(Number(customerId)) &&
          Number(customerId) > 0;

        if (isValidToken && isValidCustomerId) {
          state.token = token;
          state.customerId = customerId;
          state.isAuthenticated = true;
          state.isInitialized = true;
          console.log("✅ Auth synced successfully from localStorage", {
            customerId: state.customerId,
            isAuthenticated: state.isAuthenticated,
          });
        } else {
          console.warn("⚠️ Invalid auth data in localStorage", {
            token: isValidToken ? "Valid" : "Invalid",
            customerId: isValidCustomerId ? "Valid" : "Invalid",
          });
        }
      }
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
      clearAuthStorage();
      return {
        ...initialState,
        isInitialized: true,
        isAuthenticated: false,
      };
    },

    logoutUserSync: (state) => {
      console.log("🔄 Sync logout - clearing auth state");

      // Step 3.1: Reset all Redux auth state
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

      state.hasFetchedData = false;
      state.hasFetchedProfile = false;
      state.hasFetchedModules = false;
      state.userProfile = null;
      state.allowedModules = null;

      // Step 3.2: Clear ONLY auth tokens from localStorage
      clearAuthStorage();

      // Step 3.3: Update logout state
      state.logoutState.success = true;
      state.logoutState.timestamp = Date.now();
      state.logoutState.partnerTokensPreserved = true;
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
        timestamp: Date.now(),
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
        setLocalStorageItem(
          "is_staff_login",
          action.payload.isStaffLogin ? "1" : "0",
        );
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
        setLocalStorageItem(
          "whitelabelled_customer",
          action.payload.isWhiteLabelCustomer ? "Y" : "N",
        );
      }
      if (action.payload.partnerId !== undefined) {
        setLocalStorageItem(
          "whitelabelled_customer_partnerid",
          action.payload.partnerId.toString(),
        );
      }
      if (action.payload.partnerName !== undefined) {
        setLocalStorageItem(
          "whitelabelled_customer_partnername",
          action.payload.partnerName,
        );
      }
    },

    // ===================== BANK ACCOUNT MANAGEMENT =====================
    setBankAccountInfo: (state, action) => {
      if (action.payload.hasSilaBankAccount !== undefined) {
        state.hasSilaBankAccount = action.payload.hasSilaBankAccount;
        setLocalStorageItem(
          "hasSilaBankAccount",
          action.payload.hasSilaBankAccount ? "Y" : "N",
        );
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
      }
    },

    invalidateSession: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      clearAuthStorage();
    },

    // ===================== LOGOUT STATE MANAGEMENT =====================
    setLogoutLoading: (state, action) => {
      state.logoutState.loading = action.payload;
    },

    setLogoutError: (state, action) => {
      state.logoutState.error = action.payload;
    },

    clearLogoutState: (state) => {
      state.logoutState = initialState.logoutState;
    },
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

        // ✅ CRITICAL: Check if KYC is required
        if (
          payload.status === "kyc_required" ||
          payload.shouldNotLogin === true
        ) {
          console.log("⏳ KYC required - NOT logging user in");

          // Show passcode input again for verification
          state.showPasscodeInput = true;
          state.passcode = new Array(6).fill("");

          // DO NOT set authentication state
          return;
        }

        // ✅ Extract data from the nested structure
        let responseData = payload;

        // Check if we have the nested structure
        if (payload.data && typeof payload.data === "object") {
          responseData = payload.data;
        } else if (payload.response?.data) {
          responseData = payload.response.data;
        }

        console.log("✅ verifyPasscode.fulfilled - Processed data:", {
          hasToken: !!responseData.token,
          hasCustomerId: !!responseData.customer_id,
          originalPayload: payload,
          extractedData: responseData,
        });

        // ✅ Only set authentication state if KYC is verified
        if (
          responseData.token &&
          responseData.customer_id &&
          payload.kycVerified !== false
        ) {
          // ✅ CRITICAL: Update Redux state
          state.token = responseData.token;
          state.customerId = responseData.customer_id.toString();
          state.isAuthenticated = true;
          state.user = {
            email: state.user?.email || "",
            customerType: responseData.customer_type || "individual",
            isRemittanceOnlyCustomer:
              responseData.isRemittanceOnlyCustomer || false,
          };

          // ... rest of your existing code for storing partner data ...
        } else {
          console.error(
            "❌ Missing token, customer_id, or KYC not verified:",
            responseData,
          );
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

        if (
          action.payload?.checkMultipleCustomer === "Y" ||
          action.payload?.requiresCustomerType
        ) {
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

        const payload = action.payload;

        // ✅ CRITICAL: Check if KYC is required
        if (
          payload.status === "kyc_required" ||
          payload.shouldNotLogin === true
        ) {
          console.log("⏳ OTP Login - KYC required - NOT logging user in");

          // Show OTP input again for verification
          state.showOtpInput = true;
          state.otp = new Array(6).fill("");

          // DO NOT set authentication state
          return;
        }

        const {
          token,
          customer_id,
          kyc_status,
          bank_approve_status,
          isRemittanceOnlyCustomer,
          customer_type,
          whitelabelled_customer_partnerid,
          whitelabelled_customer_partnername,
        } = action.payload;

        // ✅ Only set authentication state if KYC is verified
        if (token && customer_id && kyc_status !== "0") {
          state.token = token;
          state.customerId = customer_id.toString();
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

          if (
            whitelabelled_customer_partnerid &&
            whitelabelled_customer_partnerid !== "0"
          ) {
            console.log(
              "📝 OTP Login - Storing partner ID:",
              whitelabelled_customer_partnerid,
            );
            localStorage.setItem(
              "whitelabelled_customer_partnerid",
              whitelabelled_customer_partnerid,
            );
            localStorage.setItem(
              "whitelabelledpartnerid",
              whitelabelled_customer_partnerid,
            );
          }

          if (whitelabelled_customer_partnername) {
            console.log(
              "📝 OTP Login - Storing partner name:",
              whitelabelled_customer_partnername,
            );
            localStorage.setItem(
              "whitelabelled_customer_partnername",
              whitelabelled_customer_partnername,
            );
          }
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
          timestamp: Date.now(),
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
        state.isRedirecting = false; // Reset redirecting flag

        const payload = action.payload;

        // ✅ CRITICAL: Check if KYC is required
        if (
          payload.status === "kyc_required" ||
          payload.shouldNotLogin === true
        ) {
          console.log("⏳ Direct Login - KYC required - NOT logging user in");

          // Set flag for UI to show KYC modal
          state.requiresKycVerification = true;

          // DO NOT set authentication state
          return;
        }

        if (payload?.is_owner_login) {
          state.isOwnerLogin = true;
          state.ownerDetails = {
            owner_id: payload.owner_id,
            owner_role_name: payload.owner_role_name,
          };
          state.isRedirecting = true;
          return;
        }

        if (payload?.requiresKycVerification) {
          state.requiresKycVerification = true;
          return;
        }

        if (payload?.data?.token) {
          state.token = payload.data.token;
          state.customerId = payload.data.customer_id;
          state.isAuthenticated = true;
          state.user = {
            customerType: payload.data.customer_type || "individual",
            isRemittanceOnlyCustomer:
              payload.data.isRemittanceOnlyCustomer || false,
            isBeneficiary: payload.data.beneficaryLogin === "Y",
          };
          state.kycStatus = payload.data.kyc_status;
          state.bankApproveStatus = payload.data.bank_approve_status;

          setLocalStorageItem("authtoken", payload.data.token);
          setLocalStorageItem("authcustomer_id", payload.data.customer_id);
          setLocalStorageItem("kyc_status", payload.data.kyc_status);
          setLocalStorageItem(
            "bank_approve_status",
            payload.data.bank_approve_status,
          );
        }
      })

      .addCase("auth/login/rejected", (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Login failed";
        state.isRedirecting = false;
      })

      // ===================== DATA FETCHING ASYNC THUNKS =====================
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading.profile = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading.profile = false;
        state.hasFetchedProfile = true;
        state.userProfile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading.profile = false;
        state.hasFetchedProfile = false;
        state.error = action.payload;
      })

      .addCase(fetchAllowedModules.pending, (state) => {
        state.loading.modules = true;
        state.error = null;
      })
      .addCase(fetchAllowedModules.fulfilled, (state, action) => {
        state.loading.modules = false;
        state.hasFetchedModules = true;
        state.allowedModules = action.payload;
      })
      .addCase(fetchAllowedModules.rejected, (state, action) => {
        state.loading.modules = false;
        state.hasFetchedModules = false;
        state.error = action.payload;
      })

      // ===================== LOGOUT USER ASYNC THUNK =====================
      .addCase(logoutUser.pending, (state) => {
        state.logoutState.loading = true;
        state.logoutState.error = null;
        state.logoutState.success = false;
        state.isLoading = true;
        state.isSubmitting = true;
      })
      .addCase(logoutUser.fulfilled, (state, action) => {
        console.log("✅ Logout successful, resetting state");
        state.logoutState.loading = false;
        state.logoutState.success = true;
        state.logoutState.timestamp = action.payload.timestamp;
        state.logoutState.apiSuccess = action.payload.apiSuccess;
        state.logoutState.partnerTokensPreserved =
          action.payload.partnerTokenPreserved;

        // Reset the entire auth state
        return {
          ...initialState,
          isInitialized: true,
          logoutState: {
            ...state.logoutState,
            loading: false,
          },
        };
      })
      .addCase(logoutUser.rejected, (state, action) => {
        console.warn("⚠️ Logout rejected:", action.payload);
        state.logoutState.loading = false;
        state.logoutState.error = action.payload?.message || "Logout failed";
        state.logoutState.success = false;
        state.isLoading = false;
        state.isSubmitting = false;

        // Even if rejected, check if we should still clean up
        if (action.payload?.proceedWithCleanup !== false) {
          console.log("🔄 Proceeding with local cleanup despite API failure");
          // Partner tokens are preserved by clearAuthStorage()
          return {
            ...initialState,
            isInitialized: true,
            logoutState: {
              ...state.logoutState,
              loading: false,
              partnerTokensPreserved: true,
            },
          };
        }
      });
  },
});

// ===================== SELECTORS =====================
export const selectAuth = (state) => state.auth;

export const selectAuthToken = (state) => {
  const token = state.auth.token;

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

  const tempAuthData = state.auth.tempAuthData;
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

  if (isValidStoredToken) {
    return storedToken;
  }

  return null;
};

export const selectIsAuthenticated = (state) => {
  const token = selectAuthToken(state);
  const customerId = state.auth.customerId;

  const isValidCustomerId =
    customerId &&
    customerId !== "undefined" &&
    customerId !== "null" &&
    customerId !== "false" &&
    !isNaN(parseInt(customerId));

  return !!(token && isValidCustomerId);
};

// Data Fetching Selectors
export const selectHasFetchedData = (state) => state.auth.hasFetchedData;
export const selectHasFetchedProfile = (state) => state.auth.hasFetchedProfile;
export const selectHasFetchedModules = (state) => state.auth.hasFetchedModules;
export const selectUserProfile = (state) => state.auth.userProfile;
export const selectAllowedModules = (state) => state.auth.allowedModules;
export const selectProfileLoading = (state) => state.auth.loading.profile;
export const selectModulesLoading = (state) => state.auth.loading.modules;

export const selectCustomerId = (state) => state.auth.customerId;
export const selectKycStatus = (state) => state.auth.kycStatus;
export const selectBankApproveStatus = (state) => state.auth.bankApproveStatus;
export const selectIsOwnerLogin = (state) => state.auth.isOwnerLogin;
export const selectOwnerDetails = (state) => state.auth.ownerDetails;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectIsGeneratingPasscode = (state) =>
  state.auth.isGeneratingPasscode;
export const selectIsGeneratingOtp = (state) => state.auth.isGeneratingOtp;
export const selectIsVerifyingPasscode = (state) =>
  state.auth.isVerifyingPasscode;
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
export const selectHasSilaBankAccount = (state) =>
  state.auth.hasSilaBankAccount;
export const selectCustomerUuid = (state) => state.auth.customerUuid;
export const selectRequiresKycVerification = (state) =>
  state.auth.requiresKycVerification;
export const selectPlaidLoading = (state) => state.auth.plaidLoading;
export const selectPlaidError = (state) => state.auth.plaidError;
export const selectModalData = (state) => state.auth.modalData;
export const selectResendTimer = (state) => state.auth.resendTimer;
export const selectResendAttempts = (state) => state.auth.resendAttempts;
export const selectIsSubmitting = (state) => state.auth.isSubmitting;
export const selectShowCustomerType = (state) => state.auth.showCustomerType;
export const selectIsRedirecting = (state) => state.auth.isRedirecting;

// Logout Selectors
export const selectLogoutState = (state) => state.auth.logoutState;
export const selectLogoutLoading = (state) => state.auth.logoutState.loading;
export const selectLogoutError = (state) => state.auth.logoutState.error;
export const selectLogoutSuccess = (state) => state.auth.logoutState.success;
export const selectLogoutTimestamp = (state) =>
  state.auth.logoutState.timestamp;
export const selectPartnerTokensPreserved = (state) =>
  state.auth.logoutState.partnerTokensPreserved;

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

// Data Fetching Status Selector
export const selectDataFetchingStatus = (state) => ({
  hasFetchedData: state.auth.hasFetchedData,
  hasFetchedProfile: state.auth.hasFetchedProfile,
  hasFetchedModules: state.auth.hasFetchedModules,
  profileLoading: state.auth.loading.profile,
  modulesLoading: state.auth.loading.modules,
  userProfile: state.auth.userProfile,
  allowedModules: state.auth.allowedModules,
});

// Session validation selector
export const selectIsValidSession = (state) => {
  const token = selectAuthToken(state);
  const customerId = state.auth.customerId;
  const isAuthenticated = selectIsAuthenticated(state);

  return {
    isValid: isAuthenticated,
    hasToken: !!token,
    hasCustomerId: !!customerId,
    token,
    customerId,
  };
};

// ===================== ACTIONS =====================
export const {
  setHasFetchedData,
  setRedirecting,
  setHasFetchedProfile,
  setHasFetchedModules,
  resetFetchFlags,
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
  logoutUserSync,
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
  setLogoutLoading,
  setLogoutError,
  clearLogoutState,
  syncAuthFromLocalStorage,
} = authSlice.actions;

export default authSlice.reducer;
