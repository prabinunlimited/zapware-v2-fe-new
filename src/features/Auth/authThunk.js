// src/thunks/authThunk.js - COMPLETE FIXED VERSION
import { createAsyncThunk } from "@reduxjs/toolkit";
import { getBearerToken } from "../../services/authService";
import { centralizedApi } from "../../services/api";
import { extractErrorMessage } from "../../utils/errorHandling";
import { tokenService } from "../../services/authService";

const debugLocalStorage = () => {
  console.log("🔍 LOCALSTORAGE DEBUG:");
  const items = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      try {
        const value = localStorage.getItem(key);
        if (value && (value.startsWith("{") || value.startsWith("["))) {
          try {
            items[key] = JSON.parse(value);
          } catch {
            items[key] = value;
          }
        } else {
          items[key] = value;
        }
      } catch (e) {
        items[key] = "ERROR_READING";
      }
    }
  }
  console.table(items);
};

// ===================== TOKEN MANAGEMENT =====================
let tokenRequest = null;

export const handleApiError = (error, dispatch = null) => {
  let errorMessage = extractErrorMessage(error);

  if (error.response) {
    switch (error.response.status) {
      case 401:
        errorMessage = "Session expired. Please login again.";
        localStorage.removeItem("authtoken");
        localStorage.removeItem("authcustomer_id");
        tokenService.clearToken();
        window.location.href = "/";
        break;
      case 403:
        errorMessage = "You don't have permission for this action";
        break;
      case 429:
        errorMessage = "Too many requests. Please try again later.";
        break;
    }
  }

  if (dispatch) {
    dispatch({ type: "auth/setError", payload: errorMessage });
    dispatch({
      type: "ui/openModal",
      payload: {
        title: "Error",
        message: errorMessage,
        type: "error",
      },
    });
  }

  return errorMessage;
};

// ===================== APP INITIALIZATION =====================
let isInitializing = false;

// Helper function to clear old partner data
const clearOldPartnerData = () => {
  console.log("🧹 Clearing old partner data before initialization...");

  // Store the current authentication tokens to preserve them
  const authtoken = localStorage.getItem("authtoken");
  const authcustomer_id = localStorage.getItem("authcustomer_id");
  const bearertoken = localStorage.getItem("bearertoken");

  // Clear ONLY partner-related data EXCEPT hostname_partner_name
  const partnerKeys = [
    "partnerDetails",
    "partnerDetailsTimestamp",
    "partner_logo",
    "partnerConfig",
    "partnerConfigTimestamp",
    "whitelabelled_customer_partnername", // This gets overwritten by login
    "header_color",
    "text_color",
    "download_operation_manual",
    "partner_name",
    "beneficiary_portal_title",
  ];

  partnerKeys.forEach((key) => {
    localStorage.removeItem(key);
  });

  // Restore authentication tokens
  if (authtoken) localStorage.setItem("authtoken", authtoken);
  if (authcustomer_id) localStorage.setItem("authcustomer_id", authcustomer_id);
  if (bearertoken) localStorage.setItem("bearertoken", bearertoken);

  console.log("✅ Old partner data cleared, auth tokens preserved");
};

// Helper function to debug partner data
const debugPartnerDataFlow = (stage) => {
  const currentState = {
    timestamp: new Date().toISOString(),
    stage,
    url: window.location.href,
    partnerId: localStorage.getItem("whitelabelledpartnerid"),
    hostnamePartnerName: localStorage.getItem("hostname_partner_name"), // NEW
    partnerName: localStorage.getItem("whitelabelled_customer_partnername"),
    partnerDetails: localStorage.getItem("partnerDetails"),
    partnerLogo: localStorage.getItem("partner_logo"),
    whiteLabelled: localStorage.getItem("whitelabelled_customer"),
    authCustomerId: localStorage.getItem("authcustomer_id"),
  };

  console.group(`🔍 Partner Data Debug - ${stage}`);
  console.log("Current State:", currentState);

  if (currentState.partnerDetails) {
    try {
      const parsed = JSON.parse(currentState.partnerDetails);
      console.log("Parsed Partner Details:", {
        id: parsed?.profile?.id,
        name: parsed?.profile?.name,
        logo: parsed?.profile?.logo,
      });
    } catch (e) {
      console.error("Failed to parse partnerDetails:", e);
    }
  }
  console.groupEnd();

  return currentState;
};

