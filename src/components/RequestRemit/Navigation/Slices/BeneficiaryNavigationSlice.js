import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { centralizedApi } from "../../../../services/api";

// Async thunk to fetch beneficiary data
export const fetchBeneficiaryData = createAsyncThunk(
  "beneficiaryNavigation/fetchBeneficiaryData",
  async (beneficiaryId, { rejectWithValue, getState }) => {
    try {
      console.log(`👤 Fetching beneficiary data for ID: ${beneficiaryId}`);

      const response = await centralizedApi.fetchMerchantBeneficiary(
        beneficiaryId
      );

      console.log("✅ Beneficiary data fetched successfully");
      return {
        id: beneficiaryId,
        name: response.data?.name || "",
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Error fetching beneficiary data:", error);
      return rejectWithValue(
        error.message || "Failed to fetch beneficiary data"
      );
    }
  }
);

const navigationSlice = createSlice({
  name: "beneficiaryNavigation",
  initialState: {
    beneficiaryId: null,
    beneficiaryName: "",
    beneficiaryData: null,
    activeTab: "dashboard",
    navigationItems: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "FaChartLine",
        description: "Overview and analytics",
        gradient: "from-blue-500 to-cyan-500",
        path: "#", // Will be updated with beneficiaryId
      },
      {
        id: "transactions",
        label: "Transactions",
        icon: "FaExchangeAlt",
        description: "View all transactions",
        gradient: "from-emerald-500 to-green-500",
        path: "#", // Will be updated with beneficiaryId
      },
      {
        id: "senders",
        label: "Senders",
        icon: "FaUserFriends",
        description: "Manage your senders",
        gradient: "from-purple-500 to-pink-500",
        path: "#", // Will be updated with beneficiaryId
      },
      {
        id: "referral",
        label: "Referral",
        icon: "FaShareAlt",
        description: "Refer and earn rewards",
        gradient: "from-orange-500 to-red-500",
        path: "#",
      },
    ],
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    isInitialized: false,
  },
  reducers: {
    // Initialize from localStorage
    initializeNavigation: (state) => {
      if (typeof window !== "undefined") {
        const storedBeneficiaryId = localStorage.getItem("beneficaryId");
        const storedBeneficiaryName =
          localStorage.getItem("beneficiaryName") || "";

        if (storedBeneficiaryId) {
          state.beneficiaryId = storedBeneficiaryId;
          state.beneficiaryName = storedBeneficiaryName;
          // Update navigation items with new routes
          state.navigationItems = state.navigationItems.map((item) => {
            let path = "#";

            switch (item.id) {
              case "dashboard":
                path = `/beneficiary/homepage/${storedBeneficiaryId}`;
                break;
              case "transactions":
                path = `/beneficiary/transactions/${storedBeneficiaryId}`;
                break;
              case "senders":
                // Support multiple route patterns
                path = `/beneficiary/senders/${storedBeneficiaryId}`;
                // Alternative path: `/benefsenders/${storedBeneficiaryId}`
                break;
              case "referral":
                path = "#";
                break;
              default:
                path = "#";
            }

            return { ...item, path };
          });
        }

        state.isInitialized = true;
      }
    },

    setBeneficiaryId: (state, action) => {
      state.beneficiaryId = action.payload;
      localStorage.setItem("beneficaryId", action.payload);

      // Update navigation paths with new beneficiaryId
      state.navigationItems = state.navigationItems.map((item) => {
        let path = "#";

        switch (item.id) {
          case "dashboard":
            path = `/beneficiary/homepage/${action.payload}`;
            break;
          case "transactions":
            path = `/beneficiary/transactions/${action.payload}`;
            break;
          case "senders":
            path = `/beneficiary/senders/${action.payload}`;
            break;
          case "referral":
            path = "#";
            break;
          default:
            path = "#";
        }

        return { ...item, path };
      });
    },

    setBeneficiaryName: (state, action) => {
      state.beneficiaryName = action.payload;
      localStorage.setItem("beneficiaryName", action.payload);
    },

    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },

    updateNavigationPaths: (state, action) => {
      const beneficiaryId = action.payload || state.beneficiaryId;

      if (beneficiaryId) {
        state.navigationItems = state.navigationItems.map((item) => {
          let path = "#";

          switch (item.id) {
            case "dashboard":
              path = `/beneficiary/homepage/${beneficiaryId}`;
              break;
            case "transactions":
              path = `/beneficiary/transactions/${beneficiaryId}`;
              break;
            case "senders":
              // Multiple route options for flexibility
              path = `/beneficiary/senders/${beneficiaryId}`;
              // Alternative: `/benefsenders/${beneficiaryId}`
              break;
            case "referral":
              path = "#";
              break;
            default:
              path = "#";
          }

          return { ...item, path };
        });
      }
    },

    clearBeneficiaryData: (state) => {
      state.beneficiaryId = null;
      state.beneficiaryName = "";
      state.beneficiaryData = null;
      // Reset paths to default
      state.navigationItems = state.navigationItems.map((item) => ({
        ...item,
        path: "#",
      }));
      localStorage.removeItem("beneficaryId");
      localStorage.removeItem("beneficiaryName");
    },

    resetNavigationState: (state) => {
      return {
        ...state,
        beneficiaryId: null,
        beneficiaryName: "",
        beneficiaryData: null,
        activeTab: "dashboard",
        navigationItems: state.navigationItems.map((item) => ({
          ...item,
          path: "#",
        })),
        status: "idle",
        error: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBeneficiaryData.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchBeneficiaryData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.beneficiaryData = action.payload.data;
        state.beneficiaryName = action.payload.name;
        localStorage.setItem("beneficiaryName", action.payload.name);

        // Update navigation paths with the new beneficiaryId
        if (action.payload.id) {
          state.navigationItems = state.navigationItems.map((item) => {
            let path = "#";

            switch (item.id) {
              case "dashboard":
                path = `/beneficiary/homepage/${action.payload.id}`;
                break;
              case "transactions":
                path = `/beneficiary/transactions/${action.payload.id}`;
                break;
              case "senders":
                path = `/beneficiary/senders/${action.payload.id}`;
                break;
              case "referral":
                path = "#";
                break;
              default:
                path = "#";
            }

            return { ...item, path };
          });
        }
      })
      .addCase(fetchBeneficiaryData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  initializeNavigation,
  setBeneficiaryId,
  setBeneficiaryName,
  setActiveTab,
  updateNavigationPaths,
  clearBeneficiaryData,
  resetNavigationState,
} = navigationSlice.actions;

// Selectors
export const selectBeneficiaryId = (state) =>
  state.beneficiaryNavigation.beneficiaryId;
export const selectBeneficiaryName = (state) =>
  state.beneficiaryNavigation.beneficiaryName;
export const selectBeneficiaryData = (state) =>
  state.beneficiaryNavigation.beneficiaryData;
export const selectActiveTab = (state) => state.beneficiaryNavigation.activeTab;
export const selectNavigationItems = (state) =>
  state.beneficiaryNavigation.navigationItems;
export const selectNavigationStatus = (state) =>
  state.beneficiaryNavigation.status;
export const selectNavigationError = (state) =>
  state.beneficiaryNavigation.error;
export const selectIsNavigationInitialized = (state) =>
  state.beneficiaryNavigation.isInitialized;

export default navigationSlice.reducer;
