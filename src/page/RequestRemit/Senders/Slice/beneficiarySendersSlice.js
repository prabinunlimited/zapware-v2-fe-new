// src/features/BeneficiarySenders/Slice/beneficiarySendersSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_URL = import.meta.env.VITE_API_URL;

// Helper function to get auth token
const getAuthToken = () => {
  const authtoken =
    localStorage.getItem("authtoken") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("bearerToken") ||
    sessionStorage.getItem("authtoken") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("bearerToken");

  return authtoken;
};

// Helper to store temporary senders in localStorage
const storeTempSender = (beneficiaryId, customerId, senderData) => {
  try {
    const key = `tempSenders_${beneficiaryId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    
    // Check if already exists
    if (!existing.find(s => s.customer_id === customerId)) {
      const tempSender = {
        id: senderData.id || Date.now(),
        customer_id: customerId,
        beneficiary_id: beneficiaryId,
        customer: senderData.customer || null,
        isTemp: true,
        addedAt: new Date().toISOString(),
        ...senderData
      };
      
      existing.push(tempSender);
      localStorage.setItem(key, JSON.stringify(existing));
      return tempSender;
    }
  } catch (error) {
    console.error("Error storing temp sender:", error);
  }
  return null;
};

// Get temporary senders from localStorage
const getTempSenders = (beneficiaryId) => {
  try {
    const key = `tempSenders_${beneficiaryId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch (error) {
    console.error("Error getting temp senders:", error);
    return [];
  }
};

// Async thunks
export const fetchSenders = createAsyncThunk(
  "beneficiarySenders/fetchSenders",
  async (beneficiaryId, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const customerId = localStorage.getItem("customerId");

      if (!beneficiaryId || !customerId || !token) {
        throw new Error("Missing required parameters");
      }

      console.log("🔍 Fetching senders for beneficiary:", beneficiaryId);

      const response = await fetch(
        `${API_URL}/beneficiaries/senders/${beneficiaryId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const status = response.status;
        if (status === 404) {
          console.log("⚠️ API endpoint not found. Returning empty list.");
          return [];
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log("🔍 API Response:", data);
      
      // Try different response structures
      let sendersData = [];
      
      if (data.getbenefsendersacctobeneficiaryid_data) {
        sendersData = data.getbenefsendersacctobeneficiaryid_data;
      } else if (data.data) {
        if (Array.isArray(data.data)) {
          sendersData = data.data;
        } else if (data.data.getbenefsendersacctobeneficiaryid_data) {
          sendersData = data.data.getbenefsendersacctobeneficiaryid_data;
        } else if (data.data.senders) {
          sendersData = data.data.senders;
        }
      } else if (data.senders) {
        sendersData = data.senders;
      }
      
      // Also get temporary senders from localStorage
      const tempSenders = getTempSenders(beneficiaryId);
      
      // Combine API senders with temp senders
      const allSenders = [...sendersData, ...tempSenders];
      
      console.log("🔍 All senders (API + temp):", allSenders);

      // Map to our format
      const senders = allSenders.map((sender) => {
        // Handle temporary senders
        if (sender.isTemp) {
          return {
            id: sender.id,
            name: `${sender.customer?.first_name || "Unknown"} ${sender.customer?.last_name || ""}`.trim(),
            email: sender.customer?.email || "Not Available",
            full_phone_number: sender.customer?.full_mobile_number || "Not Available",
            street: sender.customer?.street_address_1 || "Not Available",
            customer_id: sender.customer_id,
            beneficiary_id: sender.beneficiary_id,
            relationtobenef: "Sender",
            isVisible: true,
            isTemp: true,
          };
        }
        
        // Handle API senders
        return {
          id: sender.id,
          name: `${sender.customer?.first_name || ""} ${
            sender.customer?.middle_name || ""
          } ${sender.customer?.last_name || ""}`.trim(),
          email: sender.customer?.email,
          full_phone_number: sender.customer?.full_mobile_number,
          street:
            sender.customer?.street_address_1 ||
            sender.customer?.street_address_2 ||
            "Not Available",
          customer_id: sender.customer_id,
          beneficiary_id: sender.beneficiary_id,
          relationtobenef: "Sender",
          isVisible: true,
          isTemp: false,
        };
      });

      console.log("🔍 Mapped senders:", senders);
      return senders;
    } catch (error) {
      console.error("Error fetching senders:", error);
      
      // Return temporary senders even if API fails
      const tempSenders = getTempSenders(beneficiaryId);
      const tempMapped = tempSenders.map(sender => ({
        id: sender.id,
        name: `${sender.customer?.first_name || "Unknown"} ${sender.customer?.last_name || ""}`.trim(),
        email: sender.customer?.email || "Not Available",
        full_phone_number: sender.customer?.full_mobile_number || "Not Available",
        street: sender.customer?.street_address_1 || "Not Available",
        customer_id: sender.customer_id,
        beneficiary_id: sender.beneficiary_id,
        relationtobenef: "Sender",
        isVisible: true,
        isTemp: true,
      }));
      
      return tempMapped;
    }
  }
);

export const addSender = createAsyncThunk(
  "beneficiarySenders/addSender",
  async ({ customerId, beneficiaryId, customerData }, { rejectWithValue, dispatch }) => {
    try {
      const token = getAuthToken();

      if (!customerId || !beneficiaryId || !token) {
        throw new Error("Missing required parameters");
      }

      console.log("🔍 Adding sender:", { customerId, beneficiaryId });

      const response = await fetch(
        `${API_URL}/beneficiaries/create-benef-sender`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer_id: customerId,
            beneficiary_id: beneficiaryId,
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        // Check if it's a duplicate error
        if (data.message && data.message.includes("already exists")) {
          console.log("⚠️ Sender already exists:", data);
          
          // Store as temporary sender
          storeTempSender(beneficiaryId, customerId, {
            ...data.data,
            customer: customerData
          });
          
          // Refresh the list
          dispatch(fetchSenders(beneficiaryId));
          
          // Return with duplicate flag
          return { 
            ...data, 
            isDuplicate: true,
            customerData 
          };
        }
        
        throw new Error(data.message || data.error || "Failed to add sender");
      }

      console.log("✅ Sender added successfully:", data);
      
      // Refresh the list
      dispatch(fetchSenders(beneficiaryId));
      
      return data;
    } catch (error) {
      console.error("❌ Error adding sender:", error);
      
      // Handle network errors or other issues
      if (error.message.includes("already exists") || 
          error.message.includes("duplicate")) {
        
        // Store as temporary sender
        storeTempSender(beneficiaryId, customerId, {
          id: Date.now(),
          customer: customerData
        });
        
        // Refresh the list
        dispatch(fetchSenders(beneficiaryId));
        
        return rejectWithValue({ 
          message: "This sender is already associated with the beneficiary",
          isDuplicate: true,
          customerData 
        });
      }
      
      return rejectWithValue(error.message || "Failed to add sender");
    }
  }
);

export const deleteSender = createAsyncThunk(
  "beneficiarySenders/deleteSender",
  async (senderId, { rejectWithValue, getState }) => {
    try {
      const token = getAuthToken();
      const customerId = localStorage.getItem("customerId");

      if (!senderId || !customerId || !token) {
        throw new Error("Missing required parameters");
      }

      const response = await fetch(
        `${API_URL}/delete-beneficiary/${senderId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Also remove from temporary storage if it was temp
      const state = getState();
      const sender = state.beneficiarySenders.senders.find(s => s.id === senderId);
      if (sender?.isTemp) {
        const key = `tempSenders_${sender.beneficiary_id}`;
        const tempSenders = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = tempSenders.filter(s => s.id !== senderId);
        localStorage.setItem(key, JSON.stringify(updated));
      }
      
      return { senderId, data };
    } catch (error) {
      console.error("Error deleting sender:", error);
      return rejectWithValue(error.message || "Failed to delete sender");
    }
  }
);

export const searchSenders = createAsyncThunk(
  "beneficiarySenders/searchSenders",
  async ({ query, searchType = "email" }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();

      if (!query || !token) {
        throw new Error("Missing required parameters");
      }

      let formattedQuery = query;
      if (searchType === "mobile") {
        formattedQuery = query.replace(/[^\d\+\s]/g, "");
      }

      const response = await fetch(`${API_URL}/beneficiaries/customer/search`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_type: searchType,
          query: formattedQuery,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Map search results to our format
      const searchResults =
        data.customers_data?.map((customer) => ({
          id: customer.id,
          name: `${customer.first_name} ${customer.middle_name || ""} ${
            customer.last_name
          }`.trim(),
          email: customer.email,
          full_phone_number: customer.full_mobile_number,
          relationtobenef: "Customer",
          street: customer.street_address_1 || "Not Available",
          isVisible: true,
          isSearchResult: true,
        })) || [];

      return searchResults;
    } catch (error) {
      console.error("Error searching senders:", error);
      return rejectWithValue(error.message || "Search failed");
    }
  }
);

// Search customers for Add Sender modal
export const searchCustomers = createAsyncThunk(
  "beneficiarySenders/searchCustomers",
  async (query, { rejectWithValue }) => {
    try {
      const token = getAuthToken();

      if (!query || !token) {
        throw new Error("Missing required parameters");
      }

      const response = await fetch(`${API_URL}/beneficiaries/customer/search`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_type: "email",
          query: query.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.customers_data || [];
    } catch (error) {
      console.error("Error searching customers:", error);
      return rejectWithValue(error.message || "Search failed");
    }
  }
);

// Save sender as beneficiary
export const saveSenderAsBeneficiary = createAsyncThunk(
  "beneficiarySenders/saveSenderAsBeneficiary",
  async ({ senderCustomerId, beneficiaryId }, { rejectWithValue, dispatch }) => {
    try {
      const token = getAuthToken();
      
      if (!senderCustomerId || !beneficiaryId || !token) {
        throw new Error("Missing required parameters");
      }
      
      // Call the same API to create the association
      const response = await fetch(
        `${API_URL}/beneficiaries/create-benef-sender`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer_id: senderCustomerId,
            beneficiary_id: beneficiaryId,
          }),
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.message && data.message.includes("already exists")) {
          return { isDuplicate: true, message: data.message };
        }
        throw new Error(data.message || data.error || "Failed to save sender");
      }
      
      // Refresh the list
      dispatch(fetchSenders(beneficiaryId));
      
      return data;
    } catch (error) {
      console.error("Error saving sender:", error);
      return rejectWithValue(error.message || "Failed to save sender");
    }
  }
);

const initialState = {
  // Data
  senders: [],
  searchResults: [],
  searchCustomersResults: [],

  // UI states
  loading: false,
  loadingSearch: false,
  loadingSearchCustomers: false,
  loadingAdd: false,
  loadingDelete: false,
  savingSenderId: null,

  // Filter and search
  searchQuery: "",
  filterVisibility: "all",
  hasSearched: false,

  // Pagination
  currentPage: 1,
  itemsPerPage: 10,

  // Errors
  error: null,
  searchError: null,
  addError: null,
  deleteError: null,

  // Modal states
  showDeleteModal: false,
  showAddSenderModal: false,
  deleteMessage: "",
  senderToDelete: null,
};

const beneficiarySendersSlice = createSlice({
  name: "beneficiarySenders",
  initialState,
  reducers: {
    // Search and filter actions
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.hasSearched = false;
    },

    setFilterVisibility: (state, action) => {
      state.filterVisibility = action.payload;
    },

    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },

    toggleSenderVisibility: (state, action) => {
      const sender = state.senders.find((s) => s.id === action.payload);
      if (sender) {
        sender.isVisible = !sender.isVisible;
      }
    },

    // Modal actions
    showDeleteModal: (state, action) => {
      state.showDeleteModal = true;
      state.senderToDelete = action.payload;
      state.deleteMessage = "";
    },

    hideDeleteModal: (state) => {
      state.showDeleteModal = false;
      state.senderToDelete = null;
      state.deleteMessage = "";
    },

    showAddSenderModal: (state) => {
      state.showAddSenderModal = true;
      state.searchCustomersResults = [];
    },

    hideAddSenderModal: (state) => {
      state.showAddSenderModal = false;
      state.searchCustomersResults = [];
    },

    setDeleteMessage: (state, action) => {
      state.deleteMessage = action.payload;
    },

    // Clear actions
    clearSearch: (state) => {
      state.searchQuery = "";
      state.searchResults = [];
      state.hasSearched = false;
      state.searchError = null;
      state.currentPage = 1;
    },

    clearAllFilters: (state) => {
      state.searchQuery = "";
      state.filterVisibility = "all";
      state.searchResults = [];
      state.hasSearched = false;
      state.searchError = null;
      state.currentPage = 1;
    },

    // Reset state
    resetSenders: () => initialState,
    
    // Manually add a sender (for testing)
    manuallyAddSender: (state, action) => {
      const newSender = {
        id: Date.now(),
        ...action.payload,
        isVisible: true,
        isTemp: true,
      };
      state.senders.push(newSender);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch senders
      .addCase(fetchSenders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSenders.fulfilled, (state, action) => {
        state.loading = false;
        state.senders = action.payload;
        state.error = null;
      })
      .addCase(fetchSenders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.senders = [];
      })

      // Add sender
      .addCase(addSender.pending, (state) => {
        state.loadingAdd = true;
        state.addError = null;
      })
      .addCase(addSender.fulfilled, (state, action) => {
        state.loadingAdd = false;
        state.addError = null;
        
        // Handle duplicate case
        if (action.payload.isDuplicate) {
          // No need to add to state since fetchSenders will refresh
        }
      })
      .addCase(addSender.rejected, (state, action) => {
        state.loadingAdd = false;
        state.addError = action.payload;
        
        // Check if it was a duplicate error
        if (action.payload?.isDuplicate) {
          // Handle duplicate error specifically
        }
      })

      // Delete sender
      .addCase(deleteSender.pending, (state) => {
        state.loadingDelete = true;
        state.deleteError = null;
      })
      .addCase(deleteSender.fulfilled, (state, action) => {
        state.loadingDelete = false;
        state.senders = state.senders.filter(
          (sender) => sender.id !== action.payload.senderId
        );
        state.deleteMessage = "Sender deleted successfully!";
        state.deleteError = null;
      })
      .addCase(deleteSender.rejected, (state, action) => {
        state.loadingDelete = false;
        state.deleteError = action.payload;
        state.deleteMessage = action.payload;
      })

      // Search senders
      .addCase(searchSenders.pending, (state) => {
        state.loadingSearch = true;
        state.searchError = null;
      })
      .addCase(searchSenders.fulfilled, (state, action) => {
        state.loadingSearch = false;
        state.searchResults = action.payload;
        state.hasSearched = true;
        state.searchError = null;
      })
      .addCase(searchSenders.rejected, (state, action) => {
        state.loadingSearch = false;
        state.searchError = action.payload;
        state.searchResults = [];
        state.hasSearched = true;
      })

      // Search customers (for Add Sender modal)
      .addCase(searchCustomers.pending, (state) => {
        state.loadingSearchCustomers = true;
      })
      .addCase(searchCustomers.fulfilled, (state, action) => {
        state.loadingSearchCustomers = false;
        state.searchCustomersResults = action.payload;
      })
      .addCase(searchCustomers.rejected, (state, action) => {
        state.loadingSearchCustomers = false;
        state.searchCustomersResults = [];
      })
      
      // Save sender as beneficiary
      .addCase(saveSenderAsBeneficiary.pending, (state, action) => {
        state.savingSenderId = action.meta.arg.senderCustomerId;
      })
      .addCase(saveSenderAsBeneficiary.fulfilled, (state, action) => {
        state.savingSenderId = null;
        
        if (action.payload.isDuplicate) {
          // Handle duplicate - sender already exists
        }
      })
      .addCase(saveSenderAsBeneficiary.rejected, (state, action) => {
        state.savingSenderId = null;
      });
  },
});