// ✅ FIXED: CRITICAL FIX - Do NOT overwrite hostname partner data with login data
export const initializeApp = createAsyncThunk(
  "auth/initializeApp",
  async (_, { dispatch, rejectWithValue, getState }) => {
    const state = getState();

    if (isInitializing) {
      console.log("⏳ initializeApp already in progress, skipping...");
      return;
    }

    isInitializing = true;

    try {
      dispatch({ type: "auth/setLoading", payload: true });
      console.log("🚀 initializeApp starting...");

      // ✅ CRITICAL FIX: Clear OLD partner data BEFORE initializing
      clearOldPartnerData();

      // 1. Initialize hostname
      const hostname = window.location.hostname;
      console.log("🌐 Hostname:", hostname);
      dispatch({ type: "hostname/setHostname", payload: hostname });

      // 2. Fetch client token
      let bearerToken;
      try {
        bearerToken = await getBearerToken();
        console.log("✅ Bearer token obtained");
      } catch (tokenError) {
        console.error("❌ Failed to get bearer token:", tokenError);
        throw new Error("Failed to establish secure connection");
      }

      // 3. Fetch countries data (CENTRALIZED)
      console.log("🌍 Fetching countries data...");
      const countriesResponse = await centralizedApi.getCountries();
      const countriesData = countriesResponse.data || countriesResponse;
      localStorage.setItem("allcountries", JSON.stringify(countriesData));
      console.log("✅ Countries data fetched");

      // 4. Fetch partner details (CENTRALIZED) - THIS IS THE SOURCE OF TRUTH
      console.log("🏢 Fetching partner details...");
      const partnerResponse =
        await centralizedApi.getPartnerByHostname(hostname);
      const partnerData = partnerResponse.data || partnerResponse;
      console.log("✅ Partner details fetched:", {
        name: partnerData.partner_name,
        is_white_labelled: partnerData.is_white_labelled_partner,
        id: partnerData.partner_id,
      });

      // ✅ STORE PARTNER DATA FROM HOSTNAME - DO NOT OVERWRITE THIS LATER
      console.log("💾 Storing partner details in localStorage...");
      localStorage.setItem(
        "iswhitelabelledpartner",
        partnerData.is_white_labelled_partner || "N",
      );
      localStorage.setItem(
        "whitelabelledpartnerid",
        partnerData.partner_id?.toString() || "0", // Ensure string
      );
      localStorage.setItem(
        "isPartnerPackageModule",
        partnerData.isPartnerPackageModule || "N",
      );

      // ✅ CRITICAL FIX: Store partner name in dedicated key that won't be overwritten
      if (partnerData.partner_name) {
        localStorage.setItem(
          "hostname_partner_name", // DEDICATED KEY - WON'T BE OVERWRITTEN
          partnerData.partner_name,
        );
        console.log(
          "✅ Hostname partner name stored:",
          partnerData.partner_name,
        );
      }

      // ✅ Also store in standard key (but login might overwrite it)
      if (partnerData.partner_name) {
        localStorage.setItem(
          "whitelabelled_customer_partnername",
          partnerData.partner_name,
        );
        localStorage.setItem("partner_name", partnerData.partner_name);
      }

      // ✅ Store beneficiary portal title if available
      if (partnerData.beneficiary_portal_title) {
        localStorage.setItem(
          "beneficiary_portal_title",
          partnerData.beneficiary_portal_title,
        );
      }

      // ✅ Store full partner data
      const partnerDetailsData = {
        status: "success",
        profile: {
          id: partnerData.partner_id,
          partner_uuid: partnerData.partner_uuid || "",
          name: partnerData.partner_name || "",
          logo: partnerData.logo || "",
        },
      };
      localStorage.setItem(
        "partnerDetails",
        JSON.stringify(partnerDetailsData),
      );
      localStorage.setItem("partnerDetailsTimestamp", Date.now().toString());

      // Debug after initial storage
      debugPartnerDataFlow("after_hostname_fetch");

      // 5. Fetch partner config (CENTRALIZED)
      console.log("🎨 Fetching partner config...");
      let partnerConfig;
      try {
        const configResponse = await centralizedApi.getPartnerBasicSetup(
          partnerData.partner_id,
        );

        if (configResponse?.status === "success") {
          partnerConfig = configResponse;
          console.log("✅ Partner config fetched:", {
            header_color: partnerConfig.header_color,
            has_logo: !!partnerConfig.logo_url,
          });

          // ✅ Store partner config for Header - ALWAYS SET THESE
          localStorage.setItem(
            "header_color",
            partnerConfig.header_color || "bg-sky-800",
          );
          localStorage.setItem(
            "text_color",
            partnerConfig.text_color || "text-white",
          );

          // Store logo URL if available
          const logoUrl = partnerConfig.logo_url || partnerData.logo || "";
          if (logoUrl) {
            localStorage.setItem("partner_logo", logoUrl);
            console.log("🖼️ Partner logo stored:", logoUrl);
          }

          // ✅ Store the full partner config as JSON
          localStorage.setItem("partnerConfig", JSON.stringify(partnerConfig));
          localStorage.setItem("partnerConfigTimestamp", Date.now().toString());

          localStorage.setItem(
            "download_operation_manual",
            partnerConfig.download_operation_manual || "N",
          );
          console.log("📢 Dispatching storage event...");
          window.dispatchEvent(new Event("storage"));
        } else {
          console.warn(
            "⚠️ Partner config API returned non-success status, using defaults",
          );
          setDefaultConfig();
        }
      } catch (configError) {
        console.warn(
          "⚠️ Failed to fetch partner config, using defaults:",
          configError,
        );
        setDefaultConfig();
      }

      // Helper function to set default config
      function setDefaultConfig() {
        localStorage.setItem("header_color", "bg-sky-800");
        localStorage.setItem("text_color", "text-white");
        localStorage.setItem("download_operation_manual", "N");
        localStorage.setItem("partnerConfig", JSON.stringify({}));
      }

      // ✅ For non-whitelabelled partners, ensure defaults are set
      if (partnerData.is_white_labelled_partner !== "Y") {
        console.log("🏢 Non-whitelabelled partner, ensuring defaults");
        localStorage.setItem("whitelabelled_customer", "N");

        // Ensure we have header_color and text_color even if not whitelabelled
        if (!localStorage.getItem("header_color")) {
          localStorage.setItem("header_color", "bg-sky-800");
        }
        if (!localStorage.getItem("text_color")) {
          localStorage.setItem("text_color", "text-white");
        }

        // Use partner logo if available
        const defaultLogo = partnerData.logo || "";
        if (defaultLogo && !localStorage.getItem("partner_logo")) {
          localStorage.setItem("partner_logo", defaultLogo);
          console.log("🖼️ Default partner logo stored:", defaultLogo);
        }

        if (!localStorage.getItem("partnerConfig")) {
          localStorage.setItem("partnerConfig", JSON.stringify({}));
        }
      }

      // 6. Fetch GIF images (CENTRALIZED)
      console.log("🖼️ Fetching GIF images...");
      const gifResponse = await centralizedApi.getGifImages();
      const gifImagesData =
        gifResponse.images || gifResponse.data?.images || [];
      console.log(`✅ ${gifImagesData.length} GIF images fetched`);

      // 7. Fetch logout time (CENTRALIZED)
      try {
        console.log("⏰ Fetching logout time...");
        const logoutTimeResponse = await centralizedApi.getLogoutTime();
        const logoutData = logoutTimeResponse.data || logoutTimeResponse;
        const dataExpiryTime = (logoutData.expiry_time || 30) * 60 * 1000;
        localStorage.setItem("logoutTime", dataExpiryTime.toString());
        console.log("✅ Logout time set:", dataExpiryTime, "ms");
      } catch (err) {
        console.warn("⚠️ Failed to fetch logout time, using default (30 mins)");
        localStorage.setItem("logoutTime", (30 * 60 * 1000).toString());
      }

      // ✅ Clean up empty key if it exists
      if (localStorage.getItem("") !== null) {
        localStorage.removeItem("");
        console.log("🧹 Removed empty localStorage key");
      }

      // ✅ Dispatch all data to store
      console.log("📤 Dispatching data to Redux store...");
      dispatch({
        type: "country/fetchCountries/fulfilled",
        payload: countriesData,
      });

      dispatch({
        type: "partner/setPartnerConfig",
        payload: partnerData,
      });

      dispatch({
        type: "ui/setGifImages",
        payload: gifImagesData,
      });

      // ✅ Mark as initialized
      dispatch({ type: "auth/setInitialized", payload: true });

      console.log("🎉 initializeApp completed successfully!");
      debugPartnerDataFlow("after_initialize_complete");

      return {
        hostname,
        countries: countriesData,
        partnerConfig: partnerData,
        gifImages: gifImagesData,
      };
    } catch (error) {
      isInitializing = false;
      const errorMessage = extractErrorMessage(error);
      console.error("❌ initializeApp error:", errorMessage);
      dispatch({ type: "auth/setInitialized", payload: true });
      return rejectWithValue(errorMessage);
    } finally {
      dispatch({ type: "auth/setLoading", payload: false });
      isInitializing = false;
      console.log("🏁 initializeApp finished");
    }
  },
);

