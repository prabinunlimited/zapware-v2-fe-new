// features/team/teamSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Async thunks
export const fetchTeamMembers = createAsyncThunk(
  "team/fetchTeamMembers",
  async ({ customerId, authToken, API_URL }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/customers/staff-user-view/${customerId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch team members");
      }
      return result.data || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteTeamMember = createAsyncThunk(
  "team/deleteTeamMember",
  async ({ staffId, authToken, API_URL }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/customers/delete-staff-user/${staffId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to delete team member");
      }
      return staffId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const teamSlice = createSlice({
  name: "team",
  initialState: {
    teamMembers: [],
    loading: false,
    deletingId: null,
    isInitialized: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetTeam: (state) => {
      state.teamMembers = [];
      state.loading = false;
      state.deletingId = null;
      state.isInitialized = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch team members
      .addCase(fetchTeamMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.teamMembers = action.payload;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(fetchTeamMembers.rejected, (state, action) => {
        state.loading = false;
        state.isInitialized = true;
        state.error = action.payload;
      })
      // Delete team member
      .addCase(deleteTeamMember.pending, (state, action) => {
        state.deletingId = action.meta.arg.staffId;
        state.error = null;
      })
      .addCase(deleteTeamMember.fulfilled, (state, action) => {
        state.deletingId = null;
        state.teamMembers = state.teamMembers.filter(
          (member) => member.staff_id !== action.payload
        );
        state.error = null;
      })
      .addCase(deleteTeamMember.rejected, (state, action) => {
        state.deletingId = null;
        state.error = action.payload;
      });
  },
});

export const { clearError, resetTeam } = teamSlice.actions;
export default teamSlice.reducer;
