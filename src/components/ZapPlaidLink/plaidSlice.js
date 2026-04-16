import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_URL = import.meta.env.VITE_API_URL;

// Async thunks
export const initializePlaidLink = createAsyncThunk(
  "plaid/initializePlaidLink",
  async (customerId) => {
    console.log("🔍 Initializing Plaid link for customer:", customerId);

    const response = await fetch(`${API_URL}/sila/create_link_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN":
          document.querySelector('meta[name="csrf-token"]')?.content || "",
      },
      body: JSON.stringify({ customerId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // ✅ ADD: Validate the response structure
    console.log("🔍 Plaid API Response:", data);

    if (!data.link_token) {
      // Check if there's an error message in the response
      const errorMessage =
        data.message || data.error || "No link token received";
      throw new Error(errorMessage);
    }

    return data;
  }
);

export const storePlaidData = createAsyncThunk(
  "plaid/storePlaidData",
  async ({ public_token, accounts, customerId }) => {
    const response = await fetch(`${API_URL}/sila/store_plaid_data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN":
          document.querySelector('meta[name="csrf-token"]')?.content || "",
      },
      body: JSON.stringify({
        public_token,
        accounts,
        customerId,
      }),
    });

    const resultData = await response.json();

    if (!response.ok) {
      throw new Error(
        resultData.error
          ? parsePlaidErrorMessage(resultData.error)
          : resultData.message || "Failed to save bank details"
      );
    }

    return resultData;
  }
);

export const deleteLinkedBankAccount = createAsyncThunk(
  "plaid/deleteLinkedBankAccount",
  async ({ account_id, user_handle }) => {
    const response = await fetch(`${API_URL}/sila/delete-sila-linked-bank`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN":
          document.querySelector('meta[name="csrf-token"]')?.content || "",
      },
      body: JSON.stringify({
        account_id,
        user_handle,
      }),
    });

    const resultData = await response.json();

    if (!response.ok) {
      let errorMessage = "Failed to delete account";
      let silaMessage = "Unknown error";

      if (resultData.error) {
        try {
          const silaErrorMatch = resultData.error.match(/\{.*\}/s);
          if (silaErrorMatch) {
            const silaError = JSON.parse(silaErrorMatch[0]);
            silaMessage = silaError.message || "Unknown Sila error";
          } else {
            const messageMatch = resultData.error.match(
              /message[^"]*"([^"]+)"/
            );
            if (messageMatch) {
              silaMessage = messageMatch[1];
            }
          }
        } catch (e) {
          console.error("Error parsing Sila error:", e);
        }
      }

      errorMessage = silaMessage || resultData.message || errorMessage;
      throw new Error(errorMessage);
    }

    return resultData;
  }
);

// Helper function to parse error messages
const parsePlaidErrorMessage = (errorString) => {
  try {
    const jsonMatch = errorString.match(/\{.*\}/s);
    if (jsonMatch) {
      const errorObj = JSON.parse(jsonMatch[0]);
      return errorObj.message || errorString;
    }
    return errorString;
  } catch (e) {
    console.error("Error parsing error message:", e);
    return errorString;
  }
};

const plaidSlice = createSlice({
  name: "plaid",
  initialState: {
    isLoading: false,
    error: null,
    result: null,
    apiResponse: null,
    showResponseModal: false,
    linkToken: null,
  },
  reducers: {
    setPlaidLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    clearPlaidResult: (state) => {
      state.result = null;
      state.error = null;
    },
    setApiResponse: (state, action) => {
      state.apiResponse = action.payload;
      state.showResponseModal = true;
    },
    clearApiResponse: (state) => {
      state.apiResponse = null;
      state.showResponseModal = false;
    },
    resetPlaidState: (state) => {
      state.isLoading = false;
      state.error = null;
      state.result = null;
      state.apiResponse = null;
      state.showResponseModal = false;
      state.linkToken = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize Plaid Link
      .addCase(initializePlaidLink.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializePlaidLink.fulfilled, (state, action) => {
        state.isLoading = false;
        state.linkToken = action.payload.link_token;
      })
      .addCase(initializePlaidLink.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // Store Plaid Data
      .addCase(storePlaidData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(storePlaidData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.result = {
          ...action.payload,
          success: true,
          message: "Bank account successfully linked",
        };
      })
      .addCase(storePlaidData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
        state.result = {
          success: false,
          message: action.error.message,
          error: action.error.message,
        };
      })
      // Delete Linked Bank Account
      .addCase(deleteLinkedBankAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteLinkedBankAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.result = {
          success: true,
          message: "Bank account successfully unlinked",
          status: action.payload.status,
          reference: action.payload.reference,
        };
      })
      .addCase(deleteLinkedBankAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
        state.result = {
          success: false,
          message: action.error.message,
          status: "FAILURE",
          error: action.error.message,
        };
      });
  },
});

export const {
  setPlaidLoading,
  clearPlaidResult,
  setApiResponse,
  clearApiResponse,
  resetPlaidState,
} = plaidSlice.actions;

export default plaidSlice.reducer;