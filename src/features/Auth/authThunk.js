import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import axios from "axios";
import { openModal } from "./slices/uiSlice";
import { extractErrorMessage } from "../../utils/errorHandling";

// ===================== TOKEN MANAGEMENT =====================
let tokenPromise = null;
let tokenExpiryTime = 0;
const TOKEN_EXPIRY_BUFFER = 300;

export const getBearerToken = async () => {
  const now = Date.now() / 1000;
  const existingToken = localStorage.getItem("bearertoken");

  if (existingToken) {
    try {
      const payload = JSON.parse(atob(existingToken.split(".")[1]));
      const isExpired = payload.exp && payload.exp < now + TOKEN_EXPIRY_BUFFER;

      if (!isExpired) {
        tokenExpiryTime = payload.exp;
        return existingToken;
      }
    } catch (error) {
      console.warn("Token validation failed, getting new token");
    }
  }

  if (tokenPromise) {
    return tokenPromise;
  }

  try {
    tokenPromise = axios
      .post(`${import.meta.env.VITE_API_URL}/partner-login`, {
        client_id: "HK6V7709",
        client_secret: "057d433a-2d02-437b-a265-56114567aa44",
      })
      .then((response) => {
        const newToken = response.data.data.token;
        localStorage.setItem("bearertoken", newToken);

        try {
          const payload = JSON.parse(atob(newToken.split(".")[1]));
          tokenExpiryTime = payload.exp;
        } catch (error) {
          tokenExpiryTime = now + 3600;
        }

        return newToken;
      })
      .finally(() => {
        tokenPromise = null;
      });

    return await tokenPromise;
  } catch (error) {
    tokenPromise = null;
    throw new Error("Failed to obtain authentication token");
  }
};

// ===================== ERROR HANDLING =====================
export const handleApiError = (error, dispatch = null) => {
  // ✅ FIX: Use the extractErrorMessage utility
  let errorMessage = extractErrorMessage(error);

  if (error.response) {
    switch (error.response.status) {
      case 401:
        errorMessage = "Session expired. Please login again.";
        localStorage.removeItem("authtoken");
        localStorage.removeItem("authcustomer_id");
        localStorage.removeItem("bearertoken");
        window.location.href = "/";
        break;
      case 403:
        errorMessage = "You don't have permission for this action";
        break;
      case 429:
        errorMessage = "Too many requests. Please try again later.";
        break;
      // Keep other cases but use the extracted message as base
    }
  }

  if (dispatch) {
    dispatch({ type: "auth/setError", payload: errorMessage });
    dispatch({
      type: "ui/openModal",
      payload: {
        title: "Error",
        message: errorMessage, // ✅ Now this is always a string
        type: "error",
      },
    });
  }

  return errorMessage;
};

// ===================== CACHE MANAGEMENT =====================
const apiCache = {
  countries: null,
  partnerConfig: null,
  gifImages: null,
  partnerDetail: null,
};

// ===================== APP INITIALIZATION =====================
let isInitializing = false;

