import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";

// ===================== BENEFICIARY LIST ASYNC THUNKS =====================
export const fetchBeneficiaries = createAsyncThunk(
  "beneficiaries/fetchBeneficiaries",
  async (customerId, { rejectWithValue }) => {
    try {
      const authtoken = localStorage.getItem("authtoken");

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/beneficiaries/customer-view/${customerId}`,
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

// ===================== REMITTANCE-SPECIFIC ASYNC THUNKS =====================
export const fetchBeneficiaryByCode = createAsyncThunk(
  "beneficiaries/fetchBeneficiaryByCode",
  async (beneficiaryCode, { rejectWithValue }) => {
    try {
      const authtoken = localStorage.getItem("authtoken");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/beneficiaries/fetch-benef/${beneficiaryCode}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch beneficiary by code");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchBeneficiaryBanks = createAsyncThunk(
  "beneficiaries/fetchBeneficiaryBanks",
  async (beneficiaryId, { rejectWithValue }) => {
    try {
      const authtoken = localStorage.getItem("authtoken");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/beneficiaries/benef-all-bank/${beneficiaryId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch beneficiary banks");
      }

      const result = await response.json();
      console.log("🔍 Bank API Result:", result);
      return result?.bank_accounts || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ===================== BENEFICIARY UPDATE ASYNC THUNKS =====================
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

// ===================== CREATE BENEFICIARY ASYNC THUNKS =====================
export const createBeneficiaryWithBanks = createAsyncThunk(
  "beneficiaries/createBeneficiaryWithBanks",
  async (
    { customerId, beneficiaryData, bankAccounts, currency },
    { rejectWithValue }
  ) => {
    try {
      const authtoken = localStorage.getItem("authtoken");
      const payload = {
        ...beneficiaryData,
        banks: bankAccounts.map((account) => {
          let bankDetails = {
            rails: account.rails,
            currency_code: currency,
            payment_method: account.paymentMethod,
            benef_iban: account.iban,
            swift_code: account.swift,
            intermediary_bank_swift: account.intermediarySwift,
            routing_number: account.routingNumber,
            bank_acc_no: account.accountNumber,
            sort_code: account.sortCode,
            bank_name: account.bankName,
            ifsc: account.ifsc,
            bankCode: account.bankCode,
            branchCode: account.branchCode,
            bankState: account.bankState,
            account_name: account.accountName,
            account_title: account.accountTitle,
            wallet_provider:
              account.walletProvider === "Other"
                ? account.otherProvider
                : account.walletProvider,
            mobile_number: account.mobileNumber,
            account_type: account.accountType,
          };

          // Transform based on rails type
          if (account.rails === "Swift") {
            bankDetails = {
              rails: "Swift",
              currency_code: currency,
              payment_method: "swift",
              benef_iban: account.iban,
              swift_code: account.swift,
              intermediary_bank_swift: account.intermediarySwift,
            };
          } else if (account.rails === "Local") {
            // Handle different currencies for local transfers
            if (currency === "INR") {
              bankDetails = {
                rails: "Local",
                currency_code: currency,
                payment_method: "",
                bank_acc_no: account.accountNumber,
                account_type: account.accountType,
                bank_name: account.bankName,
                ifsc: account.ifsc,
              };
            } else if (currency === "USD") {
              bankDetails = {
                rails: "Local",
                currency_code: currency,
                payment_method: account.paymentMethod,
                routing_number: account.routingNumber,
                bank_acc_no: account.accountNumber,
                account_type: account.accountType,
                bankCode: account.routingNumber,
                swift_code: account.swift,
              };
            } else if (currency === "AED") {
              bankDetails = {
                rails: "Local",
                currency_code: currency,
                payment_method: "",
                benef_iban: account.iban,
                bic_code: account.swift,
              };
            } else if (currency === "NPR") {
              bankDetails = {
                rails: "Local",
                currency_code: currency,
                payment_method: "",
                bank_name: account.bankName,
                bank_acc_no: account.accountNumber,
                bankCode: account.bankCode,
              };
            } else if (currency === "KES") {
              bankDetails = {
                rails: "Local",
                currency_code: currency,
                payment_method: "",
                bank_acc_no: account.accountNumber,
                bankCode: account.bankCode,
              };
            } else if (currency === "NGN") {
              bankDetails = {
                rails: "Local",
                currency_code: currency,
                payment_method: "",
                bank_acc_no: account.accountNumber,
                bankCode: account.bankCode,
                account_name: account.accountName,
              };
            } else if (currency === "BDT") {
              bankDetails = {
                rails: "Local",
                currency_code: currency,
                payment_method: "",
                bank_acc_no: account.accountNumber,
                bankCode: account.bankCode,
                branchCode: account.branchCode,
                bankState: account.bankState,
              };
            } else if (currency === "LKR") {
              bankDetails = {
                rails: "Local",
                currency_code: currency,
                payment_method: "",
                bank_acc_no: account.accountNumber,
                bankCode: account.bankCode,
                branchCode: account.branchCode,
                bankState: account.bankState,
              };
            } else if (currency === "AUD") {
              bankDetails = {
                rails: "Local",
                currency_code: currency,
                payment_method: "",
                bank_acc_no: account.accountNumber,
                bankCode: account.bankCode,
                branchCode: account.branchCode,
                bankState: account.bankState,
              };
            } else if (currency === "PKR") {
              bankDetails = {
                rails: "Local",
                currency_code: currency,
                payment_method: "",
                bank_acc_no: account.accountNumber,
                bankCode: account.bankCode,
                branchCode: account.branchCode,
                bankState: account.bankState,
                benef_iban: account.iban,
                account_title: account.accountTitle,
              };
            } else if (currency === "GBP" || currency === "DKK") {
              bankDetails = {
                rails: "Local",
                currency_code: currency,
                payment_method: "",
                bank_acc_no: account.accountNumber,
                sort_code: account.sortCode,
              };
            } else if (currency === "EUR") {
              bankDetails = {
                rails: "Local",
                currency_code: currency,
                payment_method: "",
                benef_iban: account.iban,
              };
            }
          } else if (account.rails === "Mobile") {
            bankDetails = {
              rails: "Mobile",
              currency_code: currency,
              payment_method: "mobile",
              mobile_number: account.mobileNumber,
              wallet_provider:
                account.walletProvider === "Other"
                  ? account.otherProvider
                  : account.walletProvider,
            };
          }

          return bankDetails;
        }),
      };

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

      if (!response.ok) {
        throw new Error("Failed to create beneficiary");
      }

      const result = await response.json();
      return result;
    } catch (error) {
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

      if (!response.ok) {
        throw new Error("Failed to fetch ID types");
      }

      const result = await response.json();
      return { currency, data: result.data || [] };
    } catch (error) {
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

// ===================== INITIAL STATE =====================
const initialState = {
  // Beneficiaries list state
  beneficiaries: [],
  loading: false,
  error: null,
  success: false,

  // Selected beneficiary (for both beneficiary list and remittance)
  selectedBeneficiary: null,
  selectedBank: null, // NEW: For remittance

  // Remittance-specific state
  beneficiaryBanks: [], // NEW: Banks for selected beneficiary
  codeLookupLoading: false, // NEW: Loading for code lookup
  codeLookupError: null, // NEW: Error for code lookup
  banksLoading: false, // NEW: Loading for banks fetch

  // Search/filter state
  searchQuery: "",
  filterVisibility: "all",
  currentPage: 1,
  deleteLoading: false,

  // Create beneficiary state
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

  // Last updated timestamp
  lastUpdated: null,
};

// ===================== SLICE =====================
const beneficiarySlice = createSlice({
  name: "beneficiaries",
  initialState,
  reducers: {
    // Clear errors
    clearError: (state) => {
      state.error = null;
      state.createError = null;
      state.dropdownError = null;
      state.codeLookupError = null; // NEW
    },

    // Clear success messages
    clearSuccess: (state) => {
      state.success = false;
      state.createSuccess = false;
    },

    // Reset state
    resetState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.createLoading = false;
      state.createError = null;
      state.createSuccess = false;
    },

    // Selected beneficiary management
    setSelectedBeneficiary: (state, action) => {
      state.selectedBeneficiary = action.payload;
      // Reset related state when beneficiary changes
      state.selectedBank = null;
      state.beneficiaryBanks = [];
    },

    clearSelectedBeneficiary: (state) => {
      state.selectedBeneficiary = null;
      state.selectedBank = null;
      state.beneficiaryBanks = [];
    },

    // NEW: Selected bank management for remittance
    setSelectedBank: (state, action) => {
      state.selectedBank = action.payload;
    },

    clearSelectedBank: (state) => {
      state.selectedBank = null;
    },

    clearBeneficiaryBanks: (state) => {
      state.beneficiaryBanks = [];
    },

    // NEW: Clear code lookup error
    clearCodeLookupError: (state) => {
      state.codeLookupError = null;
    },

    // Reset beneficiaries list
    resetBeneficiaries: (state) => {
      state.beneficiaries = [];
      state.loading = false;
      state.error = null;
      state.success = false;
      state.selectedBeneficiary = null;
      state.selectedBank = null; // NEW
      state.beneficiaryBanks = []; // NEW
      state.lastUpdated = null;
      state.searchQuery = "";
      state.filterVisibility = "all";
      state.currentPage = 1;
      state.deleteLoading = false;
    },

    // Update beneficiary in list
    updateBeneficiaryInList: (state, action) => {
      const { beneficiaryId, updates } = action.payload;
      const index = state.beneficiaries.findIndex(
        (b) => b.id === beneficiaryId
      );
      if (index !== -1) {
        state.beneficiaries[index] = {
          ...state.beneficiaries[index],
          ...updates,
        };
      }
    },

    // Add beneficiary to list
    addBeneficiaryToList: (state, action) => {
      const newBeneficiary = action.payload;
      if (Array.isArray(state.beneficiaries)) {
        state.beneficiaries.unshift(newBeneficiary);
      } else {
        state.beneficiaries = [newBeneficiary];
      }
    },

    // Search, filter and pagination
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.currentPage = 1;
    },

    setFilterVisibility: (state, action) => {
      state.filterVisibility = action.payload;
      state.currentPage = 1;
    },

    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },

    toggleVisibilityLocal: (state, action) => {
      const beneficiary = state.beneficiaries.find(
        (b) => b.id === action.payload
      );
      if (beneficiary) {
        if (beneficiary.hasOwnProperty("isVisible")) {
          beneficiary.isVisible = !beneficiary.isVisible;
        } else if (beneficiary.hasOwnProperty("is_visible")) {
          beneficiary.is_visible = !beneficiary.is_visible;
        } else {
          beneficiary.isVisible = true;
        }
      }
    },

    // Create beneficiary actions
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

    clearBanksData: (state) => {
      state.banks = {};
    },

    clearIdTypesData: (state) => {
      state.idTypes = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // ===================== FETCH BENEFICIARIES =====================
      .addCase(fetchBeneficiaries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBeneficiaries.fulfilled, (state, action) => {
        state.loading = false;

        // Check if the response has the nested data structure
        const beneficiariesData = Array.isArray(action.payload)
          ? action.payload
          : action.payload.data || [];

        state.beneficiaries = beneficiariesData;
        state.error = null;
        state.lastUpdated = new Date().toISOString();

        // Auto-select first beneficiary if none selected
        if (beneficiariesData.length > 0 && !state.selectedBeneficiary) {
          state.selectedBeneficiary = beneficiariesData[0];
        }
      })
      .addCase(fetchBeneficiaries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ===================== DELETE BENEFICIARY =====================
      .addCase(deleteBeneficiary.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.deleteLoading = true;
      })
      .addCase(deleteBeneficiary.fulfilled, (state, action) => {
        state.loading = false;
        state.beneficiaries = state.beneficiaries.filter(
          (beneficiary) => beneficiary.id !== action.payload.beneficiaryId
        );
        state.success = true;
        state.error = null;
        state.deleteLoading = false;
        state.lastUpdated = new Date().toISOString();

        // Clear selected beneficiary if it was deleted
        if (state.selectedBeneficiary?.id === action.payload.beneficiaryId) {
          state.selectedBeneficiary = null;
          state.selectedBank = null;
          state.beneficiaryBanks = [];
        }
      })
      .addCase(deleteBeneficiary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.deleteLoading = false;
      })

      // ===================== TOGGLE VISIBILITY =====================
      .addCase(toggleBeneficiaryVisibility.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleBeneficiaryVisibility.fulfilled, (state, action) => {
        state.loading = false;
        const { beneficiaryId, isVisible } = action.payload;
        const beneficiary = state.beneficiaries.find(
          (b) => b.id === beneficiaryId
        );
        if (beneficiary) {
          beneficiary.status = isVisible ? 1 : 0;
          // Also update the is_visible and isVisible fields for consistency
          beneficiary.is_visible = isVisible;
          beneficiary.isVisible = isVisible;
        }
        state.success = true;
        state.error = null;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(toggleBeneficiaryVisibility.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ===================== NEW: FETCH BENEFICIARY BY CODE (REMITTANCE) =====================
      .addCase(fetchBeneficiaryByCode.pending, (state) => {
        state.codeLookupLoading = true;
        state.codeLookupError = null;
      })
      .addCase(fetchBeneficiaryByCode.fulfilled, (state, action) => {
        state.codeLookupLoading = false;
        if (action.payload.data) {
          // Update selected beneficiary
          state.selectedBeneficiary = action.payload.data;
          // Update beneficiary banks from response
          state.beneficiaryBanks = action.payload.data.benef_banks || [];
          // Auto-select first bank if available
          if (state.beneficiaryBanks.length > 0 && !state.selectedBank) {
            state.selectedBank = state.beneficiaryBanks[0];
          }
          state.codeLookupError = null;
        }
      })
      .addCase(fetchBeneficiaryByCode.rejected, (state, action) => {
        state.codeLookupLoading = false;
        state.codeLookupError = action.payload;
      })

      // ===================== NEW: FETCH BENEFICIARY BANKS (REMITTANCE) =====================
      .addCase(fetchBeneficiaryBanks.pending, (state) => {
        state.banksLoading = true;
      })
      .addCase(fetchBeneficiaryBanks.fulfilled, (state, action) => {
        state.banksLoading = false;
        state.beneficiaryBanks = action.payload;
        // Auto-select first bank if available and none selected
        if (action.payload.length > 0 && !state.selectedBank) {
          state.selectedBank = action.payload[0];
        }
      })
      .addCase(fetchBeneficiaryBanks.rejected, (state) => {
        state.banksLoading = false;
        state.beneficiaryBanks = [];
      })

      // ===================== UPDATE BENEFICIARY =====================
      .addCase(updateBeneficiary.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateBeneficiary.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.success = true;
        state.lastUpdated = new Date().toISOString();

        const { beneficiaryId, beneficiary } = action.payload;
        if (Array.isArray(state.beneficiaries)) {
          const beneficiaryIndex = state.beneficiaries.findIndex(
            (b) => b.id === beneficiaryId
          );

          if (beneficiaryIndex !== -1) {
            state.beneficiaries[beneficiaryIndex] = {
              ...state.beneficiaries[beneficiaryIndex],
              ...beneficiary,
            };
          }

          // Update selected beneficiary if it's the same
          if (state.selectedBeneficiary?.id === beneficiaryId) {
            state.selectedBeneficiary = {
              ...state.selectedBeneficiary,
              ...beneficiary,
            };
          }
        }
      })
      .addCase(updateBeneficiary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })

      // ===================== CREATE BENEFICIARY WITH BANKS =====================
      .addCase(createBeneficiaryWithBanks.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
        state.createSuccess = false;
      })
      .addCase(createBeneficiaryWithBanks.fulfilled, (state, action) => {
        state.createLoading = false;
        state.createSuccess = true;
        state.beneficiaryId = action.payload.beneficiary_id;
        state.createError = null;
        state.lastUpdated = new Date().toISOString();

        // Add the new beneficiary to the list immediately
        if (action.payload.beneficiary) {
          if (Array.isArray(state.beneficiaries)) {
            state.beneficiaries.unshift(action.payload.beneficiary);
          } else {
            state.beneficiaries = [action.payload.beneficiary];
          }

          // Auto-select the newly created beneficiary
          state.selectedBeneficiary = action.payload.beneficiary;
        }
      })
      .addCase(createBeneficiaryWithBanks.rejected, (state, action) => {
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
        state.dropdownLoading = false;
        const { currency, data } = action.payload;
        state.idTypes[currency] = data;
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
      });
  },
});

// ===================== ACTION EXPORTS =====================
export const {
  clearError,
  clearSuccess,
  resetState,
  setSelectedBeneficiary,
  clearSelectedBeneficiary,
  setSelectedBank,
  clearSelectedBank,
  clearBeneficiaryBanks,
  clearCodeLookupError,
  resetBeneficiaries,
  updateBeneficiaryInList,
  addBeneficiaryToList,
  setSearchQuery,
  setFilterVisibility,
  setCurrentPage,
  toggleVisibilityLocal,
  clearCreateError,
  clearCreateSuccess,
  resetCreateState,
  clearDropdownError,
  clearDropdownData,
  clearBanksData,
  clearIdTypesData,
} = beneficiarySlice.actions;

// ===================== SELECTORS =====================

// Core selectors
export const selectBeneficiaries = (state) =>
  state.beneficiaries.beneficiaries || [];
export const selectBeneficiariesLoading = (state) =>
  state.beneficiaries.loading;
export const selectBeneficiariesError = (state) => state.beneficiaries.error;
export const selectBeneficiariesSuccess = (state) =>
  state.beneficiaries.success;
export const selectBeneficiariesLastUpdated = (state) =>
  state.beneficiaries.lastUpdated;

// Selected beneficiary selectors
export const selectSelectedBeneficiary = (state) =>
  state.beneficiaries.selectedBeneficiary;
export const selectSelectedBank = (state) => state.beneficiaries.selectedBank;

// Remittance-specific selectors
export const selectBeneficiaryBanks = (state) =>
  state.beneficiaries.beneficiaryBanks;
export const selectCodeLookupLoading = (state) =>
  state.beneficiaries.codeLookupLoading;
export const selectCodeLookupError = (state) =>
  state.beneficiaries.codeLookupError;
export const selectBanksLoading = (state) => state.beneficiaries.banksLoading;

// Search/filter selectors
export const selectSearchQuery = (state) => state.beneficiaries.searchQuery;
export const selectFilterVisibility = (state) =>
  state.beneficiaries.filterVisibility;
export const selectCurrentPage = (state) => state.beneficiaries.currentPage;
export const selectDeleteLoading = (state) => state.beneficiaries.deleteLoading;

// Create beneficiary selectors
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

// ===================== HELPER SELECTORS =====================

// Helper function to get banks for currency
export const selectBanksForCurrency = (currency) => (state) => {
  if (["BDT", "LKR", "AUD", "PKR"].includes(currency)) {
    return state.beneficiaries.banks[`${currency}_int`] || [];
  }
  return state.beneficiaries.banks[currency] || [];
};

// Helper function to get ID types for currency
export const selectIdTypesForCurrency = (currency) => (state) => {
  return state.beneficiaries.idTypes[currency] || [];
};

// Helper function to get cities for country
export const selectCitiesForCountry = (countryId) => (state) => {
  return state.beneficiaries.cities[countryId] || [];
};

// Helper function to get bank branches
export const selectBankBranchesForBank = (bankCode) => (state) => {
  return state.beneficiaries.bankBranches[bankCode] || [];
};

// ===================== MEMOIZED SELECTORS =====================

// Filtered beneficiaries
export const selectFilteredBeneficiaries = createSelector(
  [selectBeneficiaries, selectSearchQuery, selectFilterVisibility],
  (beneficiaries, searchQuery, filterVisibility) => {
    let filtered = beneficiaries;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (beneficiary) =>
          beneficiary.name?.toLowerCase().includes(query) ||
          beneficiary.full_phone_number?.toLowerCase().includes(query) ||
          beneficiary.phone_number?.toLowerCase().includes(query) ||
          beneficiary.relationtobenef?.toLowerCase().includes(query) ||
          beneficiary.email?.toLowerCase().includes(query)
      );
    }

    // Apply visibility filter
    if (filterVisibility === "visible") {
      filtered = filtered.filter(
        (beneficiary) =>
          beneficiary.isVisible === true ||
          beneficiary.is_visible === true ||
          beneficiary.status === 1
      );
    } else if (filterVisibility === "hidden") {
      filtered = filtered.filter(
        (beneficiary) =>
          beneficiary.isVisible === false ||
          beneficiary.is_visible === false ||
          beneficiary.status === 0
      );
    }

    return filtered;
  }
);

// Paginated beneficiaries
export const selectPaginatedBeneficiaries = createSelector(
  [selectFilteredBeneficiaries, selectCurrentPage],
  (filteredBeneficiaries, currentPage) => {
    const startIndex = (currentPage - 1) * 10;
    const endIndex = startIndex + 10;
    return filteredBeneficiaries.slice(startIndex, endIndex);
  }
);

// Total pages
export const selectTotalPages = createSelector(
  [selectFilteredBeneficiaries],
  (filteredBeneficiaries) => Math.ceil(filteredBeneficiaries.length / 10)
);

// ===================== REMITTANCE-SPECIFIC SELECTORS =====================

// Selector for remittance-ready beneficiaries (with formatted labels)
export const selectRemittanceReadyBeneficiaries = createSelector(
  [selectBeneficiaries],
  (beneficiaries) => {
    return beneficiaries.map((benef) => ({
      ...benef,
      value: benef.id,
      label: `${benef.name} (${
        benef.full_phone_number || benef.phone_number || benef.benef_uuid
      })`,
      id: benef.id,
      formattedName: `${benef.name} (${
        benef.phone_number || benef.email || benef.benef_uuid
      })`,
    }));
  }
);

// Select beneficiary by ID for remittance
export const selectBeneficiaryForRemittance = (beneficiaryId) =>
  createSelector([selectBeneficiaries], (beneficiaries) => {
    const beneficiary = beneficiaries.find((b) => b.id === beneficiaryId);
    if (!beneficiary) return null;

    return {
      ...beneficiary,
      value: beneficiary.id,
      label: `${beneficiary.name} (${
        beneficiary.full_phone_number ||
        beneficiary.phone_number ||
        beneficiary.benef_uuid
      })`,
      formattedName: `${beneficiary.name} (${
        beneficiary.phone_number || beneficiary.email || beneficiary.benef_uuid
      })`,
    };
  });

// Remittance-ready beneficiary banks (with formatted labels)
export const selectRemittanceReadyBanks = createSelector(
  [selectBeneficiaryBanks],
  (banks) => {
    return banks.map((bank) => ({
      ...bank,
      value: bank.id,
      label: `${bank.bank_name || "Unknown Bank"} - ${
        bank.bank_acc_no || bank.account_number || "No Account"
      } (${bank.rails || "Unknown"})`,
      formattedBank: `${bank.bank_name || "Unknown Bank"} (${
        bank.bank_acc_no || bank.account_number || "No Account"
      }) - ${bank.rails || "Unknown"}`,
    }));
  }
);

// ===================== UTILITY SELECTORS =====================

// Visible beneficiaries
export const selectVisibleBeneficiaries = (state) =>
  (state.beneficiaries.beneficiaries || []).filter(
    (beneficiary) =>
      beneficiary.is_visible !== false &&
      beneficiary.isVisible !== false &&
      beneficiary.status !== 0
  );

// Beneficiary by ID
export const selectBeneficiaryById = (beneficiaryId) => (state) =>
  (state.beneficiaries.beneficiaries || []).find(
    (beneficiary) => beneficiary.id === beneficiaryId
  );

// Beneficiaries by currency
export const selectBeneficiariesByCurrency = (currency) => (state) =>
  (state.beneficiaries.beneficiaries || []).filter(
    (beneficiary) => beneficiary.currency === currency
  );

// Count selectors
export const selectBeneficiariesCount = (state) =>
  state.beneficiaries.beneficiaries?.length || 0;

export const selectFilteredBeneficiariesCount = createSelector(
  [selectFilteredBeneficiaries],
  (filteredBeneficiaries) => filteredBeneficiaries.length
);

export const selectVisibleBeneficiariesCount = (state) =>
  (state.beneficiaries.beneficiaries || []).filter(
    (beneficiary) =>
      beneficiary.is_visible !== false &&
      beneficiary.isVisible !== false &&
      beneficiary.status !== 0
  ).length;

// Remittance-specific counts
export const selectRemittanceReadyBeneficiariesCount = createSelector(
  [selectRemittanceReadyBeneficiaries],
  (remittanceReadyBeneficiaries) => remittanceReadyBeneficiaries.length
);

export const selectRemittanceReadyBanksCount = createSelector(
  [selectRemittanceReadyBanks],
  (remittanceReadyBanks) => remittanceReadyBanks.length
);

export default beneficiarySlice.reducer;
