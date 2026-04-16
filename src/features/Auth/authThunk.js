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

      // ✅ Add customer_type if provided
      if (customer_type) {
        payload.customer_type = customer_type;
        console.log(
          "✅ Adding customer_type to generatePasscode payload:",
          customer_type,
        );
      }

      console.log("🔍 Generate Passcode Request:", {
        email: payload.email,
        hasCustomerType: !!payload.customer_type,
        customerType: payload.customer_type || "not provided",
      });

      const response = await centralizedApi.requestPasscodeLogin(payload);

      // Handle multiple accounts scenario
      if (response.data?.data?.checkMultipleCustomer === "Y") {
        dispatch({ type: "auth/setShowCustomerType", payload: "Y" });

        return {
          status: "multiple_accounts",
          message: response.data.message || "Please select customer type",
          requiresCustomerType: true,
          data: response.data.data,
        };
      }

      if (response.data?.status === "success") {
        dispatch({ type: "auth/setShowPasscodeInput", payload: true });
        dispatch({ type: "auth/setPasscodeSent", payload: true });

        return {
          success: true,
          message: response.data.message || "Passcode sent successfully",
        };
      }

      throw new Error(response.data?.message || "Failed to generate passcode");
    } catch (error) {
      console.error("❌ Generate Passcode Error:", error);
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to generate passcode",
      );
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
        hostname: window.location.hostname,
      };

      // ✅ Add password if it exists
      if (password) {
        payload.password = password;
      }

      // ✅ CRITICAL: Add customer_type to payload
      if (customer_type) {
        payload.customer_type = customer_type;
        console.log(
          "✅ Adding customer_type to verifyPasscode payload:",
          customer_type,
        );
      } else {
        console.log("⚠️ No customer_type provided to verifyPasscode");
      }

      console.log("🔍 Final login payload:", {
        email: payload.email,
        passcodeLength: formattedPasscode.length,
        hasPassword: !!payload.password,
        hasCustomerType: !!payload.customer_type,
        customerType: payload.customer_type || "not provided",
        sign_in_option: payload.sign_in_option,
      });

      const response = await centralizedApi.login(payload);

      console.log("✅ Login API response:", response);

      // ✅ Handle nested response structure
      if (response.data?.status === "success" && response.data?.data) {
        console.log("✅ Success response with nested data structure");

        const responseData = response.data.data;

        // ✅ CRITICAL CHECK: If kyc_status is "0", user must go through Plaid verification
        if (responseData.kyc_status === "0" || responseData.kyc_status === 0) {
          console.log(
            "🚨 KYC NOT VERIFIED - Redirecting to Plaid verification",
          );

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
              customer_type: customer_type, // ✅ Store customer_type
            }),
          );

          return {
            status: "kyc_required",
            requiresPlaidRedirect: true,
            plaidUrl: responseData.plaid_url,
            message:
              "KYC verification required. Please complete bank verification to continue.",
            data: responseData,
            shouldNotLogin: true,
            closePasscodePopup: true,
          };
        }

        // ✅ If kyc_status is NOT "0", continue with normal login
        console.log("✅ KYC VERIFIED - Proceeding with normal login");

        // ✅ Store authentication tokens
        if (responseData.token) {
          localStorage.setItem("authtoken", responseData.token);

          const existingBearerToken = localStorage.getItem("bearertoken");
          if (!existingBearerToken) {
            try {
              const bearerToken = await getBearerToken();
              localStorage.setItem("bearertoken", bearerToken);
            } catch (error) {
              console.warn("⚠️ Could not fetch bearer token");
            }
          }
        }

        if (responseData.customer_id) {
          localStorage.setItem(
            "authcustomer_id",
            responseData.customer_id.toString(),
          );
        }

        if (responseData.first_name) {
          localStorage.setItem("firstName", responseData.first_name);
        }

        if (responseData.last_name) {
          localStorage.setItem("lastName", responseData.last_name);
        }

        if (responseData.whitelabelled_customer) {
          localStorage.setItem(
            "whitelabelled_customer",
            responseData.whitelabelled_customer,
          );
        }

        // ✅ Store customer_type if received from API
        if (responseData.customer_type) {
          localStorage.setItem("customer_type", responseData.customer_type);
        } else if (customer_type) {
          localStorage.setItem("customer_type", customer_type);
        }

        // ✅ Store remittance flag
        if (responseData.isRemittanceOnlyCustomer) {
          localStorage.setItem(
            "isRemittanceOnlyCustomer",
            responseData.isRemittanceOnlyCustomer === "Y" ? "Y" : "N",
          );
        }

        // ✅ Return the response data for Redux state update
        return {
          ...response.data,
          data: responseData,
          kycVerified: true,
          customer_type: customer_type || responseData.customer_type,
        };
      }

      // Handle regular response structure
      if (response.data?.status === "success") {
        return response.data;
      }

      throw new Error(response.data?.message || "Login failed");
    } catch (error) {
      console.error("❌ Passcode verification error:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Verification failed";
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
      const cleanPhoneNumber = mobile_number.replace(/\D/g, "");

      const payload = {
        country_code: phone_code,
        mobile_number: cleanPhoneNumber,
        password: password, // ✅ Include password
        hostname: window.location.hostname,
      };

      // ✅ Add customer_type if provided
      if (customer_type) {
        payload.customer_type = customer_type;
        console.log(
          "✅ Adding customer_type to generateOTP payload:",
          customer_type,
        );
      }

      console.log("🔍 Generate OTP Request:", {
        mobile_number: payload.mobile_number,
        hasPassword: !!payload.password,
        hasCustomerType: !!payload.customer_type,
        customerType: payload.customer_type || "not provided",
      });

      const response = await centralizedApi.sendOtpLogin(payload);

      // Handle multiple accounts scenario
      if (response.data?.data?.checkMultipleCustomer === "Y") {
        dispatch({ type: "auth/setShowCustomerType", payload: "Y" });

        return {
          status: "multiple_accounts",
          message: response.data.message || "Please select customer type",
          requiresCustomerType: true,
          data: response.data.data,
        };
      }

      if (response.data?.status === "success") {
        return {
          status: "success",
          message: response.data.message || "OTP sent successfully",
        };
      }

      throw new Error(response.data?.message || "Failed to generate OTP");
    } catch (error) {
      console.error("❌ Generate OTP Error:", error);
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to generate OTP",
      );
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
        password: password,
        phone_code: phone_code,
        sign_in_option: sign_in_option || "mobile",
        hostname: window.location.hostname,
      };

      // ✅ CRITICAL: Add customer_type to payload
      if (customer_type) {
        payload.customer_type = customer_type;
        console.log(
          "✅ Adding customer_type to verifyOTP payload:",
          customer_type,
        );
      } else {
        console.log("⚠️ No customer_type provided to verifyOTP");
      }

      console.log("🔍 OTP Verification payload:", {
        mobile_number: payload.mobile_number,
        otpLength: formattedOTP.length,
        hasPassword: !!payload.password,
        hasCustomerType: !!payload.customer_type,
        customerType: payload.customer_type || "not provided",
      });

      const response = await centralizedApi.login(payload);
      console.log("✅ verifyOTP - Login API response:", response);

      // Handle successful response
      if (response.data?.status === "success") {
        const responseData = response.data.data || response.data;

        // ✅ CRITICAL CHECK: If kyc_status is "0", user must go through Plaid verification
        if (responseData.kyc_status === "0" || responseData.kyc_status === 0) {
          console.log("🚨 OTP Login - KYC NOT VERIFIED");

          sessionStorage.setItem(
            "temp_auth_data",
            JSON.stringify({
              phone_code: phone_code,
              mobile_number: cleanMobileNumber,
              customer_id: responseData.customer_id,
              timestamp: Date.now(),
              kyc_status: responseData.kyc_status,
              isRemittanceOnlyCustomer:
                responseData.isRemittanceOnlyCustomer || false,
              customer_type: customer_type, // ✅ Store customer_type
            }),
          );

          return {
            status: "kyc_required",
            requiresPlaidRedirect: true,
            plaidUrl: responseData.plaid_url,
            message:
              "KYC verification required. Please complete bank verification to continue.",
            data: responseData,
            shouldNotLogin: true,
          };
        }

        // ✅ Store customer_type
        if (responseData.customer_type) {
          localStorage.setItem("customer_type", responseData.customer_type);
        } else if (customer_type) {
          localStorage.setItem("customer_type", customer_type);
        }

        return {
          status: "success",
          token: responseData.token,
          customer_id: responseData.customer_id,
          kyc_status: responseData.kyc_status,
          bank_approve_status: responseData.bank_approve_status,
          isRemittanceOnlyCustomer:
            responseData.isRemittanceOnlyCustomer || false,
          customer_type: customer_type || responseData.customer_type,
          data: responseData,
        };
      } else {
        throw new Error(response.data?.message || "OTP verification failed");
      }
    } catch (error) {
      console.error("❌ OTP Verification Error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "OTP verification failed";
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
        hostname: window.location.hostname,
      };

      // Add password if exists
      if (loginData.password) {
        payload.password = loginData.password;
      }

      // Handle email login
      if (loginData.sign_in_option === "email") {
        if (loginData.email) {
          payload.email = loginData.email;
        }
        if (loginData.passcode) {
          payload.passcode = Array.isArray(loginData.passcode)
            ? loginData.passcode.join("")
            : loginData.passcode;
        }
      }
      // Handle mobile login
      else {
        if (loginData.phone_code) {
          payload.phone_code = loginData.phone_code;
        }
        if (loginData.mobile_number) {
          payload.mobile_number = loginData.mobile_number;
        }
        if (loginData.otp) {
          payload.otp = Array.isArray(loginData.otp)
            ? loginData.otp.join("")
            : loginData.otp;
        }
      }

      // ✅ CRITICAL: Add customer_type to payload
      if (loginData.customer_type) {
        payload.customer_type = loginData.customer_type;
        console.log(
          "✅ Adding customer_type to loginUser payload:",
          loginData.customer_type,
        );
      }

      console.log("🔍 loginUser payload:", {
        sign_in_option: payload.sign_in_option,
        hasEmail: !!payload.email,
        hasMobile: !!payload.mobile_number,
        hasPasscode: !!payload.passcode,
        hasOtp: !!payload.otp,
        hasCustomerType: !!payload.customer_type,
        customerType: payload.customer_type || "not provided",
      });

      const response = await centralizedApi.login(payload);

      if (response.data?.status === "success") {
        const responseData = response.data.data || response.data;

        // Store customer_type
        if (responseData.customer_type) {
          localStorage.setItem("customer_type", responseData.customer_type);
        } else if (loginData.customer_type) {
          localStorage.setItem("customer_type", loginData.customer_type);
        }

        return {
          ...response.data,
          data: responseData,
          verified: true,
          customer_type: loginData.customer_type || responseData.customer_type,
        };
      }

      throw new Error(response.data?.message || "Login failed");
    } catch (error) {
      console.error("❌ Login error:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Login failed";
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