export const initializeApp = createAsyncThunk(
  "auth/initializeApp",
  async (_, { dispatch, rejectWithValue, getState }) => {
    const state = getState();
    if (isInitializing || state.auth.isInitialized) {
      return;
    }

    isInitializing = true;

    try {
      dispatch({ type: "auth/setLoading", payload: true });

      // 1. Initialize hostname
      const hostname = window.location.hostname;
      dispatch({ type: "hostname/setHostname", payload: hostname });

      // 2. Fetch client token
      let bearerToken;
      try {
        bearerToken = await getBearerToken();
        localStorage.setItem("bearertoken", bearerToken);
      } catch (tokenError) {
        console.error("Token fetch failed:", tokenError);
        throw new Error("Failed to establish secure connection");
      }

      // 3. Check cache first for countries
      let countriesData;
      if (apiCache.countries) {
        countriesData = apiCache.countries;
      } else {
        const countriesResponse = await api.get("/countries", {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        });
        countriesData = countriesResponse.data.data;
        apiCache.countries = countriesData;
        localStorage.setItem("allcountries", JSON.stringify(countriesData));
      }

      // 4. Fetch partner details with caching
      let partnerData;
      if (apiCache.partnerDetail) {
        partnerData = apiCache.partnerDetail;
      } else {
        const partnerResponse = await api.get(
          `/partners/get-partner-detail/${hostname}`,
          {
            headers: {
              Authorization: `Bearer ${bearerToken}`,
            },
          }
        );
        partnerData = partnerResponse.data.data;
        apiCache.partnerDetail = partnerData;
      }

      // Store partner details in localStorage
      localStorage.setItem(
        "iswhitelabelledpartner",
        partnerData.is_white_labelled_partner
      );
      localStorage.setItem("whitelabelledpartnerid", partnerData.partner_id);
      localStorage.setItem(
        "isPartnerPackageModule",
        partnerData.isPartnerPackageModule
      );
      localStorage.setItem(
        "showRemittanceOnlyOnRegistration",
        partnerData.showRemittanceOnlyOnRegistration
      );

      // 5. Fetch partner config if white labelled
      if (partnerData.is_white_labelled_partner === "Y") {
        let partnerConfig;
        if (apiCache.partnerConfig) {
          partnerConfig = apiCache.partnerConfig;
        } else {
          const configResponse = await api.get(
            `/partner-basic-setup/${partnerData.partner_id}`,
            {
              headers: {
                Authorization: `Bearer ${bearerToken}`,
              },
            }
          );

          if (configResponse.data?.status === "success") {
            partnerConfig = configResponse.data;
            apiCache.partnerConfig = partnerConfig;

            localStorage.setItem("header_color", partnerConfig.header_color);
            localStorage.setItem(
              "download_operation_manual",
              partnerConfig.download_operation_manual
            );
            window.dispatchEvent(new Event("storage"));
          }
        }
      }

      // 6. Fetch GIF images with caching
      let gifImagesData;
      if (apiCache.gifImages) {
        gifImagesData = apiCache.gifImages;
      } else {
        const gifResponse = await api.get("/gif-images", {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        });
        gifImagesData = gifResponse.data.images || [];
        apiCache.gifImages = gifImagesData;
      }

      // 7. Fetch logout time
      try {
        const logoutTimeResponse = await api.get("/logout-time", {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        });
        const dataExpiryTime = logoutTimeResponse.data.expiry_time * 60 * 1000;
        localStorage.setItem("logoutTime", dataExpiryTime);
      } catch (err) {
        console.log("Failed to fetch timer setup");
      }

      // Dispatch the fetchCountries thunk
      dispatch({
        type: "country/fetchCountries/fulfilled",
        payload: countriesData,
      });

      // Dispatch partner config to store
      dispatch({
        type: "partner/setPartnerConfig",
        payload: partnerData,
      });

      // Dispatch GIF images to store
      dispatch({
        type: "ui/setGifImages",
        payload: gifImagesData,
      });

      // Mark as initialized
      dispatch({ type: "auth/setInitialized", payload: true });

      return {
        hostname,
        countries: countriesData,
        partnerConfig: partnerData,
        gifImages: gifImagesData,
      };
    } catch (error) {
      isInitializing = false;
      // ✅ FIX: Use extractErrorMessage for consistent error handling
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    } finally {
      dispatch({ type: "auth/setLoading", payload: false });
      isInitializing = false;
    }
  }
);