// Export actions
export const {
  setSearchQuery,
  setFilterVisibility,
  setCurrentPage,
  toggleSenderVisibility,
  showDeleteModal,
  hideDeleteModal,
  showAddSenderModal,
  hideAddSenderModal,
  setDeleteMessage,
  clearSearch,
  clearAllFilters,
  resetSenders,
  manuallyAddSender,
} = beneficiarySendersSlice.actions;

// Selectors
export const selectSenders = (state) => state.beneficiarySenders.senders || [];
export const selectSearchResults = (state) =>
  state.beneficiarySenders.searchResults || [];
export const selectSearchCustomersResults = (state) =>
  state.beneficiarySenders.searchCustomersResults || [];
export const selectDisplayedSenders = (state) => {
  const senders = state.beneficiarySenders.hasSearched
    ? state.beneficiarySenders.searchResults
    : state.beneficiarySenders.senders;

  const filterVisibility = state.beneficiarySenders.filterVisibility;

  if (!senders) return [];

  return senders.filter((sender) => {
    if (filterVisibility === "all") return true;
    if (filterVisibility === "visible") return sender.isVisible;
    if (filterVisibility === "hidden") return !sender.isVisible;
    return true;
  });
};

export const selectLoading = (state) => state.beneficiarySenders.loading;
export const selectLoadingSearch = (state) =>
  state.beneficiarySenders.loadingSearch;
