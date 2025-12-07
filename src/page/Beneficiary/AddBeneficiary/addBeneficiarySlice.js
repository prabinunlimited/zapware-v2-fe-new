import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_URL = import.meta.env.VITE_API_URL;

// ===================== CREATE BENEFICIARY ASYNC THUNKS =====================
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
          rails: account.rails,
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

        // Transform based on rails type
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

        return bankDetails;
      });

      const payload = {
        ...beneficiaryData,
        banks: banksPayload,
      };

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
  async (currency, { rejectWithValue }) => {
    try {
      console.log(`API: Fetching ID types for currency: ${currency}`);

      const authtoken = localStorage.getItem("authtoken");
      const response = await fetch(`${API_URL}/currency-id-type/${currency}`, {
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
      console.log("API Response data:", result);

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

// ===================== INITIAL STATE =====================
const initialState = {
  // Create beneficiary state
  createLoading: false,
  createError: null,
  createSuccess: false,
  beneficiaryId: null,

  // Dropdown data state (for forms)
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
    // Clear create state
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

    // Clear dropdown errors
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

    // Clear all errors
    clearError: (state) => {
      state.createError = null;
      state.dropdownError = null;
    },

    // Reset all state
    resetState: (state) => {
      state.createLoading = false;
      state.createError = null;
      state.createSuccess = false;
      state.dropdownLoading = false;
      state.dropdownError = null;
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
  clearCreateError,
  clearCreateSuccess,
  resetCreateState,
  clearDropdownError,
  clearDropdownData,
  clearError,
  resetState,
} = addBeneficiarySlice.actions;

// ===================== SELECTORS =====================

// Create beneficiary selectors
export const selectCreateLoading = (state) =>
  state.addBeneficiary.createLoading;
export const selectCreateError = (state) => state.addBeneficiary.createError;
export const selectCreateSuccess = (state) =>
  state.addBeneficiary.createSuccess;
export const selectBeneficiaryId = (state) =>
  state.addBeneficiary.beneficiaryId;

// Dropdown data selectors
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

// Helper function to get banks based on currency and type
export const selectBanksForCurrency = (currency) => (state) => {
  if (["BDT", "LKR", "AUD", "PKR"].includes(currency)) {
    return state.addBeneficiary.banks[`${currency}_int`] || [];
  }
  return state.addBeneficiary.banks[currency] || [];
};

// Helper function to get bank branches
export const selectBankBranchesForBank = (bankCode) => (state) => {
  return state.addBeneficiary.bankBranches[bankCode] || [];
};

// Helper function to get ID types for currency
export const selectIdTypesForCurrency = (currency) => (state) => {
  return state.addBeneficiary.idTypes[currency] || [];
};

// Helper function to get cities for country
export const selectCitiesForCountry = (countryId) => (state) => {
  return state.addBeneficiary.cities[countryId] || [];
};

// ===================== DEFAULT EXPORT =====================
export default addBeneficiarySlice.reducer;