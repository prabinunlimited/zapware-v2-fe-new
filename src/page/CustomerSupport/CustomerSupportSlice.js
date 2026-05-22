// src/features/CustomerSupport/CustomerSupportSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import { extractErrorMessage } from "../../services/authService";

const API_URL = import.meta.env.VITE_API_URL;

// Async thunk to store support ticket
export const storeSupportTicket = createAsyncThunk(
  "customerSupport/storeTicket",
  async (ticketData, { rejectWithValue, getState }) => {
    try {
      const customerUuid = localStorage.getItem('customerUuid');

      if (!customerUuid) {
        throw new Error("Customer ID not found. Please login again.");
      }

      const token = localStorage.getItem('bearertoken') || localStorage.getItem('authtoken');

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const payload = {
        subject: ticketData.subject,
        description: ticketData.description,
        priority: ticketData.priority,
        category: ticketData.category,
        customer_id: customerUuid
      };

      console.log("📤 Submitting support ticket:", payload);

      const response = await api.post("/store-ticket", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.status === "success") {
        return {
          success: true,
          message: response.data.message || "Support ticket submitted successfully",
          data: response.data.data
        };
      } else {
        throw new Error(response.data.message || "Failed to submit ticket");
      }
    } catch (error) {
      console.error("❌ Error storing support ticket:", error);
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk to fetch all tickets for a customer
export const fetchAllTickets = createAsyncThunk(
  "customerSupport/fetchAllTickets",
  async (_, { rejectWithValue }) => {
    try {
      const customerUuid = localStorage.getItem('customerUuid');

      if (!customerUuid) {
        throw new Error("Customer ID not found. Please login again.");
      }

      const token = localStorage.getItem('bearertoken') || localStorage.getItem('authtoken');

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      console.log("📤 Fetching all tickets for customer:", customerUuid);

      const response = await api.get(`/fetch-ticket/${customerUuid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.status === "success") {
        console.log("✅ Tickets fetched successfully:", response.data.data);
        return {
          success: true,
          tickets: response.data.data || [],
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message || "Failed to fetch tickets");
      }
    } catch (error) {
      console.error("❌ Error fetching tickets:", error);
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk to fetch a single ticket by UUID
export const fetchTicketByUuid = createAsyncThunk(
  "customerSupport/fetchTicketByUuid",
  async (ticketUuid, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('bearertoken') || localStorage.getItem('authtoken');

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      console.log("📤 Fetching ticket details for UUID:", ticketUuid);

      const response = await api.get(`/fetch-ticket-uuid/${ticketUuid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.status === "success") {
        console.log("✅ Ticket details fetched successfully:", response.data.data);
        return {
          success: true,
          ticket: response.data.data,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message || "Failed to fetch ticket details");
      }
    } catch (error) {
      console.error("❌ Error fetching ticket details:", error);
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    }
  }
);

// ✅ Async thunk to fetch ticket categories
export const fetchTicketCategories = createAsyncThunk(
  "customerSupport/fetchTicketCategories",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('bearertoken') || localStorage.getItem('authtoken');

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      console.log("📤 Fetching ticket categories...");

      const response = await api.get("/ticket-categories", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.status === "success") {
        console.log("✅ Ticket categories fetched successfully:", response.data.data);
        return {
          success: true,
          categories: response.data.data || [],
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message || "Failed to fetch categories");
      }
    } catch (error) {
      console.error("❌ Error fetching ticket categories:", error);
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    }
  }
);

// ✅ Async thunk to fetch status list
export const fetchStatusList = createAsyncThunk(
  "customerSupport/fetchStatusList",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('bearertoken') || localStorage.getItem('authtoken');

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      console.log("📤 Fetching status list...");

      const response = await api.get("/status-list/customer", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.status === "success") {
        console.log("✅ Status list fetched successfully:", response.data.data);
        return {
          success: true,
          statusList: response.data.data || [],
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message || "Failed to fetch status list");
      }
    } catch (error) {
      console.error("❌ Error fetching status list:", error);
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    }
  }
);

