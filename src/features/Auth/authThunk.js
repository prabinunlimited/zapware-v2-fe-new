import { createAsyncThunk } from "@reduxjs/toolkit";
import { getBearerToken } from "../../services/authService";
import api from "../../services/api";
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
      } catch (tokenError) {
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
        // Silent fail for logout time
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

      return {
        hostname,
        countries: countriesData,
        partnerConfig: partnerData,
        gifImages: gifImagesData,
      };
    } catch (error) {
      isInitializing = false;
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

      const response = await api.post("/login", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data?.status === "success" && response.data?.data) {
        const responseData = response.data.data;

        // Store temporary auth data for KYC flow
        if (responseData.kyc_status === "0" || responseData.kyc_status === 0) {
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
            return {
              requiresPlaidRedirect: true,
              plaidUrl: responseData.plaid_url,
              customerData: responseData,
              customer_id: responseData.customer_id,
              kyc_status: responseData.kyc_status,
              bank_approve_status: responseData.bank_approve_status,
              tempToken: responseData.token,
              message:
                "KYC verification required - redirecting to bank verification",
            };
          }

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
                customer_id: responseData.customer_id,
                kyc_status: responseData.kyc_status,
                bank_approve_status: responseData.bank_approve_status,
                tempToken: responseData.token,
                message:
                  "KYC verification required - redirecting to bank verification",
              };
            }
          } catch (plaidError) {
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

        // Successful login with KYC verified
        return {
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

      // Handle successful response
      if (response.data.status === "success") {
        const responseData = response.data.data;

        // Handle Plaid redirect directly from login response
        if (
          response.data?.plaid_status === "success" &&
          response.data?.plaid_url
        ) {
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

      // Fetch OTP counter info after successful OTP send
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
          }
        } catch (otpCounterError) {
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

      const formattedOTP = Array.isArray(otp) ? otp.join("") : otp;
      const token = await getBearerToken();
      const currentDateTimeLocal = new Date().toLocaleString();

      // Use the FULL mobile number with country code
      const full_mobile_number = `${country_code} ${mobile_number}`;

      const payload = {
        sign_in_option: "mobile",
        mobile_number: full_mobile_number,
        otp: formattedOTP,
        currentDate: currentDateTimeLocal,
      };

      const response = await api.post("/validate-otp", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

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
          return successResponse;
        } else {
          return {
            ...successResponse,
            requiresKycVerification: true,
          };
        }
      } else {
        throw new Error(response.data.message || "OTP verification failed");
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

      let plaidUrl = null;
      let message = null;

      // STRATEGY 1: Try the main backend endpoint
      try {
        const response = await api.get(`/kycs/${customerId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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
          } else {
            throw new Error("No URL in initiation response");
          }
        } catch (initiateError) {
          throw new Error(
            "KYC system temporarily unavailable. Please try again later or contact support."
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
  }
);

// ===================== KYC CALLBACK PROCESSING =====================
export const processPlaidKycCallback = createAsyncThunk(
  "auth/processPlaidKycCallback",
  async (callbackData, { dispatch, rejectWithValue }) => {
    try {
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
          break;
        } catch (endpointError) {
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
          token: userToken,
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

        // Store user token as "authtoken", NOT "bearertoken"
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
          token: userToken,
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