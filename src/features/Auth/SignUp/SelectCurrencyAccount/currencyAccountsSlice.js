import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../../services/api";
import { countries } from "../../slices/countrySlice";

const getValidCountryId = (countryId, getState) => {
  console.log("🌍 getValidCountryId - Input:", {
    inputCountryId: countryId,
    type: typeof countryId,
    isUndefined: countryId === undefined,
    isStringUndefined: countryId === "undefined",
  });

  // Priority 1: Use the provided countryId if valid
  if (countryId && countryId !== "undefined" && countryId !== "null") {
    const countryIdStr = String(countryId);
    console.log("✅ Using provided countryId:", countryIdStr);
    return countryIdStr;
  }

  // Priority 2: Try to get from Redux state (countries slice)
  try {
    const state = getState();
    const selectedCountry = state.countries?.selectedCountry;

    if (selectedCountry && selectedCountry.id) {
      const countryIdStr = String(selectedCountry.id);
      console.log("✅ Using country from Redux state:", countryIdStr);
      return countryIdStr;
    }
  } catch (error) {
    console.warn("⚠️ Could not access Redux state for country:", error);
  }

  // Priority 3: Try localStorage
  const storedCountryId = localStorage.getItem("selectedCountryId");
  if (storedCountryId && storedCountryId !== "undefined") {
    console.log("✅ Using country from localStorage ID:", storedCountryId);
    return String(storedCountryId);
  }

  // Priority 4: Try to get from localStorage country code
  const storedCountryCode = localStorage.getItem("userCountry");
  if (storedCountryCode && countries && countries.length > 0) {
    const country = countries.find(
      (c) =>
        c.country_code === storedCountryCode ||
        c.id === parseInt(storedCountryCode),
    );
    if (country) {
      console.log("✅ Using country from localStorage code:", country.id);
      return String(country.id);
    }
  }

  // ⚠️ FIXED: Priority 5: Try to get country from URL or navigate to country selection
  // Check if we have URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const urlCountryId = urlParams.get("countryId");
  if (urlCountryId) {
    console.log("✅ Using country from URL parameter:", urlCountryId);
    return String(urlCountryId);
  }

  // ⚠️ CRITICAL FIX: Check if we're in a partner flow, default to 186 (USA) for partner
  const partnerId = localStorage.getItem("whitelabelledpartnerid");
  const isPartnerFlow =
    partnerId && partnerId !== "0" && partnerId !== "undefined";

  if (isPartnerFlow) {
    console.log("🌐 Partner flow detected, defaulting to USA (186)");
    return "186"; // Default to USA for partner flows
  }

  // Last resort: Show error or redirect
  console.error(
    "❌ No valid country ID found. Redirecting to country selection.",
  );
  // You might want to redirect to country selection here
  return "186"; // Temporary fallback
};

// Helper function to filter accounts by currency
const filterAccountsByCurrency = (accounts, currencyFilter) => {
  if (currencyFilter === "all") {
    return accounts;
  }

  return accounts.filter((account) => {
    // Try multiple possible currency field names
    const currencyFields = [
      account.currency,
      account.currency_code,
      account.currency_type,
      account.account_currency,
      account.currencyName,
    ];

    const accountCurrency = currencyFields.find(
      (field) => field && typeof field === "string",
    );

    return accountCurrency === currencyFilter;
  });
};

// ========== EXISTING ASYNC THUNKS ==========