// ===================== PASSCODE OPERATIONS =====================
export const generatePasscode = createAsyncThunk(
  "auth/generatePasscode",
  async ({ email, password, customer_type }, { dispatch, rejectWithValue }) => {
    try {
      dispatch({ type: "auth/setIsGeneratingPasscode", payload: true });

      const payload = {
        email,
        password,
        hostname: window.location.hostname,
      };

      if (customer_type) {
        payload.customer_type = customer_type;
      }

      const response = await centralizedApi.requestPasscodeLogin(payload);

      // Handle multiple accounts scenario
      if (
        response.data?.status === "error" &&
        response.data.data?.checkMultipleCustomer === "Y"
      ) {
        dispatch({ type: "auth/setShowCustomerType", payload: "Y" });
        return {
          status: "multiple_accounts",
          message: response.data.message || "Please select customer type",
          requiresCustomerType: true,
        };
      }

      if (response.data?.status === "error") {
        return rejectWithValue(
          response.data.message || "Failed to generate passcode",
        );
      }

      if (response.data?.status === "success") {
        dispatch({ type: "auth/setShowPasscodeInput", payload: true });
        dispatch({ type: "auth/setPasscodeSent", payload: true });
        dispatch({ type: "auth/setPasscode", payload: new Array(6).fill("") });

        return {
          success: true,
          message: response.data.message,
          data: response.data.data,
        };
      }

      return rejectWithValue("Unexpected response format from server");
    } catch (error) {
      if (error.response) {
        const responseData = error.response.data;

        if (
          responseData.status === "error" &&
          responseData.data?.checkMultipleCustomer === "Y"
        ) {
          dispatch({ type: "auth/setShowCustomerType", payload: "Y" });
          return {
            status: "multiple_accounts",
            message: responseData.message || "Please select customer type",
            requiresCustomerType: true,
          };
        }

        if (error.response.status === 401) {
          // ⭐⭐⭐ Handle 401 specifically for request-passcode-login
          return rejectWithValue(
            responseData.message ||
              "Invalid email or password. Please check your credentials.",
          );
        }

        if (error.response.status === 422) {
          if (responseData.data?.checkMultipleCustomer === "Y") {
            dispatch({ type: "auth/setShowCustomerType", payload: "Y" });
            return {
              status: "multiple_accounts",
              message: responseData.message || "Please select customer type",
              requiresCustomerType: true,
            };
          }

          return rejectWithValue(
            responseData.message ||
              "Validation failed. Please check your input.",
          );
        }

        return rejectWithValue(
          responseData.message || "Failed to generate passcode",
        );
      }

      return rejectWithValue(error.message || "Failed to generate passcode");
    } finally {
      dispatch({ type: "auth/setIsGeneratingPasscode", payload: false });
    }
  },
);