// ===================== PASSCODE OPERATIONS =====================
export const generatePasscode = createAsyncThunk(
  "auth/generatePasscode",
  async ({ email, password, customer_type }, { dispatch, rejectWithValue }) => {
    try {
      dispatch({ type: "auth/setIsGeneratingPasscode", payload: true });

      const token = await getBearerToken();
      const payload = {
        email,
        password,
        hostname: window.location.hostname,
      };

      if (customer_type) {
        payload.customer_type = customer_type;
      }

      const response = await api.post("/request-passcode-login", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("API Response:", response.data);

      // Handle multiple accounts scenario
      if (
        response.data.status === "error" &&
        response.data.data?.checkMultipleCustomer === "Y"
      ) {
        dispatch({ type: "auth/setShowCustomerType", payload: "Y" });
        return {
          status: "multiple_accounts",
          message: response.data.message || "Please select customer type",
          requiresCustomerType: true,
        };
      }

      if (response.data.status === "error") {
        // ✅ FIX: Return string error message
        return rejectWithValue(response.data.message || "Failed to generate passcode");
      }

      if (response.data.status === "success") {
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
      console.error("Passcode generation error:", error);

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

        if (error.response.status === 422) {
          if (responseData.data?.checkMultipleCustomer === "Y") {
            dispatch({ type: "auth/setShowCustomerType", payload: "Y" });
            return {
              status: "multiple_accounts",
              message: responseData.message || "Please select customer type",
              requiresCustomerType: true,
            };
          }

          // ✅ FIX: Return string error message
          return rejectWithValue(
            responseData.message || "Validation failed. Please check your input."
          );
        }

        // ✅ FIX: Return string error message
        return rejectWithValue(
          responseData.message || "Failed to generate passcode"
        );
      }

      // ✅ FIX: Return string error message
      return rejectWithValue(
        error.message || "Failed to generate passcode"
      );
    } finally {
      dispatch({ type: "auth/setIsGeneratingPasscode", payload: false });
    }
  }
);

export const verifyPasscode = createAsyncThunk(
  "auth/verifyPasscode",
  async (
    { email, passcode, password, sign_in_option, customer_type },
    { dispatch, rejectWithValue }
  ) => {
    try {
      dispatch({ type: "auth/setVerifyingPasscode", payload: true });

      console.log('🔍 [verifyPasscode] Starting verification with:', {
        email,
        passcodeLength: passcode?.length,
        sign_in_option,
        hasPassword: !!password
      });

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

      // Get bearer token
      const token = await getBearerToken();

      // ✅ CRITICAL FIX: Use the correct payload structure
      const payload = {
        email: email.trim().toLowerCase(),
        passcode: formattedPasscode,
        sign_in_option: sign_in_option || "email",
        // Only include password if provided (for initial login)
        ...(password && { password: password }),
        hostname: window.location.hostname,
      };

      // Add customer_type if provided
      if (customer_type) {
        payload.customer_type = customer_type;
      }

      console.log('📤 [verifyPasscode] Sending payload:', {
        ...payload,
        password: password ? '***' : 'not provided'
      });

      const response = await api.post("/login", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log('✅ [verifyPasscode] Login API Response:', response.data);

      // ✅ Handle successful login response
      if (response.data?.status === "success" && response.data?.data) {
        const responseData = response.data.data;

        console.log('🔍 [verifyPasscode] Success response data:', responseData);

        // ✅ Handle KYC verification required
        if (responseData.kyc_status === "0" || responseData.kyc_status === 0) {
          console.log('🚫 [verifyPasscode] KYC NOT VERIFIED - Blocking login');

          // ✅ CASE 1: Plaid URL is directly provided - redirect to Plaid
          if (responseData.plaid_status === "success" && responseData.plaid_url) {
            console.log('✅ Redirecting to Plaid for KYC verification');
            return {
              requiresPlaidRedirect: true,
              plaidUrl: responseData.plaid_url,
              customerData: responseData,
              customer_id: responseData.customer_id,
              kyc_status: responseData.kyc_status,
              bank_approve_status: responseData.bank_approve_status,
              message: "KYC verification required - redirecting to bank verification"
            };
          }

          // ✅ CASE 2: Try to initiate Plaid flow
          console.log('🔄 Attempting to initiate Plaid flow for KYC verification');
          try {
            const plaidResponse = await dispatch(
              initiatePlaidFlow({
                customerId: responseData.customer_id,
                hostname: window.location.hostname,
              })
            ).unwrap();

            if (plaidResponse.url) {
              console.log('✅ Plaid URL obtained, redirecting for KYC verification');
              return {
                requiresPlaidRedirect: true,
                plaidUrl: plaidResponse.url,
                customerData: responseData,
                customer_id: responseData.customer_id,
                kyc_status: responseData.kyc_status,
                bank_approve_status: responseData.bank_approve_status,
                message: "KYC verification required - redirecting to bank verification"
              };
            } else {
              throw new Error("No Plaid URL received for KYC verification");
            }
          } catch (plaidError) {
            console.error('❌ Plaid initiation failed:', plaidError);

            // Provide specific error message
            let errorMessage = "KYC verification required but unable to start the process. ";
            if (plaidError.message?.includes("Customer account not found")) {
              errorMessage += "Your account needs KYC profile setup. Please contact support.";
            } else {
              errorMessage += "Please contact support.";
            }

            throw new Error(errorMessage);
          }
        }

        // ✅ Handle owner login (bypass KYC check for owners)
        if (responseData.is_owner_login === "1") {
          console.log('👑 Owner login detected - bypassing KYC check');
          return {
            is_owner_login: true,
            owner_id: responseData.owner_id,
            owner_role_name: responseData.owner_role_name,
            kyc_status: responseData.kyc_status,
            bank_approve_status: responseData.bank_approve_status,
            customer_id: responseData.customer_id,
            token: responseData.token,
            customerData: responseData
          };
        }

        // ✅ Handle bank approval status
        if (responseData.bank_approve_status !== "1") {
          throw new Error("Bank account not approved. Please contact support.");
        }

        // ✅ ONLY allow login if KYC is verified (status not 0) and bank is approved
        console.log('✅ KYC verified - allowing login');
        return {
          token: responseData.token,
          customer_id: responseData.customer_id,
          kyc_status: responseData.kyc_status,
          bank_approve_status: responseData.bank_approve_status,
          isRemittanceOnlyCustomer: responseData.isRemittanceOnlyCustomer || false,
          customer_type: responseData.customer_type || "individual",
          is_staff_login: responseData.is_staff_login || "0",
          staff_role: responseData.staff_role || "",
          staff_id: responseData.staff_id || "0",
          is_owner_login: responseData.is_owner_login || "0",
          owner_id: responseData.owner_id || "0",
          whitelabelled_customer: responseData.whitelabelled_customer || "N",
          whitelabelled_customer_partnerid: responseData.whitelabelled_customer_partnerid || "0",
          whitelabelled_customer_partnername: responseData.whitelabelled_customer_partnername || "",
          customerUuid: responseData.customerUuid || null,
          message: "Login successful"
        };
      }

      // Handle non-success responses
      if (response.data?.status === "error") {
        // Provide specific error messages based on the response
        let errorMessage = response.data.message || "Login failed";

        if (errorMessage.includes("Invalid passcode") || errorMessage.includes("Invalid credentials")) {
          errorMessage = "Invalid passcode. Please check the code and try again.";
        } else if (errorMessage.includes("expired")) {
          errorMessage = "Passcode has expired. Please request a new one.";
        }

        throw new Error(errorMessage);
      }

      throw new Error("Invalid server response format");

    } catch (error) {
      console.error("❌ [verifyPasscode] Verification failed:", error);

      // ✅ FIX: Use extractErrorMessage for consistent error handling
      const errorMessage = extractErrorMessage(error);

      return rejectWithValue(errorMessage);
    } finally {
      dispatch({ type: "auth/setVerifyingPasscode", payload: false });
    }
  }
);

// ===================== OTP OPERATIONS =====================
export const generateOTP = createAsyncThunk(
  "auth/generateOTP",
  async ({ phone_code, mobile_number, customer_type }, { dispatch, rejectWithValue }) => {
    try {
      const cleanPhoneNumber = mobile_number.replace(/\D/g, "");
      const cleanPhoneCode = phone_code.replace(/\D/g, "");

      const token = await getBearerToken();
      const payload = {
        country_code: cleanPhoneCode,
        mobile_number: cleanPhoneNumber,
        hostname: window.location.hostname,
      };

      if (customer_type) {
        payload.customer_type = customer_type;
      }

      const response = await api.post("/send-otp-login", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
      }

      // ✅ FIX: Use extractErrorMessage for consistent error handling
      const apiError = extractErrorMessage(error);
      return rejectWithValue(apiError);
    }
  }
);

export const verifyOTP = createAsyncThunk(
  "auth/verifyOTP",
  async (
    { phone_code, mobile_number, otp, password, sign_in_option, customer_type },
    { dispatch, rejectWithValue }
  ) => {
    try {
      dispatch({ type: "auth/setVerifyingOtp", payload: true });

      // Clean inputs
      const cleanPhoneCode = phone_code.replace(/\D/g, "");
      const cleanMobileNumber = mobile_number.replace(/\D/g, "");
      const formattedOTP = Array.isArray(otp) ? otp.join("") : otp;

      // Validate inputs
      if (!cleanPhoneCode || !cleanMobileNumber || !formattedOTP || !password) {
        throw new Error("All fields are required");
      }

      if (formattedOTP.length !== 6) {
        throw new Error("OTP must be 6 digits");
      }

      const token = await getBearerToken();

      const payload = {
        mobile_number: cleanMobileNumber,
        otp: formattedOTP,
        password,
        phone_code: cleanPhoneCode,
        sign_in_option: sign_in_option || "mobile",
        hostname: window.location.hostname,
      };

      if (customer_type) {
        payload.customer_type = customer_type;
      }

      const response = await api.post("/login", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('✅ OTP verification response:', response.data);

      // Handle successful response
      if (response.data.status === "success") {
        const responseData = response.data.data;

        // Handle Plaid redirect directly from login response
        if (response.data?.plaid_status === "success" && response.data?.plaid_url) {
          console.log('🎯 Redirecting to Plaid from login response');

          sessionStorage.setItem(
            "pending_mobile_auth",
            JSON.stringify({
              phone_code: cleanPhoneCode,
              mobile_number: cleanMobileNumber,
              customer_id: responseData.customer_id,
              timestamp: Date.now()
            })
          );

          return {
            requiresPlaidRedirect: true,
            plaidUrl: response.data.plaid_url,
            customerData: responseData,
            message: "Redirecting to bank verification..."
          };
        }

        // Handle KYC verification required
        if (responseData.kyc_status === "0" || responseData.kyc_status === 0) {
          console.log('🎯 KYC verification required, initiating Plaid flow');

          sessionStorage.setItem(
            "pending_mobile_auth",
            JSON.stringify({
              phone_code: cleanPhoneCode,
              mobile_number: cleanMobileNumber,
              customer_id: responseData.customer_id,
              timestamp: Date.now()
            })
          );

          try {
            const plaidResponse = await dispatch(
              initiatePlaidFlow({
                customerId: responseData.customer_id,
                hostname: window.location.hostname,
              })
            ).unwrap();

            if (plaidResponse.url) {
              return {
                requiresPlaidRedirect: true,
                plaidUrl: plaidResponse.url,
                customerData: responseData,
                message: "Redirecting to bank verification..."
              };
            }
          } catch (plaidError) {
            console.error('❌ Plaid initiation failed:', plaidError);
            return {
              requiresKycVerification: true,
              kyc_status: responseData.kyc_status,
              bank_approve_status: responseData.bank_approve_status,
              customerData: responseData,
              message: "Bank verification required but setup failed. Please contact support."
            };
          }
        }

        // Handle bank approval
        if (responseData.bank_approve_status !== "1") {
          return {
            requiresBankApproval: true,
            bank_approve_status: responseData.bank_approve_status,
            customerData: responseData,
            message: "Bank account approval pending. Please contact support."
          };
        }

        // Handle owner login
        if (responseData.is_owner_login === "1") {
          return {
            is_owner_login: true,
            owner_id: responseData.owner_id,
            owner_role_name: responseData.owner_role_name,
            customerData: responseData,
            message: "Owner login successful"
          };
        }

        // Successful login
        return {
          status: "success",
          token: responseData.token,
          customer_id: responseData.customer_id,
          kyc_status: responseData.kyc_status,
          bank_approve_status: responseData.bank_approve_status,
          isRemittanceOnlyCustomer: responseData.isRemittanceOnlyCustomer || false,
          customer_type: responseData.customer_type || "individual",
          message: response.data.message || "Login successful",
          data: responseData
        };
      } else {
        throw new Error(response.data.message || "OTP verification failed");
      }

    } catch (error) {
      console.error("❌ OTP verification failed:", error);

      // ✅ FIX: Use extractErrorMessage for consistent error handling
      const errorMessage = extractErrorMessage(error);

      dispatch({ type: "auth/setError", payload: errorMessage });
      return rejectWithValue(errorMessage);
    } finally {
      dispatch({ type: "auth/setVerifyingOtp", payload: false });
    }
  }
);

// ===================== SEND OTP =====================
export const sendOtp = createAsyncThunk(
  "auth/sendOtp",
  async (mobileNumber, { rejectWithValue }) => {
    try {
      const token = await getBearerToken();
      const response = await api.post(
        "/send-otp",
        {
          mobile_number: mobileNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 429) {
        return rejectWithValue(
          "Too many requests. Please wait a moment before trying again."
        );
      }

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Failed to Generate OTP");
      }
      return await response.json();
    } catch (error) {
      // ✅ FIX: Use extractErrorMessage for consistent error handling
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    }
  }
);

// ===================== VALIDATE OTP (for PhoneVerification component) =====================
export const validateOtp = createAsyncThunk(
  "auth/validateOtp",
  async (
    { phone_code, mobile_number, otp, password, sign_in_option, customer_type },
    { dispatch, rejectWithValue }
  ) => {
    try {
      dispatch({ type: "auth/setVerifyingOtp", payload: true });

      console.log('🔄 validateOtp thunk called with:', {
        phone_code,
        mobile_number,
        otp,
        sign_in_option
      });

      // Clean inputs
      const cleanPhoneCode = phone_code ? phone_code.replace(/\D/g, "") : "";
      const cleanMobileNumber = mobile_number ? mobile_number.replace(/\D/g, "") : "";
      const formattedOTP = Array.isArray(otp) ? otp.join("") : otp;

      // Validate inputs
      if (!cleanMobileNumber || !formattedOTP || !password) {
        throw new Error("Mobile number, OTP and password are required");
      }

      if (formattedOTP.length !== 6) {
        throw new Error("OTP must be 6 digits");
      }

      const token = await getBearerToken();

      // Use the correct endpoint and payload structure
      const payload = {
        mobile_number: cleanMobileNumber,
        otp: formattedOTP,
        password: password,
        phone_code: cleanPhoneCode,
        sign_in_option: sign_in_option || "mobile",
        hostname: window.location.hostname,
      };

      console.log('📤 Sending OTP verification request:', payload);

      const response = await api.post("/login", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log('✅ OTP verification response:', response.data);

      // Check if response indicates success
      if (response.data.status === "success") {
        const responseData = response.data.data;

        // Handle Plaid redirect if needed
        const handlePlaidRedirect = (url, customerData) => {
          sessionStorage.setItem(
            "pending_mobile_auth",
            JSON.stringify({
              phone_code: cleanPhoneCode,
              mobile_number: cleanMobileNumber,
              customer_id: customerData.customer_id,
            })
          );

          dispatch({ type: "auth/setOtp", payload: new Array(6).fill("") });
          dispatch({ type: "auth/setShowOtpInput", payload: false });
          dispatch({ type: "auth/setOtpSent", payload: false });

          return {
            redirected: true,
            plaid_url: url,
            customer_id: customerData.customer_id,
            message: "Redirecting to bank verification..."
          };
        };

        // Check for Plaid redirect
        if (
          response.data?.plaid_status === "success" &&
          response.data?.plaid_url
        ) {
          return handlePlaidRedirect(response.data.plaid_url, responseData);
        }

        // Handle KYC verification flow
        if (responseData.kyc_status === "0" || responseData.kyc_status === 0) {
          if (responseData.plaid_status === "success" && responseData.plaid_url) {
            return handlePlaidRedirect(responseData.plaid_url, responseData);
          }

          try {
            const plaidResponse = await dispatch(
              initiatePlaidFlow({
                customerId: responseData.customer_id,
                hostname: window.location.hostname,
              })
            ).unwrap();

            if (plaidResponse.url) {
              return handlePlaidRedirect(plaidResponse.url, responseData);
            }
            throw new Error("No Plaid URL received");
          } catch (plaidError) {
            console.error("Plaid initiation failed:", plaidError);
            return {
              requiresKycVerification: true,
              kyc_status: responseData.kyc_status,
              bank_approve_status: responseData.bank_approve_status,
              message: "Bank verification required but setup failed",
            };
          }
        }

        // Handle bank approval
        if (responseData.bank_approve_status !== "1") {
          return {
            requiresBankApproval: true,
            bank_approve_status: responseData.bank_approve_status,
            message: "Bank account approval pending",
          };
        }

        // Handle owner login
        if (responseData.is_owner_login === "1") {
          return {
            is_owner_login: true,
            owner_id: responseData.owner_id,
            owner_role_name: responseData.owner_role_name,
            kyc_status: responseData.kyc_status,
            bank_approve_status: responseData.bank_approve_status,
            message: "Owner login successful",
          };
        }

        // Successful verification - return the complete success response
        return {
          status: "success",
          token: responseData.token,
          customer_id: responseData.customer_id,
          kyc_status: responseData.kyc_status,
          bank_approve_status: responseData.bank_approve_status,
          isRemittanceOnlyCustomer: responseData.isRemittanceOnlyCustomer || false,
          customer_type: responseData.customer_type || "individual",
          message: response.data.message || "OTP verification successful",
          data: responseData
        };
      } else {
        // Handle API error response
        throw new Error(response.data.message || "OTP verification failed");
      }

    } catch (error) {
      console.error("❌ OTP verification failed:", error);

      // ✅ FIX: Use extractErrorMessage for consistent error handling
      const errorMessage = extractErrorMessage(error);

      dispatch({ type: "auth/setError", payload: errorMessage });
      return rejectWithValue(errorMessage);
    } finally {
      dispatch({ type: "auth/setVerifyingOtp", payload: false });
    }
  }
);

// ===================== PLAID/KYC OPERATIONS - FIXED =====================
export const initiatePlaidFlow = createAsyncThunk(
  "auth/initiatePlaid",
  async (customerData, { dispatch, rejectWithValue }) => {
    try {
      dispatch({ type: "auth/setLoading", payload: true });
      dispatch({ type: "auth/setPlaidLoading", payload: true });

      const token = await getBearerToken();
      const customerId = customerData.customerId;

      console.log('🔄 Initiating Plaid flow for customer:', customerId);

      // ✅ CRITICAL: Enhanced customerId validation
      if (!customerId || customerId === "undefined" || customerId === "null" || customerId === "0") {
        const errorMsg = "Invalid customer ID for KYC verification. Please contact support.";
        console.error('❌', errorMsg);
        throw new Error(errorMsg);
      }

      let plaidUrl = null;
      let message = null;

      // ✅ STRATEGY 1: Try the main backend endpoint
      try {
        console.log('🔄 Trying backend endpoint: GET /kycs/' + customerId);
        const response = await api.get(`/kycs/${customerId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('✅ Backend KYC response:', response.data);

        if (response.data.kyc_url) {
          plaidUrl = response.data.kyc_url;
          message = "Bank verification ready";
          console.log('✅ Plaid URL obtained from backend');
        } else {
          throw new Error('No KYC URL in response');
        }
      } catch (backendError) {
        console.log('❌ Backend endpoint failed:', backendError.response?.data || backendError.message);

        // If customer not found (404), provide specific guidance
        if (backendError.response?.status === 404) {
          const errorMsg = "Customer account not found in verification system. This usually means your KYC profile needs to be created. Please contact support.";
          console.error('❌', errorMsg);
          throw new Error(errorMsg);
        }

        // ✅ STRATEGY 2: Try alternative endpoint for KYC initiation
        console.log('🔄 Trying alternative KYC initiation endpoint');
        try {
          const initiateResponse = await api.post('/kyc/initiate', {
            customer_id: customerId,
            hostname: window.location.hostname,
          }, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (initiateResponse.data?.kyc_url || initiateResponse.data?.url) {
            plaidUrl = initiateResponse.data.kyc_url || initiateResponse.data.url;
            message = "Bank verification initiated";
            console.log('✅ Plaid URL obtained from initiation endpoint');
          } else {
            throw new Error('No URL in initiation response');
          }
        } catch (initiateError) {
          console.log('❌ Initiation endpoint failed:', initiateError.response?.data || initiateError.message);
          throw new Error("KYC system temporarily unavailable. Please try again later or contact support.");
        }
      }

      // ✅ Final validation
      if (!plaidUrl) {
        throw new Error("Failed to obtain verification link");
      }

      console.log('✅ Final Plaid URL:', plaidUrl);

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
        customerId: customerId
      };
    } catch (error) {
      console.error('❌ Plaid initiation failed:', error);

      // ✅ FIX: Use extractErrorMessage for consistent error handling
      const errorMessage = extractErrorMessage(error);
      dispatch({ type: "auth/setPlaidError", payload: errorMessage });

      return rejectWithValue(errorMessage);
    } finally {
      dispatch({ type: "auth/setLoading", payload: false });
      dispatch({ type: "auth/setPlaidLoading", payload: false });
    }
  }
);

// ===================== KYC CALLBACK PROCESSING =====================
export const processPlaidKycCallback = createAsyncThunk(
  'auth/processPlaidKycCallback',
  async (callbackData, { dispatch, rejectWithValue }) => {
    try {
      console.log('🔄 Processing Plaid KYC callback:', callbackData);

      const { identity_verification_id, status, user_token, error_code, error_message } = callbackData;

      const token = await getBearerToken();

      const callbackEndpoints = [
        '/process-kyc-callback',
        '/kyc/callback',
        '/plaid/callback'
      ];

      let response = null;

      for (const endpoint of callbackEndpoints) {
        try {
          response = await api.post(endpoint, {
            identity_verification_id,
            status,
            user_token,
            error_code,
            error_message,
            hostname: window.location.hostname,
          }, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          console.log(`✅ Callback processed via ${endpoint}:`, response.data);
          break;
        } catch (endpointError) {
          console.log(`❌ Callback endpoint ${endpoint} failed:`, endpointError.response?.data || endpointError.message);
          continue;
        }
      }

      if (!response) {
        throw new Error('All callback endpoints failed');
      }

      if (response.data.status === 'success') {
        sessionStorage.removeItem('pending_kyc_auth');
        sessionStorage.removeItem('pending_mobile_auth');

        return {
          kycStatus: response.data.kyc_status,
          message: response.data.message,
          customerId: response.data.customer_id,
          status: 'success'
        };
      } else {
        throw new Error(response.data.message || 'Failed to process KYC verification');
      }

    } catch (error) {
      console.error('❌ KYC callback processing error:', error);

      // ✅ FIX: Use extractErrorMessage for consistent error handling
      const errorMessage = extractErrorMessage(error);

      return rejectWithValue(errorMessage);
    }
  }
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

      const token = await getBearerToken();
      const response = await api.post(
        "/get-manuals",
        {
          partnerId: partnerId,
          placement: "Login Page",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
      // ✅ FIX: Use extractErrorMessage for consistent error handling
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    } finally {
      dispatch({ type: "auth/setLoading", payload: false });
    }
  }
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
          console.log(passcode)
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

      const token = await getBearerToken();
      const response = await api.post("/login", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status === "success") {
        const {
          token,
          customer_id,
          isRemittanceOnlyCustomer,
          customer_type,
          is_owner_login,
          owner_id,
          owner_role_name,
          kyc_status,
          bank_approve_status,
          plaid_link_url,
        } = response.data.data;

        localStorage.setItem("bearertoken", token);
        localStorage.setItem("authcustomer_id", customer_id);

        if (is_owner_login === "1") {
          dispatch({
            type: "auth/setOwnerDetails",
            payload: {
              is_owner_login: true,
              owner_id: owner_id,
              owner_role_name: owner_role_name,
            },
          });
          return { is_owner_login: true, owner_id };
        }

        if (kyc_status === "0" || kyc_status === 0) {
          if (!plaid_link_url) {
            throw new Error(
              "Bank verification required but link not available"
            );
          }
          return {
            requiresKycVerification: true,
            plaid_link_url,
            customer_id,
          };
        }

        if (bank_approve_status !== "1") {
          throw new Error("Bank account not approved. Please contact support.");
        }

        const authState = {
          token,
          customerId: customer_id,
          isAuthenticated: true,
          user: {
            customerType: customer_type || "individual",
            isRemittanceOnlyCustomer: isRemittanceOnlyCustomer || false,
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
            ...response.data.data,
            isRemittanceOnlyCustomer,
            customer_type,
          },
        };
      }

      throw new Error(response.data.message || "Login failed");
    } catch (error) {
      console.error("Login error:", error);
      
      // ✅ FIX: Use extractErrorMessage for consistent error handling
      let errorMessage = extractErrorMessage(error);
      let modalActions = [];
      let isBlocked = false;

      if (error.response) {
        if (error.response.status === 401) {
          if (error.response.data?.error === "invalid_credentials") {
            errorMessage = "The email/phone or password you entered is incorrect";
          } else if (error.response.data?.error === "account_locked") {
            errorMessage = "Your account has been locked due to multiple failed attempts";
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
          errorMessage = "Your account is not verified. Please complete verification.";
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
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch({ type: "auth/setLoading", payload: true });

      const token = await getBearerToken();
      await api.post(
        "/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      dispatch({ type: "auth/clearAuthState" });
      return true;
    } catch (error) {
      // ✅ FIX: Use extractErrorMessage for consistent error handling
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    } finally {
      dispatch({ type: "auth/setLoading", payload: false });
    }
  }
);

// ===================== SELECTORS =====================
export const selectIsGeneratingPasscode = (state) =>
  state.auth.isGeneratingPasscode;

export const selectIsVerifyingOtp = (state) => state.auth.isVerifyingOtp;