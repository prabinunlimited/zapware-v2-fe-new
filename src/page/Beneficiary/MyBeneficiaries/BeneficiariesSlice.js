// src/page/Beneficiary/MyBeneficiaries/BeneficiariesSlice.js - COMPLETE FIXED VERSION
import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import api from "../../../services/api"; // ✅ Fixed: Import default api instead of { apiCall }

// Async thunks - using api methods directly
export const fetchBeneficiaries = createAsyncThunk(
  "beneficiaries/fetchBeneficiaries",
  async (customerId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/beneficiaries/customer-view/${customerId}`); // ✅ Use api.get()
      return response.data || [];
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch beneficiaries");
    }
  }
);

export const deleteBeneficiary = createAsyncThunk(
  "beneficiaries/deleteBeneficiary",
  async ({ id, customerId }, { rejectWithValue }) => {
    try {
      const currentDateTime = new Date()
        .toISOString()
        .replace("T", " ")
        .split(".")[0];

      const response = await api.delete(`/delete-beneficiary/${id}`, { // ✅ Use api.delete()
        data: {
          customer_id: customerId,
          current_date_time: currentDateTime,
        },
      });

      return { id, message: response.message };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete beneficiary");
    }
  }
);

export const toggleBeneficiaryVisibility = createAsyncThunk(
  "beneficiaries/toggleVisibility",
  async ({ id, isVisible }, { rejectWithValue }) => {
    try {
      // If you have an API endpoint for this, use it here
      // For now, we'll handle it locally in the reducer
      return { id, isVisible: !isVisible };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to toggle visibility");
    }
  }
);

// Add beneficiary thunk (if needed)
export const addBeneficiary = createAsyncThunk(
  "beneficiaries/addBeneficiary",
  async (beneficiaryData, { rejectWithValue }) => {
    try {
      const response = await api.post("/beneficiaries", beneficiaryData); // ✅ Use api.post()
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to add beneficiary");
    }
  }
);

// Update beneficiary thunk (if needed)
export const updateBeneficiary = createAsyncThunk(
  "beneficiaries/updateBeneficiary",
  async ({ id, beneficiaryData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/beneficiaries/${id}`, beneficiaryData); // ✅ Use api.put()
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update beneficiary");
    }
  }
);

const initialState = {
  beneficiaries: [],
  selectedBeneficiary: null,
  loading: false,
  error: null,
  searchQuery: "",
  filterVisibility: "all",
  currentPage: 1,
  beneficiariesPerPage: 10,
  deleteLoading: false,
  deleteError: null,
  addLoading: false,
  addError: null,
  updateLoading: false,
  updateError: null,
};

