import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_URL = import.meta.env.VITE_API_URL;

// ===================== CREATE BENEFICIARY ASYNC THUNKS =====================

export const createBeneficiaryWithBanks = createAsyncThunk(
  "beneficiaries/createBeneficiaryWithBanks",
  async (
    { customerId, beneficiaryData, bankAccounts, currency, country_code },
    { rejectWithValue }
  ) => {
    try {
      console.log("🔧 Creating beneficiary with banks...");
      console.log("🔧 Customer ID:", customerId);
      console.log("🔧 Beneficiary Data:", beneficiaryData);
      console.log("🔧 Bank Accounts:", bankAccounts);
      console.log("🔧 Currency:", currency);
      console.log("🔧 Country Code parameter:", country_code);

      let finalCountryCode = country_code;

      // Check if beneficiaryData has country_phone_code instead
      if (!finalCountryCode && beneficiaryData.country_phone_code) {
        finalCountryCode = beneficiaryData.country_phone_code;
      }
      // Also check for country_code in beneficiaryData as fallback
      if (!finalCountryCode && beneficiaryData.country_code) {
        finalCountryCode = beneficiaryData.country_code;
      }

      // Ensure we have a country code
      if (!finalCountryCode) {
        console.warn("⚠️ No country code provided, using +1 as fallback");
        finalCountryCode = "+1";
      }

      console.log("🔧 Final Country Code to use:", finalCountryCode);

      const authtoken = localStorage.getItem("authtoken");

      // Validate that all bank accounts have rails
      const missingRailsAccounts = bankAccounts.filter(
        (account) => !account.rails || account.rails.trim() === ""
      );
      if (missingRailsAccounts.length > 0) {
        console.error("❌ Missing rails in accounts:", missingRailsAccounts);
        throw new Error("All bank accounts must have a rails selection");
      }

      // Transform bank accounts for API
      const banksPayload = bankAccounts.map((account, index) => {
        // Ensure rails is provided
        if (!account.rails) {
          console.error(`❌ ERROR: rails is missing for bank account ${index}`);
          throw new Error(
            `Bank account ${index + 1} is missing rails selection`
          );
        }

        // Get currency from account or fallback to currency parameter
        const accountCurrency =
          account.currency_code || account.currency || currency;

        let bankDetails = {
          rails: account.rails,
          currency_code: accountCurrency,
          payment_method: account.paymentMethod || "",
          benef_iban: account.iban || "",
          swift_code: account.swift || "",
          intermediary_bank_swift: account.intermediarySwift || "",
          routing_number: account.routingNumber || "",
          bank_acc_no: account.accountNumber || "",
          sort_code: account.sortCode || "",
          bank_name: account.bankName || "",
          ifsc: account.ifsc || "",
          bankCode: account.bankCode || "",
          branchCode: account.branchCode || "",
          bankState: account.bankState || "",
          account_name: account.accountName || "",
          account_title: account.accountTitle || "",
          wallet_provider: account.walletProvider || "",
          mobile_number: account.mobileNumber || "",
          account_type: account.accountType || "",
          other_provider: account.otherProvider || "",
          bank_country: account.bankCountry || "",
        };

        // Transform based on rails type
        if (account.rails === "Swift") {
          bankDetails = {
            ...bankDetails,
            rails: "Swift",
            currency_code: accountCurrency,
            payment_method: "swift",
            benef_iban: account.iban || "",
            swift_code: account.swift || "",
            intermediary_bank_swift: account.intermediarySwift || "",
            bank_country: account.bankCountry || "",
          };
        } else if (account.rails === "Local") {
          if (accountCurrency === "USD") {
            bankDetails = {
              ...bankDetails,
              rails: "Local",
              currency_code: accountCurrency,
              payment_method: account.paymentMethod || "ACH",
              routing_number: account.routingNumber || "",
              bank_acc_no: account.accountNumber || "",
              account_type: account.accountType || "",
              bankCode: account.routingNumber || "",
              swift_code: account.swift || "",
              bank_country: account.bankCountry || "",
            };
          } else if (accountCurrency === "INR") {
            bankDetails = {
              ...bankDetails,
              rails: "Local",
              currency_code: accountCurrency,
              payment_method: "",
              bank_acc_no: account.accountNumber || "",
              account_type: account.accountType || "",
              bank_name: account.bankName || "",
              ifsc: account.ifsc || "",
              bank_country: account.bankCountry || "",
            };
          } else if (accountCurrency === "AED") {
            bankDetails = {
              ...bankDetails,
              rails: "Local",
              currency_code: accountCurrency,
              payment_method: "",
              benef_iban: account.iban || "",
              bic_code: account.swift || "",
              bank_country: account.bankCountry || "",
            };
          } else if (accountCurrency === "EUR") {
            bankDetails = {
              ...bankDetails,
              rails: "Local",
              currency_code: accountCurrency,
              payment_method: "",
              benef_iban: account.iban || "",
              bank_country: account.bankCountry || "",
            };
          } else if (accountCurrency === "GBP" || accountCurrency === "DKK") {
            bankDetails = {
              ...bankDetails,
              rails: "Local",
              currency_code: accountCurrency,
              payment_method: "",
              bank_acc_no: account.accountNumber || "",
              sort_code: account.sortCode || "",
              bank_country: account.bankCountry || "",
            };
          } else {
            bankDetails = {
              ...bankDetails,
              rails: "Local",
              currency_code: accountCurrency,
              payment_method: "",
              bank_acc_no: account.accountNumber || "",
              bank_name: account.bankName || "",
              bankCode: account.bankCode || "",
              branchCode: account.branchCode || "",
              bankState: account.bankState || "",
              bank_country: account.bankCountry || "",
            };
          }
        } else if (account.rails === "Mobile") {
          bankDetails = {
            ...bankDetails,
            rails: "Mobile",
            currency_code: accountCurrency,
            payment_method: "mobile",
            mobile_number: account.mobileNumber || "",
            wallet_provider: account.walletProvider || "",
            other_provider: account.otherProvider || "",
          };
        }

        return bankDetails;
      });

      const payload = {
        ...beneficiaryData,
        banks: banksPayload,
        currency_code: currency,
      };

      if (finalCountryCode.startsWith("+")) {
        payload.country_phone_code = finalCountryCode;
      } else {
        payload.country_phone_code = `+${finalCountryCode}`;
      }

      console.log("📡 Final payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(
        `${API_URL}/beneficiaries/create-benef/${customerId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      console.log("📡 API Response status:", response.status);

      const responseText = await response.text();
      console.log("📡 API Response text:", responseText);

      if (!response.ok) {
        console.error("❌ API Error Response:", responseText);
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.errors && errorData.errors["banks.0.rails"]) {
            throw new Error("Please select rails for all bank accounts.");
          }
          throw new Error(errorData.message || "Failed to create beneficiary");
        } catch (parseError) {
          throw new Error("Failed to create beneficiary");
        }
      }

      const result = JSON.parse(responseText);
      console.log("✅ API Success Response:", result);

      return result;
    } catch (error) {
      console.error("❌ createBeneficiaryWithBanks error:", error);
      return rejectWithValue(error.message);
    }
  }
);

// ===================== UPDATE BENEFICIARY BANK ASYNC THUNKS =====================
export const updateBeneficiaryBank = createAsyncThunk(
  "beneficiaries/updateBeneficiaryBank",
  async ({ bankId, bankData }, { rejectWithValue }) => {
    try {
      console.log("🏦 Updating bank details...");
      console.log("🏦 Bank ID:", bankId);
      console.log("🏦 Bank Data:", bankData);

      const authtoken = localStorage.getItem("authtoken");

      const response = await fetch(
        `${API_URL}/beneficiaries/update-benef-bank/${bankId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
          body: JSON.stringify(bankData),
        }
      );

      console.log("📡 API Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error Response:", errorText);
        throw new Error("Failed to update bank");
      }

      const result = await response.json();
      console.log("✅ Bank update successful:", result);

      return { bankId, data: result };
    } catch (error) {
      console.error("❌ updateBeneficiaryBank error:", error);
      return rejectWithValue(error.message);
    }
  }
);

