import { createAsyncThunk } from "@reduxjs/toolkit";
import api, { getBearerToken } from "../../services/api";
import axios from "axios";
import { openModal } from "./slices/uiSlice";
import { extractErrorMessage } from "../../utils/errorHandling";
import { tokenService } from "../../services/authService";

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

      // 2. Fetch client token - THIS WILL NOW MAKE ONLY ONE CALL
      let bearerToken;
      try {
        bearerToken = await getBearerToken();
        console.log("✅ Partner token initialized for app");
      } catch (tokenError) {
        console.error("Token fetch failed:", tokenError);
        throw new Error("Failed to establish secure connection");
      }

      // 3. Check cache first for countries
      let countriesData;
      if (apiCache.countries) {
        countriesData = apiCache.countries;
        console.log("✅ Using cached countries data");
      } else {
        const countriesResponse = await api.get("/countries", {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        });
        countriesData = countriesResponse.data.data;
        apiCache.countries = countriesData;
        localStorage.setItem("allcountries", JSON.stringify(countriesData));
        console.log("✅ Fetched and cached countries data");
      }

      // 4. Fetch partner details with caching
      let partnerData;
      if (apiCache.partnerDetail) {
        partnerData = apiCache.partnerDetail;
        console.log("✅ Using cached partner details");
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
        console.log("✅ Fetched and cached partner details");
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
          console.log("✅ Using cached partner config");
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
            console.log("✅ Fetched and cached partner config");
          }
        }
      }

      // 6. Fetch GIF images with caching
      let gifImagesData;
      if (apiCache.gifImages) {
        gifImagesData = apiCache.gifImages;
        console.log("✅ Using cached GIF images");
      } else {
        const gifResponse = await api.get("/gif-images", {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        });
        gifImagesData = gifResponse.data.images || [];
        apiCache.gifImages = gifImagesData;
        console.log("✅ Fetched and cached GIF images");
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
        console.log("✅ Fetched logout time");
      } catch (err) {
        console.log("Failed to fetch timer setup");
      }

      // Dispatch all data to store
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

      // Mark as initialized
      dispatch({ type: "auth/setInitialized", payload: true });

      console.log("✅ App initialization completed successfully");

      return {
        hostname,
        countries: countriesData,
        partnerConfig: partnerData,
        gifImages: gifImagesData,
      };
    } catch (error) {
      isInitializing = false;
      console.error("❌ App initialization failed:", error);
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

      console.log(
        "🔄 Generating passcode with token:",
        token ? "✅ Available" : "❌ Missing"
      );

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
        return rejectWithValue(
          response.data.message || "Failed to generate passcode"
        );
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

          return rejectWithValue(
            responseData.message ||
              "Validation failed. Please check your input."
          );
        }

        return rejectWithValue(
          responseData.message || "Failed to generate passcode"
        );
      }

      return rejectWithValue(error.message || "Failed to generate passcode");
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

      console.log("🔍 [verifyPasscode] Starting verification with:", {
        email,
        passcodeLength: passcode?.length,
        sign_in_option,
        hasPassword: !!password,
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

      console.log("📤 [verifyPasscode] Sending payload:", {
        ...payload,
        password: password ? "***" : "not provided",
      });

      const response = await api.post("/login", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ [verifyPasscode] Login API Response:", response.data);

      if (response.data?.status === "success" && response.data?.data) {
        const responseData = response.data.data;

        console.log("🔍 [verifyPasscode] Success response data:", responseData);

        // ✅ FIX: Store temporary auth data for KYC flow
        if (responseData.kyc_status === "0" || responseData.kyc_status === 0) {
          console.log(
            "🚫 [verifyPasscode] KYC NOT VERIFIED - Storing temp auth data"
          );

          // Store temporary authentication data
          const tempAuthData = {
            token: responseData.token,
            customer_id: responseData.customer_id,
            email: email,
            timestamp: Date.now(),
            requiresKyc: true,
          };

          sessionStorage.setItem(
            "temp_auth_data",
            JSON.stringify(tempAuthData)
          );
          localStorage.setItem("pending_customer_id", responseData.customer_id);

          if (
            responseData.plaid_status === "success" &&
            responseData.plaid_url
          ) {
            console.log("✅ Redirecting to Plaid for KYC verification");
            return {
              requiresPlaidRedirect: true,
              plaidUrl: responseData.plaid_url,
              customerData: responseData,
              customer_id: responseData.customer_id,
              kyc_status: responseData.kyc_status,
              bank_approve_status: responseData.bank_approve_status,
              tempToken: responseData.token, // Include token for immediate use
              message:
                "KYC verification required - redirecting to bank verification",
            };
          }

          console.log(
            "🔄 Attempting to initiate Plaid flow for KYC verification"
          );
          try {
            const plaidResponse = await dispatch(
              initiatePlaidFlow({
                customerId: responseData.customer_id,
                hostname: window.location.hostname,
              })
            ).unwrap();

            if (plaidResponse.url) {
              console.log(
                "✅ Plaid URL obtained, redirecting for KYC verification"
              );
              return {
                requiresPlaidRedirect: true,
                plaidUrl: plaidResponse.url,
                customerData: responseData,
                customer_id: responseData.customer_id,
                kyc_status: responseData.kyc_status,
                bank_approve_status: responseData.bank_approve_status,
                tempToken: responseData.token, // Include token for immediate use
                message:
                  "KYC verification required - redirecting to bank verification",
              };
            }
          } catch (plaidError) {
            console.error("❌ Plaid initiation failed:", plaidError);
            // Even if Plaid fails, store the temp auth data
            return {
              requiresKycVerification: true,
              customer_id: responseData.customer_id,
              kyc_status: responseData.kyc_status,
              bank_approve_status: responseData.bank_approve_status,
              tempToken: responseData.token,
              message: "KYC verification required",
            };
          }
        }

        // Handle owner login
        if (responseData.is_owner_login === "1") {
          console.log("👑 Owner login detected - bypassing KYC check");
          return {
            is_owner_login: true,
            owner_id: responseData.owner_id,
            owner_role_name: responseData.owner_role_name,
            kyc_status: responseData.kyc_status,
            bank_approve_status: responseData.bank_approve_status,
            customer_id: responseData.customer_id,
            token: responseData.token,
            customerData: responseData,
          };
        }

        // Handle bank approval status
        if (responseData.bank_approve_status !== "1") {
          throw new Error("Bank account not approved. Please contact support.");
        }

        // ✅ Successful login with KYC verified - IMPLEMENTED AS REQUESTED
        console.log("✅ KYC verified - allowing login");
        return {
          token: responseData.token, // ✅ Make sure this is included
          customer_id: responseData.customer_id, // ✅ Make sure this is included
          kyc_status: responseData.kyc_status,
          bank_approve_status: responseData.bank_approve_status,
          isRemittanceOnlyCustomer:
            responseData.isRemittanceOnlyCustomer || false,
          customer_type: responseData.customer_type || "individual",
          is_staff_login: responseData.is_staff_login || "0",
          staff_role: responseData.staff_role || "",
          staff_id: responseData.staff_id || "0",
          is_owner_login: responseData.is_owner_login || "0", // ✅ Make sure this is correct
          owner_id: responseData.owner_id || "0",
          whitelabelled_customer: responseData.whitelabelled_customer || "N",
          whitelabelled_customer_partnerid:
            responseData.whitelabelled_customer_partnerid || "0",
          whitelabelled_customer_partnername:
            responseData.whitelabelled_customer_partnername || "",
          customerUuid: responseData.customerUuid || null,
          message: "Login successful",
        };
      }

      // Handle non-success responses
      if (response.data?.status === "error") {
        let errorMessage = response.data.message || "Login failed";

        if (
          errorMessage.includes("Invalid passcode") ||
          errorMessage.includes("Invalid credentials")
        ) {
          errorMessage =
            "Invalid passcode. Please check the code and try again.";
        } else if (errorMessage.includes("expired")) {
          errorMessage = "Passcode has expired. Please request a new one.";
        }

        throw new Error(errorMessage);
      }

      throw new Error("Invalid server response format");
    } catch (error) {
      console.error("❌ [verifyPasscode] Verification failed:", error);
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
  async (
    { phone_code, mobile_number, customer_type },
    { dispatch, rejectWithValue }
  ) => {
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

      console.log("✅ OTP verification response:", response.data);

      // Handle successful response
      if (response.data.status === "success") {
        const responseData = response.data.data;

        // Handle Plaid redirect directly from login response
        if (
          response.data?.plaid_status === "success" &&
          response.data?.plaid_url
        ) {
          console.log("🎯 Redirecting to Plaid from login response");

          sessionStorage.setItem(
            "pending_mobile_auth",
            JSON.stringify({
              phone_code: cleanPhoneCode,
              mobile_number: cleanMobileNumber,
              customer_id: responseData.customer_id,
              timestamp: Date.now(),
            })
          );

          return {
            requiresPlaidRedirect: true,
            plaidUrl: response.data.plaid_url,
            customerData: responseData,
            message: "Redirecting to bank verification...",
          };
        }

        // Handle KYC verification required
        if (responseData.kyc_status === "0" || responseData.kyc_status === 0) {
          console.log("🎯 KYC verification required, initiating Plaid flow");

          sessionStorage.setItem(
            "pending_mobile_auth",
            JSON.stringify({
              phone_code: cleanPhoneCode,
              mobile_number: cleanMobileNumber,
              customer_id: responseData.customer_id,
              timestamp: Date.now(),
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
                message: "Redirecting to bank verification...",
              };
            }
          } catch (plaidError) {
            console.error("❌ Plaid initiation failed:", plaidError);
            return {
              requiresKycVerification: true,
              kyc_status: responseData.kyc_status,
              bank_approve_status: responseData.bank_approve_status,
              customerData: responseData,
              message:
                "Bank verification required but setup failed. Please contact support.",
            };
          }
        }

        // Handle bank approval
        if (responseData.bank_approve_status !== "1") {
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
          message: response.data.message || "Login successful",
          data: responseData,
        };
      } else {
        throw new Error(response.data.message || "OTP verification failed");
      }
    } catch (error) {
      console.error("❌ OTP verification failed:", error);

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
  async (mobileNumber, { rejectWithValue, dispatch }) => {
    try {
      const token = await getBearerToken();

      console.log("🔄 Sending OTP to:", mobileNumber);

      // ✅ UPDATED: Use the same endpoint as reference code
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

      console.log("✅ Send OTP response:", response.data);

      // ✅ ADDED: Fetch OTP counter info after successful OTP send (like reference code)
      if (response.data.status === "success") {
        try {
          const otpCounterResponse = await api.get("/otp-counter", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (otpCounterResponse.data?.counter) {
            const otpInfo = otpCounterResponse.data.counter;

            // Update Redux state with OTP limit info
            dispatch({
              type: "auth/setResendAttempts",
              payload: otpInfo.otp_limit,
            });

            // Also set resend timer if available
            if (otpInfo.otp_resend) {
              dispatch({
                type: "auth/setResendTimer",
                payload: otpInfo.otp_resend,
              });
            }

            console.log("✅ OTP counter info:", otpInfo);
          }
        } catch (otpCounterError) {
          console.warn("⚠️ Could not fetch OTP counter info:", otpCounterError);
          // Continue without OTP counter info - not critical
        }
      }

      if (response.status === 429) {
        return rejectWithValue(
          "Too many requests. Please wait a moment before trying again."
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
      console.error("❌ Send OTP error:", error);

      const errorMessage = extractErrorMessage(error);

      // Handle specific error cases
      if (error.response?.status === 429) {
        return rejectWithValue(
          "Too many requests. Please wait before trying again."
        );
      }

      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      }

      return rejectWithValue(errorMessage || "Failed to send OTP");
    }
  }
);

// ===================== VALIDATE OTP (for PhoneVerification component) =====================
export const validateOtp = createAsyncThunk(
  "auth/validateOtp",
  async (
    { country_code, mobile_number, otp },
    { dispatch, rejectWithValue }
  ) => {
    try {
      dispatch({ type: "auth/setVerifyingOtp", payload: true });

      console.log("🔄 validateOtp thunk called with:", {
        country_code,
        mobile_number,
        mobile_number_type: typeof mobile_number,
        mobile_number_length: mobile_number.length,
        mobile_number_has_dashes: mobile_number.includes("-"),
        otp: Array.isArray(otp) ? otp.join("") : otp,
      });

      const formattedOTP = Array.isArray(otp) ? otp.join("") : otp;
      const token = await getBearerToken();
      const currentDateTimeLocal = new Date().toLocaleString();

      // ✅ CRITICAL FIX: Use the FULL mobile number with country code
      // This matches how the customer was registered: "+977 9813017273"
      const full_mobile_number = `${country_code} ${mobile_number}`;

      const payload = {
        sign_in_option: "mobile",
        mobile_number: full_mobile_number, // ✅ Send "+977 9813017273" not just "9813017273"
        otp: formattedOTP,
        currentDate: currentDateTimeLocal,
      };

      console.log(
        "📤 Sending OTP verification to /validate-otp:",
        JSON.stringify(payload, null, 2)
      );
      console.log("🔍 Full mobile number being sent:", full_mobile_number);

      const response = await api.post("/validate-otp", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ OTP verification response:", response.data);

      // Handle successful response
      if (response.data.status === "success") {
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
          console.log("🎯 Plaid redirect required");

          sessionStorage.setItem(
            "pending_mobile_auth",
            JSON.stringify({
              country_code: country_code,
              mobile_number: full_mobile_number,
              customer_id: responseData.customer_id,
              timestamp: Date.now(),
            })
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
          console.log("✅ KYC already verified");
          return successResponse;
        } else {
          console.log("🚫 KYC verification required");
          return {
            ...successResponse,
            requiresKycVerification: true,
          };
        }
      } else {
        console.log("❌ OTP verification failed:", response.data);
        throw new Error(response.data.message || "OTP verification failed");
      }
    } catch (error) {
      console.error("❌ OTP verification failed:", error);
      console.log("🔍 Error response data:", error.response?.data);
      console.log("🔍 Error status:", error.response?.status);

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

      console.log("🔄 Initiating Plaid flow for customer:", customerId);

      // ✅ CRITICAL: Enhanced customerId validation
      if (
        !customerId ||
        customerId === "undefined" ||
        customerId === "null" ||
        customerId === "0"
      ) {
        const errorMsg =
          "Invalid customer ID for KYC verification. Please contact support.";
        console.error("❌", errorMsg);
        throw new Error(errorMsg);
      }

      let plaidUrl = null;
      let message = null;

      // ✅ STRATEGY 1: Try the main backend endpoint
      try {
        console.log("🔄 Trying backend endpoint: GET /kycs/" + customerId);
        const response = await api.get(`/kycs/${customerId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("✅ Backend KYC response:", response.data);

        if (response.data.kyc_url) {
          plaidUrl = response.data.kyc_url;
          message = "Bank verification ready";
          console.log("✅ Plaid URL obtained from backend");
        } else {
          throw new Error("No KYC URL in response");
        }
      } catch (backendError) {
        console.log(
          "❌ Backend endpoint failed:",
          backendError.response?.data || backendError.message
        );

        // If customer not found (404), provide specific guidance
        if (backendError.response?.status === 404) {
          const errorMsg =
            "Customer account not found in verification system. This usually means your KYC profile needs to be created. Please contact support.";
          console.error("❌", errorMsg);
          throw new Error(errorMsg);
        }

        // ✅ STRATEGY 2: Try alternative endpoint for KYC initiation
        console.log("🔄 Trying alternative KYC initiation endpoint");
        try {
          const initiateResponse = await api.post(
            "/kyc/initiate",
            {
              customer_id: customerId,
              hostname: window.location.hostname,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (initiateResponse.data?.kyc_url || initiateResponse.data?.url) {
            plaidUrl =
              initiateResponse.data.kyc_url || initiateResponse.data.url;
            message = "Bank verification initiated";
            console.log("✅ Plaid URL obtained from initiation endpoint");
          } else {
            throw new Error("No URL in initiation response");
          }
        } catch (initiateError) {
          console.log(
            "❌ Initiation endpoint failed:",
            initiateError.response?.data || initiateError.message
          );
          throw new Error(
            "KYC system temporarily unavailable. Please try again later or contact support."
          );
        }
      }

      // ✅ Final validation
      if (!plaidUrl) {
        throw new Error("Failed to obtain verification link");
      }

      console.log("✅ Final Plaid URL:", plaidUrl);

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
      console.error("❌ Plaid initiation failed:", error);

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
  "auth/processPlaidKycCallback",
  async (callbackData, { dispatch, rejectWithValue }) => {
    try {
      console.log("🔄 Processing Plaid KYC callback:", callbackData);

      const {
        identity_verification_id,
        status,
        user_token,
        error_code,
        error_message,
      } = callbackData;

      const token = await getBearerToken();

      const callbackEndpoints = [
        "/process-kyc-callback",
        "/kyc/callback",
        "/plaid/callback",
      ];

      let response = null;

      for (const endpoint of callbackEndpoints) {
        try {
          response = await api.post(
            endpoint,
            {
              identity_verification_id,
              status,
              user_token,
              error_code,
              error_message,
              hostname: window.location.hostname,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          console.log(`✅ Callback processed via ${endpoint}:`, response.data);
          break;
        } catch (endpointError) {
          console.log(
            `❌ Callback endpoint ${endpoint} failed:`,
            endpointError.response?.data || endpointError.message
          );
          continue;
        }
      }

      if (!response) {
        throw new Error("All callback endpoints failed");
      }

      if (response.data.status === "success") {
        sessionStorage.removeItem("pending_kyc_auth");
        sessionStorage.removeItem("pending_mobile_auth");

        return {
          kycStatus: response.data.kyc_status,
          message: response.data.message,
          customerId: response.data.customer_id,
          status: "success",
        };
      } else {
        throw new Error(
          response.data.message || "Failed to process KYC verification"
        );
      }
    } catch (error) {
      console.error("❌ KYC callback processing error:", error);

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
          token: userToken, // Rename to avoid confusion
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

        // ✅ FIX: Store user token as "authtoken", NOT "bearertoken"
        localStorage.setItem("authtoken", userToken);
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
          token: userToken, // Use the renamed variable
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
