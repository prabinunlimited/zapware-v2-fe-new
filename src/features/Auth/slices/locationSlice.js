import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { countries } from "../../../features/Auth/slices/countrySlice";

const API_URL = import.meta.env.VITE_API_URL;

// Async Thunks - Keep only countries and ZIP lookup
export const fetchCountries = createAsyncThunk(
  "location/fetchCountries",
  async (_, { rejectWithValue }) => {
    try {
      return countries;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch location by ZIP code using Zippopotam API
export const fetchLocationByZip = createAsyncThunk(
  "location/fetchLocationByZip",
  async ({ countryCode, zipCode }, { rejectWithValue }) => {
    try {
      // Clean and validate inputs
      const cleanCountryCode = countryCode?.toUpperCase()?.trim() || '';
      const cleanZipCode = zipCode?.trim() || '';
      
      if (!cleanCountryCode || !cleanZipCode) {
        return rejectWithValue("Country code and ZIP code are required");
      }

      console.log(`🔍 Fetching location for ${cleanCountryCode}/${cleanZipCode}`);
      
      const response = await axios.get(
        `https://api.zippopotam.us/${cleanCountryCode}/${cleanZipCode}`,
        {
          timeout: 5000,
        }
      );

      const data = response.data;
      console.log("✅ ZIP API Response:", data);
      
      // Extract state and city from the API response
      const place = data.places?.[0];
      const state = place?.state || '';
      const city = place?.["place name"] || '';
      const stateAbbr = place?.["state abbreviation"] || '';
      
      return {
        state,
        city,
        stateAbbr,
        country: data.country || '',
        countryAbbr: data["country abbreviation"] || '',
        postCode: data["post code"] || cleanZipCode,
        places: data.places || [],
        zipCode: cleanZipCode,
        success: true,
        rawData: data
      };
    } catch (error) {
      console.error('❌ Zippopotam API error:', error.message);
      return rejectWithValue({
        message: "Invalid ZIP code or no data found for this location",
        zipCode,
        countryCode,
        error: error.message
      });
    }
  }
);

// Initial State
const initialState = {
  countries: [],
  selectedCountry: null,
  zipLookup: {
    loading: false,
    data: null,
    error: null
  },
  loading: {
    countries: false,
  },
  error: {
    countries: null,
  },
};

// Slice
const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {
    setSelectedCountry: (state, action) => {
      state.selectedCountry = action.payload;
      // Clear ZIP lookup data when country changes
      state.zipLookup.data = null;
      state.zipLookup.error = null;
    },
    clearLocationData: (state) => {
      return initialState;
    },
    clearZipLookupData: (state) => {
      state.zipLookup = {
        loading: false,
        data: null,
        error: null
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Countries
      .addCase(fetchCountries.pending, (state) => {
        state.loading.countries = true;
        state.error.countries = null;
      })
      .addCase(fetchCountries.fulfilled, (state, action) => {
        state.loading.countries = false;
        state.countries = action.payload;
      })
      .addCase(fetchCountries.rejected, (state, action) => {
        state.loading.countries = false;
        state.error.countries = action.payload;
      })

      // ZIP Code Lookup
      .addCase(fetchLocationByZip.pending, (state) => {
        state.zipLookup.loading = true;
        state.zipLookup.error = null;
      })
      .addCase(fetchLocationByZip.fulfilled, (state, action) => {
        state.zipLookup.loading = false;
        state.zipLookup.data = action.payload;
        state.zipLookup.error = null;
      })
      .addCase(fetchLocationByZip.rejected, (state, action) => {
        state.zipLookup.loading = false;
        state.zipLookup.error = action.payload;
        state.zipLookup.data = null;
      });
  },
});

// Export actions and selectors
export const {
  setSelectedCountry,
  clearLocationData,
  clearZipLookupData,
} = locationSlice.actions;

export const selectCountries = (state) => state.location.countries;
export const selectSelectedCountry = (state) => state.location.selectedCountry;
export const selectLocationLoading = (state) => state.location.loading;
export const selectZipLookup = (state) => state.location.zipLookup;

export default locationSlice.reducer;