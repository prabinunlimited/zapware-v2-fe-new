// src/components/RequestRemit/RequestRemitSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../services/api";

// Async thunk to fetch request remit details
export const fetchRequestRemitDetails = createAsyncThunk(
  "requestRemit/fetchDetails",
  async (_, { rejectWithValue, getState }) => {
    try {
      // Get customerUuid from localStorage
      const customerUuid = localStorage.getItem("customer_uuid");

      if (!customerUuid) {
        console.error("❌ No customer UUID found in localStorage");
        throw new Error("Customer UUID not found");
      }

      console.log(
        `📡 Fetching request remit details for customer: ${customerUuid}`,
      );

      // Get auth token
      const authtoken = localStorage.getItem("authtoken");
      const bearertoken = localStorage.getItem("bearertoken");

      if (!authtoken) {
        console.error("❌ No authentication token found");
        throw new Error("No authentication token found");
      }

      // Make API call
      const response = await api.get(
        `/transactions/customer-request-remit-detail/${customerUuid}`,
        {
          headers: {
            Authorization: `Bearer ${bearertoken}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log(`📥 Request remit response:`, response.data);

      if (response.data.status === "success") {
        return response.data;
      } else {
        throw new Error(
          response.data.message || "Failed to fetch request remit details",
        );
      }
    } catch (error) {
      console.error("❌ Request remit fetch error:", error);
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch request remit details",
      );
    }
  },
);

export const approveRequestRemit = createAsyncThunk(
  "requestRemit/approve",
  async ({ requestId, remarks }, { rejectWithValue }) => {
    try {
      const customerUuid = localStorage.getItem("customer_uuid");

      if (!customerUuid) {
        console.error("❌ No customer UUID found in localStorage");
        throw new Error("Customer UUID not found");
      }

      const authtoken = localStorage.getItem("authtoken");

      if (!authtoken) {
        console.error("❌ No authentication token found");
        throw new Error("No authentication token found");
      }

      const payload = {
        request_remit_id: requestId,
        status_lists_id: "3", // Hardcoded as per requirements
        remarks: remarks,
        author_source: "zap", // Hardcoded as per requirements
        author_type: "customer", // Hardcoded as per requirements
        author_id: customerUuid,
      };

      console.log(`📤 Approving request remit with payload:`, payload);

      const response = await api.post(
        `/beneficiaries/request-remit-statuslog-store`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${authtoken}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log(`📥 Approve request remit response:`, response.data);

      if (response.data.status === "success") {
        return {
          success: true,
          requestId,
          message: response.data.message || "Request approved successfully",
        };
      } else {
        throw new Error(response.data.message || "Failed to approve request");
      }
    } catch (error) {
      console.error("❌ Approve request remit error:", error);
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to approve request",
      );
    }
  },
);

// Async thunk to copy link to clipboard
export const copyRemitLink = createAsyncThunk(
  "requestRemit/copyLink",
  async (link, { rejectWithValue }) => {
    try {
      await navigator.clipboard.writeText(link);
      return { success: true, message: "Link copied to clipboard" };
    } catch (error) {
      console.error("❌ Copy link error:", error);
      return rejectWithValue("Failed to copy link");
    }
  },
);

const requestRemitSlice = createSlice({
  name: "requestRemit",
  initialState: {
    requests: [],
    loading: false,
    error: null,
    copySuccess: false,
    copyMessage: "",
    approveLoading: false,
    approveSuccess: false,
    approveError: null,
    lastFetched: null,
  },
  reducers: {
    clearRequests: (state) => {
      state.requests = [];
      state.error = null;
      state.lastFetched = null;
    },
    clearCopyStatus: (state) => {
      state.copySuccess = false;
      state.copyMessage = "";
    },
    clearApproveStatus: (state) => {
      state.approveSuccess = false;
      state.approveError = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetState: (state) => {
      state.requests = [];
      state.loading = false;
      state.error = null;
      state.copySuccess = false;
      state.copyMessage = "";
      state.approveLoading = false;
      state.approveSuccess = false;
      state.approveError = null;
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch request remit details
      .addCase(fetchRequestRemitDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log(`⏳ Fetching request remit details...`);
      })
      .addCase(fetchRequestRemitDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload.data || [];
        state.lastFetched = new Date().toISOString();
        state.error = null;
        console.log(
          `✅ Request remit details fetched: ${state.requests.length} requests`,
        );
      })
      .addCase(fetchRequestRemitDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch request remit details";
        state.requests = [];
        console.error(`❌ Request remit fetch failed:`, action.payload);
      })

      // Approve request remit
      .addCase(approveRequestRemit.pending, (state) => {
        state.approveLoading = true;
        state.approveSuccess = false;
        state.approveError = null;
        console.log(`⏳ Approving request remit...`);
      })
      .addCase(approveRequestRemit.fulfilled, (state, action) => {
        state.approveLoading = false;
        state.approveSuccess = true;
        state.approveError = null;

        // Update the specific request in the list to show it's approved
        const requestId = action.payload.requestId;
        const requestIndex = state.requests.findIndex(
          (req) => req.id === requestId,
        );
        if (requestIndex !== -1) {
          state.requests[requestIndex].approved = "Y";
        }

        console.log(
          `✅ Request remit approved successfully:`,
          action.payload.message,
        );
      })
      .addCase(approveRequestRemit.rejected, (state, action) => {
        state.approveLoading = false;
        state.approveSuccess = false;
        state.approveError = action.payload || "Failed to approve request";
        console.error(`❌ Approve request remit failed:`, action.payload);
      })

      // Copy link
      .addCase(copyRemitLink.pending, (state) => {
        state.copySuccess = false;
        state.copyMessage = "";
      })
      .addCase(copyRemitLink.fulfilled, (state, action) => {
        state.copySuccess = true;
        state.copyMessage = action.payload.message;
        console.log(`✅ Link copied successfully`);
      })
      .addCase(copyRemitLink.rejected, (state, action) => {
        state.copySuccess = false;
        state.copyMessage = action.payload || "Failed to copy link";
        console.error(`❌ Copy link failed:`, action.payload);
      });
  },
});

export const {
  clearRequests,
  clearCopyStatus,
  clearApproveStatus,
  clearError,
  resetState,
} = requestRemitSlice.actions;

// Selectors
export const selectRequestRemitRequests = (state) =>
  state.requestRemit?.requests || [];
export const selectRequestRemitLoading = (state) =>
  state.requestRemit?.loading || false;
export const selectRequestRemitError = (state) =>
  state.requestRemit?.error || null;
export const selectRequestRemitCopySuccess = (state) =>
  state.requestRemit?.copySuccess || false;
export const selectRequestRemitCopyMessage = (state) =>
  state.requestRemit?.copyMessage || "";
export const selectRequestRemitApproveLoading = (state) =>
  state.requestRemit?.approveLoading || false;
export const selectRequestRemitApproveSuccess = (state) =>
  state.requestRemit?.approveSuccess || false;
export const selectRequestRemitApproveError = (state) =>
  state.requestRemit?.approveError || null;
export const selectRequestRemitLastFetched = (state) =>
  state.requestRemit?.lastFetched || null;
export const selectHasRequestRemitRequests = (state) => {
  const requests = state.requestRemit?.requests || [];
  return requests.length > 0;
};

export default requestRemitSlice.reducer;
