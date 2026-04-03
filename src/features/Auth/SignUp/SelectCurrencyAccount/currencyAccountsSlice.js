// features/currencyAccounts/currencyAccountsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../../services/api";

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
      (field) => field && typeof field === "string"
    );

    return accountCurrency === currencyFilter;
  });
};

// Async thunks
export const fetchAccountOptions = createAsyncThunk(
  "currencyAccounts/fetchAccountOptions",
  async ({ accountType, countryId, API_URL }, { rejectWithValue }) => {
    try {
      // Get onboarding description
      const accountOptionsResponse = await api.get(
        "/get-onboarding-description"
      );

      let endpoint;
      if (accountType === "partner") {
        endpoint = "/get-bank-ac-type/Individuals"; // Fallback or adjust as needed
      } else {
        endpoint = `/get-bank-ac-type-and-country/${accountType}/${countryId}`;
      }

      const termsResponse = await api.get(endpoint);

      return {
        accountOptionsData: accountOptionsResponse.data,
        termsData: termsResponse.data,
        accountType,
        countryId,
      };
    } catch (error) {
      console.error("API Error:", error.response?.data || error.message);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTermsContent = createAsyncThunk(
  "currencyAccounts/fetchTermsContent",
  async (url, { rejectWithValue }) => {
    try {
      // ✅ USE api.js INSTEAD OF FETCH - MUCH SIMPLER!
      const response = await api.get(url, {
        responseType: "text", // Important for HTML content
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
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
  }
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
  }
);

const currencyAccountsSlice = createSlice({
  name: "currencyAccounts",
  initialState: {
    accountOptions: [],
    namedAccounts: [],
    pooledAccounts: [],
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
    // ⚠️ REMOVED: isNamedAccount: false,
    agentCode: "",
    agentError: null,
    isReferralValidating: false,
    isAgentValidating: false,
    validationMessage: "",
  },
  reducers: {
    clearAllSelections: (state) => {
      state.selectedAccounts = [];
      state.remittanceOnlyAccepted = false;
    },
    clearSelectedAccounts: (state) => {
      state.selectedAccounts = [];
    },
    setSelectedAccounts: (state, action) => {
      state.selectedAccounts = action.payload;
      // ⚠️ REMOVED: No need to set isNamedAccount here
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
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;

      // Apply both currency and search filtering
      const currencyFilteredNamed = filterAccountsByCurrency(
        state.namedAccounts,
        state.activeTab
      );
      const currencyFilteredPooled = filterAccountsByCurrency(
        state.pooledAccounts,
        state.activeTab
      );

      if (action.payload) {
        const searchLower = action.payload.toLowerCase();
        state.filteredNamedAccounts = currencyFilteredNamed.filter((account) =>
          JSON.stringify(account).toLowerCase().includes(searchLower)
        );
        state.filteredPooledAccounts = currencyFilteredPooled.filter(
          (account) =>
            JSON.stringify(account).toLowerCase().includes(searchLower)
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
        action.payload
      );
      state.filteredPooledAccounts = filterAccountsByCurrency(
        state.pooledAccounts,
        action.payload
      );

      // If there's a search term, apply search filtering on top of currency filtering
      if (state.searchTerm) {
        const searchLower = state.searchTerm.toLowerCase();
        state.filteredNamedAccounts = state.filteredNamedAccounts.filter(
          (account) =>
            JSON.stringify(account).toLowerCase().includes(searchLower)
        );
        state.filteredPooledAccounts = state.filteredPooledAccounts.filter(
          (account) =>
            JSON.stringify(account).toLowerCase().includes(searchLower)
        );
      }
    },
    setRemittanceOnlyAccepted: (state, action) => {
      state.remittanceOnlyAccepted = action.payload;
    },
    setTermsModalOpen: (state, action) => {
      state.termsModalOpen = action.payload;
    },
    toggleAccountSelection: (state, action) => {
      const accountId = action.payload;
      const index = state.selectedAccounts.indexOf(accountId);
      if (index > -1) {
        state.selectedAccounts.splice(index, 1);
      } else {
        state.selectedAccounts.push(accountId);
      }
      // ⚠️ REMOVED: No need to update isNamedAccount here
    },
    clearError: (state) => {
      state.apiError = null;
      state.referralError = null;
      state.agentError = null;
    },
    resetState: (state) => {
      return {
        accountOptions: [],
        namedAccounts: [],
        pooledAccounts: [],
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
        // ⚠️ REMOVED: isNamedAccount: false,
        agentCode: "",
        agentError: null,
        isReferralValidating: false,
        isAgentValidating: false,
        validationMessage: "",
      };
    },
    // ⚠️ REMOVED: setIsNamedAccount reducer
    setAgentCode: (state, action) => {
      state.agentCode = action.payload;
      // Basic validation - check if more than 10 characters
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
        const { accountOptionsData, termsData, accountType } = action.payload;

        // Set description
        const descriptionKey =
          accountType === "individual"
            ? "individual_description"
            : "institution_description";
        state.ucaDescription =
          accountOptionsData[descriptionKey] ||
          accountOptionsData.description ||
          "Select your preferred currency accounts to get started";

        // Process accounts data
        let accountsData = [];
        if (Array.isArray(termsData)) {
          accountsData = termsData;
        } else if (termsData.data && Array.isArray(termsData.data)) {
          accountsData = termsData.data;
        } else if (termsData.accounts && Array.isArray(termsData.accounts)) {
          accountsData = termsData.accounts;
        } else if (termsData.success && Array.isArray(termsData.result)) {
          accountsData = termsData.result;
        }

        // Separate accounts by type
        const named = accountsData.filter(
          (account) =>
            account.accountType === "named" ||
            account.account_type === "named" ||
            account.type === "named"
        );

        const pooled = accountsData.filter(
          (account) =>
            account.accountType === "pooled" ||
            account.account_type === "pooled" ||
            account.type === "pooled"
        );

        state.accountOptions = accountsData;
        state.namedAccounts = named;
        state.pooledAccounts = pooled;

        // Apply initial filtering based on active tab
        state.filteredNamedAccounts = filterAccountsByCurrency(
          named,
          state.activeTab
        );
        state.filteredPooledAccounts = filterAccountsByCurrency(
          pooled,
          state.activeTab
        );

        // ⚠️ REMOVED: No need to reset isNamedAccount
        // state.isNamedAccount = false;

        // Set terms text
        if (termsData.termsText) {
          state.termsText = "I agree to " + termsData.termsText;
        } else if (termsData.terms_text) {
          state.termsText = "I agree to " + termsData.terms_text;
        } else if (termsData.terms) {
          state.termsText = "I agree to " + termsData.terms;
        } else {
          state.termsText =
            "Please confirm that you agree on the Charges and Fees";
        }
      })
      .addCase(fetchAccountOptions.rejected, (state, action) => {
        state.loading = false;
        state.apiError = action.payload;
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
      });
  },
});

export const {
  setSelectedAccounts,
  setReferralCode,
  setReferralError,
  setTermsAccepted,
  setSearchTerm,
  setActiveTab,
  setRemittanceOnlyAccepted,
  setTermsModalOpen,
  toggleAccountSelection,
  clearError,
  resetState,
  // ⚠️ REMOVED: setIsNamedAccount,
  clearSelectedAccounts,
  clearAllSelections,
  setAgentCode,
  setAgentError,
  setValidationMessage,
  clearValidationMessage,
} = currencyAccountsSlice.actions;

export default currencyAccountsSlice.reducer;