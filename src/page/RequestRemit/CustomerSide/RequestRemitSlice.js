// src/components/RequestRemit/RequestRemitSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../services/api";

export const fetchRequestRemitDetails = createAsyncThunk(
  "requestRemit/fetchDetails",
  async (_, { rejectWithValue }) => {
    try {
      const customerUuid = localStorage.getItem("customer_uuid");
      if (!customerUuid) {
        throw new Error("Customer UUID not found");
      }

      const bearertoken = localStorage.getItem("bearertoken");
      if (!bearertoken) {
        throw new Error("No authentication token found");
      }

      const response = await api.get(
        `/transactions/customer-request-remit-detail/${customerUuid}`,
        {
          headers: {
            Authorization: `Bearer ${bearertoken}`,
          },
        },
      );

      if (response.__cancelled || !response.data) {
        return rejectWithValue(null); // silently ignore; the real request will follow
      }

      if (response.data.status === "success") {
        return response.data;
      }
      throw new Error(
        response.data.message || "Failed to fetch request remit details",
      );
    } catch (error) {
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
        throw new Error("Customer UUID not found");
      }

      const bearertoken = localStorage.getItem("bearertoken");
      if (!bearertoken) {
        throw new Error("No authentication token found");
      }

      const payload = {
        request_remit_id: requestId,
        status_lists_id: 5,
        remarks,
        author_source: "zap",
        author_type: "customer",
        author_id: customerUuid,
      };

      const response = await api.post(
        `/beneficiaries/request-remit-statuslog-store`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${bearertoken}`,
          },
        },
      );

      if (response.data.status === "success") {
        return { requestId, message: response.data.message };
      }
      throw new Error(response.data.message || "Failed to approve request");
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.message ||
        "Failed to approve request",
      );
    }
  },
);

export const updateRequestRemit = createAsyncThunk(
  "requestRemit/update",
  async ({ requestId, amount }, { rejectWithValue }) => {
    try {
      const customerUuid = localStorage.getItem("customer_uuid");
      if (!customerUuid) {
        throw new Error("Customer UUID not found");
      }

      const bearertoken = localStorage.getItem("bearertoken");
      if (!bearertoken) {
        throw new Error("No authentication token found");
      }

      const payload = {
        request_remit_uuid: requestId,
        status_lists_id: "3",
        amount,
        updated_source: "zap",
        user_type: "customer",
        user_id: customerUuid,
      };

      const response = await api.post(
        `/customers/update-request-remit`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${bearertoken}`,
          },
        },
      );

      if (response.data.status === "success") {
        return { requestId, message: response.data.message };
      }
      throw new Error(response.data.message || "Failed to update request");
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.message ||
        "Failed to update request",
      );
    }
  },
);

const requestRemitSlice = createSlice({
  name: "requestRemit",
  initialState: {
    requests: [],
    loading: true,
    error: null,
    approveLoading: false,
    approveSuccess: false,
    approveError: null,
    updateLoading: false,
    updateSuccess: false,
    updateError: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearApproveStatus: (state) => {
      state.approveSuccess = false;
      state.approveError = null;
    },
    clearUpdateStatus: (state) => {
      state.updateSuccess = false;
      state.updateError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRequestRemitDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRequestRemitDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload.data || [];
        state.error = null;
      })
      .addCase(fetchRequestRemitDetails.rejected, (state, action) => {
        if (action.payload === null) {
          // cancelled/duplicate request — stay in loading state, the real request is still in flight
          return;
        }
        state.loading = false;
        state.error = action.payload || "Failed to fetch request remit details";
        state.requests = [];
      })
      .addCase(approveRequestRemit.pending, (state) => {
        state.approveLoading = true;
        state.approveSuccess = false;
        state.approveError = null;
      })
      .addCase(approveRequestRemit.fulfilled, (state) => {
        state.approveLoading = false;
        state.approveSuccess = true;
      })
      .addCase(approveRequestRemit.rejected, (state, action) => {
        state.approveLoading = false;
        state.approveError = action.payload || "Failed to approve request";
      })
      .addCase(updateRequestRemit.pending, (state) => {
        state.updateLoading = true;
        state.updateSuccess = false;
        state.updateError = null;
      })
      .addCase(updateRequestRemit.fulfilled, (state) => {
        state.updateLoading = false;
        state.updateSuccess = true;
      })
      .addCase(updateRequestRemit.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload || "Failed to update request";
      });
  },
});

export const { clearError, clearApproveStatus, clearUpdateStatus } =
  requestRemitSlice.actions;

export const selectRequestRemitRequests = (state) =>
  state.requestRemit?.requests || [];
export const selectRequestRemitLoading = (state) =>
  state.requestRemit?.loading || false;
export const selectRequestRemitError = (state) =>
  state.requestRemit?.error || null;
export const selectRequestRemitApproveLoading = (state) =>
  state.requestRemit?.approveLoading || false;
export const selectRequestRemitUpdateLoading = (state) =>
  state.requestRemit?.updateLoading || false;

export default requestRemitSlice.reducer;