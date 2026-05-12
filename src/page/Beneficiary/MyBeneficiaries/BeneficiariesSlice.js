import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import { createBeneficiaryWithBanks } from "../AddBeneficiary/addBeneficiarySlice";

const API_URL = import.meta.env.VITE_API_URL;

// ===================== CREATE AND ADD BENEFICIARY (SIMPLIFIED VERSION) =====================
export const createAndAddBeneficiary = createAsyncThunk(
  "beneficiaries/createAndAddBeneficiary",
  async (
    { customerId, beneficiaryData, bankAccounts, currency, country_code },
    { dispatch, rejectWithValue }
  ) => {
    try {
      console.log("🔄 createAndAddBeneficiary: Starting...");
      console.log("📦 Parameters:", {
        customerId,
        beneficiaryData,
        bankAccountsCount: bankAccounts?.length || 0,
        currency,
        country_code,
      });

      // 1. Create the beneficiary
      const createResult = await dispatch(
        createBeneficiaryWithBanks({
          customerId,
          beneficiaryData,
          bankAccounts,
          currency,
          country_code,
        })
      );

      console.log("📦 Create result:", createResult);

      // Check if creation was successful
      if (createBeneficiaryWithBanks.rejected.match(createResult)) {
        console.error("❌ Creation failed:", createResult.payload);
        throw new Error(createResult.payload || "Failed to create beneficiary");
      }

      // 2. Get the newly created beneficiary ID
      const createPayload = createResult.payload;
      const newBeneficiaryId =
        createPayload?.beneficiary_id ||
        createPayload?.benef_id ||
        createPayload?.id;

      console.log("✅ Beneficiary created, ID:", newBeneficiaryId);

      if (!newBeneficiaryId) {
        console.error("❌ No beneficiary ID found in response:", createPayload);
        throw new Error("No beneficiary ID returned from creation");
      }

      // 3. Add delay to allow DB sync (if needed)
      console.log("⏳ Waiting for DB sync...");
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 4. Fetch the specific beneficiary to ensure it's available
      console.log("🔄 Fetching newly created beneficiary...");
      const fetchResult = await dispatch(
        fetchBeneficiaryById(newBeneficiaryId)
      );

      // Check if fetch was successful
      if (fetchBeneficiaryById.rejected.match(fetchResult)) {
        console.warn(
          "⚠️ Beneficiary fetch failed, but creation was successful:",
          fetchResult.payload
        );
        // Continue anyway since creation was successful
      }

      // 5. Refresh the beneficiaries list
      console.log("🔄 Refreshing beneficiaries list...");
      await dispatch(fetchBeneficiaries(customerId));

      // 6. Return the fetched beneficiary data
      return {
        success: true,
        message: "Beneficiary created and fetched successfully",
        beneficiaryId: newBeneficiaryId,
        beneficiaryData: fetchResult.payload || createPayload,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ createAndAddBeneficiary error:", error);

      // Even if something fails after creation, we might still want to indicate partial success
      if (newBeneficiaryId) {
        console.warn(
          "⚠️ Beneficiary created but post-creation steps failed:",
          error.message
        );
        return {
          success: true,
          warning: "Beneficiary created but some post-creation steps failed",
          beneficiaryId: newBeneficiaryId,
          error: error.message,
          timestamp: new Date().toISOString(),
        };
      }

      return rejectWithValue(error.message || "Failed to create beneficiary");
    }
  }
);

// ===================== SEARCH BENEFICIARY BY PHONE (API CALL) =====================
export const searchBeneficiaryByPhone = createAsyncThunk(
  "beneficiaries/searchBeneficiaryByPhone",
  async ({ phoneNumber, countryPhoneCode }, { rejectWithValue }) => {
    try {
      // Clean the country code - ensure it has + prefix
      let cleanedCountryCode = countryPhoneCode;
      if (cleanedCountryCode && !cleanedCountryCode.startsWith('+')) {
        cleanedCountryCode = `+${cleanedCountryCode}`;
      }
      
      // Prepare payload according to API requirements
      const payload = {
        beneficiary_type: "individual",
        mobile_number_country_code: cleanedCountryCode,
        mobile_number: phoneNumber
      };
      
      console.log('🔍 Searching beneficiary with payload:', payload);
      
      const authtoken = localStorage.getItem("authtoken");
      const API_URL = import.meta.env.VITE_API_URL;
      
      const response = await fetch(
        `${API_URL}/beneficiaries/fetch-by-type-mobile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authtoken}`,
          },
          body: JSON.stringify(payload),
        }
      );
      
      console.log('📡 API Response status:', response.status);
      
      const result = await response.json();
      console.log('✅ API Response data:', result);
      
      // Check if beneficiary exists based on the response structure
      // The API returns data as an array when beneficiary is found
      if (result.status === "success" && 
          result.message === "Beneficiary Fetched Successfully!" &&
          result.data && 
          Array.isArray(result.data) && 
          result.data.length > 0) {
        
        // Extract the first beneficiary from the array
        const beneficiaryData = result.data[0];
        console.log('✅ Beneficiary found:', beneficiaryData);
        
        return {
          exists: true,
          data: beneficiaryData,
          searched: true,
          processed: false,
          message: 'Beneficiary found'
        };
      }
      
      // Check for "Not Found" case
      if (result.status === "success" && 
          (result.message === "Beneficiary Not Found!" || 
           result.message?.includes("Not Found") ||
           !result.data || 
           result.data === "" ||
           (Array.isArray(result.data) && result.data.length === 0))) {
        console.log('ℹ️ No beneficiary found with this phone number');
        return {
          exists: false,
          data: null,
          searched: true,
          processed: false,
          message: 'No beneficiary found with this phone number'
        };
      }
      
      // If response has beneficiary data directly without array wrapper
      if (result.data && !Array.isArray(result.data) && result.data.id) {
        return {
          exists: true,
          data: result.data,
          searched: true,
          processed: false,
          message: 'Beneficiary found'
        };
      }
      
      // Default case - no beneficiary found
      console.log('ℹ️ No beneficiary found (default case)');
      return {
        exists: false,
        data: null,
        searched: true,
        processed: false,
        message: 'No beneficiary found with this phone number'
      };
      
    } catch (error) {
      console.error('❌ Phone search API error:', error);
      return rejectWithValue(error.message || 'Failed to search for beneficiary');
    }
  }
);