export const fetchAccountOptions = createAsyncThunk(
  "currencyAccounts/fetchAccountOptions",
  async (
    { accountType, countryId, API_URL },
    { rejectWithValue, getState },
  ) => {
    try {
      // ⚠️ CRITICAL: Validate country ID
      const validatedCountryId = getValidCountryId(countryId, getState);

      console.log("🔍 THUNK - Validated Country ID:", {
        original: countryId,
        validated: validatedCountryId,
        countryName:
          countries.find((c) => c.id === parseInt(validatedCountryId))?.name ||
          "Unknown",
      });

      // Step 1: Get onboarding description
      const accountOptionsResponse = await api.get(
        "/get-onboarding-description",
      );

      // Step 2: Check if partnerId exists in localStorage
      const partnerId = localStorage.getItem("whitelabelledpartnerid");
      const isPartnerFlow =
        partnerId &&
        partnerId !== "0" &&
        partnerId !== "undefined" &&
        partnerId !== "null" &&
        partnerId !== "";

      console.log("🔍 THUNK DEBUG - fetchAccountOptions:", {
        partnerId,
        isPartnerFlow,
        accountType,
        validatedCountryId,
        timestamp: new Date().toISOString(),
      });

      let endpoint;
      let responseData;

      if (isPartnerFlow) {
        // ✅ PARTNER-SPECIFIC FLOW - Use validatedCountryId
        endpoint = `partners/open-account-currencies-customertype-and-country/${partnerId}/${accountType}/${validatedCountryId}`;
        console.log(`🔍 Using PARTNER API: ${endpoint}`);

        try {
          const response = await api.get(endpoint);
          responseData = response.data;
          console.log("✅ Partner API response received:", {
            status: response.status,
            dataKeys: Object.keys(responseData),
          });
        } catch (partnerError) {
          console.warn("⚠️ Partner API failed:", partnerError.message);

          // Fallback to standard API
          endpoint = `/get-bank-ac-type-and-country/${accountType}/${validatedCountryId}`;
          console.log(`🔄 Using FALLBACK API: ${endpoint}`);

          const fallbackResponse = await api.get(endpoint);
          responseData = fallbackResponse.data;
        }
      } else {
        // ✅ STANDARD FLOW - Use validatedCountryId
        endpoint = `/get-bank-ac-type-and-country/${accountType}/${validatedCountryId}`;
        console.log(`🔍 Using STANDARD API: ${endpoint}`);

        const response = await api.get(endpoint);
        responseData = response.data;
        console.log("✅ Standard API response received");
      }

      return {
        accountOptionsData: accountOptionsResponse.data,
        termsData: responseData,
        accountType,
        countryId: validatedCountryId,
        isPartnerFlow,
        partnerId: isPartnerFlow ? partnerId : null,
      };
    } catch (error) {
      console.error("❌ API Error in fetchAccountOptions:", error.message);
      return rejectWithValue(
        error.message || "Failed to fetch account options",
      );
    }
  },
);

