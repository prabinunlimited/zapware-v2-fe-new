// src/features/Auth/slices/authSlice.js - FIXED VERSION
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// ===================== ASYNC THUNKS =====================
export const fetchUserProfile = createAsyncThunk(
  "auth/fetchUserProfile",
  async ({ customerId }, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const token = state.auth.token;

      const response = await fetch(`/api/customer/profile/${customerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAllowedModules = createAsyncThunk(
  "auth/fetchAllowedModules",
  async ({ customerId }, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const token = state.auth.token;

      const response = await fetch(
        `/api/customer/${customerId}/allowed-modules`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
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
      "logoutTime",
    ];
    authKeys.forEach((key) => localStorage.removeItem(key));
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

    logoutUser: (state) => {
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

      clearAuthStorage();
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
          action.payload.isStaffLogin ? "1" : "0"
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
          action.payload.isWhiteLabelCustomer ? "Y" : "N"
        );
      }
      if (action.payload.partnerId !== undefined) {
        setLocalStorageItem(
          "whitelabelled_customer_partnerid",
          action.payload.partnerId.toString()
        );
      }
      if (action.payload.partnerName !== undefined) {
        setLocalStorageItem(
          "whitelabelled_customer_partnername",
          action.payload.partnerName
        );
      }
    },

    // ===================== BANK ACCOUNT MANAGEMENT =====================
    setBankAccountInfo: (state, action) => {
      if (action.payload.hasSilaBankAccount !== undefined) {
        state.hasSilaBankAccount = action.payload.hasSilaBankAccount;
        setLocalStorageItem(
          "hasSilaBankAccount",
          action.payload.hasSilaBankAccount ? "Y" : "N"
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

        if (payload.kyc_status !== undefined) {
          state.kycStatus = payload.kyc_status;
          setLocalStorageItem("kyc_status", payload.kyc_status);
        }
        if (payload.bank_approve_status !== undefined) {
          state.bankApproveStatus = payload.bank_approve_status;
          setLocalStorageItem(
            "bank_approve_status",
            payload.bank_approve_status
          );
        }

        if (payload.requiresPlaidRedirect) {
          state.plaidStatus = {
            status: "pending",
            url: payload.plaidUrl,
            message: "Redirecting to Plaid",
          };

          if (payload.tempToken && payload.customer_id) {
            state.tempAuthData = {
              token: payload.tempToken,
              customerId: payload.customer_id,
              requiresKyc: true,
            };
            sessionStorage.setItem(
              "temp_auth_data",
              JSON.stringify({
                token: payload.tempToken,
                customer_id: payload.customer_id,
                requiresKyc: true,
                timestamp: Date.now(),
              })
            );
          }

          return;
        }

        if (payload.requiresKycVerification) {
          state.requiresKycVerification = true;
          if (payload.tempToken && payload.customer_id) {
            state.tempAuthData = {
              token: payload.tempToken,
              customerId: payload.customer_id,
              requiresKyc: true,
            };
            sessionStorage.setItem(
              "temp_auth_data",
              JSON.stringify({
                token: payload.tempToken,
                customer_id: payload.customer_id,
                requiresKyc: true,
                timestamp: Date.now(),
              })
            );
          }
          return;
        }

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

        if (payload.token && payload.customer_id) {
          state.token = payload.token;
          state.customerId = payload.customer_id.toString();
          state.isAuthenticated = true;
          state.user = {
            email: state.user?.email || "",
            customerType: payload.customer_type || "individual",
            isRemittanceOnlyCustomer: payload.isRemittanceOnlyCustomer || false,
          };

          state.tempAuthData = null;
          sessionStorage.removeItem("temp_auth_data");

          setLocalStorageItem("authtoken", payload.token);
          setLocalStorageItem(
            "authcustomer_id",
            payload.customer_id.toString()
          );
          setLocalStorageItem("kyc_status", payload.kyc_status);
          setLocalStorageItem(
            "bank_approve_status",
            payload.bank_approve_status
          );
          setLocalStorageItem("is_staff_login", payload.is_staff_login || "0");
          setLocalStorageItem("staff_role", payload.staff_role || "");
          setLocalStorageItem("staff_id", payload.staff_id || "0");
          setLocalStorageItem("is_owner_login", payload.is_owner_login || "0");
          setLocalStorageItem("owner_id", payload.owner_id || "0");
          setLocalStorageItem(
            "whitelabelled_customer",
            payload.whitelabelled_customer || "N"
          );
          setLocalStorageItem(
            "whitelabelled_customer_partnerid",
            payload.whitelabelled_customer_partnerid || "0"
          );
          setLocalStorageItem(
            "whitelabelled_customer_partnername",
            payload.whitelabelled_customer_partnername || ""
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

        const {
          token,
          customer_id,
          kyc_status,
          bank_approve_status,
          isRemittanceOnlyCustomer,
          customer_type,
        } = action.payload;

        if (token && customer_id) {
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
            isRemittanceOnlyCustomer:
              action.payload.data.isRemittanceOnlyCustomer || false,
          };
          setLocalStorageItem("authtoken", action.payload.data.token);
          setLocalStorageItem(
            "authcustomer_id",
            action.payload.data.customer_id
          );
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
      });
  },
});

// ===================== SELECTORS (CLEAN - NO CONSOLE.LOG) =====================
export const selectAuth = (state) => state.auth;


// export const selectAuthToken = (state) => {
//   const token = state.auth.token;

//   const isValidToken =
//     token &&
//     token !== "undefined" &&
//     token !== "null" &&
//     token !== "false" &&
//     typeof token === "string" &&
//     token.length > 10;

//   if (isValidToken) {
//     return token;
//   }

//   const tempAuthData = state.auth.tempAuthData;
//   if (tempAuthData?.token) {
//     return tempAuthData.token;
//   }

//   try {
//     const sessionTempAuth = sessionStorage.getItem("temp_auth_data");
//     if (sessionTempAuth) {
//       const tempAuth = JSON.parse(sessionTempAuth);
//       if (
//         tempAuth.token &&
//         tempAuth.timestamp &&
//         Date.now() - tempAuth.timestamp < 300000
//       ) {
//         return tempAuth.token;
//       }
//     }
//   } catch (e) {
//     // Silent catch
//   }

//   const storedToken = localStorage.getItem("authtoken");
//   const isValidStoredToken =
//     storedToken &&
//     storedToken !== "undefined" &&
//     storedToken !== "null" &&
//     storedToken !== "false" &&
//     typeof storedToken === "string" &&
//     storedToken.length > 10;

//   if (isValidStoredToken) {
//     return storedToken;
//   }

//   return null;
// };

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