export const selectLoadingSearchCustomers = (state) =>
  state.beneficiarySenders.loadingSearchCustomers;
export const selectLoadingAdd = (state) => state.beneficiarySenders.loadingAdd;
export const selectLoadingDelete = (state) =>
  state.beneficiarySenders.loadingDelete;
export const selectSavingSenderId = (state) =>
  state.beneficiarySenders.savingSenderId;

export const selectSearchQuery = (state) =>
  state.beneficiarySenders.searchQuery;
export const selectFilterVisibility = (state) =>
  state.beneficiarySenders.filterVisibility;
export const selectHasSearched = (state) =>
  state.beneficiarySenders.hasSearched;
export const selectCurrentPage = (state) =>
  state.beneficiarySenders.currentPage;
export const selectItemsPerPage = (state) =>
  state.beneficiarySenders.itemsPerPage;

export const selectError = (state) => state.beneficiarySenders.error;
export const selectSearchError = (state) =>
  state.beneficiarySenders.searchError;
export const selectAddError = (state) => state.beneficiarySenders.addError;
export const selectDeleteError = (state) =>
  state.beneficiarySenders.deleteError;

export const selectShowDeleteModal = (state) =>
  state.beneficiarySenders.showDeleteModal;
export const selectShowAddSenderModal = (state) =>
  state.beneficiarySenders.showAddSenderModal;
export const selectDeleteMessage = (state) =>
  state.beneficiarySenders.deleteMessage;
export const selectSenderToDelete = (state) =>
  state.beneficiarySenders.senderToDelete;

// Pagination selectors
export const selectPaginatedSenders = (state) => {
  const displayedSenders = selectDisplayedSenders(state);
  const currentPage = selectCurrentPage(state);
  const itemsPerPage = selectItemsPerPage(state);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  return displayedSenders.slice(indexOfFirstItem, indexOfLastItem);
};

export const selectTotalPages = (state) => {
  const displayedSenders = selectDisplayedSenders(state);
  const itemsPerPage = selectItemsPerPage(state);
  return Math.ceil(displayedSenders.length / itemsPerPage);
};

export const selectTotalSenders = (state) => {
  return selectDisplayedSenders(state).length;
};

export default beneficiarySendersSlice.reducer;