// ===================== ADD BENEFICIARY BANK ASYNC THUNKS =====================
export const addBeneficiaryBank = createAsyncThunk(
  "beneficiaries/addBeneficiaryBank",
  async ({ customerId, bankData }, { rejectWithValue }) => {
    try {
      console.log("📤 Adding bank to existing beneficiary...");
      console.log("📤 Customer ID:", customerId);
      console.log("📤 Bank Data:", bankData);

      const authtoken = localStorage.getItem("authtoken");

      // Ensure we have beneficiary_id in the payload
      const payload = {
        ...bankData,
        customer_id: customerId
      };

      console.log("📤 Payload for create-benef-bank:", JSON.stringify(payload, null, 2));

      const response = await fetch(
        `${API_URL}/beneficiaries/create-benef-bank`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      console.log("📡 API Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error Response:", errorText);
        throw new Error("Failed to add bank");
      }

      const result = await response.json();
      console.log("✅ Bank added successfully:", result);
      return result;
    } catch (error) {
      console.error("❌ addBeneficiaryBank error:", error);
      return rejectWithValue(error.message);
    }
  }
);
// ===================== DELETE BENEFICIARY BANK ASYNC THUNKS =====================
export const deleteBeneficiaryBank = createAsyncThunk(
  "beneficiaries/deleteBeneficiaryBank",
  async ({ beneficiaryId, bankId, customerId }, { rejectWithValue }) => {
    try {
      console.log("🗑️ Deleting bank account...");
      console.log("🗑️ Customer ID:", customerId);
      console.log("🗑️ Beneficiary ID:", beneficiaryId);
      console.log("🗑️ Bank ID:", bankId);

      const authtoken = localStorage.getItem("authtoken");

      const response = await fetch(
        `${API_URL}/beneficiaries/delete-benef-bank/${bankId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
          body: JSON.stringify({
            customer_id: customerId,
          }),
        }
      );

      console.log("📡 Delete API Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Delete API Error:", errorText);
        throw new Error("Failed to delete bank");
      }

      const result = await response.json();
      console.log("✅ Bank deleted successfully:", result);

      return { beneficiaryId, bankId, customerId, data: result };
    } catch (error) {
      console.error("❌ deleteBeneficiaryBank error:", error);
      return rejectWithValue(error.message);
    }
  }
);

// ===================== FETCH BENEFICIARY BY ID ASYNC THUNK =====================
export const fetchBeneficiaryById = createAsyncThunk(
  "beneficiaries/fetchBeneficiaryById",
  async (beneficiaryId, { rejectWithValue }) => {
    try {
      const authtoken = localStorage.getItem("authtoken");

      console.log("📥 Fetching beneficiary with ID:", beneficiaryId);
      console.log(
        "📥 Using endpoint:",
        `/beneficiaries/benef-view/${beneficiaryId}`
      );

      const response = await fetch(
        `${API_URL}/beneficiaries/benef-view/${beneficiaryId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
        }
      );

      console.log("📡 API Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error Response:", errorText);
        throw new Error("Failed to fetch beneficiary");
      }

      const result = await response.json();
      console.log("✅ API Success Response:", result);

      let beneficiaryData = null;

      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        beneficiaryData = result.data[0];
      } else if (result.data && typeof result.data === "object") {
        beneficiaryData = result.data;
      }

      if (result.benef_banks && Array.isArray(result.benef_banks)) {
        beneficiaryData = {
          ...beneficiaryData,
          banks: result.benef_banks,
        };
      }

      return beneficiaryData;
    } catch (error) {
      console.error("❌ fetchBeneficiaryById error:", error);
      return rejectWithValue(error.message);
    }
  }
);