const beneficiariesSlice = createSlice({
  name: "beneficiaries",
  initialState,
  reducers: {
    setSelectedBeneficiary: (state, action) => {
      state.selectedBeneficiary = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.currentPage = 1; // Reset to first page when searching
    },
    setFilterVisibility: (state, action) => {
      state.filterVisibility = action.payload;
      state.currentPage = 1; // Reset to first page when filtering
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setBeneficiariesPerPage: (state, action) => {
      state.beneficiariesPerPage = action.payload;
      state.currentPage = 1; // Reset to first page when changing page size
    },
    clearError: (state) => {
      state.error = null;
      state.deleteError = null;
      state.addError = null;
      state.updateError = null;
    },
    resetBeneficiariesState: () => initialState,
    // Local visibility toggle (if no API endpoint)
    toggleVisibilityLocal: (state, action) => {
      const beneficiary = state.beneficiaries.find(b => b.id === action.payload);
      if (beneficiary) {
        beneficiary.isVisible = !beneficiary.isVisible;
      }
    },
    // Clear selected beneficiary
    clearSelectedBeneficiary: (state) => {
      state.selectedBeneficiary = null;
    },
    // Manual beneficiary addition (for offline/local state updates)
    addBeneficiaryLocal: (state, action) => {
      state.beneficiaries.unshift({
        ...action.payload,
        isVisible: true,
        id: Date.now().toString() // Temporary ID for local addition
      });
    },
    // Manual beneficiary update (for offline/local state updates)
    updateBeneficiaryLocal: (state, action) => {
      const index = state.beneficiaries.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.beneficiaries[index] = { ...state.beneficiaries[index], ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch beneficiaries
      .addCase(fetchBeneficiaries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBeneficiaries.fulfilled, (state, action) => {
        state.loading = false;
        state.beneficiaries = action.payload.map(beneficiary => ({
          ...beneficiary,
          isVisible: true, // Default to visible
        }));
      })
      .addCase(fetchBeneficiaries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete beneficiary
      .addCase(deleteBeneficiary.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteBeneficiary.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.beneficiaries = state.beneficiaries.filter(
          beneficiary => beneficiary.id !== action.payload.id
        );
        if (state.selectedBeneficiary === action.payload.id) {
          state.selectedBeneficiary = null;
        }
      })
      .addCase(deleteBeneficiary.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      })
      // Toggle visibility
      .addCase(toggleBeneficiaryVisibility.fulfilled, (state, action) => {
        const beneficiary = state.beneficiaries.find(b => b.id === action.payload.id);
        if (beneficiary) {
          beneficiary.isVisible = action.payload.isVisible;
        }
      })
      // Add beneficiary
      .addCase(addBeneficiary.pending, (state) => {
        state.addLoading = true;
        state.addError = null;
      })
      .addCase(addBeneficiary.fulfilled, (state, action) => {
        state.addLoading = false;
        state.beneficiaries.unshift({
          ...action.payload,
          isVisible: true
        });
      })
      .addCase(addBeneficiary.rejected, (state, action) => {
        state.addLoading = false;
        state.addError = action.payload;
      })
      // Update beneficiary
      .addCase(updateBeneficiary.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateBeneficiary.fulfilled, (state, action) => {
        state.updateLoading = false;
        const index = state.beneficiaries.findIndex(b => b.id === action.payload.id);
        if (index !== -1) {
          state.beneficiaries[index] = { ...state.beneficiaries[index], ...action.payload };
        }
      })
      .addCase(updateBeneficiary.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      });
  },
});

export const {
  setSelectedBeneficiary,
  setSearchQuery,
  setFilterVisibility,
  setCurrentPage,
  setBeneficiariesPerPage,
  clearError,
  resetBeneficiariesState,
  toggleVisibilityLocal,
  clearSelectedBeneficiary,
  addBeneficiaryLocal,
  updateBeneficiaryLocal,
} = beneficiariesSlice.actions;

// SELECTORS
export const selectBeneficiaries = (state) => state.beneficiaries.beneficiaries;
export const selectSelectedBeneficiary = (state) => state.beneficiaries.selectedBeneficiary;
export const selectBeneficiariesLoading = (state) => state.beneficiaries.loading;
export const selectBeneficiariesError = (state) => state.beneficiaries.error;
export const selectSearchQuery = (state) => state.beneficiaries.searchQuery;
export const selectFilterVisibility = (state) => state.beneficiaries.filterVisibility;
export const selectCurrentPage = (state) => state.beneficiaries.currentPage;
export const selectBeneficiariesPerPage = (state) => state.beneficiaries.beneficiariesPerPage;
export const selectDeleteLoading = (state) => state.beneficiaries.deleteLoading;
export const selectDeleteError = (state) => state.beneficiaries.deleteError;
export const selectAddLoading = (state) => state.beneficiaries.addLoading;
export const selectAddError = (state) => state.beneficiaries.addError;
export const selectUpdateLoading = (state) => state.beneficiaries.updateLoading;
export const selectUpdateError = (state) => state.beneficiaries.updateError;

// Derived selectors
export const selectFilteredBeneficiaries = createSelector(
  [selectBeneficiaries, selectSearchQuery, selectFilterVisibility],
  (beneficiaries, searchQuery, filterVisibility) => {
    return beneficiaries.filter((beneficiary) => {
      const name = beneficiary.name || "";
      const phone = beneficiary.full_phone_number || "";
      const relation = beneficiary.relationtobenef || "";
      const email = beneficiary.email || "";
      const accountNumber = beneficiary.account_number || "";

      const matchesSearchQuery =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phone.includes(searchQuery) ||
        relation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        accountNumber.includes(searchQuery);

      const matchesVisibilityFilter =
        filterVisibility === "all" ||
        (filterVisibility === "visible" && beneficiary.isVisible) ||
        (filterVisibility === "hidden" && !beneficiary.isVisible);

      return matchesSearchQuery && matchesVisibilityFilter;
    });
  }
);

export const selectPaginatedBeneficiaries = createSelector(
  [selectFilteredBeneficiaries, selectCurrentPage, selectBeneficiariesPerPage],
  (filteredBeneficiaries, currentPage, beneficiariesPerPage) => {
    const indexOfLastBeneficiary = currentPage * beneficiariesPerPage;
    const indexOfFirstBeneficiary = indexOfLastBeneficiary - beneficiariesPerPage;
    return filteredBeneficiaries.slice(indexOfFirstBeneficiary, indexOfLastBeneficiary);
  }
);

export const selectTotalPages = createSelector(
  [selectFilteredBeneficiaries, selectBeneficiariesPerPage],
  (filteredBeneficiaries, beneficiariesPerPage) => {
    return Math.ceil(filteredBeneficiaries.length / beneficiariesPerPage);
  }
);

export const selectTotalBeneficiaries = createSelector(
  [selectBeneficiaries],
  (beneficiaries) => beneficiaries.length
);

export const selectVisibleBeneficiaries = createSelector(
  [selectBeneficiaries],
  (beneficiaries) => beneficiaries.filter(b => b.isVisible)
);

export const selectHiddenBeneficiaries = createSelector(
  [selectBeneficiaries],
  (beneficiaries) => beneficiaries.filter(b => !b.isVisible)
);

export const selectBeneficiaryById = createSelector(
  [selectBeneficiaries, (state, beneficiaryId) => beneficiaryId],
  (beneficiaries, beneficiaryId) => beneficiaries.find(b => b.id === beneficiaryId)
);

export default beneficiariesSlice.reducer;