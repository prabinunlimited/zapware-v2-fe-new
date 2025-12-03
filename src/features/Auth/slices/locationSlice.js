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
      const cleanZipCode = zipCode?.trim()?.replace(/\s+/g, '') || '';
      
      if (!cleanCountryCode || !cleanZipCode) {
        return rejectWithValue("Country code and ZIP code are required");
      }
      
      // Try Zippopotam API first
      let response;
      try {
        response = await axios.get(
          `https://api.zippopotam.us/${cleanCountryCode}/${cleanZipCode}`,
          { timeout: 3000 }
        );
      } catch (zippoError) {
        console.log('❌ Zippopotam API failed, trying fallback...');
        
        if (cleanCountryCode === 'GB') {
          try {
            const ukResponse = await axios.get(
              `https://api.postcodes.io/postcodes/${cleanZipCode}`,
              { timeout: 3000 }
            );
            
            const ukData = ukResponse.data;
            if (ukData.result) {
              return {
                state: ukData.result.region || '',
                city: ukData.result.admin_district || ukData.result.admin_ward || '',
                stateAbbr: '',
                country: 'United Kingdom',
                countryAbbr: 'GB',
                postCode: ukData.result.postcode || cleanZipCode,
                places: [],
                zipCode: cleanZipCode,
                originalZipCode: zipCode,
                success: true,
                source: 'postcodes.io',
                rawData: ukData
              };
            }
          } catch (ukError) {
            console.log('❌ UK postcodes.io also failed');
          }
        }
        
        // If all APIs fail, check if it's a valid format but no data
        throw zippoError;
      }

      // Zippopotam succeeded
      const data = response.data;
      
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
        originalZipCode: zipCode,
        success: true,
        source: 'zippopotam.us',
        rawData: data
      };
      
    } catch (error) {
      console.error('❌ All location APIs failed:', error.message);
      
      return rejectWithValue({
        message: "Invalid postal code format or no data available",
        zipCode,
        countryCode,
        error: error.message,
        suggestion: "Please check the postal code format or enter location manually"
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