// ===================== UPDATE BENEFICIARY ASYNC THUNK =====================
export const updateBeneficiary = createAsyncThunk(
  "beneficiaries/updateBeneficiary",
  async (
    { customerId, beneficiaryId, beneficiaryData },
    { rejectWithValue }
  ) => {
    try {
      console.log("📤 Updating beneficiary:", {
        customerId,
        beneficiaryId,
        beneficiaryData,
      });

      const authtoken = localStorage.getItem("authtoken");
      const currentDateTime = new Date().toLocaleString();

      const payload = {
        customer_id: customerId,
        ...beneficiaryData,
        current_date_time: currentDateTime,
      };

      delete payload.banks;

      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined || payload[key] === "") {
          delete payload[key];
        }
      });

      console.log("📤 Final payload for update:", JSON.stringify(payload, null, 2));
      console.log("📤 Endpoint:", `/beneficiaries/update-benef/${beneficiaryId}`);

      const response = await fetch(
        `${API_URL}/beneficiaries/update-benef/${beneficiaryId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      console.log("📡 Update API Response status:", response.status);

      if (!response.ok) {
        const errorResult = await response.json();
        console.error("❌ Update API Error:", errorResult);
        throw new Error(
          errorResult.message ||
          errorResult.error ||
          "Failed to update beneficiary"
        );
      }

      const result = await response.json();
      console.log("✅ Update successful:", result);

      return {
        customerId,
        beneficiaryId,
        beneficiary: result.data || beneficiaryData,
        message: result.message || "Beneficiary updated successfully",
      };
    } catch (error) {
      console.error("❌ updateBeneficiary error:", error);
      return rejectWithValue(error.message);
    }
  }
);

// ===================== DROPDOWN DATA ASYNC THUNKS =====================
export const fetchNationalities = createAsyncThunk(
  "beneficiaries/fetchNationalities",
  async (_, { rejectWithValue }) => {
    try {
      const authtoken = localStorage.getItem("authtoken");
      const response = await fetch(`${API_URL}/nationalities`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authtoken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch nationalities");
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchBanksByCurrency = createAsyncThunk(
  "beneficiaries/fetchBanksByCurrency",
  async (
    { currency, bankType = "currency-payout-banks" },
    { rejectWithValue }
  ) => {
    try {
      const authtoken = localStorage.getItem("authtoken");
      const endpoint =
        bankType === "int-banks"
          ? `/int-banks/${currency}`
          : `/currency-payout-banks/${currency}`;

      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authtoken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch banks");
      }

      const result = await response.json();
      return { currency, data: result.data || [], bankType };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchIdTypesByCurrency = createAsyncThunk(
  "beneficiaries/fetchIdTypesByCurrency",
  async ({ currency, benefType }, { rejectWithValue }) => {
    try {
      console.log(`API: Fetching ID types for currency: ${currency} and benefType: ${benefType}`);

      const authtoken = localStorage.getItem("authtoken");
      const response = await fetch(`${API_URL}/benef-type-currency-id-type/${currency}/${benefType}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authtoken}`,
        },
      });

      console.log("API Response status:", response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch ID types: ${response.status}`);
      }

      const result = await response.json();
      console.log("API Response:", result);

      // Extract data from the response
      const extractedData = result.data || [];

      console.log("Extracted ID types:", extractedData);

      return { currency, benefType, data: extractedData };
    } catch (error) {
      console.error("API Error:", error);
      return rejectWithValue(error.message);
    }
  }
);
export const fetchCitiesByCountry = createAsyncThunk(
  "beneficiaries/fetchCitiesByCountry",
  async (countryId, { rejectWithValue }) => {
    try {
      const authtoken = localStorage.getItem("authtoken");
      const response = await fetch(`${API_URL}/cities/${countryId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authtoken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cities");
      }

      const result = await response.json();
      return { countryId, data: result.success ? result.data : [] };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchBankBranches = createAsyncThunk(
  "beneficiaries/fetchBankBranches",
  async (bankCode, { rejectWithValue }) => {
    try {
      const authtoken = localStorage.getItem("authtoken");
      const response = await fetch(`${API_URL}/int-banks-branch/${bankCode}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authtoken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bank branches");
      }

      const result = await response.json();
      return { bankCode, data: result.data || [] };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ===================== BENEFICIARY REGISTRATION VERIFICATION ENDPOINTS =====================

export const sendBeneficiaryRegistrationPasscode = createAsyncThunk(
  "beneficiaries/sendRegistrationPasscode",
  async ({ email, partner_id }, { rejectWithValue }) => {
    try {
      console.log("📧 Sending registration passcode to:", email);

      const authtoken = localStorage.getItem("authtoken");
      const payload = {
        email: email.trim().toLowerCase(),
        user_type: "beneficiary",
        partner_id:
          partner_id || localStorage.getItem("whitelabelledpartnerid") || "0",
      };

      console.log("📧 Payload:", payload);

      const response = await fetch(`${API_URL}/send-passcode-registration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authtoken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("📧 Response:", result);

      if (!response.ok) {
        throw new Error(result.message || "Failed to send passcode");
      }

      return {
        status: "success",
        message: result.message || "Passcode sent to your email",
        data: result.data || {},
      };
    } catch (error) {
      console.error("❌ sendBeneficiaryRegistrationPasscode error:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const validateBeneficiaryRegistrationPasscode = createAsyncThunk(
  "beneficiaries/validateRegistrationPasscode",
  async ({ email, passcode }, { rejectWithValue }) => {
    try {
      console.log("✅ Validating registration passcode for:", email);

      const authtoken = localStorage.getItem("authtoken");
      const payload = {
        email: email.trim().toLowerCase(),
        passcode: passcode,
      };

      console.log("✅ Payload:", payload);

      const response = await fetch(
        `${API_URL}/validate-passcode-registration`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      console.log("✅ Response:", result);

      if (!response.ok) {
        throw new Error(result.message || "Invalid passcode");
      }

      return {
        status: "success",
        message: result.message || "Email verified successfully",
        data: result.data || {},
        verificationToken: result.data?.verification_token,
      };
    } catch (error) {
      console.error("❌ validateBeneficiaryRegistrationPasscode error:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const sendBeneficiaryRegistrationOTP = createAsyncThunk(
  "beneficiaries/sendRegistrationOTP",
  async ({ country_code, mobile_number, partner_id }, { rejectWithValue }) => {
    try {
      console.log(
        "📱 Sending registration OTP to:",
        country_code,
        mobile_number
      );

      const cleanMobileNumber = mobile_number.replace(/\D/g, "");
      const cleanCountryCode = country_code.replace(/\D/g, "");

      const authtoken = localStorage.getItem("authtoken");
      const payload = {
        country_code: cleanCountryCode,
        mobile_number: cleanMobileNumber,
        user_type: "beneficiary",
        partner_id:
          partner_id || localStorage.getItem("whitelabelledpartnerid") || "0",
      };

      console.log("📱 Payload:", payload);

      const response = await fetch(`${API_URL}/send-otp-registration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authtoken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("📱 Response:", result);

      if (!response.ok) {
        throw new Error(result.message || "Failed to send OTP");
      }

      return {
        status: "success",
        message: result.message || "OTP sent to your phone",
        data: result.data || {},
      };
    } catch (error) {
      console.error("❌ sendBeneficiaryRegistrationOTP error:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const validateBeneficiaryRegistrationOTP = createAsyncThunk(
  "beneficiaries/validateRegistrationOTP",
  async ({ country_code, mobile_number, otp }, { rejectWithValue }) => {
    try {
      console.log(
        "✅ Validating registration OTP for:",
        country_code,
        mobile_number
      );

      const cleanMobileNumber = mobile_number.replace(/\D/g, "");
      const cleanCountryCode = country_code.replace(/\D/g, "");
      const formattedOTP = Array.isArray(otp) ? otp.join("") : otp;

      const authtoken = localStorage.getItem("authtoken");
      const payload = {
        country_code: cleanCountryCode,
        mobile_number: cleanMobileNumber,
        otp: formattedOTP,
      };

      console.log("✅ Payload:", payload);

      const response = await fetch(`${API_URL}/validate-otp-registration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authtoken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("✅ Response:", result);

      if (!response.ok) {
        throw new Error(result.message || "Invalid OTP");
      }

      if (result.data?.verification_token) {
        localStorage.setItem(
          "phone_verification_token",
          result.data.verification_token
        );
      }

      return {
        status: "success",
        message: result.message || "Phone number verified successfully",
        data: result.data || {},
        verificationToken: result.data?.verification_token,
      };
    } catch (error) {
      console.error("❌ validateBeneficiaryRegistrationOTP error:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const createBeneficiaryRequestRemit = createAsyncThunk(
  "beneficiaries/createBeneficiaryRequestRemit",
  async (beneficiaryData, { rejectWithValue }) => {
    try {
      console.log("🔧 Creating beneficiary with request-remit flow...");
      console.log("🔧 Beneficiary Data:", beneficiaryData);

      const authtoken = localStorage.getItem("authtoken");

      if (!beneficiaryData.hostname) {
        beneficiaryData.hostname = window.location.hostname;
      }

      if (!beneficiaryData.partner_id) {
        beneficiaryData.partner_id =
          localStorage.getItem("whitelabelledpartnerid") || "0";
      }

      console.log(
        "📡 Final payload:",
        JSON.stringify(beneficiaryData, null, 2)
      );

      const response = await fetch(
        `${API_URL}/beneficiaries/create-requestremit-benef`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
          body: JSON.stringify(beneficiaryData),
        }
      );

      console.log("📡 API Response status:", response.status);

      const responseText = await response.text();
      console.log("📡 API Response text:", responseText);

      if (!response.ok) {
        console.error("❌ API Error Response:", responseText);
        const errorData = JSON.parse(responseText);

        if (errorData.message) {
          const errorMessages = [];

          if (errorData.message.phone_number) {
            errorMessages.push(...errorData.message.phone_number);
          }

          if (errorData.message.email) {
            errorMessages.push(...errorData.message.email);
          }

          if (errorData.message.password) {
            errorMessages.push(...errorData.message.password);
          }

          if (errorData.message && typeof errorData.message === "string") {
            errorMessages.push(errorData.message);
          }

          throw new Error(errorMessages.join(", "));
        }

        throw new Error(errorData.message || "Failed to create beneficiary");
      }

      const result = JSON.parse(responseText);
      console.log("✅ API Success Response:", result);

      return {
        status: "success",
        message: result.message || "Beneficiary created successfully",
        data: result.data || {},
        benefCode: result.benefCode,
      };
    } catch (error) {
      console.error("❌ createBeneficiaryRequestRemit error:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const validateBeneficiaryCreate = createAsyncThunk(
  "beneficiaries/validateBeneficiaryCreate",
  async (payload, { rejectWithValue }) => {
    try {
      console.log("🔍 Validating beneficiary creation...");
      console.log("🔍 Payload:", payload);

      const authtoken = localStorage.getItem("authtoken");

      const response = await fetch(
        `${API_URL}/beneficiaries/validate-beneficiary-create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      console.log("📡 Validation API Response status:", response.status);

      const responseText = await response.text();
      console.log("📡 Validation API Response text:", responseText);

      if (!response.ok) {
        console.error("❌ Validation API Error Response:", responseText);
        
        // Try to parse the error response
        try {
          const errorData = JSON.parse(responseText);
          console.log("📦 Parsed error data:", errorData);
          
          // Return the FULL error object
          return rejectWithValue(errorData);
        } catch (parseError) {
          // If response is not JSON, return a simple error object
          return rejectWithValue({ 
            message: responseText || 'Validation failed. Please check your details.' 
          });
        }
      }

      const result = JSON.parse(responseText);
      console.log("✅ Validation API Success Response:", result);

      return {
        success: true,
        message: result.message || "Validation successful",
        data: result.data || {}
      };
    } catch (error) {
      console.error("❌ validateBeneficiaryCreate error:", error);
      return rejectWithValue({ 
        message: error.message || "Validation failed. Please check your details." 
      });
    }
  }
);

// ===================== INITIAL STATE =====================
const initialState = {
  createLoading: false,
  createError: null,
  createSuccess: false,
  beneficiaryId: null,

  fetchLoading: false,
  fetchError: null,
  beneficiaryData: null,

  updateLoading: false,
  updateError: null,
  updateSuccess: false,

  validateLoading: false,
  validateError: null,
  validateSuccess: false,

  bankLoading: false,
  bankError: null,
  bankSuccess: false,

  bankDeleteLoading: false,
  bankDeleteError: null,
  bankDeleteSuccess: false,

  bankAddLoading: false,
  bankAddError: null,
  bankAddSuccess: false,

  bankOperation: null,
  bankId: null,

  nationalities: [],
  banks: {},
  idTypes: {},
  cities: {},
  bankBranches: {},
  dropdownLoading: false,
  dropdownError: null,
};

// ===================== SLICE =====================
const addBeneficiarySlice = createSlice({
  name: "addBeneficiary",
  initialState,
  reducers: {
    clearCreateError: (state) => {
      console.log("🧹 Clearing create error in addBeneficiarySlice");
      state.createError = null;
    },
    clearCreateSuccess: (state) => {
      console.log("🧹 Clearing create success in addBeneficiarySlice");
      state.createSuccess = false;
    },
    resetCreateState: (state) => {
      console.log("🧹 Resetting create state in addBeneficiarySlice");
      state.createLoading = false;
      state.createError = null;
      state.createSuccess = false;
      state.beneficiaryId = null;
    },

    clearBankError: (state) => {
      state.bankUpdateError = null;
      state.bankUpdateSuccess = false;
      state.bankDeleteError = null;
      state.bankDeleteSuccess = false;
      state.bankAddError = null;
      state.bankAddSuccess = false;
      state.bankOperation = null;
      state.bankId = null;
    },

    clearFetchState: (state) => {
      state.fetchLoading = false;
      state.fetchError = null;
      state.beneficiaryData = null;
    },

    clearUpdateState: (state) => {
      state.updateLoading = false;
      state.updateError = null;
      state.updateSuccess = false;
    },

    setBeneficiaryData: (state, action) => {
      state.beneficiaryData = action.payload;
    },

    clearDropdownError: (state) => {
      state.dropdownError = null;
    },
    clearDropdownData: (state) => {
      state.nationalities = [];
      state.banks = {};
      state.idTypes = {};
      state.cities = {};
      state.bankBranches = {};
    },

    clearError: (state) => {
      state.createError = null;
      state.dropdownError = null;
      state.bankError = null;
      state.fetchError = null;
      state.updateError = null;
    },

    resetState: (state) => {
      state.createLoading = false;
      state.createError = null;
      state.createSuccess = false;
      state.dropdownLoading = false;
      state.dropdownError = null;
      state.fetchLoading = false;
      state.fetchError = null;
      state.beneficiaryData = null;
      state.updateLoading = false;
      state.updateError = null;
      state.updateSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // ===================== CREATE BENEFICIARY WITH BANKS =====================
      .addCase(createBeneficiaryWithBanks.pending, (state) => {
        console.log("⏳ createBeneficiaryWithBanks PENDING");
        state.createLoading = true;
        state.createError = null;
        state.createSuccess = false;
      })
      .addCase(createBeneficiaryWithBanks.fulfilled, (state, action) => {
        console.log("✅ createBeneficiaryWithBanks FULFILLED");
        state.createLoading = false;
        state.createSuccess = true;
        state.beneficiaryId =
          action.payload.beneficiary_id || action.payload.benef_id;
        state.createError = null;
      })
      .addCase(createBeneficiaryWithBanks.rejected, (state, action) => {
        console.error(
          "❌ createBeneficiaryWithBanks REJECTED:",
          action.payload
        );
        state.createLoading = false;
        state.createError = action.payload;
        state.createSuccess = false;
      })

      // ===================== CREATE BENEFICIARY REQUEST REMIT =====================
      .addCase(createBeneficiaryRequestRemit.pending, (state) => {
        console.log("⏳ createBeneficiaryRequestRemit PENDING");
        state.createLoading = true;
        state.createError = null;
        state.createSuccess = false;
      })
      .addCase(createBeneficiaryRequestRemit.fulfilled, (state, action) => {
        console.log("✅ createBeneficiaryRequestRemit FULFILLED");
        state.createLoading = false;
        state.createSuccess = true;
        state.beneficiaryId = action.payload.benefCode;
        state.createError = null;
      })
      .addCase(createBeneficiaryRequestRemit.rejected, (state, action) => {
        console.error(
          "❌ createBeneficiaryRequestRemit REJECTED:",
          action.payload
        );
        state.createLoading = false;
        state.createError = action.payload;
        state.createSuccess = false;
      })

      // ===================== NATIONALITIES =====================
      .addCase(fetchNationalities.pending, (state) => {
        state.dropdownLoading = true;
        state.dropdownError = null;
      })
      .addCase(fetchNationalities.fulfilled, (state, action) => {
        state.dropdownLoading = false;
        state.nationalities = action.payload;
      })
      .addCase(fetchNationalities.rejected, (state, action) => {
        state.dropdownLoading = false;
        state.dropdownError = action.payload;
      })

      // ===================== BANKS BY CURRENCY =====================
      .addCase(fetchBanksByCurrency.pending, (state) => {
        state.dropdownLoading = true;
        state.dropdownError = null;
      })
      .addCase(fetchBanksByCurrency.fulfilled, (state, action) => {
        state.dropdownLoading = false;
        const { currency, data, bankType } = action.payload;
        const key = bankType === "int-banks" ? `${currency}_int` : currency;
        state.banks[key] = data;
      })
      .addCase(fetchBanksByCurrency.rejected, (state, action) => {
        state.dropdownLoading = false;
        state.dropdownError = action.payload;
      })

      // ===================== ID TYPES BY CURRENCY =====================
      .addCase(fetchIdTypesByCurrency.pending, (state) => {
        state.dropdownLoading = true;
        state.dropdownError = null;
      })
      .addCase(fetchIdTypesByCurrency.fulfilled, (state, action) => {
        console.log("✅ fetchIdTypesByCurrency FULFILLED");
        state.dropdownLoading = false;
        const { currency, benefType, data } = action.payload;

        // Store with compound key to support different benefTypes
        const key = `${currency}_${benefType}`;
        state.idTypes[key] = data;

        // Also store with just currency for backward compatibility
        if (!state.idTypes[currency]) {
          state.idTypes[currency] = data;
        }
        console.log(`Stored ID types for ${key}:`, data);
      })
      .addCase(fetchIdTypesByCurrency.rejected, (state, action) => {
        state.dropdownLoading = false;
        state.dropdownError = action.payload;
      })

      // ===================== CITIES BY COUNTRY =====================
      .addCase(fetchCitiesByCountry.pending, (state) => {
        state.dropdownLoading = true;
        state.dropdownError = null;
      })
      .addCase(fetchCitiesByCountry.fulfilled, (state, action) => {
        state.dropdownLoading = false;
        const { countryId, data } = action.payload;
        state.cities[countryId] = data;
      })
      .addCase(fetchCitiesByCountry.rejected, (state, action) => {
        state.dropdownLoading = false;
        state.dropdownError = action.payload;
      })

      // ===================== BANK BRANCHES =====================
      .addCase(fetchBankBranches.pending, (state) => {
        state.dropdownLoading = true;
        state.dropdownError = null;
      })
      .addCase(fetchBankBranches.fulfilled, (state, action) => {
        state.dropdownLoading = false;
        const { bankCode, data } = action.payload;
        state.bankBranches[bankCode] = data;
      })
      .addCase(fetchBankBranches.rejected, (state, action) => {
        state.dropdownLoading = false;
        state.dropdownError = action.payload;
      })

      // ===================== FETCH BENEFICIARY BY ID =====================
      .addCase(fetchBeneficiaryById.pending, (state) => {
        console.log("⏳ fetchBeneficiaryById PENDING");
        state.fetchLoading = true;
        state.fetchError = null;
        state.beneficiaryData = null;
      })
      .addCase(fetchBeneficiaryById.fulfilled, (state, action) => {
        console.log("✅ fetchBeneficiaryById FULFILLED");
        state.fetchLoading = false;
        state.beneficiaryData = action.payload;
        state.fetchError = null;
      })
      .addCase(fetchBeneficiaryById.rejected, (state, action) => {
        console.error("❌ fetchBeneficiaryById REJECTED:", action.payload);
        state.fetchLoading = false;
        state.fetchError = action.payload;
      })

      // ===================== UPDATE BENEFICIARY BANK =====================
      .addCase(updateBeneficiaryBank.pending, (state) => {
        console.log("⏳ updateBeneficiaryBank PENDING");
        state.bankUpdateLoading = true;
        state.bankUpdateError = null;
        state.bankUpdateSuccess = false;
        state.bankOperation = "update";
      })
      .addCase(updateBeneficiaryBank.fulfilled, (state, action) => {
        console.log("✅ updateBeneficiaryBank FULFILLED");
        state.bankUpdateLoading = false;
        state.bankUpdateSuccess = true;
        state.bankUpdateError = null;
        state.bankId = action.payload.bankId || null;

        if (state.beneficiaryData && state.beneficiaryData.banks) {
          const bankIndex = state.beneficiaryData.banks.findIndex(
            (bank) => bank.id === action.payload.bankId
          );
          if (bankIndex !== -1) {
            state.beneficiaryData.banks[bankIndex] = {
              ...state.beneficiaryData.banks[bankIndex],
              ...action.payload,
            };
          }
        }
      })
      .addCase(updateBeneficiaryBank.rejected, (state, action) => {
        console.error("❌ updateBeneficiaryBank REJECTED:", action.payload);
        state.bankUpdateLoading = false;
        state.bankUpdateError = action.payload;
        state.bankUpdateSuccess = false;
      })

      // ===================== ADD BENEFICIARY BANK =====================
      .addCase(addBeneficiaryBank.pending, (state) => {
        console.log("⏳ addBeneficiaryBank PENDING");
        state.bankAddLoading = true;
        state.bankAddError = null;
        state.bankAddSuccess = false;
        state.bankOperation = "add";
      })
      .addCase(addBeneficiaryBank.fulfilled, (state, action) => {
        console.log("✅ addBeneficiaryBank FULFILLED");
        state.bankAddLoading = false;
        state.bankAddSuccess = true;
        state.bankAddError = null;
        state.bankId = action.payload.bankId || null;

        if (state.beneficiaryData && state.beneficiaryData.banks) {
          state.beneficiaryData.banks.push(action.payload);
        }
      })
      .addCase(addBeneficiaryBank.rejected, (state, action) => {
        console.error("❌ addBeneficiaryBank REJECTED:", action.payload);
        state.bankAddLoading = false;
        state.bankAddError = action.payload;
        state.bankAddSuccess = false;
      })

      // ===================== DELETE BENEFICIARY BANK =====================
      .addCase(deleteBeneficiaryBank.pending, (state) => {
        console.log("⏳ deleteBeneficiaryBank PENDING");
        state.bankDeleteLoading = true;
        state.bankDeleteError = null;
        state.bankDeleteSuccess = false;
        state.bankOperation = "delete";
      })
      .addCase(deleteBeneficiaryBank.fulfilled, (state, action) => {
        console.log("✅ deleteBeneficiaryBank FULFILLED");
        state.bankDeleteLoading = false;
        state.bankDeleteSuccess = true;
        state.bankDeleteError = null;
        state.bankId = action.payload.bankId;

        if (state.beneficiaryData && state.beneficiaryData.banks) {
          state.beneficiaryData.banks = state.beneficiaryData.banks.filter(
            (bank) => bank.id !== action.payload.bankId
          );
        }
      })
      .addCase(deleteBeneficiaryBank.rejected, (state, action) => {
        console.error("❌ deleteBeneficiaryBank REJECTED:", action.payload);
        state.bankDeleteLoading = false;
        state.bankDeleteError = action.payload;
        state.bankDeleteSuccess = false;
      })

      // ===================== UPDATE BENEFICIARY =====================
      .addCase(updateBeneficiary.pending, (state) => {
        console.log("⏳ updateBeneficiary PENDING");
        state.updateLoading = true;
        state.updateError = null;
        state.updateSuccess = false;
      })
      .addCase(updateBeneficiary.fulfilled, (state, action) => {
        console.log("✅ updateBeneficiary FULFILLED");
        state.updateLoading = false;
        state.updateSuccess = true;
        state.updateError = null;

        if (action.payload.beneficiary) {
          state.beneficiaryData = {
            ...state.beneficiaryData,
            ...action.payload.beneficiary,
          };
        }
      })
      .addCase(updateBeneficiary.rejected, (state, action) => {
        console.error("❌ updateBeneficiary REJECTED:", action.payload);
        state.updateLoading = false;
        state.updateError = action.payload;
        state.updateSuccess = false;
      })

      // ===================== VALIDATE BENEFICIARY CREATE =====================
      .addCase(validateBeneficiaryCreate.pending, (state) => {
        console.log("⏳ validateBeneficiaryCreate PENDING");
        state.validateLoading = true;
        state.validateError = null;
        state.validateSuccess = false;
      })
      .addCase(validateBeneficiaryCreate.fulfilled, (state, action) => {
        console.log("✅ validateBeneficiaryCreate FULFILLED");
        state.validateLoading = false;
        state.validateSuccess = true;
        state.validateError = null;
      })
      .addCase(validateBeneficiaryCreate.rejected, (state, action) => {
        console.error("❌ validateBeneficiaryCreate REJECTED:", action.payload);
        state.validateLoading = false;
        state.validateSuccess = false;
        state.validateError = action.payload || "Validation failed";
      });
  },
});

// ===================== ACTION EXPORTS =====================
export const {
  clearCreateError,
  clearCreateSuccess,
  resetCreateState,
  clearDropdownError,
  clearDropdownData,
  clearError,
  resetState,
  clearBankError,
  clearFetchState,
  clearUpdateState,
  setBeneficiaryData,
} = addBeneficiarySlice.actions;

// ===================== SELECTORS =====================

export const selectCreateLoading = (state) =>
  state.addBeneficiary.createLoading;
export const selectCreateError = (state) => state.addBeneficiary.createError;
export const selectCreateSuccess = (state) =>
  state.addBeneficiary.createSuccess;
export const selectBeneficiaryId = (state) =>
  state.addBeneficiary.beneficiaryId;

export const selectNationalities = (state) =>
  state.addBeneficiary.nationalities;
export const selectBanks = (state) => state.addBeneficiary.banks;
export const selectIdTypes = (state) => state.addBeneficiary.idTypes;
export const selectCities = (state) => state.addBeneficiary.cities;
export const selectBankBranches = (state) => state.addBeneficiary.bankBranches;
export const selectDropdownLoading = (state) =>
  state.addBeneficiary.dropdownLoading;
export const selectDropdownError = (state) =>
  state.addBeneficiary.dropdownError;

export const selectBanksForCurrency = (currency) => (state) => {
  if (["BDT", "LKR", "AUD", "PKR"].includes(currency)) {
    return state.addBeneficiary.banks[`${currency}_int`] || [];
  }
  return state.addBeneficiary.banks[currency] || [];
};

export const selectBankBranchesForBank = (bankCode) => (state) => {
  return state.addBeneficiary.bankBranches[bankCode] || [];
};

export const selectIdTypesForCurrency = (currency) => (state) => {
  return state.addBeneficiary.idTypes[currency] || [];
};

export const selectCitiesForCountry = (countryId) => (state) => {
  return state.addBeneficiary.cities[countryId] || [];
};

export const selectFetchLoading = (state) => state.addBeneficiary.fetchLoading;
export const selectFetchError = (state) => state.addBeneficiary.fetchError;
export const selectBeneficiaryData = (state) =>
  state.addBeneficiary.beneficiaryData;

export const selectUpdateLoading = (state) =>
  state.addBeneficiary.updateLoading;
export const selectUpdateError = (state) => state.addBeneficiary.updateError;
export const selectUpdateSuccess = (state) =>
  state.addBeneficiary.updateSuccess;

export const selectBankUpdateLoading = (state) => state.addBeneficiary.bankUpdateLoading;
export const selectBankUpdateError = (state) => state.addBeneficiary.bankUpdateError;
export const selectBankUpdateSuccess = (state) => state.addBeneficiary.bankUpdateSuccess;

export const selectBankDeleteLoading = (state) => state.addBeneficiary.bankDeleteLoading;
export const selectBankDeleteError = (state) => state.addBeneficiary.bankDeleteError;
export const selectBankDeleteSuccess = (state) => state.addBeneficiary.bankDeleteSuccess;

export const selectValidateLoading = (state) => state.addBeneficiary.validateLoading || false;
export const selectValidateError = (state) => state.addBeneficiary.validateError || null;
export const selectValidateSuccess = (state) => state.addBeneficiary.validateSuccess || false;

export const selectBankAddLoading = (state) => state.addBeneficiary.bankAddLoading;
export const selectBankAddError = (state) => state.addBeneficiary.bankAddError;
export const selectBankAddSuccess = (state) => state.addBeneficiary.bankAddSuccess;
export const selectBankOperation = (state) =>
  state.addBeneficiary.bankOperation;
export const selectBankId = (state) => state.addBeneficiary.bankId;

export const selectBankLoading = (state) =>
  state.addBeneficiary.bankUpdateLoading ||
  state.addBeneficiary.bankDeleteLoading ||
  state.addBeneficiary.bankAddLoading;
export const selectBankError = (state) =>
  state.addBeneficiary.bankUpdateError ||
  state.addBeneficiary.bankDeleteError ||
  state.addBeneficiary.bankAddError;
export const selectBankSuccess = (state) =>
  state.addBeneficiary.bankUpdateSuccess ||
  state.addBeneficiary.bankDeleteSuccess ||
  state.addBeneficiary.bankAddSuccess;

export const selectBankById = (bankId) => (state) => {
  if (
    !state.addBeneficiary.beneficiaryData ||
    !state.addBeneficiary.beneficiaryData.banks
  ) {
    return null;
  }
  return (
    state.addBeneficiary.beneficiaryData.banks.find(
      (bank) => bank.id === bankId
    ) || null
  );
};

// ===================== DEFAULT EXPORT =====================
export default addBeneficiarySlice.reducer;