// src/page/Deposit/slices/currencySlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { tokenService } from "../../../services/authService";

const API_URL = import.meta.env.VITE_API_URL;

export const fetchPaymentMethodsByCurrency = createAsyncThunk(
  "currency/fetchPaymentMethodsByCurrency",
  async ({ currencyId, serviceProviderId }, { rejectWithValue }) => {
    try {
      if (!currencyId || !serviceProviderId) {
        return rejectWithValue("Missing currency_id or service_provider_id");
      }

      const token = tokenService.getToken();

      if (!token) {
        try {
          const response = await axios.post(
            `${API_URL}/partner-login`,
            {
              client_id: "HK6V7709",
              client_secret: "057d433a-2d02-437b-a265-56114567aa44",
            },
            {
              headers: { "Content-Type": "application/json" },
              timeout: 10000,
            }
          );

          if (response.data?.data?.token) {
            const newToken = response.data.data.token;
            tokenService.setToken(newToken);
          } else {
            throw new Error("Invalid token response structure");
          }
        } catch (partnerError) {
          throw new Error("Authentication required. Please try again.");
        }
      }

      const finalToken = tokenService.getToken();
      if (!finalToken) {
        throw new Error("No authentication token available");
      }

      // ✅ Updated endpoint using currency_id and service_provider_id
      const response = await axios.get(
        `${API_URL}/deposit-types-by-currency-service-provider/${currencyId}/${serviceProviderId}`,
        {
          headers: {
            Authorization: `Bearer ${finalToken}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      const resData = response.data;
      let rawLists = [];

      if (Array.isArray(resData?.data?.lists)) {
        rawLists = resData.data.lists;
      } else if (Array.isArray(resData?.lists)) {
        rawLists = resData.lists;
      } else if (Array.isArray(resData?.data)) {
        rawLists = resData.data;
      } else if (Array.isArray(resData)) {
        rawLists = resData;
      }

      return rawLists.filter(
        (item) =>
          item.is_active === 1 ||
          item.is_active === true ||
          item.is_active === undefined
      );
    } catch (error) {
      if (error.response?.status === 401) {
        return rejectWithValue("Authentication failed. Please log in again.");
      }

      if (error.response?.status === 404) {
        return [];
      }

      if (error.response) {
        return rejectWithValue(
          error.response.data?.message ||
            error.response.data?.error ||
            "Failed to load payment methods"
        );
      } else if (error.request) {
        return rejectWithValue("Network error while loading payment methods");
      } else {
        return rejectWithValue(
          error.message || "Failed to load payment methods"
        );
      }
    }
  }
);

const currencySlice = createSlice({
  name: "currency",
  initialState: {
    paymentMethods: [],
    paymentMethodsLoading: false,
    paymentMethodsError: null,
  },
  reducers: {
    clearPaymentMethods: (state) => {
      state.paymentMethods = [];
      state.paymentMethodsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentMethodsByCurrency.pending, (state) => {
        state.paymentMethodsLoading = true;
        state.paymentMethodsError = null;
        state.paymentMethods = [];
      })
      .addCase(fetchPaymentMethodsByCurrency.fulfilled, (state, action) => {
        state.paymentMethodsLoading = false;
        state.paymentMethodsError = null;

        if (Array.isArray(action.payload)) {
          state.paymentMethods = action.payload;
        } else {
          state.paymentMethods = [];
        }
      })
      .addCase(fetchPaymentMethodsByCurrency.rejected, (state, action) => {
        state.paymentMethodsLoading = false;
        state.paymentMethodsError = action.payload;
        state.paymentMethods = [];
      });
  },
});

export const { clearPaymentMethods } = currencySlice.actions;

export const selectPaymentMethods = (state) => state.currency.paymentMethods;
export const selectPaymentMethodsLoading = (state) =>
  state.currency.paymentMethodsLoading;
export const selectPaymentMethodsError = (state) =>
  state.currency.paymentMethodsError;

export default currencySlice.reducer;