// features/teamMember/teamMemberSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Async thunks
export const fetchRoles = createAsyncThunk(
  "teamMember/fetchRoles",
  async ({ bearertoken, API_URL }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/customers/customer-staff-roles`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearertoken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch roles");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addTeamMember = createAsyncThunk(
  "teamMember/addTeamMember",
  async (
    { customerId, memberData, authToken, API_URL },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${API_URL}/customers/add-staff-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          customer_id: customerId,
          first_name: memberData.first_name,
          middle_name: memberData.middle_name,
          last_name: memberData.last_name,
          email: memberData.email,
          password: memberData.password,
          mobilenumber_countrycode: memberData.mobilenumber_countrycode,
          phone_no: memberData.mobile_number,
          role_id: memberData.role_id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle email validation errors
        if (result.message?.email?.[0]) {
          throw new Error(result.message.email[0]);
        }
        throw new Error(result.message || "Failed to add team member");
      }

      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const teamMemberSlice = createSlice({
  name: "teamMember",
  initialState: {
    roles: [],
    loading: false,
    error: null,
    success: false,
    showPopup: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    setShowPopup: (state, action) => {
      state.showPopup = action.payload;
    },
    resetTeamMemberState: (state) => {
      state.roles = [];
      state.loading = false;
      state.error = null;
      state.success = false;
      state.showPopup = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch roles
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;

        // Ensure we always have an array, even if the API returns different structure
        if (Array.isArray(action.payload)) {
          state.roles = action.payload;
        } else if (action.payload && Array.isArray(action.payload.data)) {
          state.roles = action.payload.data;
        } else if (action.payload && action.payload.roles) {
          state.roles = action.payload.roles;
        } else {
          
          state.roles = []; // Default to empty array
        }

        state.error = null;
      })

      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add team member
      .addCase(addTeamMember.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(addTeamMember.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.showPopup = false;
      })
      .addCase(addTeamMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.showPopup = true;
        state.success = false;
      });
  },
});

export const { clearError, clearSuccess, setShowPopup, resetTeamMemberState } =
  teamMemberSlice.actions;

export default teamMemberSlice.reducer;
