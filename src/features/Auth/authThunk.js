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

      const defaultSigninType = localStorage.getItem("default_signin_type");
      dispatch({ type: "auth/setInputType", payload: defaultSigninType });

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
        const logoutTimeResponse = await api.get("/logout", {
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
  async ({ email, password, customer_type, user_type }, { dispatch, rejectWithValue }) => {
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

      if (user_type) {
        payload.user_type = user_type;
      }

      const response = await api.post("/request-passcode-login", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
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

      return response.data;
    } catch (error) {
      if (error.response) {
        const responseData = error.response.data;

        if (responseData.data?.has_multiple_user_types === "Y") {
          return rejectWithValue({
            hasMultipleUserTypes: true,
            message: responseData.message || "Please select a user type",
            data: responseData.data,
          });
        }

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
    { email, passcode, password, sign_in_option, customer_type, user_type, },
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
        ...(customer_type && { customer_type }),
        ...(user_type && { user_type }),
        hostname: window.location.hostname,
      };

      const response = await api.post("/login", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data?.status === "success" && response.data?.data) {
        const responseData = response.data.data;

        // CASE 1: Owner login
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

        // CASE 2: Remittance Only Customer with Pending KYC - Show message (NO redirect)
        if (responseData.kyc_status === "0" &&
          responseData.isRemittanceOnlyCustomer === "Y") {

          return {
            kyc_status: "0",
            isRemittanceOnlyCustomer: "Y",
            plaid_message: responseData.plaid_message || "Your KYC Verification is in Pending state. Please contact support team on suds@xchangely.com or call at +1 (408) 242-9705",
            customer_id: responseData.customer_id,
            // ❌ NO token, NO requiresPlaidRedirect
          };
        }

        // CASE 3: Non-Remittance Customer with Pending KYC - Redirect to Plaid (Open in new tab)
        if (responseData.kyc_status === "0" &&
          responseData.isRemittanceOnlyCustomer !== "Y") {

          // Store temporary auth data
          const tempAuthData = {
            token: responseData.token,
            customer_id: responseData.customer_id,
            email: email,
            timestamp: Date.now(),
            requiresKyc: true,
          };
          sessionStorage.setItem("temp_auth_data", JSON.stringify(tempAuthData));

          return {
            requiresPlaidRedirect: true,
            plaidUrl: responseData.plaid_url,
            customer_id: responseData.customer_id,
            kyc_status: responseData.kyc_status,
            isRemittanceOnlyCustomer: "N",
            plaid_message: responseData.plaid_message,
            // ❌ NO token for authentication
          };
        }

        // CASE 4: Handle bank approval status
        if (responseData.bank_approve_status !== "1") {
          throw new Error("Bank account not approved. Please contact support.");
        }

        // CASE 5: Successful login with KYC verified
        if (responseData.token && responseData.customer_id) {
          if (responseData.login_user_type) {
            localStorage.setItem('login_user_type', responseData.login_user_type);

            // Store UUIDs based on login type
            if (responseData.login_user_type === 'customer' && responseData.customerUuid) {
              localStorage.setItem('customer_uuid', responseData.customerUuid);
              localStorage.removeItem('beneficiary_uuid');
            } else if (responseData.login_user_type === 'beneficiary' && responseData.beneficaryUuid) {
              localStorage.setItem('beneficiary_uuid', responseData.beneficaryUuid);
              localStorage.removeItem('customer_uuid');
            }
          }

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
            beneficaryLogin: responseData.beneficaryLogin || null,
            beneficaryId: responseData.beneficaryId || null,
            message: "Login successful",
          };
        }

        throw new Error("Invalid server response format");
      }

      // Handle non-success responses
      if (response.data?.status === "error") {
        let errorMessage = response.data.message || "Login failed";

        if (
          errorMessage.includes("Invalid passcode") ||
          errorMessage.includes("Invalid credentials")
        ) {
          errorMessage = "Invalid passcode. Please check the code and try again.";
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
    { phone_code, mobile_number, password, customer_type, user_type, customer_id },
    { dispatch, rejectWithValue }
  ) => {
    try {
      // Validate that password is provided
      if (!password || password.trim() === "") {
        return rejectWithValue({
          message: "Password is required for OTP generation",
          status: 400
        });
      }

      const cleanPhoneNumber = mobile_number.replace(/\D/g, "");
      const cleanPhoneCode = phone_code.replace(/\D/g, "");

      const token = await getBearerToken();

      const payload = {
        country_code: phone_code,
        mobile_number: cleanPhoneNumber,
        password: password,
        hostname: window.location.hostname,
      };

      if (customer_type) {
        payload.customer_type = customer_type;
      }

      if (user_type) {
        payload.user_type = user_type;
      }

      if (customer_id) {
        payload.customer_id = customer_id;
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

      // Handle multiple institution accounts scenario
      if (response.data?.data?.checkMultipleInstitutionCustomer === "Y") {
        return {
          status: "multiple_institutions",
          message: response.data.message || "Please select an institution",
          customers: response.data.data.customers || [],
        };
      }

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
      console.log("❌ Generate OTP Error:", error);
      console.log("❌ Error response:", error.response);
      console.log("❌ Error response data:", error.response?.data);

      if (error.response?.data?.data?.has_multiple_user_types === "Y") {
        return rejectWithValue({
          hasMultipleUserTypes: true,
          message: error.response.data.message || "Please select a user type",
          data: error.response.data.data,
        });
      }

      // Handle multiple accounts scenario in error
      if (error.response?.data?.data?.checkMultipleCustomer === "Y") {
        dispatch({ type: "auth/setShowCustomerType", payload: "Y" });
        return {
          status: "multiple_accounts",
          message: error.response.data.message || "Please select customer type",
          requiresCustomerType: true,
        };
      }

      // Extract the error message properly
      let errorMessage = "";
      let errorStatus = error.response?.status || 500;

      if (error.response?.data) {
        const responseData = error.response.data;
        if (typeof responseData === "string") {
          errorMessage = responseData;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.error) {
          errorMessage = responseData.error;
        } else if (responseData.detail) {
          errorMessage = responseData.detail;
        } else {
          // Default messages based on status code
          switch (errorStatus) {
            case 401:
              errorMessage = "Invalid email/phone or password. Please check your credentials and try again.";
              break;
            case 400:
              errorMessage = "Invalid request. Please check your input.";
              break;
            case 404:
              errorMessage = "Service not found. Please try again later.";
              break;
            case 429:
              errorMessage = "Too many attempts. Please try again later.";
              break;
            default:
              errorMessage = responseData.message || "Failed to generate OTP";
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = "Failed to generate OTP. Please try again.";
      }

      // Return structured error object
      return rejectWithValue({
        message: errorMessage,
        status: errorStatus,
        originalError: error.response?.data
      });
    }
  }
);

export const verifyOTP = createAsyncThunk(
  "auth/verifyOTP",
  async (
    { phone_code, mobile_number, otp, password, sign_in_option, customer_type, user_type, customer_id },
    { dispatch, rejectWithValue }
  ) => {
    try {
      dispatch({ type: "auth/setVerifyingOtp", payload: true });

      const cleanMobileNumber = mobile_number.replace(/\D/g, "");
      const formattedOTP = Array.isArray(otp) ? otp.join("") : otp;

      if (!phone_code || !cleanMobileNumber || !formattedOTP || !password) {
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
        phone_code: phone_code,
        sign_in_option: sign_in_option || "mobile",
        hostname: window.location.hostname,
      };

      if (customer_type) {
        payload.customer_type = customer_type;
      }

      if (user_type) {
        payload.user_type = user_type;
      }

      if (customer_id) {
        payload.customer_id = customer_id;
      }

      const response = await api.post("/login", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status === "success") {
        const responseData = response.data.data;

        //  CASE 1: KYC Pending for Remittance Only Customer - Show message, DON'T login
        if (responseData.kyc_status === "0" &&
          responseData.isRemittanceOnlyCustomer === "Y") {

          // Return ONLY the message, NO token, NO customer_id for authentication
          return {
            kyc_status: "0",
            isRemittanceOnlyCustomer: "Y",
            plaid_message: responseData.plaid_message,
            showKycMessage: true,
            requiresRedirect: false,
            // ❌ DO NOT include token or customer_id here
          };
        }

        // CASE 2: KYC Pending for Non-Remittance Customer - Redirect to Plaid, DON'T login
        if (responseData.kyc_status === "0" &&
          responseData.isRemittanceOnlyCustomer !== "Y") {

          return {
            kyc_status: "0",
            isRemittanceOnlyCustomer: "N",
            requiresPlaidRedirect: true,
            plaidUrl: responseData.plaid_url,
            customer_id: responseData.customer_id,
            plaid_message: responseData.plaid_message,
            // ❌ DO NOT include token here
          };
        }

        //  CASE 3: KYC Completed - Normal login
        if (responseData.token && responseData.customer_id) {
          if (responseData.login_user_type) {
            localStorage.setItem('login_user_type', responseData.login_user_type);

            // Store UUIDs based on login type
            if (responseData.login_user_type === 'customer' && responseData.customerUuid) {
              localStorage.setItem('customer_uuid', responseData.customerUuid);
              localStorage.removeItem('beneficiary_uuid');
            } else if (responseData.login_user_type === 'beneficiary' && responseData.beneficaryUuid) {
              localStorage.setItem('beneficiary_uuid', responseData.beneficaryUuid);
              localStorage.removeItem('customer_uuid');
            }
          }

          // Save other auth data
          localStorage.setItem('authcustomer_id', responseData.customer_id);
          localStorage.setItem('authtoken', responseData.token);

          return {
            status: "success",
            token: responseData.token,
            customer_id: responseData.customer_id,
            kyc_status: responseData.kyc_status,
            bank_approve_status: responseData.bank_approve_status,
            isRemittanceOnlyCustomer: responseData.isRemittanceOnlyCustomer || false,
            customer_type: responseData.customer_type || "individual",
            customerUuid: responseData.customerUuid || null,
            beneficaryLogin: responseData.beneficaryLogin || null,
            beneficaryId: responseData.beneficaryId || null,
            message: "Login successful",
          };
        }

        throw new Error("Invalid response from server");
      } else {
        throw new Error(response.data.message || "OTP verification failed");
      }
    } catch (error) {
      console.log("❌ Verify OTP Error:", error);

      let errorMessage = "";

      if (error.response?.data) {
        const responseData = error.response.data;
        if (typeof responseData === "string") {
          errorMessage = responseData;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else {
          errorMessage = "OTP verification failed. Please try again.";
        }
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = "OTP verification failed. Please try again.";
      }

      dispatch({ type: "auth/setError", payload: errorMessage });
      return rejectWithValue({
        message: errorMessage,
      });
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

// ===================== RESEND REGISTRATION OTP =====================
export const resendRegistrationOtp = createAsyncThunk(
  "auth/resendRegistrationOtp",
  async ({ customer_type, country_code, mobile_number }, { rejectWithValue, dispatch }) => {
    try {
      const token = await getBearerToken();

      const payload = {
        customer_type: customer_type || "individual",
        mobile_number_country_code: country_code,
        mobile_number: mobile_number,
      };

      const response = await api.post("/resend-otp-registration", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data?.status === "success") {
        try {
          const otpCounterResponse = await api.get("/otp-counter", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (otpCounterResponse.data?.counter) {
            const otpInfo = otpCounterResponse.data.counter;
            dispatch({
              type: "auth/setResendAttempts",
              payload: otpInfo.otp_limit,
            });
            if (otpInfo.otp_resend) {
              dispatch({
                type: "auth/setResendTimer",
                payload: otpInfo.otp_resend,
              });
            }
          }
        } catch (err) {
          // Silent catch for counter error
        }
      }

      if (response.status === 429) {
        return rejectWithValue("Too many requests. Please wait a moment before trying again.");
      }

      if (response.data?.status === "error") {
        return rejectWithValue(response.data.message || "Failed to resend OTP");
      }

      return {
        status: "success",
        message: response.data?.message || "OTP resent successfully",
        data: response.data?.data || {},
      };
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(error.response?.data?.message || errorMessage || "Failed to resend OTP");
    }
  }
);

// ===================== VALIDATE OTP (for PhoneVerification component) =====================
export const validateOtp = createAsyncThunk(
  "auth/validateOtp",
  async (
    { country_code, mobile_number_country_code, mobile_number, otp },
    { dispatch, rejectWithValue }
  ) => {
    try {
      dispatch({ type: "auth/setVerifyingOtp", payload: true });

      const formattedOTP = Array.isArray(otp) ? otp.join("") : otp;
      const token = await getBearerToken();

      // Resolve country code from whichever property was passed
      const finalCountryCode = mobile_number_country_code || country_code;

      // Exact payload required by the endpoint
      const payload = {
        mobile_number_country_code: finalCountryCode,
        mobile_number: mobile_number,
        otp: formattedOTP,
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
          plaid_kyc_required: responseData.plaid_kyc_required, // Ensure this passes through for your UI check
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
              country_code: finalCountryCode,
              mobile_number: `${finalCountryCode} ${mobile_number}`,
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

// ===================== PLAID/KYC OPERATIONS =====================
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
          customerUuid,
          beneficaryLogin,
          beneficaryId,
          login_user_type,
          beneficaryUuid,
        } = response.data.data;

        // Store user token as "authtoken", NOT "bearertoken"
        localStorage.setItem("authtoken", userToken);
        localStorage.setItem("authcustomer_id", customer_id);


        // Store login_user_type and UUIDs
        if (login_user_type) {
          localStorage.setItem('login_user_type', login_user_type);

          // Store UUIDs based on login type
          if (login_user_type === 'customer' && customerUuid) {
            localStorage.setItem('customer_uuid', customerUuid);
            localStorage.removeItem('beneficiary_uuid');
          } else if (login_user_type === 'beneficiary' && beneficaryUuid) {
            localStorage.setItem('beneficiary_uuid', beneficaryUuid);
            localStorage.removeItem('customer_uuid');
          }
        }
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
            beneficaryLogin,
            beneficaryId,
          },
        };
      }

      throw new Error(response.data.message || "Login failed");
    } catch (error) {
      console.log("❌ Login Error:", error);
      console.log("❌ Error response:", error.response);
      console.log("❌ Error response data:", error.response?.data);

      let errorMessage = "";
      let errorStatus = error.response?.status || 500;
      let modalActions = [];
      let isBlocked = false;

      if (error.response?.data) {
        const responseData = error.response.data;

        if (typeof responseData === "string") {
          errorMessage = responseData;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.error) {
          errorMessage = responseData.error;
        } else if (responseData.detail) {
          errorMessage = responseData.detail;
        } else {
          // Handle specific error cases
          if (error.response.status === 401) {
            errorMessage = "Invalid email/phone or password. Please check your credentials and try again.";
          } else if (error.response.status === 403) {
            errorMessage = "Your account is not verified. Please complete verification.";
          } else if (error.response.status === 429) {
            errorMessage = "Too many attempts. Please try again later.";
          } else {
            errorMessage = "Login failed. Please try again.";
          }
        }

        // Check for account locked status
        if (error.response.data?.error === "account_locked") {
          errorMessage = "Your account has been locked due to multiple failed attempts. Please contact support.";
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
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = "Login failed. Please try again.";
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

      return rejectWithValue({
        message: errorMessage,
        status: errorStatus,
        isBlocked: isBlocked
      });
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

      // Clear all auth-related data from localStorage
      localStorage.removeItem('customerUuid');
      localStorage.removeItem('authtoken');
      localStorage.removeItem('authcustomer_id');
      localStorage.removeItem('currentCustomerId');
      localStorage.removeItem('bearertoken');

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