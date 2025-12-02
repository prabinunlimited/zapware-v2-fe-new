// src/features/location/locationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { countries } from "../../../features/Auth/slices/countrySlice";

const API_URL = import.meta.env.VITE_API_URL;

// Async Thunks
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

export const fetchStates = createAsyncThunk(
  "location/fetchStates",
  async (countryId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const token = auth.bearerToken || localStorage.getItem("bearertoken");

      const response = await axios.get(
        `${API_URL}/country-states/${countryId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 8000,
        }
      );

      const statesData = response.data.data || [];

      return {
        countryId,
        states: statesData,
        hasStates: statesData.length > 0,
        message:
          statesData.length > 0
            ? `Found ${statesData.length} states`
            : "No states found for this country",
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch states"
      );
    }
  }
);

export const fetchCities = createAsyncThunk(
  "location/fetchCities",
  async (stateId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const token = auth.bearerToken || localStorage.getItem("bearertoken");

      const response = await axios.get(`${API_URL}/state-cities/${stateId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 8000,
      });

      const citiesData = response.data.data || [];

      return {
        stateId,
        cities: citiesData,
        hasCities: citiesData.length > 0, // Add this flag
        message:
          citiesData.length > 0
            ? `Found ${citiesData.length} cities`
            : "No cities found for this state",
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch cities"
      );
    }
  }
);

// Initial State
const initialState = {
  countries: [],
  states: [],
  cities: [],
  selectedCountry: null,
  selectedState: null,
  selectedCity: null,
  // Add these flags
  hasStates: false,
  hasCities: false,
  lastUpdated: null,
  loading: {
    countries: false,
    states: false,
    cities: false,
    refresh: false,
  },
  error: {
    countries: null,
    states: null,
    cities: null,
  },
  metadata: {
    countriesCount: 0,
    lastFetchTimestamp: null,
    cacheStatus: "fresh",
  },
};

// Slice
const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {
    setSelectedCountry: (state, action) => {
      state.selectedCountry = action.payload;
      state.states = [];
      state.cities = [];
      state.selectedState = null;
      state.selectedCity = null;
    },
    setSelectedState: (state, action) => {
      state.selectedState = action.payload;
      state.cities = [];
      state.selectedCity = null;
    },
    setSelectedCity: (state, action) => {
      state.selectedCity = action.payload;
    },
    clearLocationData: (state) => {
      return initialState;
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

      // States
      .addCase(fetchStates.pending, (state) => {
        state.loading.states = true;
        state.error.states = null;
      })
      .addCase(fetchStates.fulfilled, (state, action) => {
        state.loading.states = false;
        state.states = action.payload.states;
        state.hasStates = action.payload.hasStates; 
        state.lastUpdated = Date.now();
      })
      .addCase(fetchStates.rejected, (state, action) => {
        state.loading.states = false;
        state.error.states = action.payload;
      })

      // Cities
      .addCase(fetchCities.pending, (state) => {
        state.loading.cities = true;
        state.error.cities = null;
      })
      .addCase(fetchCities.fulfilled, (state, action) => {
        state.loading.cities = false;
        state.cities = action.payload.cities;
        state.hasCities = action.payload.hasCities; 
        state.lastUpdated = Date.now();
      })
      .addCase(fetchCities.rejected, (state, action) => {
        state.loading.cities = false;
        state.error.cities = action.payload;
      });
  },
});

// Export actions and selectors
export const {
  setSelectedCountry,
  setSelectedState,
  setSelectedCity,
  clearLocationData,
} = locationSlice.actions;

export const selectCountries = (state) => state.location.countries;
export const selectStates = (state) => state.location.states;
export const selectCities = (state) => state.location.cities;
export const selectSelectedCountry = (state) => state.location.selectedCountry;
export const selectSelectedState = (state) => state.location.selectedState;
export const selectSelectedCity = (state) => state.location.selectedCity;
export const selectLocationLoading = (state) => state.location.loading;
export const selectLocationError = (state) => state.location.error;
export const selectHasStates = (state) => state.location.hasStates;
export const selectHasCities = (state) => state.location.hasCities;

export default locationSlice.reducer;