export const verifyPasscode = createAsyncThunk(
  "auth/verifyPasscode",
  async (
    { email, passcode, password, sign_in_option, customer_type },
    { dispatch, rejectWithValue },
  ) => {
    try {
      dispatch({ type: "auth/setVerifyingPasscode", payload: true });

      // Validate inputs
      if (!email || !passcode) {
        throw new Error("Email and passcode are required");
      }

      const formattedPasscode = Array.isArray(passcode)
        ? passcode.join("")
        : passcode;

      if (formattedPasscode.length !== 6) {
        throw new Error("Passcode must be 6 digits");
      }

      const payload = {
        email: email.trim().toLowerCase(),
        passcode: formattedPasscode,
        sign_in_option: sign_in_option || "email",
        ...(password && { password: password }),
        hostname: window.location.hostname,
      };

      if (customer_type) {
        payload.customer_type = customer_type;
      }

      console.log("🔍 Making login request with payload:", {
        email: payload.email,
        passcodeLength: formattedPasscode.length,
        hasPassword: !!payload.password,
      });

      const response = await centralizedApi.login(payload);

      console.log("✅ Login API response:", response);

      // ✅ FIXED: Check for both response structures
      if (response.data?.status === "success" && response.data?.data) {
        console.log("✅ Success response with nested data structure");

        const responseData = response.data.data;

        // ✅ CRITICAL CHECK: If kyc_status is "0", user must go through Plaid verification
        // This should ALWAYS trigger redirect to Plaid, not allow login
        if (responseData.kyc_status === "0" || responseData.kyc_status === 0) {
          console.log(
            "🚨 KYC NOT VERIFIED - Redirecting to Plaid verification. User should NOT be logged in.",
          );

          // ✅ IMPORTANT: DO NOT store authentication tokens in localStorage
          // DO NOT set isAuthenticated to true
          // DO NOT update Redux auth state

          // Store temp data for KYC flow ONLY
          sessionStorage.setItem(
            "temp_auth_data",
            JSON.stringify({
              email: email,
              customer_id: responseData.customer_id,
              token: responseData.token,
              timestamp: Date.now(),
              kyc_status: responseData.kyc_status,
              isRemittanceOnlyCustomer:
                responseData.isRemittanceOnlyCustomer || false,
              // Add all necessary data for after KYC completion
              requiresPlaidRedirect: true,
            }),
          );

          // ✅ IMPORTANT: Return a special response that indicates KYC is required
          return {
            status: "kyc_required",
            requiresPlaidRedirect: true,
            plaidUrl: responseData.plaid_url,
            message:
              "KYC verification required. Please complete bank verification to continue.",
            data: responseData,
            shouldNotLogin: true, // CRITICAL FLAG
            closePasscodePopup: true, // NEW: Signal to close popup
          };
        }

        // ✅ If kyc_status is NOT "0", continue with normal login
        console.log("✅ KYC VERIFIED - Proceeding with normal login");

        // ✅ Store authentication tokens ONLY when KYC is verified
        if (responseData.token) {
          localStorage.setItem("authtoken", responseData.token);

          // Also store partner API token if not already present
          const existingBearerToken = localStorage.getItem("bearertoken");
          if (!existingBearerToken) {
            try {
              const bearerToken = await getBearerToken();
              localStorage.setItem("bearertoken", bearerToken);
            } catch (error) {
              console.warn(
                "⚠️ Could not fetch bearer token, user may have limited API access",
              );
            }
          }
        }

        if (responseData.customer_id) {
          localStorage.setItem(
            "authcustomer_id",
            responseData.customer_id.toString(),
          );
        }

        // Store user-specific data
        if (responseData.first_name) {
          localStorage.setItem("firstName", responseData.first_name);
        }

        if (responseData.last_name) {
          localStorage.setItem("lastName", responseData.last_name);
        }

        // ✅ Store whitelabel CUSTOMER info
        if (responseData.whitelabelled_customer) {
          localStorage.setItem(
            "whitelabelled_customer",
            responseData.whitelabelled_customer,
          );
        }

        // ✅ CRITICAL FIX: NEVER OVERWRITE HOSTNAME PARTNER DATA WITH LOGIN DATA
        const hostnamePartnerName = localStorage.getItem(
          "hostname_partner_name",
        );
        const storedPartnerName = localStorage.getItem(
          "whitelabelled_customer_partnername",
        );
        const storedPartnerId = localStorage.getItem("whitelabelledpartnerid");

        const loginPartnerName =
          responseData.whitelabelled_customer_partnername;
        const loginPartnerId = responseData.whitelabelled_customer_partnerid;

        // Only store partner name from login under specific conditions
        const shouldStoreLoginPartnerData = () => {
          if (
            hostnamePartnerName &&
            hostnamePartnerName !== "undefined" &&
            hostnamePartnerName !== "null"
          ) {
            return false;
          }

          if (loginPartnerName === "Unlimited Remit") {
            console.warn(
              "⚠️ Ignoring wrong partner name 'Unlimited Remit' from login response",
            );
            return false;
          }

          if (
            loginPartnerId &&
            storedPartnerId &&
            loginPartnerId.toString() === storedPartnerId.toString() &&
            loginPartnerName &&
            loginPartnerName !== "undefined" &&
            loginPartnerName !== "null"
          ) {
            return true;
          }

          return false;
        };

        if (shouldStoreLoginPartnerData()) {
          localStorage.setItem(
            "whitelabelled_customer_partnername",
            loginPartnerName,
          );
          localStorage.setItem("partner_name", loginPartnerName);
        }

        // ✅ Return the response data for Redux state update
        return {
          ...response.data,
          data: responseData,
          kycVerified: true, // ✅ Add this flag
        };
      }
      // ... rest of the existing code ...
    } catch (error) {
      console.error("❌ Passcode verification error:", error);
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    } finally {
      dispatch({ type: "auth/setVerifyingPasscode", payload: false });
    }
  },
);

// ===================== OTP OPERATIONS =====================
export const generateOTP = createAsyncThunk(
  "auth/generateOTP",
  async (
    { phone_code, mobile_number, password, customer_type },
    { dispatch, rejectWithValue },
  ) => {
    try {
      // ✅ Validate that password is provided
      if (!password || password.trim() === "") {
        return rejectWithValue({
          message: "Password is required for OTP generation",
        });
      }

      const cleanPhoneNumber = mobile_number.replace(/\D/g, "");
      const cleanPhoneCode = phone_code.replace(/\D/g, "");

      // ✅ Password is ALWAYS included
      const payload = {
        country_code: phone_code,
        mobile_number: cleanPhoneNumber,
        password: password, // ✅ ALWAYS INCLUDED
        hostname: window.location.hostname,
      };

      if (customer_type) {
        payload.customer_type = customer_type;
      }

      const response = await centralizedApi.sendOtpLogin(payload);

      // Handle multiple accounts scenario
      if (response.data?.data?.checkMultipleCustomer === "Y") {
        dispatch({ type: "auth/setShowCustomerType", payload: "Y" });
        return {
          status: "multiple_accounts",
          message: response.data.message || "Please select customer type",
          requiresCustomerType: true,
        };
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        const responseData = error.response.data;

        if (
          responseData.status === "error" &&
          responseData.data?.checkMultipleCustomer === "Y"
        ) {
          dispatch({ type: "auth/setShowCustomerType", payload: "Y" });
          return {
            status: "multiple_accounts",
            message: responseData.message || "Please select customer type",
            requiresCustomerType: true,
          };
        }

        // ✅ FIX: Return the full API response object, not just the message
        return rejectWithValue(responseData);
      }

      // If no response, return the full error
      return rejectWithValue({
        message: error.message || "Failed to generate OTP",
      });
    }
  },
);

