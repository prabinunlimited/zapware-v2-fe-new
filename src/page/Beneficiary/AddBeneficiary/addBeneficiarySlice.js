import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";

// Async thunk for fetching beneficiaries
export const fetchBeneficiaries = createAsyncThunk(
  "beneficiaries/fetchBeneficiaries",
  async (customerId, { rejectWithValue }) => {
    try {
      const authtoken = localStorage.getItem("authtoken");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/beneficiaries/${customerId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch beneficiaries");
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for deleting beneficiary
export const deleteBeneficiary = createAsyncThunk(
  "beneficiaries/deleteBeneficiary",
  async ({ customerId, beneficiaryId }, { rejectWithValue }) => {
    try {
      const authtoken = localStorage.getItem("authtoken");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/beneficiaries/${customerId}/${beneficiaryId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete beneficiary");
      }

      const result = await response.json();
      return { beneficiaryId, message: result.message };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for toggling beneficiary visibility
export const toggleBeneficiaryVisibility = createAsyncThunk(
  "beneficiaries/toggleBeneficiaryVisibility",
  async ({ customerId, beneficiaryId, isVisible }, { rejectWithValue }) => {
    try {
      const authtoken = localStorage.getItem("authtoken");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/beneficiaries/${customerId}/${beneficiaryId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
          body: JSON.stringify({
            status: isVisible ? 1 : 0,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update beneficiary visibility");
      }

      const result = await response.json();
      return { beneficiaryId, isVisible, message: result.message };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating beneficiary
export const updateBeneficiary = createAsyncThunk(
  "beneficiaries/updateBeneficiary",
  async (
    { customerId, beneficiaryId, beneficiaryData },
    { rejectWithValue }
  ) => {
    try {
      const authtoken = localStorage.getItem("authtoken");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/beneficiaries/update/${customerId}/${beneficiaryId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
          body: JSON.stringify(beneficiaryData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update beneficiary");
      }

      const result = await response.json();
      return {
        beneficiaryId,
        beneficiary: result.data || beneficiaryData,
        message: result.message || "Beneficiary updated successfully",
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createBeneficiaryWithBanks = createAsyncThunk(
  "beneficiaries/createBeneficiaryWithBanks",
  async (
    { customerId, beneficiaryData, bankAccounts, currency },
    { rejectWithValue }
  ) => {
    try {
      console.log("🔧 Creating beneficiary with banks...");
      console.log("🔧 Customer ID:", customerId);
      console.log("🔧 Beneficiary Data:", beneficiaryData);
      console.log("🔧 Bank Accounts:", bankAccounts);
      console.log("🔧 Currency:", currency);

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

        let bankDetails = {
          rails: account.rails, // This is REQUIRED
          currency_code: account.currency || currency,
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
        };

        // Debug the account rails
        console.log(
          `📝 Processing bank account ${index} with rails: "${account.rails}"`
        );

        // Transform based on rails type - ensure required fields are present
        if (account.rails === "Swift") {
          bankDetails = {
            ...bankDetails,
            rails: "Swift",
            currency_code: account.currency || currency,
            payment_method: "swift",
            benef_iban: account.iban || "",
            swift_code: account.swift || "",
            intermediary_bank_swift: account.intermediarySwift || "",
          };
        } else if (account.rails === "Local") {
          // Handle different currencies for local transfers
          if (currency === "USD") {
            bankDetails = {
              ...bankDetails,
              rails: "Local",
              currency_code: currency,
              payment_method: account.paymentMethod || "ACH",
              routing_number: account.routingNumber || "",
              bank_acc_no: account.accountNumber || "",
              account_type: account.accountType || "",
              bankCode: account.routingNumber || "",
              swift_code: account.swift || "",
            };
          } else if (currency === "INR") {
            bankDetails = {
              ...bankDetails,
              rails: "Local",
              currency_code: currency,
              payment_method: "",
              bank_acc_no: account.accountNumber || "",
              account_type: account.accountType || "",
              bank_name: account.bankName || "",
              ifsc: account.ifsc || "",
            };
          } else if (currency === "AED") {
            bankDetails = {
              ...bankDetails,
              rails: "Local",
              currency_code: currency,
              payment_method: "",
              benef_iban: account.iban || "",
              bic_code: account.swift || "",
            };
          } else if (currency === "EUR") {
            bankDetails = {
              ...bankDetails,
              rails: "Local",
              currency_code: currency,
              payment_method: "",
              benef_iban: account.iban || "",
            };
          } else if (currency === "GBP" || currency === "DKK") {
            bankDetails = {
              ...bankDetails,
              rails: "Local",
              currency_code: currency,
              payment_method: "",
              bank_acc_no: account.accountNumber || "",
              sort_code: account.sortCode || "",
            };
          } else {
            // Default local transfer structure for other currencies
            bankDetails = {
              ...bankDetails,
              rails: "Local",
              currency_code: currency,
              payment_method: "",
              bank_acc_no: account.accountNumber || "",
              bank_name: account.bankName || "",
              bankCode: account.bankCode || "",
              branchCode: account.branchCode || "",
              bankState: account.bankState || "",
            };
          }
        } else if (account.rails === "Mobile") {
          bankDetails = {
            ...bankDetails,
            rails: "Mobile",
            currency_code: currency,
            payment_method: "mobile",
            mobile_number: account.mobileNumber || "",
            wallet_provider: account.walletProvider || "",
            other_provider: account.otherProvider || "",
          };
        }

        // Ensure rails is always included
        if (!bankDetails.rails) {
          console.error(
            `❌ ERROR: rails field is missing in bankDetails for account ${index}!`
          );
          // Set a default if missing
          bankDetails.rails = "Local";
        }

        console.log(
          `✅ Bank account ${index} prepared: rails="${bankDetails.rails}"`
        );
        return bankDetails;
      });

      // Log the transformed banks payload
      console.log("📦 Transformed banks payload:", banksPayload);

      const payload = {
        ...beneficiaryData,
        banks: banksPayload,
      };

      console.log(
        "📡 Final payload to send:",
        JSON.stringify(payload, null, 2)
      );
      console.log(
        "📡 API URL:",
        `${
          import.meta.env.VITE_API_URL
        }/beneficiaries/create-benef/${customerId}`
      );

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/beneficiaries/create-benef/${customerId}`,
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

        // Try to parse the error message
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
// Dropdown data async thunks
export const fetchNationalities = createAsyncThunk(
  "beneficiaries/fetchNationalities",
  async (_, { rejectWithValue }) => {
    try {
      const authtoken = localStorage.getItem("authtoken");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/nationalities`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
        }
      );

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

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}${endpoint}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
        }
      );

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
  async (currency, { rejectWithValue }) => {
    try {
      console.log(`API: Fetching ID types for currency: ${currency}`);

      const authtoken = localStorage.getItem("authtoken");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/currency-id-type/${currency}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
        }
      );

      console.log("API Response status:", response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch ID types: ${response.status}`);
      }

      const result = await response.json();
      console.log("API Response data:", result);

      // Return both currency and data
      return { currency, data: result.data || result || [] };
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
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/cities/${countryId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
        }
      );

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
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/int-banks-branch/${bankCode}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
        }
      );

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

const initialState = {
  // Beneficiaries list state
  beneficiaries: [],
  beneficiariesLoading: false,
  beneficiariesError: null,

  // Operation states
  operationLoading: false,
  operationError: null,
  operationSuccess: false,

  // Selected beneficiary
  selectedBeneficiary: null,

  // Filters and pagination
  filters: {
    search: "",
    status: "all",
    beneftype: "all",
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  },

  // Add beneficiary state
  createLoading: false,
  createError: null,
  createSuccess: false,
  beneficiaryId: null,

  // Dropdown data state
  nationalities: [],
  banks: {},
  idTypes: {},
  cities: {},
  bankBranches: {},
  dropdownLoading: false,
  dropdownError: null,
};

const beneficiariesSlice = createSlice({
  name: "beneficiaries",
  initialState,
  reducers: {
    // Clear errors
    clearError: (state) => {
      state.beneficiariesError = null;
      state.operationError = null;
      state.createError = null;
      state.dropdownError = null;
    },

    // Clear success messages
    clearSuccess: (state) => {
      state.operationSuccess = false;
      state.createSuccess = false;
    },

    // Reset state
    resetState: (state) => {
      state.beneficiariesLoading = false;
      state.operationLoading = false;
      state.beneficiariesError = null;
      state.operationError = null;
      state.operationSuccess = false;
      state.createLoading = false;
      state.createError = null;
      state.createSuccess = false;
    },

    // Set selected beneficiary
    setSelectedBeneficiary: (state, action) => {
      state.selectedBeneficiary = action.payload;
    },

    // Clear selected beneficiary
    clearSelectedBeneficiary: (state) => {
      state.selectedBeneficiary = null;
    },

    // Update filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Clear filters
    clearFilters: (state) => {
      state.filters = {
        search: "",
        status: "all",
        beneftype: "all",
      };
    },

    // Add beneficiary actions
    clearCreateError: (state) => {
      state.createError = null;
    },

    clearCreateSuccess: (state) => {
      state.createSuccess = false;
    },

    resetCreateState: (state) => {
      state.createLoading = false;
      state.createError = null;
      state.createSuccess = false;
      state.beneficiaryId = null;
    },

    // Dropdown data actions
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
  },
  extraReducers: (builder) => {
    builder
      // Fetch beneficiaries
      .addCase(fetchBeneficiaries.pending, (state) => {
        state.beneficiariesLoading = true;
        state.beneficiariesError = null;
      })
      .addCase(fetchBeneficiaries.fulfilled, (state, action) => {
        state.beneficiariesLoading = false;
        state.beneficiaries = action.payload;
        state.beneficiariesError = null;
      })
      .addCase(fetchBeneficiaries.rejected, (state, action) => {
        state.beneficiariesLoading = false;
        state.beneficiariesError = action.payload;
      })

      // Delete beneficiary
      .addCase(deleteBeneficiary.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
        state.operationSuccess = false;
      })
      .addCase(deleteBeneficiary.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.beneficiaries = state.beneficiaries.filter(
          (beneficiary) => beneficiary.id !== action.payload.beneficiaryId
        );
        state.operationSuccess = true;
        state.operationError = null;
      })
      .addCase(deleteBeneficiary.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
        state.operationSuccess = false;
      })

      // Toggle beneficiary visibility
      .addCase(toggleBeneficiaryVisibility.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
        state.operationSuccess = false;
      })
      .addCase(toggleBeneficiaryVisibility.fulfilled, (state, action) => {
        state.operationLoading = false;
        const { beneficiaryId, isVisible } = action.payload;
        const beneficiary = state.beneficiaries.find(
          (b) => b.id === beneficiaryId
        );
        if (beneficiary) {
          beneficiary.status = isVisible ? 1 : 0;
        }
        state.operationSuccess = true;
        state.operationError = null;
      })
      .addCase(toggleBeneficiaryVisibility.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
        state.operationSuccess = false;
      })

      // Update beneficiary
      .addCase(updateBeneficiary.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
        state.operationSuccess = false;
      })
      .addCase(updateBeneficiary.fulfilled, (state, action) => {
        state.operationLoading = false;
        const { beneficiaryId, beneficiary } = action.payload;
        const index = state.beneficiaries.findIndex(
          (b) => b.id === beneficiaryId
        );
        if (index !== -1) {
          state.beneficiaries[index] = {
            ...state.beneficiaries[index],
            ...beneficiary,
          };
        }
        state.operationSuccess = true;
        state.operationError = null;
      })
      .addCase(updateBeneficiary.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
        state.operationSuccess = false;
      })

      // Create beneficiary with banks
      .addCase(createBeneficiaryWithBanks.pending, (state) => {
        console.log("⏳ createBeneficiaryWithBanks PENDING");
        state.createLoading = true;
        state.createError = null;
        state.createSuccess = false;
      })
      .addCase(createBeneficiaryWithBanks.fulfilled, (state, action) => {
        console.log("✅ createBeneficiaryWithBanks FULFILLED");
        console.log("✅ Action payload:", action.payload);
        state.createLoading = false;
        state.createSuccess = true;
        state.beneficiaryId =
          action.payload.beneficiary_id || action.payload.benef_id;
        state.createError = null;

        // Add the new beneficiary to the list if available
        if (action.payload.beneficiary) {
          state.beneficiaries.unshift(action.payload.beneficiary);
        }
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

      // Nationalities
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

      // Banks by currency
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

      // ID Types by currency
      .addCase(fetchIdTypesByCurrency.pending, (state) => {
        state.dropdownLoading = true;
        state.dropdownError = null;
      })
      .addCase(fetchIdTypesByCurrency.fulfilled, (state, action) => {
        state.dropdownLoading = false;
        const { currency, data } = action.payload;
        state.idTypes[currency] = data;
      })
      .addCase(fetchIdTypesByCurrency.rejected, (state, action) => {
        state.dropdownLoading = false;
        state.dropdownError = action.payload;
      })

      // Cities by country
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

      // Bank branches
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
      });
  },
});

// Selectors
export const selectBeneficiaries = (state) => state.beneficiaries.beneficiaries;
export const selectBeneficiariesLoading = (state) =>
  state.beneficiaries.beneficiariesLoading;
export const selectBeneficiariesError = (state) =>
  state.beneficiaries.beneficiariesError;

// ✅ FIXED: Added the missing selectors
export const selectOperationLoading = (state) =>
  state.beneficiaries.operationLoading;
export const selectOperationError = (state) =>
  state.beneficiaries.operationError;
export const selectOperationSuccess = (state) =>
  state.beneficiaries.operationSuccess;

export const selectSelectedBeneficiary = (state) =>
  state.beneficiaries.selectedBeneficiary;
export const selectFilters = (state) => state.beneficiaries.filters;

// Add beneficiary selectors
export const selectCreateLoading = (state) => state.beneficiaries.createLoading;
export const selectCreateError = (state) => state.beneficiaries.createError;
export const selectCreateSuccess = (state) => state.beneficiaries.createSuccess;
export const selectBeneficiaryId = (state) => state.beneficiaries.beneficiaryId;

// Dropdown data selectors
export const selectNationalities = (state) => state.beneficiaries.nationalities;
export const selectBanks = (state) => state.beneficiaries.banks;
export const selectIdTypes = (state) => state.beneficiaries.idTypes;
export const selectCities = (state) => state.beneficiaries.cities;
export const selectBankBranches = (state) => state.beneficiaries.bankBranches;
export const selectDropdownLoading = (state) =>
  state.beneficiaries.dropdownLoading;
export const selectDropdownError = (state) => state.beneficiaries.dropdownError;

// Memoized selectors
export const selectFilteredBeneficiaries = createSelector(
  [selectBeneficiaries, selectFilters],
  (beneficiaries, filters) => {
    const { search, status, beneftype } = filters;

    return beneficiaries.filter((beneficiary) => {
      // Search filter
      const matchesSearch =
        !search ||
        beneficiary.name?.toLowerCase().includes(search.toLowerCase()) ||
        beneficiary.email?.toLowerCase().includes(search.toLowerCase()) ||
        beneficiary.phone_number?.includes(search);

      // Status filter
      const matchesStatus =
        status === "all" ||
        (status === "active" && beneficiary.status === 1) ||
        (status === "inactive" && beneficiary.status === 0);

      // Beneficiary type filter
      const matchesType =
        beneftype === "all" || beneficiary.beneftype === beneftype;

      return matchesSearch && matchesStatus && matchesType;
    });
  }
);

// Helper function to get banks based on currency and type
export const selectBanksForCurrency = (currency) => (state) => {
  if (["BDT", "LKR", "AUD", "PKR"].includes(currency)) {
    return state.beneficiaries.banks[`${currency}_int`] || [];
  }
  return state.beneficiaries.banks[currency] || [];
};

// Helper function to get bank branches
export const selectBankBranchesForBank = (bankCode) => (state) => {
  return state.beneficiaries.bankBranches[bankCode] || [];
};

// Export actions
export const {
  clearError,
  clearSuccess,
  resetState,
  setSelectedBeneficiary,
  clearSelectedBeneficiary,
  setFilters,
  clearFilters,
  clearCreateError,
  clearCreateSuccess,
  resetCreateState,
  clearDropdownError,
  clearDropdownData,
} = beneficiariesSlice.actions;

export default beneficiariesSlice.reducer;