// ✅ Async thunk to update ticket status - DIRECT FIX
export const updateTicketStatus = createAsyncThunk(
  "customerSupport/updateTicketStatus",
  async ({ ticketUuid, statusId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('bearertoken') || localStorage.getItem('authtoken');

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      console.log("📤 Updating ticket status:", { 
        status: statusId, 
        ticket_id: ticketUuid 
      });

      const response = await api.post("/update-ticket-status", {
        status: statusId,
        ticket_id: ticketUuid  // Make sure this field name matches exactly what API expects
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.status === "success") {
        console.log("✅ Ticket status updated successfully:", response.data);
        return {
          success: true,
          ticket: response.data.data,
          message: response.data.message || "Status updated successfully"
        };
      } else {
        throw new Error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("❌ Error updating ticket status:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    }
  }
);
// Async thunk to update a ticket (using POST)
export const updateTicket = createAsyncThunk(
  "customerSupport/updateTicket",
  async ({ ticketId, ticketData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('bearertoken') || localStorage.getItem('authtoken');

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      console.log("📤 Updating ticket:", ticketId, ticketData);

      const response = await api.post(`/update-ticket`, {
        ticket_id: ticketId,
        subject: ticketData.subject,
        description: ticketData.description,
        priority: ticketData.priority,
        category: ticketData.category
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.status === "success") {
        console.log("✅ Ticket updated successfully:", response.data);
        return {
          success: true,
          ticket: response.data.data,
          message: response.data.message || "Ticket updated successfully"
        };
      } else {
        throw new Error(response.data.message || "Failed to update ticket");
      }
    } catch (error) {
      console.error("❌ Error updating ticket:", error);
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk to delete a ticket
export const deleteTicket = createAsyncThunk(
  "customerSupport/deleteTicket",
  async (ticketUuid, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('bearertoken') || localStorage.getItem('authtoken');

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      console.log("📤 Deleting ticket:", ticketUuid);

      const response = await api.delete(`/delete-ticket/${ticketUuid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.status === "success") {
        console.log("✅ Ticket deleted successfully:", response.data);
        return {
          success: true,
          ticketUuid: ticketUuid,
          message: response.data.message || "Ticket deleted successfully"
        };
      } else {
        throw new Error(response.data.message || "Failed to delete ticket");
      }
    } catch (error) {
      console.error("❌ Error deleting ticket:", error);
      const errorMessage = extractErrorMessage(error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Initial state
const initialState = {
  tickets: [],
  currentTicket: null,
  categories: [],
  statusList: [],
  loading: false,
  error: null,
  success: false,
  lastSubmitted: null,
  submitting: false,
  fetchingTickets: false,
  fetchingTicketDetail: false,
  updatingTicket: false,
  deletingTicket: false,
  fetchingCategories: false,
  fetchingStatusList: false,
  updatingStatus: false
};

// Create slice
const customerSupportSlice = createSlice({
  name: "customerSupport",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    resetForm: (state) => {
      state.error = null;
      state.success = false;
      state.submitting = false;
    },
    clearLastSubmitted: (state) => {
      state.lastSubmitted = null;
    },
    clearCurrentTicket: (state) => {
      state.currentTicket = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Store Ticket
      .addCase(storeSupportTicket.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.success = false;
      })
      .addCase(storeSupportTicket.fulfilled, (state, action) => {
        state.submitting = false;
        state.success = true;
        state.lastSubmitted = action.payload.data;
        state.error = null;
        if (action.payload.data) {
          state.tickets.unshift(action.payload.data);
        }
      })
      .addCase(storeSupportTicket.rejected, (state, action) => {
        state.submitting = false;
        state.success = false;
        state.error = action.payload || "Failed to submit support ticket";
      })

      // Fetch All Tickets
      .addCase(fetchAllTickets.pending, (state) => {
        state.fetchingTickets = true;
        state.error = null;
      })
      .addCase(fetchAllTickets.fulfilled, (state, action) => {
        state.fetchingTickets = false;
        state.tickets = action.payload.tickets;
        state.error = null;
      })
      .addCase(fetchAllTickets.rejected, (state, action) => {
        state.fetchingTickets = false;
        state.error = action.payload || "Failed to fetch tickets";
      })

      // Fetch Ticket by UUID
      .addCase(fetchTicketByUuid.pending, (state) => {
        state.fetchingTicketDetail = true;
        state.error = null;
      })
      .addCase(fetchTicketByUuid.fulfilled, (state, action) => {
        state.fetchingTicketDetail = false;
        state.currentTicket = action.payload.ticket;
        state.error = null;
      })
      .addCase(fetchTicketByUuid.rejected, (state, action) => {
        state.fetchingTicketDetail = false;
        state.error = action.payload || "Failed to fetch ticket details";
      })

      // ✅ Fetch Ticket Categories
      .addCase(fetchTicketCategories.pending, (state) => {
        state.fetchingCategories = true;
        state.error = null;
      })
      .addCase(fetchTicketCategories.fulfilled, (state, action) => {
        state.fetchingCategories = false;
        state.categories = action.payload.categories;
        state.error = null;
      })
      .addCase(fetchTicketCategories.rejected, (state, action) => {
        state.fetchingCategories = false;
        state.error = action.payload || "Failed to fetch categories";
      })

      // Fetch Status List
      .addCase(fetchStatusList.pending, (state) => {
        state.fetchingStatusList = true;
        state.error = null;
      })
      .addCase(fetchStatusList.fulfilled, (state, action) => {
        state.fetchingStatusList = false;
        state.statusList = action.payload.statusList;
        state.error = null;
      })
      .addCase(fetchStatusList.rejected, (state, action) => {
        state.fetchingStatusList = false;
        state.error = action.payload || "Failed to fetch status list";
      })

      //Update ticket status
      .addCase(updateTicketStatus.pending, (state) => {
        state.updatingStatus = true;
        state.error = null;
      })
      .addCase(updateTicketStatus.fulfilled, (state, action) => {
        state.updatingStatus = false;
        // Update the ticket in the list
        const index = state.tickets.findIndex(t =>
          t.id === action.payload.ticket?.id
        );
        if (index !== -1 && action.payload.ticket) {
          state.tickets[index] = action.payload.ticket;
        }
        // Also update currentTicket if it's the same
        if (state.currentTicket?.id === action.payload.ticket?.ticket_uuid) {
          state.currentTicket = action.payload.ticket;
        }
        state.success = true;
        state.error = null;
      })
      .addCase(updateTicketStatus.rejected, (state, action) => {
        state.updatingStatus = false;
        state.error = action.payload || "Failed to update status";
      })

      // Update Ticket
      .addCase(updateTicket.pending, (state) => {
        state.updatingTicket = true;
        state.error = null;
      })
      .addCase(updateTicket.fulfilled, (state, action) => {
        state.updatingTicket = false;
        state.currentTicket = action.payload.ticket;
        state.success = true;
        state.error = null;
        const index = state.tickets.findIndex(t =>
          (t.ticket_uuid === action.payload.ticket?.ticket_uuid)
        );
        if (index !== -1 && action.payload.ticket) {
          state.tickets[index] = action.payload.ticket;
        }
      })
      .addCase(updateTicket.rejected, (state, action) => {
        state.updatingTicket = false;
        state.error = action.payload || "Failed to update ticket";
      })

      // Delete Ticket
      .addCase(deleteTicket.pending, (state) => {
        state.deletingTicket = true;
        state.error = null;
      })
      .addCase(deleteTicket.fulfilled, (state, action) => {
        state.deletingTicket = false;
        state.success = true;
        state.currentTicket = null;
        state.error = null;
        state.tickets = state.tickets.filter(t =>
          t.ticket_uuid !== action.payload.ticketUuid
        );
      })
      .addCase(deleteTicket.rejected, (state, action) => {
        state.deletingTicket = false;
        state.error = action.payload || "Failed to delete ticket";
      });
  }
});

// Selectors
export const selectSupportTickets = (state) => state.customerSupport?.tickets || [];
export const selectSupportLoading = (state) => state.customerSupport?.loading || false;
export const selectSupportSubmitting = (state) => state.customerSupport?.submitting || false;
export const selectSupportError = (state) => state.customerSupport?.error;
export const selectSupportSuccess = (state) => state.customerSupport?.success;
export const selectLastSubmitted = (state) => state.customerSupport?.lastSubmitted;
export const selectFetchingTickets = (state) => state.customerSupport?.fetchingTickets || false;
export const selectCurrentTicket = (state) => state.customerSupport?.currentTicket;
export const selectFetchingTicketDetail = (state) => state.customerSupport?.fetchingTicketDetail || false;
export const selectUpdatingTicket = (state) => state.customerSupport?.updatingTicket || false;
export const selectDeletingTicket = (state) => state.customerSupport?.deletingTicket || false;
export const selectTicketCategories = (state) => state.customerSupport?.categories || [];
export const selectFetchingCategories = (state) => state.customerSupport?.fetchingCategories || false;
export const selectStatusList = (state) => state.customerSupport?.statusList || [];
export const selectFetchingStatusList = (state) => state.customerSupport?.fetchingStatusList || false;
export const selectUpdatingStatus = (state) => state.customerSupport?.updatingStatus || false;

// Actions
export const { clearError, clearSuccess, resetForm, clearLastSubmitted, clearCurrentTicket } = customerSupportSlice.actions;

// Reducer
export default customerSupportSlice.reducer;