import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = import.meta.env.REACT_APP_API_URL;

// THUNK: Fetch partner profile
export const fetchPartnerProfileData = createAsyncThunk(
  "bankLetter/fetchPartnerProfileData",
  async ({ token, partnerId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/bank-letter/partner/${partnerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to load data");
    }
  }
);

const bankLetterSlice = createSlice({
  name: "bankLetter",
  initialState: {
    partnerProfileData: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPartnerProfileData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPartnerProfileData.fulfilled, (state, action) => {
        state.loading = false;
        state.partnerProfileData = action.payload;
      })
      .addCase(fetchPartnerProfileData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default bankLetterSlice.reducer;