export const fetchTermsContent = createAsyncThunk(
  "currencyAccounts/fetchTermsContent",
  async (url, { rejectWithValue }) => {
    try {
      const response = await api.get(url, {
        responseType: "text",
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const validateReferralCode = createAsyncThunk(
  "currencyAccounts/validateReferralCode",
  async (referralCode, { rejectWithValue, dispatch }) => {
    try {
      if (!referralCode || referralCode.trim() === "") {
        return { isValid: true, message: "" };
      }

      const response = await api.post("/validate-referral-code", {
        referral_code: referralCode,
      });

      if (response.status === 200) {
        return {
          isValid: true,
          message: "✓ Referral code is valid",
        };
      }
    } catch (error) {
      dispatch(setReferralError("Referral code is invalid!"));
      return rejectWithValue("Referral code is invalid!");
    }
  },
);

export const validateAgentCode = createAsyncThunk(
  "currencyAccounts/validateAgentCode",
  async (agentCode, { rejectWithValue, dispatch }) => {
    try {
      if (!agentCode || agentCode.trim() === "") {
        return { isValid: true, message: "" };
      }

      // Basic client-side validation
      if (agentCode.length > 10) {
        dispatch(setAgentError("The provided Agent Code is invalid"));
        return rejectWithValue("Agent code must be 10 characters or less");
      }

      const response = await api.post("/validate-agent-code", {
        agent_code: agentCode,
      });

      if (response.status === 200) {
        return {
          isValid: true,
          message: "✓ Agent code is valid",
        };
      }
    } catch (error) {
      dispatch(setAgentError("Agent Code Invalid"));
      return rejectWithValue("Agent Code Invalid");
    }
  },
);

// ========== NEW ASYNC THUNK FOR PACKAGE OPTIONS ==========
export const fetchPackageOptions = createAsyncThunk(
  "currencyAccounts/fetchPackageOptions",
  async (
    { accountType, partnerId, API_URL },
    { rejectWithValue, getState },
  ) => {
    try {
      const bearertoken = localStorage.getItem("bearertoken");

      if (!partnerId) {
        partnerId = localStorage.getItem("whitelabelledpartnerid");
      }

      if (!partnerId || partnerId === "0") {
        return rejectWithValue("Partner ID is required for package options");
      }

      console.log("🔍 Fetching package options:", {
        partnerId,
        accountType,
        API_URL,
      });

      const response = await api.get(
        `/package/list/${partnerId}/${accountType}`,
        {
          headers: {
            Authorization: `Bearer ${bearertoken}`,
          },
        },
      );

      console.log("✅ Package data received:", response.data);

      return response.data;
    } catch (error) {
      console.error("❌ Error fetching package options:", error);
      return rejectWithValue(error.message);
    }
  },
);

// ========== FIXED ASYNC THUNK FOR PACKAGE VALIDATION ==========
export const validatePackageCurrencies = createAsyncThunk(
  "currencyAccounts/validatePackageCurrencies",
  async ({ selectedPackageCurrencies, partnerId }, { rejectWithValue }) => {
    try {
      const bearertoken = localStorage.getItem("bearertoken");

      if (!partnerId) {
        partnerId = localStorage.getItem("whitelabelledpartnerid");
      }

      const response = await api.post(
        "/customers/validate-package-currency",
        {
          packageCurrenciesSelected: selectedPackageCurrencies,
          partnerId: partnerId,
        },
        {
          headers: {
            Authorization: `Bearer ${bearertoken}`,
          },
        },
      );

      console.log("Package validation API response:", response.data);

      // FIXED: Safely handle API response to avoid QR issues
      const responseData = response.data;

      // Check if response has status error
      if (responseData && responseData.status === "error") {
        // Safely extract message
        const errorMessage =
          typeof responseData.message === "string"
            ? responseData.message
            : "Package validation failed";
        return rejectWithValue(errorMessage);
      }

      // Return sanitized response data
      return responseData;
    } catch (error) {
      console.error("❌ Error validating package currencies:", error);

      // FIXED: Safely extract error message without triggering QR
      let errorMessage = "Package validation failed";

      if (error.response && error.response.data) {
        const responseData = error.response.data;
        if (typeof responseData.message === "string") {
          errorMessage = responseData.message;
        } else if (typeof responseData.error === "string") {
          errorMessage = responseData.error;
        } else if (typeof responseData === "string") {
          errorMessage = responseData;
        }
      } else if (typeof error.message === "string") {
        errorMessage = error.message;
      }

      return rejectWithValue(errorMessage);
    }
  },
);

const currencyAccountsSlice = createSlice({
  name: "currencyAccounts",
  initialState: {
    accountOptions: [],
    namedAccounts: [],
    pooledAccounts: [],
    isPartnerFlow: false,
    partnerId: null,
    ucaDescription: "",
    selectedAccounts: [],
    referralCode: "",
    referralError: null,
    loading: false,
    termsText: "",
    termsAccepted: false,
    apiError: null,
    termsContent: "",
    searchTerm: "",
    filteredNamedAccounts: [],
    filteredPooledAccounts: [],
    activeTab: "all",
    remittanceOnlyAccepted: false,
    termsModalOpen: false,
    agentCode: "",
    agentError: null,
    isReferralValidating: false,
    isAgentValidating: false,
    validationMessage: "",

    // ✅ NEW: Package-related states
    isPartnerPackageModule:
      localStorage.getItem("isPartnerPackageModule") || "N",
    packageOptions: [],
    selectedPackageCurrencies: [],
    packageFeesUrl: "",
    packageLoading: false,
    packageError: null,
    isPackageValidating: false,
    packageValidationMessage: "",

    // Package-specific flags
    packageDocumentUpload: "Y",
    packageKycVerify: "Y",
    packageOwnerAdd: "Y",
    packageSsnRequired: "Y",
  },
  reducers: {
    // ✅ FIXED: Added the missing toggleAccountSelection reducer
    toggleAccountSelection: (state, action) => {
      const id = action.payload;
      console.log("🔄 toggleAccountSelection:", {
        id,
        currentSelection: [...state.selectedAccounts],
      });

      const isAlreadySelected = state.selectedAccounts.includes(id);

      if (isAlreadySelected) {
        state.selectedAccounts = state.selectedAccounts.filter(
          (accountId) => accountId !== id,
        );
        console.log("🔘 Deselected account:", id);
      } else {
        state.selectedAccounts.push(id);
        console.log("🔘 Added account to selection:", id);
      }

      console.log("🎯 Final selection state:", state.selectedAccounts);
    },

    clearAllSelections: (state) => {
      state.selectedAccounts = [];
      state.selectedPackageCurrencies = [];
      state.remittanceOnlyAccepted = false;
    },
    clearSelectedAccounts: (state) => {
      state.selectedAccounts = [];
    },
    setSelectedAccounts: (state, action) => {
      state.selectedAccounts = action.payload;
    },
    setReferralCode: (state, action) => {
      state.referralCode = action.payload;
      if (action.payload && action.payload.length < 3) {
        state.referralError = "Referral code must be at least 3 characters";
      } else {
        state.referralError = "";
      }
    },
    setReferralError: (state, action) => {
      state.referralError = action.payload;
    },
    setTermsAccepted: (state, action) => {
      state.termsAccepted = action.payload;
    },
    setTermsText: (state, action) => {
      state.termsText = action.payload;
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;

      // Apply both currency and search filtering
      const currencyFilteredNamed = filterAccountsByCurrency(
        state.namedAccounts,
        state.activeTab,
      );
      const currencyFilteredPooled = filterAccountsByCurrency(
        state.pooledAccounts,
        state.activeTab,
      );

      if (action.payload) {
        const searchLower = action.payload.toLowerCase();
        state.filteredNamedAccounts = currencyFilteredNamed.filter((account) =>
          JSON.stringify(account).toLowerCase().includes(searchLower),
        );
        state.filteredPooledAccounts = currencyFilteredPooled.filter(
          (account) =>
            JSON.stringify(account).toLowerCase().includes(searchLower),
        );
      } else {
        state.filteredNamedAccounts = currencyFilteredNamed;
        state.filteredPooledAccounts = currencyFilteredPooled;
      }
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
      // Apply filtering when tab changes
      state.filteredNamedAccounts = filterAccountsByCurrency(
        state.namedAccounts,
        action.payload,
      );
      state.filteredPooledAccounts = filterAccountsByCurrency(
        state.pooledAccounts,
        action.payload,
      );

      // If there's a search term, apply search filtering on top of currency filtering
      if (state.searchTerm) {
        const searchLower = state.searchTerm.toLowerCase();
        state.filteredNamedAccounts = state.filteredNamedAccounts.filter(
          (account) =>
            JSON.stringify(account).toLowerCase().includes(searchLower),
        );
        state.filteredPooledAccounts = state.filteredPooledAccounts.filter(
          (account) =>
            JSON.stringify(account).toLowerCase().includes(searchLower),
        );
      }
    },
    setRemittanceOnlyAccepted: (state, action) => {
      state.remittanceOnlyAccepted = action.payload;
    },
    setTermsModalOpen: (state, action) => {
      state.termsModalOpen = action.payload;
    },
    togglePackageCurrencySelection: (state, action) => {
      const { currencyId } = action.payload;

      console.log("🔄 togglePackageCurrencySelection:", {
        currencyId,
        currentSelection: [...state.selectedPackageCurrencies],
      });

      const isAlreadySelected =
        state.selectedPackageCurrencies.includes(currencyId);

      if (isAlreadySelected) {
        state.selectedPackageCurrencies =
          state.selectedPackageCurrencies.filter((id) => id !== currencyId);
        console.log("🔘 Deselected currency:", currencyId);
      } else {
        state.selectedPackageCurrencies.push(currencyId);
        console.log("🔘 Added currency to selection:", currencyId);
      }

      console.log("🎯 Final selection state:", state.selectedPackageCurrencies);
    },

    clearError: (state) => {
      state.apiError = null;
      state.referralError = null;
      state.agentError = null;
      state.packageError = null;
    },
    resetState: (state) => {
      return {
        accountOptions: [],
        namedAccounts: [],
        pooledAccounts: [],
        isPartnerFlow: false,
        partnerId: null,
        ucaDescription: "",
        selectedAccounts: [],
        referralCode: "",
        referralError: null,
        loading: false,
        termsText: "",
        termsAccepted: false,
        apiError: null,
        termsContent: "",
        searchTerm: "",
        filteredNamedAccounts: [],
        filteredPooledAccounts: [],
        activeTab: "all",
        remittanceOnlyAccepted: false,
        termsModalOpen: false,
        agentCode: "",
        agentError: null,
        isReferralValidating: false,
        isAgentValidating: false,
        validationMessage: "",
        isPartnerPackageModule: "N",
        packageOptions: [],
        selectedPackageCurrencies: [],
        packageFeesUrl: "",
        packageLoading: false,
        packageError: null,
        isPackageValidating: false,
        packageValidationMessage: "",
        packageDocumentUpload: "Y",
        packageKycVerify: "Y",
        packageOwnerAdd: "Y",
        packageSsnRequired: "Y",
      };
    },
    setAgentCode: (state, action) => {
      state.agentCode = action.payload;
      if (action.payload && action.payload.length > 10) {
        state.agentError = "The provided Agent Code is invalid";
      } else {
        state.agentError = "";
      }
    },
    setAgentError: (state, action) => {
      state.agentError = action.payload;
    },
    setValidationMessage: (state, action) => {
      state.validationMessage = action.payload;
    },
    clearValidationMessage: (state) => {
      state.validationMessage = "";
    },

    // ✅ NEW: Package-related reducers
    setIsPartnerPackageModule: (state, action) => {
      state.isPartnerPackageModule = action.payload;
    },
    setPackageOptions: (state, action) => {
      state.packageOptions = action.payload;
    },
    setSelectedPackageCurrencies: (state, action) => {
      state.selectedPackageCurrencies = action.payload;
    },
    setPackageFeesUrl: (state, action) => {
      state.packageFeesUrl = action.payload;
    },

    setPackageFlags: (state, action) => {
      const { ssnRequired, ownerAdd, documentUpload, kycVerify, feesUrl } =
        action.payload;
      if (ssnRequired !== undefined) state.packageSsnRequired = ssnRequired;
      if (ownerAdd !== undefined) state.packageOwnerAdd = ownerAdd;
      if (documentUpload !== undefined)
        state.packageDocumentUpload = documentUpload;
      if (kycVerify !== undefined) state.packageKycVerify = kycVerify;
      if (feesUrl !== undefined) state.packageFeesUrl = feesUrl;
    },
    clearPackageValidationMessage: (state) => {
      state.packageValidationMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch account options
      .addCase(fetchAccountOptions.pending, (state) => {
        state.loading = true;
        state.apiError = null;
      })
      .addCase(fetchAccountOptions.fulfilled, (state, action) => {
        state.loading = false;
        const {
          accountOptionsData,
          termsData,
          accountType,
          countryId,
          isPartnerFlow,
          partnerId,
        } = action.payload;

        console.log("✅ fetchAccountOptions successful:", {
          isPartnerFlow,
          partnerId,
          accountType,
          countryId,
          hasTermsData: !!termsData,
          termsDataStructure: termsData
            ? Object.keys(termsData)
            : "No termsData",
        });

        // Set description based on account type
        const descriptionKey =
          accountType === "individual"
            ? "individual_description"
            : "institution_description";
        state.ucaDescription =
          accountOptionsData[descriptionKey] ||
          accountOptionsData.description ||
          (isPartnerFlow
            ? `Select your currency accounts through our partner program`
            : "Select your preferred currency accounts to get started");

        // ✅ FIXED: Process accounts data with correct API response structure
        let accountsData = [];

        if (isPartnerFlow) {
          // ✅ PARTNER API RESPONSE FORMAT - API returns {status, message, data: [...]}
          console.log("🔍 Processing partner response format:", termsData);

          // Primary extraction: Access the data array from response
          if (termsData && termsData.data && Array.isArray(termsData.data)) {
            accountsData = termsData.data;
            console.log(
              "✅ Extracted accounts from termsData.data:",
              accountsData.length,
            );
          }
          // Fallback: If response is already an array (for compatibility)
          else if (Array.isArray(termsData)) {
            accountsData = termsData;
            console.log(
              "⚠️ Using termsData directly as array:",
              accountsData.length,
            );
          }
          // Additional fallbacks for different API formats
          else if (
            termsData &&
            termsData.currencies &&
            Array.isArray(termsData.currencies)
          ) {
            accountsData = termsData.currencies;
          } else if (
            termsData &&
            termsData.accounts &&
            Array.isArray(termsData.accounts)
          ) {
            accountsData = termsData.accounts;
          } else if (
            termsData &&
            termsData.success &&
            Array.isArray(termsData.result)
          ) {
            accountsData = termsData.result;
          }

          // Add partner flag to accounts if needed
          accountsData = accountsData.map((account) => ({
            ...account,
            is_partner_account: true,
            partner_id: partnerId,
          }));
        } else {
          // ✅ STANDARD API RESPONSE FORMAT - Handle various possible structures
          if (Array.isArray(termsData)) {
            accountsData = termsData;
          } else if (
            termsData &&
            termsData.data &&
            Array.isArray(termsData.data)
          ) {
            accountsData = termsData.data;
          } else if (
            termsData &&
            termsData.accounts &&
            Array.isArray(termsData.accounts)
          ) {
            accountsData = termsData.accounts;
          } else if (
            termsData &&
            termsData.success &&
            Array.isArray(termsData.result)
          ) {
            accountsData = termsData.result;
          }
        }

        console.log("📊 Processed accounts data:", {
          totalAccounts: accountsData.length,
          sampleAccount: accountsData[0],
          allCurrencies: accountsData.map((a) => a.currency).filter(Boolean),
        });

        // Separate accounts by type
        const named = accountsData.filter(
          (account) =>
            account.accountType === "named" ||
            account.account_type === "named" ||
            account.type === "named" ||
            (isPartnerFlow && account.account_type === "1"),
        );

        const pooled = accountsData.filter(
          (account) =>
            account.accountType === "pooled" ||
            account.account_type === "pooled" ||
            account.type === "pooled" ||
            (isPartnerFlow && account.account_type === "0"),
        );

        state.accountOptions = accountsData;
        state.namedAccounts = named;
        state.pooledAccounts = pooled;
        state.isPartnerFlow = isPartnerFlow;
        state.partnerId = partnerId;

        // Apply initial filtering based on active tab
        state.filteredNamedAccounts = filterAccountsByCurrency(
          named,
          state.activeTab,
        );
        state.filteredPooledAccounts = filterAccountsByCurrency(
          pooled,
          state.activeTab,
        );

        // Set terms text
        if (termsData && termsData.termsText) {
          state.termsText = "I agree to " + termsData.termsText;
        } else if (termsData && termsData.terms_text) {
          state.termsText = "I agree to " + termsData.terms_text;
        } else if (termsData && termsData.terms) {
          state.termsText = "I agree to " + termsData.terms;
        } else if (isPartnerFlow) {
          const partnerName =
            localStorage.getItem("whitelabelled_customer_partnername") ||
            "Partner";
          state.termsText = `I agree to ${partnerName} Terms and Conditions`;
        } else {
          state.termsText =
            "Please confirm that you agree on the Charges and Fees";
        }

        // ✅ Debug: Log final state
        console.log("🎯 Final Redux State:", {
          allAccounts: state.accountOptions.length,
          namedAccounts: state.namedAccounts.length,
          pooledAccounts: state.pooledAccounts.length,
          currenciesAvailable: [
            ...new Set(
              state.accountOptions.map((a) => a.currency).filter(Boolean),
            ),
          ],
          filteredNamed: state.filteredNamedAccounts.length,
          filteredPooled: state.filteredPooledAccounts.length,
        });
      })

      .addCase(fetchAccountOptions.rejected, (state, action) => {
        state.loading = false;
        state.apiError = action.payload;
        console.error("❌ fetchAccountOptions rejected:", action.payload);
      })
      // Fetch terms content
      .addCase(fetchTermsContent.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTermsContent.fulfilled, (state, action) => {
        state.loading = false;
        state.termsContent = action.payload;
        state.termsModalOpen = true;
      })
      .addCase(fetchTermsContent.rejected, (state, action) => {
        state.loading = false;
        state.apiError = action.payload;
      })
      // Validate referral code
      .addCase(validateReferralCode.pending, (state) => {
        state.isReferralValidating = true;
        state.referralError = null;
        state.validationMessage = "";
      })
      .addCase(validateReferralCode.fulfilled, (state, action) => {
        state.isReferralValidating = false;
        state.validationMessage = action.payload.message;
      })
      .addCase(validateReferralCode.rejected, (state, action) => {
        state.isReferralValidating = false;
        state.referralError = action.payload;
      })
      // Validate agent code
      .addCase(validateAgentCode.pending, (state) => {
        state.isAgentValidating = true;
        state.agentError = null;
        state.validationMessage = "";
      })
      .addCase(validateAgentCode.fulfilled, (state, action) => {
        state.isAgentValidating = false;
        state.validationMessage = action.payload.message;
      })
      .addCase(validateAgentCode.rejected, (state, action) => {
        state.isAgentValidating = false;
        state.agentError = action.payload;
      })
      // Fetch package options
      .addCase(fetchPackageOptions.pending, (state) => {
        state.packageLoading = true;
        state.packageError = null;
      })
      .addCase(fetchPackageOptions.fulfilled, (state, action) => {
        state.packageLoading = false;
        const packageData = action.payload.data || action.payload;
        state.packageOptions = packageData;

        // Set initial package fees URL if available
        if (packageData.length > 0 && packageData[0].currencies) {
          const firstCurrency = packageData[0].currencies[0];
          if (firstCurrency.fees_url) {
            state.packageFeesUrl = firstCurrency.fees_url;
          }
        }

        // Set partner-specific terms text
        const partnerName =
          localStorage.getItem("whitelabelled_customer_partnername") ||
          "Partner";
        state.termsText = `I agree to ${partnerName} Terms and Conditions`;
      })
      .addCase(fetchPackageOptions.rejected, (state, action) => {
        state.packageLoading = false;
        state.packageError = action.payload;
      })
      // Validate package currencies - FIXED
      .addCase(validatePackageCurrencies.pending, (state) => {
        state.isPackageValidating = true;
        state.packageValidationMessage = "";
        state.packageError = null;
      })
      .addCase(validatePackageCurrencies.fulfilled, (state, action) => {
        state.isPackageValidating = false;
        state.packageValidationMessage =
          action.payload.message || "Package validation successful";
        state.packageError = null;
      })
      .addCase(validatePackageCurrencies.rejected, (state, action) => {
        state.isPackageValidating = false;
        state.packageValidationMessage =
          action.payload || "Package validation failed";
        state.packageError = action.payload; // This will be "Only 1 currency allowed"
      });
  },
});

export const {
  setSelectedAccounts,
  setReferralCode,
  setReferralError,
  setTermsAccepted,
  setTermsText,
  setSearchTerm,
  setActiveTab,
  setRemittanceOnlyAccepted,
  setTermsModalOpen,
  toggleAccountSelection, // ✅ NOW PROPERLY EXPORTED
  clearError,
  resetState,
  clearSelectedAccounts,
  clearAllSelections,
  setAgentCode,
  setAgentError,
  setValidationMessage,
  clearValidationMessage,
  // ✅ NEW: Package actions
  setIsPartnerPackageModule,
  setPackageOptions,
  setSelectedPackageCurrencies,
  setPackageFeesUrl,
  togglePackageCurrencySelection,
  setPackageFlags,
  clearPackageValidationMessage,
} = currencyAccountsSlice.actions;

export default currencyAccountsSlice.reducer;