// ===================== ORIGINAL THUNKS =====================
export const fetchBeneficiaries = createAsyncThunk(
  "beneficiaries/fetchBeneficiaries",
  async (customerId, { rejectWithValue }) => {
    try {
      const authtoken = localStorage.getItem("authtoken");

      const response = await fetch(
        `${API_URL}/beneficiaries/customer-view/${customerId}`,
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
      console.log("📥 Fetched beneficiaries count:", result.data?.length || 0);

      return result.data || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchBeneficiaryById = createAsyncThunk(
  "beneficiaries/fetchBeneficiaryById",
  async (beneficiaryId, { rejectWithValue }) => {
    try {
      const token =
        localStorage.getItem("bearertoken") ||
        localStorage.getItem("authtoken");

      console.log("📥 Fetching beneficiary:", beneficiaryId);

      const response = await fetch(
        `${API_URL}/beneficiaries/benef-view/${beneficiaryId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("📡 API Response status:", response.status);

      if (!response.ok) {
        throw new Error("Failed to fetch beneficiary details");
      }

      const result = await response.json();
      console.log("✅ API Response:", result);

      let beneficiaryData = null;
      let benefBanks = [];

      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        beneficiaryData = result.data[0];
      } else if (result.data && typeof result.data === "object") {
        beneficiaryData = result.data;
      }

      if (result.benef_banks && Array.isArray(result.benef_banks)) {
        benefBanks = result.benef_banks;
      }

      if (beneficiaryData) {
        beneficiaryData.benef_banks = benefBanks;
      }

      return beneficiaryData;
    } catch (error) {
      console.error("❌ fetchBeneficiaryById error:", error);
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
        `${API_URL}/delete-beneficiary/${beneficiaryId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
          body: JSON.stringify({
            customer_id: customerId,
            current_date_time: new Date()
              .toISOString()
              .replace("T", " ")
              .split(".")[0],
          }),
        }
      );

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(
          errorResult.message ||
            errorResult.error ||
            "Failed to delete beneficiary"
        );
      }

      const result = await response.json();
      return {
        beneficiaryId,
        message: result.message || "Beneficiary deleted successfully!",
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const bulkDeleteBeneficiaries = createAsyncThunk(
  "beneficiaries/bulkDeleteBeneficiaries",
  async ({ customerId, beneficiaryIds }, { rejectWithValue }) => {
    try {
      const authtoken = localStorage.getItem("authtoken");
      const currentDateTime = new Date()
        .toISOString()
        .replace("T", " ")
        .split(".")[0];

      const promises = beneficiaryIds.map((beneficiaryId) =>
        fetch(`${API_URL}/delete-beneficiary/${beneficiaryId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
          body: JSON.stringify({
            customer_id: customerId,
            current_date_time: currentDateTime,
          }),
        }).then(async (response) => {
          if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(
              errorResult.message ||
                `Failed to delete beneficiary ${beneficiaryId}`
            );
          }
          return response.json();
        })
      );

      const results = await Promise.all(promises);

      return {
        beneficiaryIds,
        results,
        message: `Successfully deleted ${beneficiaryIds.length} beneficiaries`,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteBeneficiaryWithUndo = createAsyncThunk(
  "beneficiaries/deleteBeneficiaryWithUndo",
  async (
    { customerId, beneficiaryId, beneficiaryName },
    { rejectWithValue, getState }
  ) => {
    try {
      const authtoken = localStorage.getItem("authtoken");

      const state = getState();
      const beneficiary = state.beneficiaries.beneficiaries.find(
        (b) => b.id === beneficiaryId
      );

      if (beneficiary) {
        localStorage.setItem(
          `undo_beneficiary_${beneficiaryId}`,
          JSON.stringify({
            ...beneficiary,
            deletedAt: new Date().toISOString(),
          })
        );
      }

      const response = await fetch(
        `${API_URL}/delete-beneficiary/${beneficiaryId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
          body: JSON.stringify({
            customer_id: customerId,
            current_date_time: new Date()
              .toISOString()
              .replace("T", " ")
              .split(".")[0],
          }),
        }
      );

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(
          errorResult.message ||
            errorResult.error ||
            "Failed to delete beneficiary"
        );
      }

      const result = await response.json();
      return {
        beneficiaryId,
        beneficiaryName,
        message: result.message || "Beneficiary deleted successfully!",
        undoAvailable: true,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const undoDeleteBeneficiary = createAsyncThunk(
  "beneficiaries/undoDeleteBeneficiary",
  async ({ customerId, beneficiaryId }, { rejectWithValue }) => {
    try {
      const storedData = localStorage.getItem(
        `undo_beneficiary_${beneficiaryId}`
      );
      if (!storedData) {
        throw new Error("Undo data not found or expired");
      }

      const beneficiaryData = JSON.parse(storedData);
      const authtoken = localStorage.getItem("authtoken");

      const response = await fetch(
        `${API_URL}/beneficiaries/restore/${customerId}/${beneficiaryId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authtoken}`,
          },
          body: JSON.stringify(beneficiaryData),
        }
      );

      if (!response.ok) {
        const createResponse = await fetch(
          `${API_URL}/beneficiaries/create-benef/${customerId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authtoken}`,
            },
            body: JSON.stringify(beneficiaryData),
          }
        );

        if (!createResponse.ok) {
          throw new Error("Failed to restore beneficiary");
        }

        const result = await createResponse.json();
        return {
          beneficiaryId: result.beneficiary_id || beneficiaryId,
          beneficiaryData,
          message: "Beneficiary restored successfully",
          restored: true,
        };
      }

      const result = await response.json();
      return {
        beneficiaryId,
        beneficiaryData,
        message: result.message || "Beneficiary restored successfully",
        restored: true,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    } finally {
      localStorage.removeItem(`undo_beneficiary_${beneficiaryId}`);
    }
  }
);

export const toggleBeneficiaryVisibility = createAsyncThunk(
  "beneficiaries/toggleBeneficiaryVisibility",
  async ({ customerId, beneficiaryId, isVisible }, { rejectWithValue }) => {
    try {
      const authtoken = localStorage.getItem("authtoken");
      const response = await fetch(
        `${API_URL}/beneficiaries/${customerId}/${beneficiaryId}`,
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

export const fetchBeneficiaryByCode = createAsyncThunk(
  "beneficiaries/fetchBeneficiaryByCode",
  async (beneficiaryCode, { rejectWithValue }) => {
    try {
      const authtoken = localStorage.getItem("authtoken");
      const response = await fetch(
        `${API_URL}/beneficiaries/fetch-benef/${beneficiaryCode}`,
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
        `${API_URL}/beneficiaries/benef-all-bank/${beneficiaryId}`,
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
      return result.bank_accounts || [];
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

  // Edit beneficiary state
  editLoading: false,
  editError: null,
  beneficiaryDetails: null,

  // Selected beneficiary (for both beneficiary list and remittance)
  selectedBeneficiary: null,
  selectedBank: null,

  // Remittance-specific state
  beneficiaryBanks: [],
  codeLookupLoading: false,
  codeLookupError: null,
  banksLoading: false,

  // Search/filter state
  searchQuery: "",
  filterVisibility: "all",
  currentPage: 1,

  // Delete state
  deleteState: {
    loadingIds: [],
    pendingDeletions: [],
    lastDeleted: null,
    error: null,
    undoAvailable: false,
    undoData: null,
    bulkDeleteInProgress: false,
    bulkDeleteProgress: 0,
    bulkDeleteTotal: 0,
  },

  // Create state
  createState: {
    loading: false,
    error: null,
    success: false,
    lastCreatedId: null,
  },

  // Email search state
  emailSearch: {
    loading: false,
    error: null,
    searched: false,
    exists: false,
    data: null,
    processed: false,
  },

  // Phone search state
  phoneSearch: {
    loading: false,
    error: null,
    searched: false,
    exists: false,
    data: null,
    processed: false,
  },

  // Last updated timestamp
  lastUpdated: null,
};

// ===================== SLICE =====================
const beneficiarySlice = createSlice({
  name: "beneficiaries",
  initialState,
  reducers: {
    // Keep email search for backward compatibility
    searchBeneficiaryByEmail: (state, action) => {
      const { email } = action.payload;
      console.log("🔍 Searching for email in store:", email);

      if (!email) {
        state.emailSearch = initialState.emailSearch;
        return;
      }

      const foundBeneficiary = state.beneficiaries.find(
        (beneficiary) =>
          beneficiary.email &&
          beneficiary.email.toLowerCase() === email.toLowerCase()
      );

      console.log("📊 Found beneficiary:", foundBeneficiary);

      if (foundBeneficiary) {
        let phoneCode = foundBeneficiary.country_phone_code;
        let phoneNumber = foundBeneficiary.phone_number;

        if (!phoneCode && foundBeneficiary.full_phone_number) {
          const fullPhone = foundBeneficiary.full_phone_number;
          if (fullPhone.startsWith("+")) {
            if (fullPhone.startsWith("+1")) {
              phoneCode = "+1";
              phoneNumber = fullPhone.substring(2);
            } else if (fullPhone.startsWith("+44")) {
              phoneCode = "+44";
              phoneNumber = fullPhone.substring(3);
            } else if (fullPhone.startsWith("+91")) {
              phoneCode = "+91";
              phoneNumber = fullPhone.substring(3);
            }
          }
        }

        let countryId = foundBeneficiary.country_id;
        if (!countryId) {
          if (
            foundBeneficiary.city?.toUpperCase() === "HOUSTON" &&
            foundBeneficiary.state?.toUpperCase() === "TX"
          ) {
            countryId = "186";
            if (!phoneCode) phoneCode = "+1";
          }
        }

        let nationalityId = foundBeneficiary.nationality_id;
        if (!nationalityId && countryId === "186") {
          nationalityId = "186";
        }

        let relationValue = foundBeneficiary.relationtobenef;
        const relationshipMap = {
          Father: "father",
          Mother: "mother",
          Sister: "sister",
          Brother: "brother",
          Cousin: "cousin",
          Friend: "friend",
          Other: "other",
          father: "father",
          mother: "mother",
          sister: "sister",
          brother: "brother",
          cousin: "cousin",
          friend: "friend",
          other: "other",
        };

        if (relationValue && relationshipMap[relationValue]) {
          relationValue = relationshipMap[relationValue];
        }

        const cleanData = {
          id: foundBeneficiary.id || "",
          name: foundBeneficiary.name || "",
          email: foundBeneficiary.email || "",
          phone_number: phoneNumber || foundBeneficiary.phone_number || "",
          country_id: countryId?.toString() || "",
          country_phone_code: phoneCode || "+1",
          beneftype: foundBeneficiary.beneftype || "individual",
          state: foundBeneficiary.state || "",
          city: foundBeneficiary.city || "",
          street: foundBeneficiary.street || foundBeneficiary.address || "",
          postalcode: foundBeneficiary.postalcode || "",
          relationtobenef: relationValue || "",
          otherRelationship: foundBeneficiary.otherRelationship || "",
          nationality_id: nationalityId?.toString() || "",
          status: foundBeneficiary.status || 1,
          nic_bcc_code: foundBeneficiary.nic_bcc_code || "",
          beneficiary_id_type: foundBeneficiary.beneficiary_id_type || "",
          beneficiary_id_number: foundBeneficiary.beneficiary_id_number || "",
          currency: foundBeneficiary.currency || "USD",
          banks: foundBeneficiary.banks || [],
        };

        console.log(
          "📋 Clean beneficiary data with inferred values:",
          cleanData
        );

        state.emailSearch.data = cleanData;
        state.emailSearch.exists = true;
        state.emailSearch.searched = true;
      } else {
        state.emailSearch = {
          ...initialState.emailSearch,
          searched: true,
          exists: false,
        };
      }

      state.emailSearch.loading = false;
      state.emailSearch.error = null;
    },

    // Clear errors
    clearError: (state) => {
      state.error = null;
      state.editError = null;
      state.deleteState.error = null;
      state.codeLookupError = null;
      state.createState.error = null;
    },

    // Clear success messages
    clearSuccess: (state) => {
      state.success = false;
      state.createState.success = false;
    },

    // Reset state
    resetState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.deleteState.error = null;
      state.createState.error = null;
    },

    clearEditState: (state) => {
      state.editLoading = false;
      state.editError = null;
      state.beneficiaryDetails = null;
    },

    // Clear create state
    clearCreateState: (state) => {
      console.log("🧹 Clearing create state");
      state.createState.loading = false;
      state.createState.error = null;
      state.createState.success = false;
      state.createState.lastCreatedId = null;
    },

    // Clear create error only
    clearCreateError: (state) => {
      state.createState.error = null;
    },

    // Clear create success only
    clearCreateSuccess: (state) => {
      console.log("🧹 Clearing create success");
      state.createState.success = false;
      state.createState.lastCreatedId = null;
    },

    // Selected beneficiary management
    setSelectedBeneficiary: (state, action) => {
      state.selectedBeneficiary = action.payload;
      state.selectedBank = null;
      state.beneficiaryBanks = [];
    },

    clearSelectedBeneficiary: (state) => {
      state.selectedBeneficiary = null;
      state.selectedBank = null;
      state.beneficiaryBanks = [];
    },

    // Selected bank management for remittance
    setSelectedBank: (state, action) => {
      state.selectedBank = action.payload;
    },

    clearSelectedBank: (state) => {
      state.selectedBank = null;
    },

    clearBeneficiaryBanks: (state) => {
      state.beneficiaryBanks = [];
    },

    // Clear code lookup error
    clearCodeLookupError: (state) => {
      state.codeLookupError = null;
    },

    // Set email search as processed
    setEmailSearchProcessed: (state) => {
      if (state.emailSearch) {
        state.emailSearch.processed = true;
      }
    },

    // Set phone search as processed
    setPhoneSearchProcessed: (state) => {
      if (state.phoneSearch) {
        state.phoneSearch.processed = true;
      }
    },

    // Clear phone search
    clearPhoneSearch: (state) => {
      state.phoneSearch = initialState.phoneSearch;
    },

    // Clear email search
    clearEmailSearch: (state) => {
      state.emailSearch = initialState.emailSearch;
    },

    // Reset beneficiaries list
    resetBeneficiaries: (state) => {
      state.beneficiaries = [];
      state.loading = false;
      state.error = null;
      state.success = false;
      state.selectedBeneficiary = null;
      state.selectedBank = null;
      state.beneficiaryBanks = [];
      state.lastUpdated = null;
      state.searchQuery = "";
      state.filterVisibility = "all";
      state.currentPage = 1;
      state.deleteState = initialState.deleteState;
      state.createState = initialState.createState;
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
      state.success = true;
      state.lastUpdated = new Date().toISOString();
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

    // Delete state actions
    addToDeleteQueue: (state, action) => {
      state.deleteState.pendingDeletions.push(action.payload);
    },

    removeFromDeleteQueue: (state, action) => {
      state.deleteState.pendingDeletions =
        state.deleteState.pendingDeletions.filter(
          (id) => id !== action.payload
        );
    },

    clearDeleteQueue: (state) => {
      state.deleteState.pendingDeletions = [];
    },

    updateBulkDeleteProgress: (state, action) => {
      state.deleteState.bulkDeleteProgress = action.payload.progress;
      state.deleteState.bulkDeleteTotal = action.payload.total;
    },

    clearDeleteState: (state) => {
      state.deleteState = initialState.deleteState;
    },

    clearUndoState: (state) => {
      state.deleteState.undoAvailable = false;
      state.deleteState.undoData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ===================== CREATE AND ADD BENEFICIARY =====================
      .addCase(createAndAddBeneficiary.pending, (state) => {
        console.log("⏳ createAndAddBeneficiary PENDING");
        state.createState.loading = true;
        state.createState.error = null;
        state.createState.success = false;
        state.createState.lastCreatedId = null;
      })
      .addCase(createAndAddBeneficiary.fulfilled, (state, action) => {
        console.log("✅ createAndAddBeneficiary FULFILLED", action.payload);
        state.createState.loading = false;
        state.createState.success = true;
        state.createState.lastCreatedId = action.payload.beneficiaryId;
        state.createState.error = null;

        // Also set the main success flag for backward compatibility
        state.success = true;
        state.lastUpdated = new Date().toISOString();

        console.log("🏁 createState after success:", state.createState);
      })
      .addCase(createAndAddBeneficiary.rejected, (state, action) => {
        console.error("❌ createAndAddBeneficiary REJECTED:", action.payload);
        state.createState.loading = false;
        state.createState.error = action.payload;
        state.createState.success = false;
        state.createState.lastCreatedId = null;
      })

      // ===================== SEARCH BENEFICIARY BY PHONE (API) =====================
      .addCase(searchBeneficiaryByPhone.pending, (state) => {
        state.phoneSearch.loading = true;
        state.phoneSearch.error = null;
        state.phoneSearch.searched = false;
        state.phoneSearch.exists = false;
        state.phoneSearch.data = null;
        state.phoneSearch.processed = false;
      })
      .addCase(searchBeneficiaryByPhone.fulfilled, (state, action) => {
        state.phoneSearch.loading = false;
        state.phoneSearch.searched = true;
        state.phoneSearch.exists = action.payload.exists;
        state.phoneSearch.data = action.payload.data;
        state.phoneSearch.processed = false;
        state.phoneSearch.error = null;
        
        console.log('✅ Phone search fulfilled:', {
          exists: action.payload.exists,
          hasData: !!action.payload.data
        });
      })
      .addCase(searchBeneficiaryByPhone.rejected, (state, action) => {
        state.phoneSearch.loading = false;
        state.phoneSearch.searched = true;
        state.phoneSearch.exists = false;
        state.phoneSearch.data = null;
        state.phoneSearch.error = action.payload;
        state.phoneSearch.processed = false;
        
        console.error('❌ Phone search rejected:', action.payload);
      })

      // ===================== FETCH BENEFICIARIES =====================
      .addCase(fetchBeneficiaries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBeneficiaries.fulfilled, (state, action) => {
        state.loading = false;

        let beneficiariesData = [];

        if (Array.isArray(action.payload)) {
          beneficiariesData = action.payload;
        } else if (action.payload && Array.isArray(action.payload.data)) {
          beneficiariesData = action.payload.data;
        } else if (action.payload && action.payload.data === null) {
          beneficiariesData = [];
        }

        state.beneficiaries = beneficiariesData || [];
        state.error = null;
        state.lastUpdated = new Date().toISOString();

        console.log(`📥 Loaded ${beneficiariesData.length} beneficiaries`);
      })
      .addCase(fetchBeneficiaries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ===================== FETCH BENEFICIARY BY ID (FOR EDIT) =====================
      .addCase(fetchBeneficiaryById.pending, (state) => {
        state.editLoading = true;
        state.editError = null;
        state.beneficiaryDetails = null;
      })
      .addCase(fetchBeneficiaryById.fulfilled, (state, action) => {
        state.editLoading = false;
        state.beneficiaryDetails = action.payload;
        state.editError = null;

        if (action.payload && action.payload.benef_banks) {
          state.beneficiaryBanks = action.payload.benef_banks;
        }
      })
      .addCase(fetchBeneficiaryById.rejected, (state, action) => {
        state.editLoading = false;
        state.editError = action.payload;
        state.beneficiaryDetails = null;
      })

      // ===================== DELETE BENEFICIARY =====================
      .addCase(deleteBeneficiary.pending, (state, action) => {
        const { beneficiaryId } = action.meta.arg;
        state.deleteState.loadingIds.push(beneficiaryId);
        state.error = null;
      })
      .addCase(deleteBeneficiary.fulfilled, (state, action) => {
        const { beneficiaryId } = action.payload;
        state.deleteState.loadingIds = state.deleteState.loadingIds.filter(
          (id) => id !== beneficiaryId
        );
        state.beneficiaries = state.beneficiaries.filter(
          (beneficiary) => beneficiary.id !== beneficiaryId
        );
        state.success = true;
        state.error = null;
        state.lastUpdated = new Date().toISOString();

        if (state.selectedBeneficiary?.id === beneficiaryId) {
          state.selectedBeneficiary = null;
          state.selectedBank = null;
          state.beneficiaryBanks = [];
        }
      })
      .addCase(deleteBeneficiary.rejected, (state, action) => {
        const { beneficiaryId } = action.meta.arg;
        state.deleteState.loadingIds = state.deleteState.loadingIds.filter(
          (id) => id !== beneficiaryId
        );
        state.error = action.payload;
      })

      // ===================== DELETE BENEFICIARY WITH UNDO =====================
      .addCase(deleteBeneficiaryWithUndo.pending, (state, action) => {
        const { beneficiaryId } = action.meta.arg;
        state.deleteState.loadingIds.push(beneficiaryId);
        state.deleteState.error = null;
      })
      .addCase(deleteBeneficiaryWithUndo.fulfilled, (state, action) => {
        const { beneficiaryId } = action.payload;
        state.deleteState.loadingIds = state.deleteState.loadingIds.filter(
          (id) => id !== beneficiaryId
        );
        state.beneficiaries = state.beneficiaries.filter(
          (beneficiary) => beneficiary.id !== beneficiaryId
        );
        state.deleteState.lastDeleted = action.payload;
        state.deleteState.undoAvailable = true;
        state.deleteState.undoData = {
          id: beneficiaryId,
          name: action.payload.beneficiaryName,
        };
        state.success = true;
        state.error = null;
        state.lastUpdated = new Date().toISOString();

        if (state.selectedBeneficiary?.id === beneficiaryId) {
          state.selectedBeneficiary = null;
          state.selectedBank = null;
          state.beneficiaryBanks = [];
        }
      })
      .addCase(deleteBeneficiaryWithUndo.rejected, (state, action) => {
        const { beneficiaryId } = action.meta.arg;
        state.deleteState.loadingIds = state.deleteState.loadingIds.filter(
          (id) => id !== beneficiaryId
        );
        state.deleteState.error = action.payload;
      })

      // ===================== BULK DELETE BENEFICIARIES =====================
      .addCase(bulkDeleteBeneficiaries.pending, (state, action) => {
        const { beneficiaryIds } = action.meta.arg;
        state.deleteState.loadingIds = [
          ...state.deleteState.loadingIds,
          ...beneficiaryIds,
        ];
        state.deleteState.bulkDeleteInProgress = true;
        state.deleteState.bulkDeleteProgress = 0;
        state.deleteState.bulkDeleteTotal = beneficiaryIds.length;
        state.error = null;
      })
      .addCase(bulkDeleteBeneficiaries.fulfilled, (state, action) => {
        const { beneficiaryIds } = action.payload;
        state.deleteState.loadingIds = state.deleteState.loadingIds.filter(
          (id) => !beneficiaryIds.includes(id)
        );
        state.beneficiaries = state.beneficiaries.filter(
          (beneficiary) => !beneficiaryIds.includes(beneficiary.id)
        );
        state.deleteState.bulkDeleteInProgress = false;
        state.deleteState.bulkDeleteProgress = 100;
        state.success = true;
        state.error = null;
        state.lastUpdated = new Date().toISOString();

        if (
          state.selectedBeneficiary &&
          beneficiaryIds.includes(state.selectedBeneficiary.id)
        ) {
          state.selectedBeneficiary = null;
          state.selectedBank = null;
          state.beneficiaryBanks = [];
        }
      })
      .addCase(bulkDeleteBeneficiaries.rejected, (state, action) => {
        state.deleteState.loadingIds = [];
        state.deleteState.bulkDeleteInProgress = false;
        state.error = action.payload;
      })

      // ===================== UNDO DELETE BENEFICIARY =====================
      .addCase(undoDeleteBeneficiary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(undoDeleteBeneficiary.fulfilled, (state, action) => {
        state.loading = false;
        const { beneficiaryId, beneficiaryData } = action.payload;

        if (beneficiaryData) {
          state.beneficiaries.unshift(beneficiaryData);
        }

        state.deleteState.undoAvailable = false;
        state.deleteState.undoData = null;
        state.deleteState.lastDeleted = null;
        state.success = true;
        state.error = null;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(undoDeleteBeneficiary.rejected, (state, action) => {
        state.loading = false;
        state.deleteState.undoAvailable = false;
        state.deleteState.undoData = null;
        state.error = action.payload;
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

      // ===================== FETCH BENEFICIARY BY CODE =====================
      .addCase(fetchBeneficiaryByCode.pending, (state) => {
        state.codeLookupLoading = true;
        state.codeLookupError = null;
      })
      .addCase(fetchBeneficiaryByCode.fulfilled, (state, action) => {
        state.codeLookupLoading = false;
        if (action.payload.data) {
          state.selectedBeneficiary = action.payload.data;
          state.beneficiaryBanks = action.payload.data.benef_banks || [];
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

      // ===================== FETCH BENEFICIARY BANKS =====================
      .addCase(fetchBeneficiaryBanks.pending, (state) => {
        state.banksLoading = true;
      })
      .addCase(fetchBeneficiaryBanks.fulfilled, (state, action) => {
        state.banksLoading = false;
        state.beneficiaryBanks = action.payload;
        if (action.payload.length > 0 && !state.selectedBank) {
          state.selectedBank = action.payload[0];
        }
      })
      .addCase(fetchBeneficiaryBanks.rejected, (state) => {
        state.banksLoading = false;
        state.beneficiaryBanks = [];
      });
  },
});

// ===================== ACTION EXPORTS =====================
export const {
  clearError,
  clearSuccess,
  resetState,
  clearEditState,
  clearCreateState,
  clearCreateError,
  clearCreateSuccess,
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
  addToDeleteQueue,
  removeFromDeleteQueue,
  clearDeleteQueue,
  updateBulkDeleteProgress,
  clearDeleteState,
  clearUndoState,
  searchBeneficiaryByEmail,
  clearEmailSearch,
  setEmailSearchProcessed,
  clearPhoneSearch,
  setPhoneSearchProcessed,
} = beneficiarySlice.actions;

// ===================== SELECTOR DEFINITIONS =====================

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

// Create state selectors
export const selectCreateLoading = (state) =>
  state.beneficiaries.createState.loading;
export const selectCreateError = (state) =>
  state.beneficiaries.createState.error;
export const selectCreateSuccess = (state) =>
  state.beneficiaries.createState.success;
export const selectLastCreatedId = (state) =>
  state.beneficiaries.createState.lastCreatedId;

// Edit beneficiary selectors
export const selectEditBeneficiaryLoading = (state) =>
  state.beneficiaries.editLoading || false;
export const selectEditBeneficiaryError = (state) =>
  state.beneficiaries.editError;
export const selectBeneficiaryDetails = (state) =>
  state.beneficiaries.beneficiaryDetails;

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

// Delete state selectors
export const selectDeleteState = (state) => state.beneficiaries.deleteState;
export const selectDeleteLoadingIds = (state) =>
  state.beneficiaries.deleteState.loadingIds;
export const selectIsDeleting = (beneficiaryId) => (state) =>
  state.beneficiaries.deleteState.loadingIds.includes(beneficiaryId);
export const selectBulkDeleteInProgress = (state) =>
  state.beneficiaries.deleteState.bulkDeleteInProgress;
export const selectBulkDeleteProgress = (state) => ({
  progress: state.beneficiaries.deleteState.bulkDeleteProgress,
  total: state.beneficiaries.deleteState.bulkDeleteTotal,
});
export const selectUndoAvailable = (state) =>
  state.beneficiaries.deleteState.undoAvailable;
export const selectUndoData = (state) =>
  state.beneficiaries.deleteState.undoData;

// Email search selectors
export const selectEmailSearch = (state) => state.beneficiaries.emailSearch;
export const selectEmailSearchLoading = (state) =>
  state.beneficiaries.emailSearch.loading;
export const selectEmailExists = (state) =>
  state.beneficiaries.emailSearch.exists;
export const selectEmailSearchData = (state) =>
  state.beneficiaries.emailSearch.data;
export const selectEmailSearchProcessed = (state) =>
  state.beneficiaries.emailSearch.processed;

// Phone search selectors
export const selectPhoneSearch = (state) => state.beneficiaries.phoneSearch;
export const selectPhoneSearchLoading = (state) =>
  state.beneficiaries.phoneSearch.loading;
export const selectPhoneExists = (state) =>
  state.beneficiaries.phoneSearch.exists;
export const selectPhoneSearchData = (state) =>
  state.beneficiaries.phoneSearch.data;
export const selectPhoneSearchProcessed = (state) =>
  state.beneficiaries.phoneSearch.processed;

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

// ===================== MEMOIZED SELECTORS =====================

// Filtered beneficiaries
export const selectFilteredBeneficiaries = createSelector(
  [selectBeneficiaries, selectSearchQuery, selectFilterVisibility],
  (beneficiaries, searchQuery, filterVisibility) => {
    let filtered = beneficiaries;

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

// Beneficiaries with deletion status
export const selectBeneficiariesWithDeleteStatus = createSelector(
  [selectBeneficiaries, selectDeleteLoadingIds],
  (beneficiaries, loadingIds) => {
    return beneficiaries.map((beneficiary) => ({
      ...beneficiary,
      isDeleting: loadingIds.includes(beneficiary.id),
    }));
  }
);

// Count selectors that depend on memoized selectors
export const selectFilteredBeneficiariesCount = createSelector(
  [selectFilteredBeneficiaries],
  (filteredBeneficiaries) => filteredBeneficiaries.length
);

export const selectVisibleBeneficiariesCount = createSelector(
  [selectVisibleBeneficiaries],
  (visibleBeneficiaries) => visibleBeneficiaries.length
);

// ===================== REMITTANCE-SPECIFIC SELECTORS =====================

// Selector for remittance-ready beneficiaries
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

// Remittance-ready beneficiary banks
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

// Add this selector with your other selectors
export const selectHasFetched = (state) => {
  // Check if beneficiaries have been fetched at least once
  return state.beneficiaries?.lastUpdated !== null || 
         state.beneficiaries?.beneficiaries?.length > 0 ||
         state.beneficiaries?.hasFetched === true;
};

// ===================== DEFAULT EXPORT =====================
export default beneficiarySlice.reducer;