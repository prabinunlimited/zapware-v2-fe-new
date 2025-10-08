// src/features/Auth/slices/signupSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Create a simple API utility
const api = {
  get: async (url, options = {}) => {
    const API_URL = import.meta.env.VITE_API_URL || "https://sandbox-zapware.unlimitedremit.com/api";
    const fullUrl = `${API_URL}${url}`;
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
  post: async (url, data, options = {}) => {
    const API_URL = import.meta.env.VITE_API_URL || "https://sandbox-zapware.unlimitedremit.com/api";
    const fullUrl = `${API_URL}${url}`;
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
};

// Async thunk for fetching terms and conditions
export const fetchTermsAndConditions = createAsyncThunk(
  "signup/fetchTermsAndConditions",
  async (_, { rejectWithValue }) => {
    try {
      const iswhitelabelledpartner = localStorage.getItem("iswhitelabelledpartner");
      const whitelabelledpartnerid = localStorage.getItem("whitelabelledpartnerid");
      const bearertoken = localStorage.getItem("bearertoken");

      const partnerId = iswhitelabelledpartner === "1" ? whitelabelledpartnerid : "0";

      const response = await api.get(`/terms-by-partner/${partnerId}`, {
        timeout: 15000,
        headers: bearertoken ? {
          Authorization: `Bearer ${bearertoken}`
        } : {}
      });

      // Handle various response structures
      const termsData = response.data || response;

      if (termsData && Array.isArray(termsData.terms)) {
        return termsData.terms;
      } else if (Array.isArray(termsData)) {
        return termsData;
      } else if (termsData && typeof termsData === 'object') {
        // Try to extract terms from object
        const termsArray = Object.values(termsData).find(Array.isArray);
        return termsArray || [];
      } else {
        console.warn("Unexpected terms response structure:", termsData);
        return [];
      }
    } catch (error) {
      console.error("Error fetching Terms and Conditions:", error);

      // Don't block registration if terms fail to load
      if (error.message.includes("timeout") || error.code === 'ECONNABORTED') {
        console.warn("Terms fetch timeout - continuing without terms");
        return [];
      }

      // Handle 401 specifically
      if (error.response?.status === 401) {
        console.warn("Authentication failed for terms - continuing without terms");
        return [];
      }

      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching nationalities
export const fetchNationalities = createAsyncThunk(
  "signup/fetchNationalities",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/nationalities', { timeout: 10000 });

      // Handle different response structures
      const nationalitiesData = response.data || response.nationalities || response;

      if (Array.isArray(nationalitiesData)) {
        return nationalitiesData;
      } else if (nationalitiesData && typeof nationalitiesData === 'object') {
        // Extract array from object if needed
        const nationalitiesArray = Object.values(nationalitiesData).find(Array.isArray);
        return nationalitiesArray || [];
      } else {
        console.warn("Unexpected nationalities response structure:", nationalitiesData);
        return [];
      }
    } catch (error) {
      console.error("Failed to fetch nationalities:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching ID document types
export const fetchIdDocumentTypes = createAsyncThunk(
  "signup/fetchIdDocumentTypes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/id-document-types', { timeout: 10000 });

      // Handle different response structures
      const documentTypesData = response.data || response.documentTypes || response;

      if (Array.isArray(documentTypesData)) {
        return documentTypesData;
      } else if (documentTypesData && typeof documentTypesData === 'object') {
        // Extract array from object if needed
        const documentTypesArray = Object.values(documentTypesData).find(Array.isArray);
        return documentTypesArray || [];
      } else {
        console.warn("Unexpected document types response structure:", documentTypesData);
        return [];
      }
    } catch (error) {
      console.error("Failed to fetch ID document types:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching genders
export const fetchGenders = createAsyncThunk(
  "signup/fetchGenders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/genders', { timeout: 10000 });

      // Handle different response structures
      const gendersData = response.data || response.genders || response;

      if (Array.isArray(gendersData)) {
        return gendersData;
      } else {
        console.warn("Unexpected genders response structure:", gendersData);
        return [];
      }
    } catch (error) {
      console.error("Failed to fetch genders:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for submitting individual signup
export const submitIndividualSignup = createAsyncThunk(
  "signup/submitIndividual",
  async (formData, { rejectWithValue }) => {
    try {
      const bearertoken = localStorage.getItem("bearertoken");

      const response = await api.post("/customers/sign-up", formData, {
        headers: {
          Authorization: bearertoken ? `Bearer ${bearertoken}` : "",
        },
        timeout: 30000,
      });

      return response;
    } catch (error) {
      console.error("Signup submission error:", error);

      // Enhanced error handling
      let errorMessage = "Registration failed. Please try again.";
      let validationErrors = {};

      if (error.response) {
        const responseData = error.response.data;
        if (responseData.message) {
          errorMessage = responseData.message;
        }
        if (responseData.errors) {
          validationErrors = responseData.errors;
        }
      } else if (error.request) {
        errorMessage = "No response from server. Please check your connection.";
      } else {
        errorMessage = error.message;
      }

      return rejectWithValue({
        message: errorMessage,
        errors: validationErrors,
      });
    }
  }
);

const initialState = {
  // Form data
  formData: {
    customer_type: "individual",
    first_name: "",
    last_name: "",
    email: "",
    middle_name: "",
    password: "",
    confirmPassword: "",
    mobile_number: "",
    zip_code: "",
    state: "",
    city: "",
    country: "",
    resident_country: "",
    mobilenumber_countrycode: "",
    flag_url: "",
    street_address_1: "",
    street_address_2: "",
    nationality: "",
    gender: "",
    dob: "",
    ssn: "",
    house_number: "",
    accept_sms: 0,
    accept_privacy_policy: 0,
    accept_disclosure: 0,
    accept_fees: 0,
    terms_and_conditions: [],
  },
  
  // API data - flattened structure
  nationalities: [],
  idDocumentTypes: [],
  genders: [],
  termsConditions: [],

  // Loading states
  nationalitiesLoading: false,
  nationalitiesError: null,
  idDocumentTypesLoading: false,
  idDocumentTypesError: null,
  gendersLoading: false,
  gendersError: null,
  termsLoading: false,
  termsError: null,
  termsFetched: false,
  submissionLoading: false,
  submissionError: null,

  // Business logic flags
  showSSNField: false,
  hasNamedAccounts: false,
  isUSDSelected: false,
  ssnError: "",
  showSSNConfirmation: false,

  // Validation
  validationErrors: {},
  isFormValid: false,

  // Steps and progress
  currentStep: 0,
  totalSteps: 5,
  formProgress: 0,
};

const signupSlice = createSlice({
  name: "signup",
  initialState,
  reducers: {
    setFormField: (state, action) => {
      const { field, value } = action.payload;
      if (field in state.formData) {
        state.formData[field] = value;

        // Clear specific errors when field is updated
        if (state.validationErrors[field]) {
          delete state.validationErrors[field];
        }

        // Clear SSN error when SSN field is updated
        if (field === 'ssn' && state.ssnError) {
          state.ssnError = "";
        }
      }
    },

    setMetadataField: (state, action) => {
      const { field, value } = action.payload;
      // Direct property access instead of nested metadata
      if (field in state && field !== 'formData') {
        state[field] = value;
      }
    },

    setTermsAccepted: (state, action) => {
      const { termId, accepted, metadata } = action.payload;
      if (accepted) {
        const existingIndex = state.formData.terms_and_conditions.findIndex(
          (item) => item.id === termId
        );
        if (existingIndex === -1) {
          state.formData.terms_and_conditions.push({
            id: termId,
            accepted_at: metadata?.accepted_at || new Date().toISOString(),
            ip: metadata?.ip || "Unknown",
            location: metadata?.location || "Unknown",
            device: metadata?.device || "Unknown",
          });
        }
      } else {
        state.formData.terms_and_conditions = 
          state.formData.terms_and_conditions.filter(item => item.id !== termId);
      }
    },

    clearTermsError: (state) => {
      state.termsError = null;
    },

    clearSubmissionError: (state) => {
      state.submissionError = null;
      state.validationErrors = {};
    },

    clearSSNError: (state) => {
      state.ssnError = "";
    },

    setValidationErrors: (state, action) => {
      state.validationErrors = action.payload;
    },

    setFormProgress: (state, action) => {
      state.formProgress = Math.max(0, Math.min(100, action.payload));
    },

    setCurrentStep: (state, action) => {
      state.currentStep = Math.max(0, Math.min(state.totalSteps - 1, action.payload));
    },

    nextStep: (state) => {
      if (state.currentStep < state.totalSteps - 1) {
        state.currentStep += 1;
      }
    },

    prevStep: (state) => {
      if (state.currentStep > 0) {
        state.currentStep -= 1;
      }
    },

    resetForm: () => initialState,

    resetFormData: (state) => {
      state.formData = { ...initialState.formData };
      state.validationErrors = {};
      state.submissionError = null;
      state.ssnError = "";
      state.formProgress = 0;
      state.currentStep = 0;
    },

    syncFormikToRedux: (state, action) => {
      const formikValues = action.payload;
      Object.keys(formikValues).forEach(key => {
        if (key in state.formData) {
          state.formData[key] = formikValues[key];
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // Terms and Conditions
      .addCase(fetchTermsAndConditions.pending, (state) => {
        state.termsLoading = true;
        state.termsError = null;
      })
      .addCase(fetchTermsAndConditions.fulfilled, (state, action) => {
        state.termsLoading = false;
        state.termsConditions = action.payload;
        state.termsFetched = true;
      })
      .addCase(fetchTermsAndConditions.rejected, (state, action) => {
        state.termsLoading = false;
        state.termsError = action.payload;
        state.termsFetched = true;
        state.termsConditions = [];
      })

      // Nationalities
      .addCase(fetchNationalities.pending, (state) => {
        state.nationalitiesLoading = true;
        state.nationalitiesError = null;
      })
      .addCase(fetchNationalities.fulfilled, (state, action) => {
        state.nationalitiesLoading = false;
        state.nationalities = action.payload;
      })
      .addCase(fetchNationalities.rejected, (state, action) => {
        state.nationalitiesLoading = false;
        state.nationalitiesError = action.payload;
        state.nationalities = [];
      })

      // ID Document Types
      .addCase(fetchIdDocumentTypes.pending, (state) => {
        state.idDocumentTypesLoading = true;
        state.idDocumentTypesError = null;
      })
      .addCase(fetchIdDocumentTypes.fulfilled, (state, action) => {
        state.idDocumentTypesLoading = false;
        state.idDocumentTypes = action.payload;
      })
      .addCase(fetchIdDocumentTypes.rejected, (state, action) => {
        state.idDocumentTypesLoading = false;
        state.idDocumentTypesError = action.payload;
        state.idDocumentTypes = [];
      })

      // Genders
      .addCase(fetchGenders.pending, (state) => {
        state.gendersLoading = true;
        state.gendersError = null;
      })
      .addCase(fetchGenders.fulfilled, (state, action) => {
        state.gendersLoading = false;
        state.genders = action.payload;
      })
      .addCase(fetchGenders.rejected, (state, action) => {
        state.gendersLoading = false;
        state.gendersError = action.payload;
        state.genders = [];
      })

      // Signup Submission
      .addCase(submitIndividualSignup.pending, (state) => {
        state.submissionLoading = true;
        state.submissionError = null;
        state.validationErrors = {};
      })
      .addCase(submitIndividualSignup.fulfilled, (state, action) => {
        state.submissionLoading = false;
        state.submissionError = null;
      })
      .addCase(submitIndividualSignup.rejected, (state, action) => {
        state.submissionLoading = false;
        state.submissionError = action.payload?.message || "Submission failed";
        state.validationErrors = action.payload?.errors || {};
      });
  },
});

// Selectors - updated for flat structure
export const selectFormData = (state) => state.signup.formData;
export const selectNationalities = (state) => state.signup.nationalities;
export const selectIdDocumentTypes = (state) => state.signup.idDocumentTypes;
export const selectGenders = (state) => state.signup.genders;
export const selectTermsConditions = (state) => state.signup.termsConditions;

// Loading selectors
export const selectTermsLoading = (state) => state.signup.termsLoading;
export const selectTermsError = (state) => state.signup.termsError;
export const selectTermsFetched = (state) => state.signup.termsFetched;
export const selectNationalitiesLoading = (state) => state.signup.nationalitiesLoading;
export const selectNationalitiesError = (state) => state.signup.nationalitiesError;
export const selectIdDocumentTypesLoading = (state) => state.signup.idDocumentTypesLoading;
export const selectIdDocumentTypesError = (state) => state.signup.idDocumentTypesError;
export const selectGendersLoading = (state) => state.signup.gendersLoading;
export const selectGendersError = (state) => state.signup.gendersError;
export const selectSubmissionLoading = (state) => state.signup.submissionLoading;
export const selectSubmissionError = (state) => state.signup.submissionError;

// Business logic selectors
export const selectAcceptedTerms = (state) => state.signup.formData.terms_and_conditions;
export const selectShowSSNField = (state) => state.signup.showSSNField;
export const selectHasNamedAccounts = (state) => state.signup.hasNamedAccounts;
export const selectIsUSDSelected = (state) => state.signup.isUSDSelected;
export const selectSSNError = (state) => state.signup.ssnError;
export const selectShowSSNConfirmation = (state) => state.signup.showSSNConfirmation;

// Validation and progress selectors
export const selectValidationErrors = (state) => state.signup.validationErrors;
export const selectIsFormValid = (state) => state.signup.isFormValid;
export const selectCurrentStep = (state) => state.signup.currentStep;
export const selectFormProgress = (state) => state.signup.formProgress;
export const selectTotalSteps = (state) => state.signup.totalSteps;

// Combined loading selector for initialization
export const selectIsInitializing = (state) =>
  state.signup.nationalitiesLoading ||
  state.signup.idDocumentTypesLoading ||
  state.signup.gendersLoading ||
  state.signup.termsLoading;

// Combined error selector
export const selectAnyErrors = (state) =>
  state.signup.nationalitiesError ||
  state.signup.idDocumentTypesError ||
  state.signup.gendersError ||
  state.signup.termsError;

export const {
  setFormField,
  setMetadataField,
  setTermsAccepted,
  clearTermsError,
  clearSubmissionError,
  clearSSNError,
  setValidationErrors,
  setFormProgress,
  setCurrentStep,
  nextStep,
  prevStep,
  resetForm,
  resetFormData,
  syncFormikToRedux,
} = signupSlice.actions;

export default signupSlice.reducer;