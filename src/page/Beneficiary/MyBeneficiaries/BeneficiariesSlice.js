// MyBeneficiaries/BeneficiariesSlice.js - COMPLETE VERSION WITH ALL SELECTORS

import {
  createSlice,
  createAsyncThunk,
  createSelector,
  createEntityAdapter,
} from "@reduxjs/toolkit";

const API_URL = import.meta.env.VITE_API_URL;

// ===================== ENTITY ADAPTER FOR CACHING =====================
const beneficiariesAdapter = createEntityAdapter({
  selectId: (beneficiary) => beneficiary.id || beneficiary.beneficiary_id,
  sortComparer: (a, b) => new Date(b.created_at) - new Date(a.created_at),
});

// ===================== CACHE DURATION (5 minutes) =====================
const CACHE_DURATION = 5 * 60 * 1000;

// ===================== HELPER FUNCTIONS =====================
const isCacheValid = (lastFetched) => {
  if (!lastFetched) return false;
  return Date.now() - new Date(lastFetched).getTime() < CACHE_DURATION;
};

// ===================== CREATE AND ADD BENEFICIARY =====================
export const createAndAddBeneficiary = createAsyncThunk(
  "beneficiaries/createAndAddBeneficiary",
  async (
    { customerId, beneficiaryData, bankAccounts, currency, country_code },
    { dispatch, rejectWithValue },
  ) => {
    try {
      console.log("🔄 createAndAddBeneficiary: Starting...");
      const bearertoken = localStorage.getItem("bearertoken");

      const banksPayload = bankAccounts.map((account) => ({
        rails: account.rails,
        currency_code: account.currency || currency,
        payment_method: account.paymentMethod || "",
        benef_iban: account.iban || "",
        swift_code: account.swift || "",
        routing_number: account.routingNumber || "",
        bank_acc_no: account.accountNumber || "",
        bank_name: account.bankName || "",
        ifsc: account.ifsc || "",
        bankCode: account.bankCode || "",
        branchCode: account.branchCode || "",
        account_name: account.accountName || "",
        account_type: account.accountType || "",
      }));

      const payload = {
        ...beneficiaryData,
        banks: banksPayload,
        country_phone_code: country_code,
      };

      const response = await fetch(
        `${API_URL}/beneficiaries/create-benef/${customerId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearertoken}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create beneficiary");
      }

      const createResult = await response.json();
      const newBeneficiaryId =
        createResult?.beneficiary_id ||
        createResult?.benef_id ||
        createResult?.id;

      await new Promise((resolve) => setTimeout(resolve, 500));

      const fetchResult = await dispatch(
        fetchBeneficiaryById({
          beneficiaryId: newBeneficiaryId,
          forceRefresh: true,
        }),
      ).unwrap();

      await dispatch(fetchBeneficiaries({ customerId, forceRefresh: true }));

      return {
        success: true,
        message: "Beneficiary created and fetched successfully",
        beneficiaryId: newBeneficiaryId,
        beneficiaryData: fetchResult.payload || createResult,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ createAndAddBeneficiary error:", error);
      return rejectWithValue(error.message || "Failed to create beneficiary");
    }
  },
);

// ===================== FETCH BENEFICIARIES WITH CACHING =====================
export const fetchBeneficiaries = createAsyncThunk(
  "beneficiaries/fetchBeneficiaries",
  async (
    { customerId, forceRefresh = false },
    { getState, rejectWithValue },
  ) => {
    try {
      const bearertoken = localStorage.getItem("bearertoken");

      if (!bearertoken) {
        throw new Error("Authentication token not found");
      }

      // Check cache if not forcing refresh
      const state = getState();
      const lastFetched = state.beneficiaries.lastFetched;
      const cachedData = beneficiariesAdapter
        .getSelectors()
        .selectAll(state.beneficiaries);

      if (!forceRefresh && isCacheValid(lastFetched) && cachedData.length > 0) {
        console.log("📦 Using cached beneficiaries data");
        return {
          data: cachedData,
          fromCache: true,
          timestamp: lastFetched,
        };
      }

      console.log("🌐 Fetching fresh beneficiaries data");
      const response = await fetch(
        `${API_URL}/beneficiaries/customer-view/${customerId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearertoken}`,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch beneficiaries: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ API Response:", result);

      if (
        result.status === "200" &&
        result.message === "No beneficiaries found"
      ) {
        return {
          data: [],
          message: result.message,
          status: "success",
          empty: true,
          timestamp: new Date().toISOString(),
        };
      }

      let beneficiariesData = [];
      if (result.data && Array.isArray(result.data)) {
        beneficiariesData = result.data;
      } else if (Array.isArray(result)) {
        beneficiariesData = result;
      } else if (result.beneficiaries && Array.isArray(result.beneficiaries)) {
        beneficiariesData = result.beneficiaries;
      }

      return {
        data: beneficiariesData,
        message: "Successfully fetched beneficiaries",
        status: "success",
        empty: beneficiariesData.length === 0,
        timestamp: new Date().toISOString(),
        fromCache: false,
      };
    } catch (error) {
      console.error("❌ fetchBeneficiaries error:", error);
      return rejectWithValue({
        message: error.message,
        empty: true,
      });
    }
  },
);

// ===================== FETCH BENEFICIARY BY ID =====================
export const fetchBeneficiaryById = createAsyncThunk(
  "beneficiaries/fetchBeneficiaryById",
  async (
    { beneficiaryId, forceRefresh = false },
    { getState, rejectWithValue },
  ) => {
    try {
      const token =
        localStorage.getItem("bearertoken") ||
        localStorage.getItem("authtoken");

      console.log("📥 Fetching beneficiary:", beneficiaryId);

      // Check cache
      if (!forceRefresh) {
        const state = getState();
        const cachedBeneficiary = beneficiariesAdapter
          .getSelectors()
          .selectById(state.beneficiaries, beneficiaryId);

        if (cachedBeneficiary && cachedBeneficiary.lastFetchedDetails) {
          const detailsAge =
            Date.now() -
            new Date(cachedBeneficiary.lastFetchedDetails).getTime();
          if (detailsAge < CACHE_DURATION) {
            console.log("📦 Using cached beneficiary details:", beneficiaryId);
            return { data: cachedBeneficiary, fromCache: true };
          }
        }
      }

      const response = await fetch(
        `${API_URL}/beneficiaries/benef-view/${beneficiaryId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
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
        beneficiaryData.lastFetchedDetails = new Date().toISOString();
      }

      return { data: beneficiaryData, fromCache: false };
    } catch (error) {
      console.error("❌ fetchBeneficiaryById error:", error);
      return rejectWithValue(error.message);
    }
  },
);

// ===================== DELETE BENEFICIARY =====================
export const deleteBeneficiary = createAsyncThunk(
  "beneficiaries/deleteBeneficiary",
  async ({ customerId, beneficiaryId }, { dispatch, rejectWithValue }) => {
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
        },
      );

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(
          errorResult.message ||
            errorResult.error ||
            "Failed to delete beneficiary",
        );
      }

      const result = await response.json();

      // Invalidate cache after deletion
      dispatch(invalidateBeneficiariesCache());

      return {
        beneficiaryId,
        message: result.message || "Beneficiary deleted successfully!",
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ===================== BULK DELETE BENEFICIARIES =====================
export const bulkDeleteBeneficiaries = createAsyncThunk(
  "beneficiaries/bulkDeleteBeneficiaries",
  async ({ customerId, beneficiaryIds }, { dispatch, rejectWithValue }) => {
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
                `Failed to delete beneficiary ${beneficiaryId}`,
            );
          }
          return response.json();
        }),
      );

      const results = await Promise.all(promises);

      // Invalidate cache after bulk delete
      dispatch(invalidateBeneficiariesCache());

      return {
        beneficiaryIds,
        results,
        message: `Successfully deleted ${beneficiaryIds.length} beneficiaries`,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ===================== DELETE BENEFICIARY WITH UNDO =====================
export const deleteBeneficiaryWithUndo = createAsyncThunk(
  "beneficiaries/deleteBeneficiaryWithUndo",
  async (
    { customerId, beneficiaryId, beneficiaryName },
    { rejectWithValue, getState, dispatch },
  ) => {
    try {
      const authtoken = localStorage.getItem("authtoken");

      const state = getState();
      const beneficiary = beneficiariesAdapter
        .getSelectors()
        .selectById(state.beneficiaries, beneficiaryId);

      if (beneficiary) {
        localStorage.setItem(
          `undo_beneficiary_${beneficiaryId}`,
          JSON.stringify({
            ...beneficiary,
            deletedAt: new Date().toISOString(),
          }),
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
        },
      );

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(
          errorResult.message ||
            errorResult.error ||
            "Failed to delete beneficiary",
        );
      }

      const result = await response.json();

      // Invalidate cache
      dispatch(invalidateBeneficiariesCache());

      return {
        beneficiaryId,
        beneficiaryName,
        message: result.message || "Beneficiary deleted successfully!",
        undoAvailable: true,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ===================== UNDO DELETE BENEFICIARY =====================
export const undoDeleteBeneficiary = createAsyncThunk(
  "beneficiaries/undoDeleteBeneficiary",
  async ({ customerId, beneficiaryId }, { rejectWithValue, dispatch }) => {
    try {
      const storedData = localStorage.getItem(
        `undo_beneficiary_${beneficiaryId}`,
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
        },
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
          },
        );

        if (!createResponse.ok) {
          throw new Error("Failed to restore beneficiary");
        }

        const result = await createResponse.json();

        // Invalidate cache
        dispatch(invalidateBeneficiariesCache());

        return {
          beneficiaryId: result.beneficiary_id || beneficiaryId,
          beneficiaryData,
          message: "Beneficiary restored successfully",
          restored: true,
        };
      }

      const result = await response.json();

      // Invalidate cache
      dispatch(invalidateBeneficiariesCache());

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
  },
);

// ===================== TOGGLE BENEFICIARY VISIBILITY =====================
export const toggleBeneficiaryVisibility = createAsyncThunk(
  "beneficiaries/toggleBeneficiaryVisibility",
  async (
    { customerId, beneficiaryId, isVisible },
    { rejectWithValue, dispatch },
  ) => {
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
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update beneficiary visibility");
      }

      const result = await response.json();

      // Invalidate cache after visibility change
      dispatch(invalidateBeneficiariesCache());

      return { beneficiaryId, isVisible, message: result.message };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ===================== REMITTANCE-SPECIFIC ASYNC THUNKS =====================
export const fetchBeneficiaryByCode = createAsyncThunk(
  "beneficiaries/fetchBeneficiaryByCode",
  async (beneficiaryCode, { rejectWithValue }) => {
    try {
      const bearertoken = localStorage.getItem("bearertoken");

      console.log("🔍 Fetching beneficiary by code:", beneficiaryCode);
      console.log(
        "🔍 API URL:",
        `${API_URL}/beneficiaries/fetch-benef/${beneficiaryCode}`,
      );

      const response = await fetch(
        `${API_URL}/beneficiaries/fetch-benef/${beneficiaryCode}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearertoken}`,
          },
        },
      );

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        let errorMessage = "Failed to fetch beneficiary by code";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error("❌ API Error:", errorData);
        } catch (e) {
          console.error("❌ Response not JSON:", response.statusText);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("✅ API Response:", result);

      return result;
    } catch (error) {
      console.error("❌ fetchBeneficiaryByCode error:", error);
      return rejectWithValue(error.message);
    }
  },
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
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch beneficiary banks");
      }

      const result = await response.json();
      return result.bank_accounts || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ===================== INITIAL STATE =====================
const initialState = beneficiariesAdapter.getInitialState({
  // Beneficiaries list state
  loading: false,
  error: null,
  success: false,
  hasFetched: false,
  lastFetched: null,

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
});

// ===================== SLICE =====================
const beneficiarySlice = createSlice({
  name: "beneficiaries",
  initialState,
  reducers: {
    // ===================== CACHE MANAGEMENT =====================
    invalidateBeneficiariesCache: (state) => {
      state.lastFetched = null;
      state.hasFetched = false;
    },

    clearCache: (state) => {
      beneficiariesAdapter.removeAll(state);
      state.lastFetched = null;
      state.hasFetched = false;
      state.lastUpdated = null;
    },

    // ===================== PHONE SEARCH =====================
    searchBeneficiaryByPhone: (state, action) => {
      const { phoneNumber, countryPhoneCode } = action.payload;

      if (!phoneNumber) {
        state.phoneSearch = {
          loading: false,
          error: null,
          searched: false,
          exists: false,
          data: null,
          processed: false,
        };
        return;
      }

      const cleanSearchPhone = phoneNumber.replace(/\D/g, "");
      const searchFullPhone = countryPhoneCode
        ? `${countryPhoneCode.replace(/\D/g, "")}${cleanSearchPhone}`
        : cleanSearchPhone;

      let foundBeneficiary = null;
      const beneficiaries = beneficiariesAdapter
        .getSelectors()
        .selectAll(state);

      for (const beneficiary of beneficiaries) {
        const beneficiaryPhone =
          beneficiary.phone_number?.replace(/\D/g, "") || "";
        const beneficiaryFullPhone =
          beneficiary.full_phone_number?.replace(/\D/g, "") || "";

        if (
          beneficiaryPhone === cleanSearchPhone ||
          beneficiaryFullPhone === cleanSearchPhone ||
          beneficiaryFullPhone === searchFullPhone ||
          beneficiary.phone_number === phoneNumber ||
          beneficiary.full_phone_number === phoneNumber ||
          beneficiaryPhone.includes(cleanSearchPhone) ||
          beneficiaryFullPhone.includes(cleanSearchPhone)
        ) {
          foundBeneficiary = beneficiary;
          break;
        }
      }

      if (foundBeneficiary) {
        const cleanData = {
          id: foundBeneficiary.id || foundBeneficiary.beneficiary_id || "",
          name:
            foundBeneficiary.name ||
            `${foundBeneficiary.first_name || ""} ${foundBeneficiary.last_name || ""}`.trim(),
          email: foundBeneficiary.email || "",
          phone_number: foundBeneficiary.phone_number || "",
          full_phone_number: foundBeneficiary.full_phone_number || "",
          country_phone_code:
            foundBeneficiary.country_phone_code ||
            countryPhoneCode?.replace("+", "") ||
            "1",
          beneftype: foundBeneficiary.beneftype || "individual",
          country_id: foundBeneficiary.country_id?.toString() || "",
          state: foundBeneficiary.state || "",
          city: foundBeneficiary.city || "",
          street: foundBeneficiary.street || foundBeneficiary.address || "",
          postalcode: foundBeneficiary.postalcode || "",
          relationtobenef: foundBeneficiary.relationtobenef || "",
          otherRelationship: foundBeneficiary.otherRelationship || "",
          nationality_id: foundBeneficiary.nationality_id?.toString() || "",
          beneficiary_id_type: foundBeneficiary.beneficiary_id_type || "",
          beneficiary_id_number: foundBeneficiary.beneficiary_id_number || "",
          nic_bcc_code: foundBeneficiary.nic_bcc_code || "",
          currency: foundBeneficiary.currency || "USD",
          banks: foundBeneficiary.banks || foundBeneficiary.benef_banks || [],
          status: foundBeneficiary.status || 1,
          benef_code: foundBeneficiary.benef_code || "",
          created_at: foundBeneficiary.created_at || "",
          first_name: foundBeneficiary.first_name || "",
          last_name: foundBeneficiary.last_name || "",
        };

        state.phoneSearch = {
          ...state.phoneSearch,
          data: cleanData,
          exists: true,
          searched: true,
          loading: false,
          error: null,
        };
      } else {
        state.phoneSearch = {
          ...state.phoneSearch,
          searched: true,
          exists: false,
          loading: false,
          error: null,
        };
      }
    },

    clearPhoneSearch: (state) => {
      state.phoneSearch = {
        loading: false,
        error: null,
        searched: false,
        exists: false,
        data: null,
        processed: false,
      };
    },

    setPhoneSearchProcessed: (state) => {
      if (state.phoneSearch) {
        state.phoneSearch = {
          ...state.phoneSearch,
          processed: true,
        };
      }
    },

    // ===================== EMAIL SEARCH =====================
    searchBeneficiaryByEmail: (state, action) => {
      const { email } = action.payload;
      console.log("🔍 Searching for email in store:", email);

      if (!email) {
        state.emailSearch = initialState.emailSearch;
        return;
      }

      const beneficiaries = beneficiariesAdapter
        .getSelectors()
        .selectAll(state);
      const foundBeneficiary = beneficiaries.find(
        (beneficiary) =>
          beneficiary.email &&
          beneficiary.email.toLowerCase() === email.toLowerCase(),
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
          cleanData,
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

    clearEmailSearch: (state) => {
      state.emailSearch = initialState.emailSearch;
    },

    setEmailSearchProcessed: (state) => {
      if (state.emailSearch) {
        state.emailSearch.processed = true;
      }
    },

    // ===================== ERROR HANDLING =====================
    clearError: (state) => {
      state.error = null;
      state.editError = null;
      state.deleteState.error = null;
      state.codeLookupError = null;
      state.createState.error = null;
    },

    clearSuccess: (state) => {
      state.success = false;
      state.createState.success = false;
    },

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

    clearCreateState: (state) => {
      console.log("🧹 Clearing create state");
      state.createState.loading = false;
      state.createState.error = null;
      state.createState.success = false;
      state.createState.lastCreatedId = null;
    },

    clearCreateError: (state) => {
      state.createState.error = null;
    },

    clearCreateSuccess: (state) => {
      console.log("🧹 Clearing create success");
      state.createState.success = false;
      state.createState.lastCreatedId = null;
    },

    clearCodeLookupError: (state) => {
      state.codeLookupError = null;
    },

    // ===================== SELECTED BENEFICIARY MANAGEMENT =====================
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

    setSelectedBank: (state, action) => {
      state.selectedBank = action.payload;
    },

    clearSelectedBank: (state) => {
      state.selectedBank = null;
    },

    clearBeneficiaryBanks: (state) => {
      state.beneficiaryBanks = [];
    },

    // ===================== BENEFICIARY LIST MANAGEMENT =====================
    resetBeneficiaries: (state) => {
      beneficiariesAdapter.removeAll(state);
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

    updateBeneficiaryInList: (state, action) => {
      const { beneficiaryId, updates } = action.payload;
      beneficiariesAdapter.updateOne(state, {
        id: beneficiaryId,
        changes: updates,
      });
    },

    addBeneficiaryToList: (state, action) => {
      beneficiariesAdapter.addOne(state, action.payload);
      state.success = true;
      state.lastUpdated = new Date().toISOString();
    },

    toggleVisibilityLocal: (state, action) => {
      const beneficiary = beneficiariesAdapter
        .getSelectors()
        .selectById(state, action.payload);
      if (beneficiary) {
        const updates = {};
        if (beneficiary.hasOwnProperty("isVisible")) {
          updates.isVisible = !beneficiary.isVisible;
        } else if (beneficiary.hasOwnProperty("is_visible")) {
          updates.is_visible = !beneficiary.is_visible;
        } else {
          updates.isVisible = true;
        }
        beneficiariesAdapter.updateOne(state, {
          id: action.payload,
          changes: updates,
        });
      }
    },

    // ===================== SEARCH, FILTER & PAGINATION =====================
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

    // ===================== DELETE STATE MANAGEMENT =====================
    addToDeleteQueue: (state, action) => {
      state.deleteState.pendingDeletions.push(action.payload);
    },

    removeFromDeleteQueue: (state, action) => {
      state.deleteState.pendingDeletions =
        state.deleteState.pendingDeletions.filter(
          (id) => id !== action.payload,
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
        state.success = true;
        state.lastUpdated = new Date().toISOString();
        if (action.payload.beneficiaryData) {
          beneficiariesAdapter.addOne(state, action.payload.beneficiaryData);
        }
        console.log("🏁 createState after success:", state.createState);
      })
      .addCase(createAndAddBeneficiary.rejected, (state, action) => {
        console.error("❌ createAndAddBeneficiary REJECTED:", action.payload);
        state.createState.loading = false;
        state.createState.error = action.payload;
        state.createState.success = false;
        state.createState.lastCreatedId = null;
      })

      // ===================== FETCH BENEFICIARIES =====================
      .addCase(fetchBeneficiaries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBeneficiaries.fulfilled, (state, action) => {
        state.loading = false;
        state.hasFetched = true;
        state.lastFetched = action.payload.timestamp;

        if (!action.payload.fromCache) {
          const beneficiariesData = action.payload.data;
          beneficiariesAdapter.setAll(state, beneficiariesData);
          console.log(
            "✅ Stored fresh beneficiaries:",
            beneficiariesData.length,
          );
        }

        state.error = null;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchBeneficiaries.rejected, (state, action) => {
        state.loading = false;
        state.hasFetched = true;
        state.error =
          action.payload?.message || "Failed to fetch beneficiaries";
      })

      // ===================== FETCH BENEFICIARY BY ID =====================
      .addCase(fetchBeneficiaryById.pending, (state) => {
        state.editLoading = true;
        state.editError = null;
        state.beneficiaryDetails = null;
      })
      .addCase(fetchBeneficiaryById.fulfilled, (state, action) => {
        state.editLoading = false;
        state.beneficiaryDetails = action.payload.data;
        state.editError = null;
        if (action.payload.data && !action.payload.fromCache) {
          beneficiariesAdapter.upsertOne(state, action.payload.data);
        }
        if (action.payload.data && action.payload.data.benef_banks) {
          state.beneficiaryBanks = action.payload.data.benef_banks;
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
          (id) => id !== beneficiaryId,
        );
        beneficiariesAdapter.removeOne(state, beneficiaryId);
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
          (id) => id !== beneficiaryId,
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
          (id) => id !== beneficiaryId,
        );
        beneficiariesAdapter.removeOne(state, beneficiaryId);
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
          (id) => id !== beneficiaryId,
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
          (id) => !beneficiaryIds.includes(id),
        );
        beneficiariesAdapter.removeMany(state, beneficiaryIds);
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
          beneficiariesAdapter.addOne(state, beneficiaryData);
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
        beneficiariesAdapter.updateOne(state, {
          id: beneficiaryId,
          changes: {
            status: isVisible ? 1 : 0,
            is_visible: isVisible,
            isVisible: isVisible,
          },
        });
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
      })
      .addCase(fetchBeneficiaryBanks.rejected, (state) => {
        state.banksLoading = false;
        state.beneficiaryBanks = [];
      });
  },
});

// ===================== ACTION EXPORTS =====================
export const {
  invalidateBeneficiariesCache,
  clearCache,
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
  searchBeneficiaryByPhone,
  clearPhoneSearch,
  setPhoneSearchProcessed,
} = beneficiarySlice.actions;

// ===================== SELECTOR DEFINITIONS =====================

// Entity adapter selectors
export const {
  selectAll: selectBeneficiaries,
  selectById: selectBeneficiaryById,
  selectIds: selectBeneficiaryIds,
  selectTotal: selectBeneficiariesCount,
} = beneficiariesAdapter.getSelectors((state) => state.beneficiaries);

// Core selectors
export const selectBeneficiariesLoading = (state) =>
  state.beneficiaries.loading;
export const selectBeneficiariesError = (state) => state.beneficiaries.error;
export const selectBeneficiariesSuccess = (state) =>
  state.beneficiaries.success;
export const selectHasFetched = (state) => state.beneficiaries.hasFetched;
export const selectBeneficiariesLastUpdated = (state) =>
  state.beneficiaries.lastUpdated;
export const selectLastFetched = (state) => state.beneficiaries.lastFetched;

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
export const selectVisibleBeneficiaries = createSelector(
  [selectBeneficiaries],
  (beneficiaries) =>
    beneficiaries.filter(
      (beneficiary) =>
        beneficiary.is_visible !== false &&
        beneficiary.isVisible !== false &&
        beneficiary.status !== 0,
    ),
);

// Beneficiaries by currency
export const selectBeneficiariesByCurrency = (currency) =>
  createSelector([selectBeneficiaries], (beneficiaries) =>
    beneficiaries.filter((beneficiary) => beneficiary.currency === currency),
  );

// ===================== MEMOIZED SELECTORS =====================

// Filtered beneficiaries
export const selectFilteredBeneficiaries = createSelector(
  [selectBeneficiaries, selectSearchQuery, selectFilterVisibility],
  (beneficiaries, searchQuery, filterVisibility) => {
    let filtered = [...beneficiaries];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (beneficiary) =>
          beneficiary.name?.toLowerCase().includes(query) ||
          beneficiary.full_phone_number?.toLowerCase().includes(query) ||
          beneficiary.phone_number?.toLowerCase().includes(query) ||
          beneficiary.relationtobenef?.toLowerCase().includes(query) ||
          beneficiary.email?.toLowerCase().includes(query),
      );
    }

    if (filterVisibility === "visible") {
      filtered = filtered.filter(
        (beneficiary) =>
          beneficiary.isVisible === true ||
          beneficiary.is_visible === true ||
          beneficiary.status === 1,
      );
    } else if (filterVisibility === "hidden") {
      filtered = filtered.filter(
        (beneficiary) =>
          beneficiary.isVisible === false ||
          beneficiary.is_visible === false ||
          beneficiary.status === 0,
      );
    }

    return filtered;
  },
);

// Paginated beneficiaries
export const selectPaginatedBeneficiaries = createSelector(
  [selectFilteredBeneficiaries, selectCurrentPage],
  (filteredBeneficiaries, currentPage) => {
    const startIndex = (currentPage - 1) * 10;
    const endIndex = startIndex + 10;
    return filteredBeneficiaries.slice(startIndex, endIndex);
  },
);

// Total pages
export const selectTotalPages = createSelector(
  [selectFilteredBeneficiaries],
  (filteredBeneficiaries) => Math.ceil(filteredBeneficiaries.length / 10),
);

// Beneficiaries with deletion status
export const selectBeneficiariesWithDeleteStatus = createSelector(
  [selectBeneficiaries, selectDeleteLoadingIds],
  (beneficiaries, loadingIds) => {
    return beneficiaries.map((beneficiary) => ({
      ...beneficiary,
      isDeleting: loadingIds.includes(beneficiary.id),
    }));
  },
);

// Count selectors
export const selectFilteredBeneficiariesCount = createSelector(
  [selectFilteredBeneficiaries],
  (filteredBeneficiaries) => filteredBeneficiaries.length,
);

export const selectVisibleBeneficiariesCount = createSelector(
  [selectVisibleBeneficiaries],
  (visibleBeneficiaries) => visibleBeneficiaries.length,
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
  },
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
  },
);

// ===================== DEFAULT EXPORT =====================
export default beneficiarySlice.reducer;