// ✅ FIXED: OTP verification also preserves hostname partner data
export const verifyOTP = createAsyncThunk(
  "auth/verifyOTP",
  async (
    { phone_code, mobile_number, otp, password, sign_in_option, customer_type },
    { dispatch, rejectWithValue },
  ) => {
    try {
      dispatch({ type: "auth/setVerifyingOtp", payload: true });

      // Clean inputs
      const cleanPhoneCode = phone_code.replace(/\D/g, "");
      const cleanMobileNumber = mobile_number.replace(/\D/g, "");
      const formattedOTP = Array.isArray(otp) ? otp.join("") : otp;

      // Validate inputs
      if (!phone_code || !cleanMobileNumber || !formattedOTP || !password) {
        throw new Error("All fields are required");
      }

      if (formattedOTP.length !== 6) {
        throw new Error("OTP must be 6 digits");
      }

      const payload = {
        mobile_number: cleanMobileNumber,
        otp: formattedOTP,
        password,
        phone_code: phone_code,
        sign_in_option: sign_in_option || "mobile",
        hostname: window.location.hostname,
      };

      if (customer_type) {
        payload.customer_type = customer_type;
      }

      const response = await centralizedApi.login(payload);

      // Handle successful response
      if (response.data?.status === "success") {
        const responseData = response.data.data;

        // ✅ CRITICAL CHECK: If kyc_status is "0", user must go through Plaid verification
        if (responseData.kyc_status === "0" || responseData.kyc_status === 0) {
          console.log(
            "🚨 OTP Login - KYC NOT VERIFIED - User should NOT be logged in.",
          );

          // ✅ IMPORTANT: DO NOT store authentication tokens in localStorage
          // DO NOT set isAuthenticated to true
          // DO NOT update Redux auth state

          // Store temp data for KYC flow ONLY
          sessionStorage.setItem(
            "pending_mobile_auth",
            JSON.stringify({
              phone_code: phone_code,
              mobile_number: cleanMobileNumber,
              customer_id: responseData.customer_id,
              timestamp: Date.now(),
              kyc_status: responseData.kyc_status,
              isRemittanceOnlyCustomer:
                responseData.isRemittanceOnlyCustomer || false,
              requiresPlaidRedirect: true,
            }),
          );

          // ✅ IMPORTANT: Return a special response that indicates KYC is required
          return {
            status: "kyc_required",
            requiresPlaidRedirect: true,
            plaidUrl: responseData.plaid_url,
            message:
              "KYC verification required. Please complete bank verification to continue.",
            data: responseData,
            shouldNotLogin: true, // CRITICAL FLAG
          };
        }

        // ✅ If kyc_status is NOT "0", continue with normal login
        console.log(
          "✅ OTP Login - KYC VERIFIED - Proceeding with normal login",
        );

        // ✅ Store user data in localStorage for Header
        localStorage.setItem("firstName", responseData.first_name || "User");
        localStorage.setItem("lastName", responseData.last_name || "");
        localStorage.setItem(
          "whitelabelled_customer",
          responseData.whitelabelled_customer || "N",
        );
        localStorage.setItem(
          "isRemittanceOnlyCustomer",
          responseData.isRemittanceOnlyCustomer || "N",
        );

        // ✅ DO NOT OVERWRITE HOSTNAME-BASED PARTNER DATA
        const hostnamePartnerName = localStorage.getItem(
          "hostname_partner_name",
        );
        const storedPartnerName = localStorage.getItem(
          "whitelabelled_customer_partnername",
        );
        const storedPartnerId = localStorage.getItem("whitelabelledpartnerid");

        const loginPartnerName =
          responseData.whitelabelled_customer_partnername;
        const loginPartnerId = responseData.whitelabelled_customer_partnerid;

        // Check if we should store the login partner data
        const shouldStoreLoginPartnerData = () => {
          // If we have hostname partner name, NEVER overwrite it
          if (
            hostnamePartnerName &&
            hostnamePartnerName !== "undefined" &&
            hostnamePartnerName !== "null"
          ) {
            return false;
          }

          // If login partner name is "Unlimited Remit", ignore it (wrong data)
          if (loginPartnerName === "Unlimited Remit") {
            console.warn(
              "⚠️ OTP Login: Ignoring wrong partner name 'Unlimited Remit'",
            );
            return false;
          }

          // Only store if partner IDs match and name is valid
          if (
            loginPartnerId &&
            storedPartnerId &&
            loginPartnerId.toString() === storedPartnerId.toString() &&
            loginPartnerName &&
            loginPartnerName !== "undefined" &&
            loginPartnerName !== "null"
          ) {
            return true;
          }

          return false;
        };

        // Only update standard key if conditions are met
        if (shouldStoreLoginPartnerData()) {
          localStorage.setItem(
            "whitelabelled_customer_partnername",
            responseData.whitelabelled_customer_partnername,
          );
          console.log(
            "✅ OTP Login: Stored partner name from login:",
            loginPartnerName,
          );
        } else {
          console.log("✅ OTP Login: Keeping existing partner data");
        }

        // ✅ Store authentication tokens ONLY when KYC is verified
        localStorage.setItem("bearertoken", responseData.token);
        localStorage.setItem("authtoken", responseData.token);
        localStorage.setItem("authcustomer_id", responseData.customer_id);
        localStorage.setItem("kyc_status", responseData.kyc_status);
        localStorage.setItem(
          "bank_approve_status",
          responseData.bank_approve_status,
        );

        // ✅ Store additional user data
        if (responseData.customerUuid) {
          localStorage.setItem("customerUuid", responseData.customerUuid);
        }
        if (responseData.hasSilaBankAccount !== undefined) {
          localStorage.setItem(
            "hasSilaBankAccount",
            responseData.hasSilaBankAccount,
          );
        }
        if (responseData.plaidStatus) {
          localStorage.setItem("plaidStatus", responseData.plaidStatus);
        }

        // ✅ Handle owner login
        if (responseData.is_owner_login === "1") {
          localStorage.setItem("is_owner_login", responseData.is_owner_login);
          localStorage.setItem("owner_id", responseData.owner_id);
          localStorage.setItem("owner_role_name", responseData.owner_role_name);
          localStorage.setItem(
            "staff_role",
            responseData.owner_role_name || "",
          );
          localStorage.setItem("staff_id", responseData.owner_id || "");
        }

        // ✅ Handle staff login
        if (responseData.is_staff_login === "1") {
          localStorage.setItem("is_staff_login", responseData.is_staff_login);
          localStorage.setItem("staff_role", responseData.staff_role || "");
          localStorage.setItem("staff_id", responseData.staff_id || "");
        }

        // ✅ Load partner config AFTER storing user data
        try {
          console.log(
            "🔄 Loading partner config after successful OTP login...",
          );
          await dispatch(initializeApp()).unwrap();
          console.log("✅ Partner config loaded successfully");
        } catch (initError) {
          console.warn(
            "Partner config load failed after OTP login:",
            initError,
          );
          // Continue even if partner config fails
        }

        // Handle Plaid redirect directly from login response
        if (
          response.data?.plaid_status === "success" &&
          response.data?.plaid_url
        ) {
          sessionStorage.setItem(
            "pending_mobile_auth",
            JSON.stringify({
              phone_code: phone_code,
              mobile_number: cleanMobileNumber,
              customer_id: responseData.customer_id,
              timestamp: Date.now(),
            }),
          );

          return {
            requiresPlaidRedirect: true,
            plaidUrl: response.data.plaid_url,
            customerData: responseData,
            message: "Redirecting to bank verification...",
          };
        }

        // ✅ IMPORTANT: Beneficiaries don't need bank approval
        if (
          responseData.beneficaryLogin !== "Y" &&
          responseData.bank_approve_status !== "1"
        ) {
          return {
            requiresBankApproval: true,
            bank_approve_status: responseData.bank_approve_status,
            customerData: responseData,
            message: "Bank account approval pending. Please contact support.",
          };
        }

        // Handle owner login
        if (responseData.is_owner_login === "1") {
          return {
            is_owner_login: true,
            owner_id: responseData.owner_id,
            owner_role_name: responseData.owner_role_name,
            customerData: responseData,
            message: "Owner login successful",
          };
        }

        // Successful login
        return {
          status: "success",
          token: responseData.token,
          customer_id: responseData.customer_id,
          kyc_status: responseData.kyc_status,
          bank_approve_status: responseData.bank_approve_status,
          isRemittanceOnlyCustomer:
            responseData.isRemittanceOnlyCustomer || false,
          customer_type: responseData.customer_type || "individual",
          is_staff_login: responseData.is_staff_login || "0",
          staff_role: responseData.staff_role || "",
          staff_id: responseData.staff_id || "0",
          is_owner_login: responseData.is_owner_login || "0",
          owner_id: responseData.owner_id || "0",
          whitelabelled_customer: responseData.whitelabelled_customer || "N",
          message: response.data.message || "Login successful",
          data: responseData,
        };
      } else {
        throw new Error(response.data?.message || "OTP verification failed");
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      dispatch({ type: "auth/setError", payload: errorMessage });
      return rejectWithValue(errorMessage);
    } finally {
      dispatch({ type: "auth/setVerifyingOtp", payload: false });
    }
  },
);

// ===================== SEND OTP =====================
export const sendOtp = createAsyncThunk(
  "auth/sendOtp",
  async (mobileNumber, { rejectWithValue, dispatch }) => {
    try {
      const response = await centralizedApi.sendOtp(mobileNumber);

      // Fetch OTP counter info after successful OTP send
      if (response.data?.status === "success") {
        try {
          // Note: This endpoint might not be in centralizedApi yet
          // You may need to add it or handle differently
        } catch (otpCounterError) {
          // Continue without OTP counter info - not critical
        }
      }

      if (response.status === 429) {
        return rejectWithValue(
          "Too many requests. Please wait a moment before trying again.",
        );
      }

      if (response.data?.status === "error") {
        return rejectWithValue(response.data.message || "Failed to send OTP");
      }

      // Return success response
      return {
        status: "success",
        message: response.data?.message || "OTP sent successfully",
        data: response.data?.data || {},
      };
    } catch (error) {
      const errorMessage = extractErrorMessage(error);

      // Handle specific error cases
      if (error.response?.status === 429) {
        return rejectWithValue(
          "Too many requests. Please wait before trying again.",
        );
      }

      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      }

      return rejectWithValue(errorMessage || "Failed to send OTP");
    }
  },
);

