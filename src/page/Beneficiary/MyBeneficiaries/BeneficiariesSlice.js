// src/page/Beneficiary/MyBeneficiaries/beneficiarySlice.js - UPDATED VERSION
import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import api from "../../../services/api";

// ===================== UPDATED ASYNC THUNKS TO MATCH FIRST EXAMPLE =====================
export const fetchBeneficiaries = createAsyncThunk(
  "beneficiaries/fetchBeneficiaries",
  async (customerId, { rejectWithValue }) => {
    try {
      console.log("🔄 Fetching beneficiaries for customer:", customerId);
      const authtoken = localStorage.getItem("authtoken");

      // ✅ FIXED: Use the correct API endpoint format without the extra "/beneficiaries" prefix
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
      console.error("❌ Failed to fetch beneficiaries:", error);
      return rejectWithValue(error.message);
    }
  }
);


export const deleteBeneficiary = createAsyncThunk(
  "beneficiaries/deleteBeneficiary",
  async ({ customerId, beneficiaryId }, { rejectWithValue }) => {
    try {
      console.log("🔄 Deleting beneficiary:", { customerId, beneficiaryId });
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
      console.error("❌ Failed to delete beneficiary:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const toggleBeneficiaryVisibility = createAsyncThunk(
  "beneficiaries/toggleBeneficiaryVisibility",
  async ({ customerId, beneficiaryId, isVisible }, { rejectWithValue }) => {
    try {
      console.log("🔄 Toggling beneficiary visibility:", {
        customerId,
        beneficiaryId,
        isVisible,
      });
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
      console.error("❌ Failed to update beneficiary visibility:", error);
      return rejectWithValue(error.message);
    }
  }
);

// ===================== EXISTING ADDITIONAL ASYNC THUNKS =====================
export const updateBeneficiary = createAsyncThunk(
  "beneficiaries/updateBeneficiary",
  async (
    { customerId, beneficiaryId, beneficiaryData },
    { rejectWithValue }
  ) => {
    try {
      console.log("🔄 Updating beneficiary:", { customerId, beneficiaryId });
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
      console.error("❌ Failed to update beneficiary:", error);
      return rejectWithValue(error.message);
    }
  }
);

// ===================== ADD BENEFICIARY ASYNC THUNKS =====================
export const createBeneficiaryWithBanks = createAsyncThunk(
  "beneficiaries/createBeneficiaryWithBanks",
  async (
    { customerId, beneficiaryData, bankAccounts, currency },
    { rejectWithValue }
  ) => {
    try {
      console.log("🔄 Creating beneficiary with banks:", {
        customerId,
        currency,
      });

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
            } else if (currency === "GBP") {
              bankDetails = {
                rails: "Local",
                currency_code: currency,
                payment_method: "",
                bank_acc_no: account.accountNumber,
                sort_code: account.sortCode,
              };
            } else if (currency === "DKK") {
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
      console.log("✅ Beneficiary created successfully");
      return result;
    } catch (error) {
      console.error("❌ Failed to create beneficiary:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Dropdown data async thunks
export const fetchNationalities = createAsyncThunk(
  "beneficiaries/fetchNationalities",
  async (_, { rejectWithValue }) => {
    try {
      console.log("🔄 Fetching nationalities");
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
      console.error("❌ Failed to fetch nationalities:", error);
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
      console.log("🔄 Fetching banks for currency:", { currency, bankType });
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
      console.error("❌ Failed to fetch banks:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchIdTypesByCurrency = createAsyncThunk(
  "beneficiaries/fetchIdTypesByCurrency",
  async (currency, { rejectWithValue }) => {
    try {
      console.log("🔄 Fetching ID types for currency:", currency);
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
      console.error("❌ Failed to fetch ID types:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCitiesByCountry = createAsyncThunk(
  "beneficiaries/fetchCitiesByCountry",
  async (countryId, { rejectWithValue }) => {
    try {
      console.log("🔄 Fetching cities for country:", countryId);
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
      console.error("❌ Failed to fetch cities:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchBankBranches = createAsyncThunk(
  "beneficiaries/fetchBankBranches",
  async (bankCode, { rejectWithValue }) => {
    try {
      console.log("🔄 Fetching bank branches for bank:", bankCode);
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
      console.error("❌ Failed to fetch bank branches:", error);
      return rejectWithValue(error.message);
    }
  }
);

// ===================== INITIAL STATE =====================
const initialState = {
  // Existing beneficiaries state
  beneficiaries: [],
  loading: false,
  error: null,
  success: false,
  selectedBeneficiary: null,
  lastUpdated: null,

  // Existing search/filter state
  searchQuery: "",
  filterVisibility: "all",
  currentPage: 1,
  deleteLoading: false,

  // NEW STATE FOR ADD BENEFICIARY
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

// ===================== SLICE =====================
const beneficiarySlice = createSlice({
  name: "beneficiaries",
  initialState,
  reducers: {
    // Existing reducers
    clearError: (state) => {
      state.error = null;
      state.createError = null;
      state.dropdownError = null;
    },
    clearSuccess: (state) => {
      state.success = false;
      state.createSuccess = false;
    },
    resetState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
    setSelectedBeneficiary: (state, action) => {
      state.selectedBeneficiary = action.payload;
    },
    clearSelectedBeneficiary: (state) => {
      state.selectedBeneficiary = null;
    },
    resetBeneficiaries: (state) => {
      state.beneficiaries = [];
      state.loading = false;
      state.error = null;
      state.success = false;
      state.selectedBeneficiary = null;
      state.lastUpdated = null;
      state.searchQuery = "";
      state.filterVisibility = "all";
      state.currentPage = 1;
      state.deleteLoading = false;
    },
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
    addBeneficiaryToList: (state, action) => {
      const newBeneficiary = action.payload;
      if (Array.isArray(state.beneficiaries)) {
        state.beneficiaries.unshift(newBeneficiary);
      } else {
        state.beneficiaries = [newBeneficiary];
      }
    },

    // Search, filter and pagination reducers
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

    // NEW REDUCERS FOR ADD BENEFICIARY
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
      // ===================== UPDATED EXTRA REDUCERS TO MATCH FIRST EXAMPLE =====================
      // Fetch beneficiaries
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
      })
      .addCase(fetchBeneficiaries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete beneficiary
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
      })
      .addCase(deleteBeneficiary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.deleteLoading = false;
      })

      // Toggle visibility
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

      // ===================== EXISTING ADDITIONAL EXTRA REDUCERS =====================
      // Update beneficiary
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
        }
      })
      .addCase(updateBeneficiary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })

      // ===================== ADD BENEFICIARY EXTRA REDUCERS =====================
      // Create beneficiary with banks
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
        }
      })
      .addCase(createBeneficiaryWithBanks.rejected, (state, action) => {
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

// ===================== ACTION EXPORTS =====================
export const {
  clearError,
  clearSuccess,
  resetState,
  setSelectedBeneficiary,
  clearSelectedBeneficiary,
  resetBeneficiaries,
  updateBeneficiaryInList,
  addBeneficiaryToList,
  setSearchQuery,
  setFilterVisibility,
  setCurrentPage,
  toggleVisibilityLocal,
  // NEW ACTION EXPORTS
  clearCreateError,
  clearCreateSuccess,
  resetCreateState,
  clearDropdownError,
  clearDropdownData,
  clearBanksData,
  clearIdTypesData,
} = beneficiarySlice.actions;

// ===================== SELECTORS =====================

// Existing selectors
export const selectBeneficiaries = (state) =>
  state.beneficiaries.beneficiaries || [];
export const selectBeneficiariesLoading = (state) =>
  state.beneficiaries.loading;
export const selectBeneficiariesError = (state) => state.beneficiaries.error;
export const selectBeneficiariesSuccess = (state) =>
  state.beneficiaries.success;
export const selectSelectedBeneficiary = (state) =>
  state.beneficiaries.selectedBeneficiary;
export const selectBeneficiariesLastUpdated = (state) =>
  state.beneficiaries.lastUpdated;
export const selectSearchQuery = (state) => state.beneficiaries.searchQuery;
export const selectFilterVisibility = (state) =>
  state.beneficiaries.filterVisibility;
export const selectCurrentPage = (state) => state.beneficiaries.currentPage;
export const selectDeleteLoading = (state) => state.beneficiaries.deleteLoading;

// NEW SELECTORS FOR ADD BENEFICIARY
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

// Memoized selectors with createSelector for better performance
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

export const selectPaginatedBeneficiaries = createSelector(
  [selectFilteredBeneficiaries, selectCurrentPage],
  (filteredBeneficiaries, currentPage) => {
    const startIndex = (currentPage - 1) * 10;
    const endIndex = startIndex + 10;
    return filteredBeneficiaries.slice(startIndex, endIndex);
  }
);

export const selectTotalPages = createSelector(
  [selectFilteredBeneficiaries],
  (filteredBeneficiaries) => Math.ceil(filteredBeneficiaries.length / 10)
);

// Helper selectors
export const selectVisibleBeneficiaries = (state) =>
  (state.beneficiaries.beneficiaries || []).filter(
    (beneficiary) =>
      beneficiary.is_visible !== false &&
      beneficiary.isVisible !== false &&
      beneficiary.status !== 0
  );

export const selectBeneficiaryById = (beneficiaryId) => (state) =>
  (state.beneficiaries.beneficiaries || []).find(
    (beneficiary) => beneficiary.id === beneficiaryId
  );

export const selectBeneficiariesByCurrency = (currency) => (state) =>
  (state.beneficiaries.beneficiaries || []).filter(
    (beneficiary) => beneficiary.currency === currency
  );

// Additional utility selectors
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

export default beneficiarySlice.reducer;
