// features/currencyAccounts/currencyAccountsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../../services/api"; 

// Helper function to filter accounts by currency
const filterAccountsByCurrency = (accounts, currencyFilter) => {
  if (currencyFilter === "all") {
    return accounts;
  }
  
  return accounts.filter(account => {
    // Try multiple possible currency field names
    const currencyFields = [
      account.currency,
      account.currency_code, 
      account.currency_type,
      account.account_currency,
      account.currencyName
    ];
    
    const accountCurrency = currencyFields.find(field => 
      field && typeof field === "string"
    );
    
    return accountCurrency === currencyFilter;
  });
};

// Helper function to check if USD Named Account is selected
const checkIfUSDNamedAccountSelected = (state) => {
  if (!state.selectedAccounts || state.selectedAccounts.length === 0) {
    return false;
  }

  // Check each selected account
  for (const selectedAccountId of state.selectedAccounts) {
    // Try to find the account by different possible ID properties
    let account = state.namedAccounts.find((acc) => {
      // Check multiple possible ID properties
      const possibleIds = [
        acc.service_provide_id_type,
        acc.service_provide_id,
        acc.id,
        acc.account_id,
      ];

      const found = possibleIds.some(
        (id) => id && id.toString() === selectedAccountId.toString()
      );
      return found;
    });

    // If not found in namedAccounts, try accountOptions
    if (!account) {
      account = state.accountOptions.find((acc) => {
        const possibleIds = [
          acc.service_provide_id_type,
          acc.service_provide_id,
          acc.id,
          acc.account_id,
        ];

        const found = possibleIds.some(
          (id) => id && id.toString() === selectedAccountId.toString()
        );
        return found;
      });
    }

    if (account) {
      // Check if it's a named account - check multiple possible properties
      const isNamed =
        account.accountType === "named" ||
        account.account_type === "named" ||
        account.type === "named";

      // Check if it's USD - check multiple possible properties
      const isUSD =
        account.currency === "USD" || account.account_currency === "USD";

      // Return true for ALL USD named accounts
      if (isNamed && isUSD) {
        return true;
      }
    }
  }

  return false;
};

// Async thunks - SIMPLIFIED WITH api.js! 🎉
export const fetchAccountOptions = createAsyncThunk(
  "currencyAccounts/fetchAccountOptions",
  async ({ accountType, bearertoken, API_URL }, { rejectWithValue }) => {
    try {
      
      
      // ✅ USE api.js INSTEAD OF FETCH - MUCH SIMPLER!
      const accountOptionsResponse = await api.get("/get-onboarding-description");

      const accountTypeEndpoint = accountType === "individual" ? "Individuals" : "Institutions";
      const termsResponse = await api.get("/get-bank-ac-type/" + accountTypeEndpoint);

      return { 
        accountOptionsData: accountOptionsResponse.data, 
        termsData: termsResponse.data, 
        accountType 
      };
    } catch (error) {
      
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
        responseType: 'text' // Important for HTML content
      });

      return response.data;
    } catch (error) {
      
      return rejectWithValue(error.message);
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
    isNamedAccount: false,
  },
  reducers: {
    clearAllSelections: (state) => {
      state.selectedAccounts = [];
      state.remittanceOnlyAccepted = false;
      state.isNamedAccount = false;
    },
    clearSelectedAccounts: (state) => {
      state.selectedAccounts = [];
      state.isNamedAccount = false;
    },
    setSelectedAccounts: (state, action) => {
      state.selectedAccounts = action.payload;
      state.isNamedAccount = checkIfUSDNamedAccountSelected(state);
    },
    setReferralCode: (state, action) => {
      state.referralCode = action.payload;
      if (action.payload && action.payload.length < 3) {
        state.referralError = "Referral code must be at least 3 characters";
      } else {
        state.referralError = "";
      }
    },
    setTermsAccepted: (state, action) => {
      state.termsAccepted = action.payload;
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
      
      // Apply both currency and search filtering
      const currencyFilteredNamed = filterAccountsByCurrency(state.namedAccounts, state.activeTab);
      const currencyFilteredPooled = filterAccountsByCurrency(state.pooledAccounts, state.activeTab);
      
      if (action.payload) {
        const searchLower = action.payload.toLowerCase();
        state.filteredNamedAccounts = currencyFilteredNamed.filter(account => 
          JSON.stringify(account).toLowerCase().includes(searchLower)
        );
        state.filteredPooledAccounts = currencyFilteredPooled.filter(account => 
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
      state.filteredNamedAccounts = filterAccountsByCurrency(state.namedAccounts, action.payload);
      state.filteredPooledAccounts = filterAccountsByCurrency(state.pooledAccounts, action.payload);
      
      // If there's a search term, apply search filtering on top of currency filtering
      if (state.searchTerm) {
        const searchLower = state.searchTerm.toLowerCase();
        state.filteredNamedAccounts = state.filteredNamedAccounts.filter(account => 
          JSON.stringify(account).toLowerCase().includes(searchLower)
        );
        state.filteredPooledAccounts = state.filteredPooledAccounts.filter(account => 
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
      // Update isNamedAccount when account selection changes
      state.isNamedAccount = checkIfUSDNamedAccountSelected(state);
    },
    clearError: (state) => {
      state.apiError = null;
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
        isNamedAccount: false,
      };
    },
    setIsNamedAccount: (state, action) => {
      state.isNamedAccount = action.payload;
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

        // Reset isNamedAccount when new accounts are loaded
        state.isNamedAccount = false;

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
      });
  },
});

export const {
  setSelectedAccounts,
  setReferralCode,
  setTermsAccepted,
  setSearchTerm,
  setActiveTab,
  setRemittanceOnlyAccepted,
  setTermsModalOpen,
  toggleAccountSelection,
  clearError,
  resetState,
  setIsNamedAccount,
  clearSelectedAccounts,
  clearAllSelections,
} = currencyAccountsSlice.actions;

export default currencyAccountsSlice.reducer;