// ===================== VALIDATE OTP =====================
export const validateOtp = createAsyncThunk(
  "auth/validateOtp",
  async (
    { country_code, mobile_number, otp },
    { dispatch, rejectWithValue },
  ) => {
    try {
      dispatch({ type: "auth/setVerifyingOtp", payload: true });

      const formattedOTP = Array.isArray(otp) ? otp.join("") : otp;
      const currentDateTimeLocal = new Date().toLocaleString();

      // Use the FULL mobile number with country code
      const full_mobile_number = `${country_code} ${mobile_number}`;

      const payload = {
        sign_in_option: "mobile",
        mobile_number: full_mobile_number,
        otp: formattedOTP,
        currentDate: currentDateTimeLocal,
      };

      const response = await centralizedApi.validateOtp(payload);

      // Handle successful response
      if (response.data?.status === "success") {
        const responseData = response.data;

        const successResponse = {
          status: "success",
          kyc_status: responseData.kyc_status,
          plaid_status: responseData.plaid_status,
          plaid_url: responseData.plaid_url,
          token: responseData.token,
          customer_id: responseData.customer_id,
          is_whitelabelled_partner_customer:
            responseData.is_whitelabelled_partner_customer,
          message: responseData.message || "OTP verified successfully!",
          data: responseData.data || responseData,
        };

        // Handle Plaid redirect
        if (responseData.plaid_status === "success" && responseData.plaid_url) {
          sessionStorage.setItem(
            "pending_mobile_auth",
            JSON.stringify({
              country_code: country_code,
              mobile_number: full_mobile_number,
              customer_id: responseData.customer_id,
              timestamp: Date.now(),
            }),
          );

          dispatch({ type: "auth/setOtp", payload: new Array(6).fill("") });
          dispatch({ type: "auth/setShowOtpInput", payload: false });
          dispatch({ type: "auth/setOtpSent", payload: false });

          return {
            ...successResponse,
            redirected: true,
            requiresPlaidRedirect: true,
          };
        }

        if (responseData.kyc_status === 1 || responseData.kyc_status === "1") {
          return successResponse;
        } else {
          return {
            ...successResponse,
            requiresKycVerification: true,
          };
        }
      } else {
        throw new Error(response.data?.message || "OTP verification failed");
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      dispatch({ type: "auth/setError", payload: errorMessage });
      return rejectWithValue({
        status: "error",
        message: errorMessage,
        error: error.response?.data || error.message,
      });
    } finally {
      dispatch({ type: "auth/setVerifyingOtp", payload: false });
    }
  },
);

// ===================== PLAID/KYC OPERATIONS =====================
export const initiatePlaidFlow = createAsyncThunk(
  "auth/initiatePlaid",
  async (customerData, { dispatch, rejectWithValue }) => {
    try {
      dispatch({ type: "auth/setLoading", payload: true });
      dispatch({ type: "auth/setPlaidLoading", payload: true });

      const customerId = customerData.customerId;

      // Enhanced customerId validation
      if (
        !customerId ||
        customerId === "undefined" ||
        customerId === "null" ||
        customerId === "0"
      ) {
        const errorMsg =
          "Invalid customer ID for KYC verification. Please contact support.";
        throw new Error(errorMsg);
      }

      // Note: This endpoint might need to be added to centralizedApi
      // For now, using the base api instance
      const api = (await import("../../services/api")).default;

      let plaidUrl = null;
      let message = null;

      // STRATEGY 1: Try the main backend endpoint
      try {
        const response = await api.get(`/kycs/${customerId}`);
        if (response.data.kyc_url) {
          plaidUrl = response.data.kyc_url;
          message = "Bank verification ready";
        } else {
          throw new Error("No KYC URL in response");
        }
      } catch (backendError) {
        // If customer not found (404), provide specific guidance
        if (backendError.response?.status === 404) {
          const errorMsg =
            "Customer account not found in verification system. This usually means your KYC profile needs to be created. Please contact support.";
          throw new Error(errorMsg);
        }

        // STRATEGY 2: Try alternative endpoint for KYC initiation
        try {
          const initiateResponse = await api.post("/kyc/initiate", {
            customer_id: customerId,
            hostname: window.location.hostname,
          });

          if (initiateResponse.data?.kyc_url || initiateResponse.data?.url) {
            plaidUrl =
              initiateResponse.data.kyc_url || initiateResponse.data.url;
            message = "Bank verification initiated";
          } else {
            throw new Error("No URL in initiation response");
          }
        } catch (initiateError) {
          throw new Error(
            "KYC system temporarily unavailable. Please try again later or contact support.",
          );
        }
      }

      // Final validation
      if (!plaidUrl) {
        throw new Error("Failed to obtain verification link");
      }

      dispatch({
        type: "auth/setPlaidStatus",
        payload: {
          status: "success",
          url: plaidUrl,
          message: message || "Bank verification ready",
        },
      });

      return {
        url: plaidUrl,
        message: message || "Bank verification ready",
        customerId: customerId,
      };
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      dispatch({ type: "auth/setPlaidError", payload: errorMessage });

      return rejectWithValue(errorMessage);
    } finally {
      dispatch({ type: "auth/setLoading", payload: false });
      dispatch({ type: "auth/setPlaidLoading", payload: false });
    }
  },
);

// ===================== MANUAL DOWNLOAD =====================
export const downloadManual = createAsyncThunk(
  "auth/downloadManual",
  async (_, { dispatch, rejectWithValue, getState }) => {
    try {
      dispatch({ type: "auth/setLoading", payload: true });

      const state = getState();
      const partnerId =
        state.partner.config?.partner_id ||
        localStorage.getItem("whitelabelledpartnerid") ||
        "0";

      // Note: This endpoint might need to be added to centralizedApi
      // For now, using the base api instance
      const api = (await import("../../services/api")).default;

      const response = await api.post("/get-manuals", {
        partnerId: partnerId,
        placement: "Login Page",
      });

      if (!response.data?.status === "success") {
        throw new Error("Invalid response format");
      }

      const cleanFilePath = response.data.data.file_path.replace(/\\\//g, "/");
      window.open(cleanFilePath, "_blank");

      return {
        file_path: cleanFilePath,
        title: response.data.data.title || "Manual",
      };
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    } finally {
      dispatch({ type: "auth/setLoading", payload: false });
    }
  },
);

// ===================== USER LOGIN/LOGOUT =====================
export const loginUser = createAsyncThunk(
  "auth/login",
  async (loginData, { dispatch, rejectWithValue }) => {
    try {
      dispatch({ type: "auth/setLoading", payload: true });

      const payload = {
        sign_in_option: loginData.sign_in_option || "email",
        password: loginData.password,
      };

      if (loginData.sign_in_option === "email") {
        payload.email = loginData.email;
        if (loginData.passcode) {
          payload.passcode = Array.isArray(loginData.passcode)
            ? loginData.passcode.join("")
            : loginData.passcode;
        }
      } else {
        payload.phone_code = loginData.phone_code;
        payload.mobile_number = loginData.mobile_number;
        if (loginData.otp) {
          payload.otp = Array.isArray(loginData.otp)
            ? loginData.otp.join("")
            : loginData.otp;
        }
      }

      if (loginData.customer_type) {
        payload.customer_type = loginData.customer_type;
      }

      const response = await centralizedApi.login(payload);

      if (response.data?.status === "success") {
        const responseData = response.data.data || response.data;

        const {
          token: userToken,
          customer_id,
          isRemittanceOnlyCustomer,
          customer_type,
          is_owner_login,
          owner_id,
          owner_role_name,
          kyc_status,
          bank_approve_status,
          plaid_url,
          plaid_link_url,
          beneficaryLogin,
          beneficaryId,
          whitelabelled_customer_partnerid,
          whitelabelled_customer_partnername,
        } = responseData;

        console.log("🔍 loginUser - Response data:", {
          kyc_status,
          token: userToken ? `${userToken.substring(0, 20)}...` : "No token",
          customer_id,
          is_owner_login,
        });

        // ✅ CRITICAL CHECK: If kyc_status is "0", user must go through Plaid verification
        // ✅ EXCEPTION: Beneficiaries don't need KYC
        if (
          (kyc_status === "0" || kyc_status === 0) &&
          beneficaryLogin !== "Y" // Beneficiaries skip KYC
        ) {
          console.log(
            "🚨 Direct Login - KYC NOT VERIFIED - User should NOT be logged in.",
          );

          // Store temp data for KYC flow
          const tempAuthData = {
            email:
              loginData.sign_in_option === "email" ? loginData.email : null,
            phone_code:
              loginData.sign_in_option === "mobile"
                ? loginData.phone_code
                : null,
            mobile_number:
              loginData.sign_in_option === "mobile"
                ? loginData.mobile_number
                : null,
            customer_id,
            token: userToken,
            timestamp: Date.now(),
            kyc_status,
            isRemittanceOnlyCustomer: isRemittanceOnlyCustomer || false,
            plaid_url: plaid_url || plaid_link_url,
            customer_type,
          };

          sessionStorage.setItem(
            "temp_auth_data",
            JSON.stringify(tempAuthData),
          );

          return {
            status: "kyc_required",
            requiresKycVerification: true,
            requiresPlaidRedirect: true,
            plaidUrl: plaid_url || plaid_link_url,
            customer_id,
            message:
              response.data.message ||
              "KYC verification required. Please complete bank verification to continue.",
            shouldNotLogin: true,
            data: responseData,
          };
        }

        // ✅ Handle beneficiary login (no KYC required)
        if (beneficaryLogin === "Y") {
          console.log("✅ Beneficiary login detected - KYC not required");

          // Store beneficiary info
          if (beneficaryId) {
            localStorage.setItem("beneficaryLogin", beneficaryLogin);
            localStorage.setItem("beneficaryId", beneficaryId.toString());
          }

          // Continue with normal login flow
        }

        // ✅ Handle owner login
        if (is_owner_login === "1" || is_owner_login === true) {
          console.log("✅ Owner login detected");
          dispatch({
            type: "auth/setOwnerDetails",
            payload: {
              is_owner_login: true,
              owner_id: owner_id,
              owner_role_name: owner_role_name,
            },
          });

          // Store in localStorage
          localStorage.setItem("is_owner_login", "1");
          localStorage.setItem("owner_id", owner_id || "0");
          localStorage.setItem("owner_role_name", owner_role_name || "");

          return {
            is_owner_login: true,
            owner_id,
            owner_role_name,
            data: responseData,
          };
        }

        // ✅ Check bank approval (non-beneficiaries only)
        if (
          beneficaryLogin !== "Y" &&
          bank_approve_status !== "1" &&
          bank_approve_status !== 1
        ) {
          throw new Error("Bank account not approved. Please contact support.");
        }

        // ✅ Store authentication tokens ONLY when KYC is verified or user is beneficiary
        localStorage.setItem("authtoken", userToken);
        localStorage.setItem("authcustomer_id", customer_id.toString());

        // ✅ DO NOT OVERWRITE HOSTNAME-BASED PARTNER DATA
        const hostnamePartnerName = localStorage.getItem(
          "hostname_partner_name",
        );
        const storedPartnerName = localStorage.getItem(
          "whitelabelled_customer_partnername",
        );
        const storedPartnerId = localStorage.getItem("whitelabelledpartnerid");

        // Only store partner name from login if:
        // 1. We don't have hostname partner name AND
        // 2. The login partner name is NOT "Unlimited Remit" (wrong data)
        // 3. The login partner name actually exists and is valid
        const shouldStoreLoginPartnerData = () => {
          // If we have hostname partner name, NEVER overwrite it
          if (
            hostnamePartnerName &&
            hostnamePartnerName !== "undefined" &&
            hostnamePartnerName !== "null"
          ) {
            return false;
          }

          // If login partner name is "Unlimited Remit", ignore it (wrong data)
          if (whitelabelled_customer_partnername === "Unlimited Remit") {
            console.warn(
              "⚠️ Ignoring wrong partner name 'Unlimited Remit' from login response",
            );
            return false;
          }

          // Only store if partner IDs match and name is valid
          if (
            whitelabelled_customer_partnerid &&
            storedPartnerId &&
            whitelabelled_customer_partnerid.toString() ===
              storedPartnerId.toString() &&
            whitelabelled_customer_partnername &&
            whitelabelled_customer_partnername !== "undefined" &&
            whitelabelled_customer_partnername !== "null"
          ) {
            return true;
          }

          return false;
        };

        if (shouldStoreLoginPartnerData()) {
          console.log(
            "✅ Storing partner name from login response:",
            whitelabelled_customer_partnername,
          );
          localStorage.setItem(
            "whitelabelled_customer_partnername",
            whitelabelled_customer_partnername,
          );
          localStorage.setItem(
            "partner_name",
            whitelabelled_customer_partnername,
          );
        } else {
          console.log(
            "✅ Keeping existing partner data, not overwriting with login data",
          );
        }

        // ✅ Store additional user info
        if (responseData.first_name) {
          localStorage.setItem("firstName", responseData.first_name);
        }
        if (responseData.last_name) {
          localStorage.setItem("lastName", responseData.last_name);
        }

        localStorage.setItem("kyc_status", kyc_status || "1");
        localStorage.setItem("bank_approve_status", bank_approve_status || "1");
        localStorage.setItem(
          "isRemittanceOnlyCustomer",
          isRemittanceOnlyCustomer || "N",
        );
        localStorage.setItem(
          "whitelabelled_customer",
          responseData.whitelabelled_customer || "N",
        );

        // ✅ Create auth state
        const authState = {
          token: userToken,
          customerId: customer_id,
          isAuthenticated: true,
          user: {
            customerType: customer_type || "individual",
            isRemittanceOnlyCustomer: isRemittanceOnlyCustomer || false,
            isBeneficiary: beneficaryLogin === "Y",
            [loginData.sign_in_option === "email" ? "email" : "mobile_number"]:
              loginData.sign_in_option === "email"
                ? loginData.email
                : loginData.mobile_number,
          },
        };

        dispatch({ type: "auth/setAuthState", payload: authState });

        return {
          ...response.data,
          data: {
            ...responseData,
            isRemittanceOnlyCustomer,
            customer_type,
            beneficaryLogin,
            beneficaryId,
            kyc_status,
            bank_approve_status,
          },
          verified: true,
        };
      }

      throw new Error(response.data?.message || "Login failed");
    } catch (error) {
      let errorMessage = extractErrorMessage(error);
      let modalActions = [];
      let isBlocked = false;

      if (error.response) {
        if (error.response.status === 401) {
          if (error.response.data?.error === "invalid_credentials") {
            errorMessage =
              "The email/phone or password you entered is incorrect";
          } else if (error.response.data?.error === "account_locked") {
            errorMessage =
              "Your account has been locked due to multiple failed attempts";
            isBlocked = true;
            modalActions = [
              {
                label: "Contact Support",
                primary: true,
                actionType: "NAVIGATE",
                path: "/contact-support",
              },
            ];
          }
        } else if (error.response.status === 403) {
          errorMessage =
            "Your account is not verified. Please complete verification.";
        }
      }

      dispatch({
        type: "ui/openModal",
        payload: {
          title: "Login Error",
          message: errorMessage,
          type: "error",
          modalProps: isBlocked ? { actions: modalActions } : undefined,
        },
      });

      return rejectWithValue(errorMessage);
    } finally {
      dispatch({ type: "auth/setLoading", payload: false });
    }
  },
);

// export const logoutUser = createAsyncThunk(
//   "auth/logout",
//   async (_, { dispatch, rejectWithValue }) => {
//     try {
//       dispatch({ type: "auth/setLoading", payload: true });

//       await centralizedApi.logout();

//       dispatch({ type: "auth/clearAuthState" });
//       return true;
//     } catch (error) {
//       const errorMessage = extractErrorMessage(error);
//       return rejectWithValue(errorMessage);
//     } finally {
//       dispatch({ type: "auth/setLoading", payload: false });
//     }
//   },
// );

// ===================== SELECTORS =====================
export const selectIsGeneratingPasscode = (state) =>
  state.auth.isGeneratingPasscode;

export const selectIsVerifyingOtp = (state) => state.auth.isVerifyingOtp;
