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

// ===================== UPDATE BENEFICIARY BANK ASYNC THUNKS =====================
export const updateBeneficiaryBank = createAsyncThunk(
  "beneficiaries/updateBeneficiaryBank",
  async ({ beneficiaryId, bankId, bankData }, { rejectWithValue }) => {
    try {
      const authtoken = localStorage.getItem("authtoken");
      const response = await fetch(
        `${API_URL}/beneficiaries/${beneficiaryId}/banks/${bankId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
          body: JSON.stringify(bankData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update bank");
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ===================== ADD BENEFICIARY BANK ASYNC THUNKS =====================
export const addBeneficiaryBank = createAsyncThunk(
  "beneficiaries/addBeneficiaryBank",
  async ({ beneficiaryId, bankData }, { rejectWithValue }) => {
    try {
      const authtoken = localStorage.getItem("authtoken");
      const response = await fetch(
        `${API_URL}/beneficiaries/${beneficiaryId}/banks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
          body: JSON.stringify(bankData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add bank");
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ===================== DELETE BENEFICIARY BANK ASYNC THUNKS =====================
export const deleteBeneficiaryBank = createAsyncThunk(
  "beneficiaries/deleteBeneficiaryBank",
  async ({ beneficiaryId, bankId }, { rejectWithValue }) => {
    try {
      const authtoken = localStorage.getItem("authtoken");
      const response = await fetch(
        `${API_URL}/beneficiaries/${beneficiaryId}/banks/${bankId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete bank");
      }

      return { beneficiaryId, bankId };
    } catch (error) {
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
      const response = await fetch(
        `${API_URL}/beneficiaries/${beneficiaryId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch beneficiary");
      }

      return await response.json();
    } catch (error) {
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
      console.log("📤 Updating beneficiary with:", {
        customerId,
        beneficiaryId,
        beneficiaryData,
      });

      const authtoken = localStorage.getItem("authtoken");

      // Format current_date_time like the non-redux version
      const currentDateTime = new Date().toLocaleString(); // Changed from ISO format

      // Create payload matching the non-redux version
      const payload = {
        ...beneficiaryData,
        current_date_time: currentDateTime,
        // Include these additional fields that the API might expect
        name: `${beneficiaryData.first_name} ${beneficiaryData.last_name}`.trim(),
        street: beneficiaryData.street || "", // Ensure street is included
        pincode: beneficiaryData.postalcode || "", // Map postalcode to pincode if needed
        // idTypes: beneficiaryData.idTypes || [] // Add if needed
      };

      console.log("📤 Payload being sent:", payload);

      // ✅ Use the correct endpoint from non-redux version
      const response = await fetch(
        `${API_URL}/beneficiaries/update-benef/${beneficiaryId}`,
        {
          method: "POST", // ✅ Changed from PUT to POST
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      console.log("📡 API Response status:", response.status);

      if (!response.ok) {
        const errorResult = await response.json();
        console.error("❌ API Error Response:", errorResult);
        throw new Error(
          errorResult.message ||
            errorResult.error ||
            "Failed to update beneficiary"
        );
      }

      const result = await response.json();
      console.log("✅ API Success Response:", result);

      return {
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

  // Create beneficiary state
  createLoading: false,
  createError: null,
  createSuccess: false,
  beneficiaryId: null,

  // Fetch beneficiary state
  fetchLoading: false,
  fetchError: null,
  beneficiaryData: null,

  // Update beneficiary state
  updateLoading: false,
  updateError: null,
  updateSuccess: false,

  // Bank operations state
  bankLoading: false,
  bankError: null,
  bankSuccess: false,
  bankOperation: null, // 'add', 'update', or 'delete'
  bankId: null,

  // Dropdown data state (for forms)
  nationalities: [],
  banks: {},
  idTypes: {},
  cities: {},
  bankBranches: {},
  dropdownLoading: false,
  dropdownError: null,

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

    clearBankError: (state) => {
      state.bankError = null;
      state.bankSuccess = false;
      state.bankOperation = null;
      state.bankId = null;
    },

    // Clear fetch beneficiary state
    clearFetchState: (state) => {
      state.fetchLoading = false;
      state.fetchError = null;
      state.beneficiaryData = null;
    },

    // Clear update beneficiary state
    clearUpdateState: (state) => {
      state.updateLoading = false;
      state.updateError = null;
      state.updateSuccess = false;
    },

    // Set beneficiary data (useful for editing)
    setBeneficiaryData: (state, action) => {
      state.beneficiaryData = action.payload;
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
      })

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

        // Update beneficiary data if it exists
        if (state.beneficiaryData) {
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

      // ===================== UPDATE BENEFICIARY BANK =====================
      .addCase(updateBeneficiaryBank.pending, (state) => {
        console.log("⏳ updateBeneficiaryBank PENDING");
        state.bankLoading = true;
        state.bankError = null;
        state.bankSuccess = false;
        state.bankOperation = "update";
      })
      .addCase(updateBeneficiaryBank.fulfilled, (state, action) => {
        console.log("✅ updateBeneficiaryBank FULFILLED");
        state.bankLoading = false;
        state.bankSuccess = true;
        state.bankError = null;
        state.bankId = action.payload.bankId || null;

        // Update beneficiary data if it exists
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
        state.bankLoading = false;
        state.bankError = action.payload;
        state.bankSuccess = false;
      })

      // ===================== ADD BENEFICIARY BANK =====================
      .addCase(addBeneficiaryBank.pending, (state) => {
        console.log("⏳ addBeneficiaryBank PENDING");
        state.bankLoading = true;
        state.bankError = null;
        state.bankSuccess = false;
        state.bankOperation = "add";
      })
      .addCase(addBeneficiaryBank.fulfilled, (state, action) => {
        console.log("✅ addBeneficiaryBank FULFILLED");
        state.bankLoading = false;
        state.bankSuccess = true;
        state.bankError = null;
        state.bankId = action.payload.bankId || null;

        // Add bank to beneficiary data if it exists
        if (state.beneficiaryData && state.beneficiaryData.banks) {
          state.beneficiaryData.banks.push(action.payload);
        }
      })
      .addCase(addBeneficiaryBank.rejected, (state, action) => {
        console.error("❌ addBeneficiaryBank REJECTED:", action.payload);
        state.bankLoading = false;
        state.bankError = action.payload;
        state.bankSuccess = false;
      })

      // ===================== DELETE BENEFICIARY BANK =====================
      .addCase(deleteBeneficiaryBank.pending, (state) => {
        console.log("⏳ deleteBeneficiaryBank PENDING");
        state.bankLoading = true;
        state.bankError = null;
        state.bankSuccess = false;
        state.bankOperation = "delete";
      })
      .addCase(deleteBeneficiaryBank.fulfilled, (state, action) => {
        console.log("✅ deleteBeneficiaryBank FULFILLED");
        state.bankLoading = false;
        state.bankSuccess = true;
        state.bankError = null;
        state.bankId = action.payload.bankId;

        // Remove bank from beneficiary data if it exists
        if (state.beneficiaryData && state.beneficiaryData.banks) {
          state.beneficiaryData.banks = state.beneficiaryData.banks.filter(
            (bank) => bank.id !== action.payload.bankId
          );
        }
      })
      .addCase(deleteBeneficiaryBank.rejected, (state, action) => {
        console.error("❌ deleteBeneficiaryBank REJECTED:", action.payload);
        state.bankLoading = false;
        state.bankError = action.payload;
        state.bankSuccess = false;
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

// Fetch beneficiary selectors
export const selectFetchLoading = (state) => state.addBeneficiary.fetchLoading;
export const selectFetchError = (state) => state.addBeneficiary.fetchError;
export const selectBeneficiaryData = (state) =>
  state.addBeneficiary.beneficiaryData;

// Update beneficiary selectors
export const selectUpdateLoading = (state) =>
  state.addBeneficiary.updateLoading;
export const selectUpdateError = (state) => state.addBeneficiary.updateError;
export const selectUpdateSuccess = (state) =>
  state.addBeneficiary.updateSuccess;

// Bank operations selectors
export const selectBankLoading = (state) => state.addBeneficiary.bankLoading;
export const selectBankError = (state) => state.addBeneficiary.bankError;
export const selectBankSuccess = (state) => state.addBeneficiary.bankSuccess;
export const selectBankOperation = (state) =>
  state.addBeneficiary.bankOperation;
export const selectBankId = (state) => state.addBeneficiary.bankId;

// Helper to get specific bank by ID
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
