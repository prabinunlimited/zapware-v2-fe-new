// src/features/Auth/slices/signupSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../services/api.js";

export const fetchTermsAndConditions = createAsyncThunk(
  "signup/fetchTermsAndConditions",
  async (_, { rejectWithValue }) => {
    try {
      console.log("🔍 [fetchTermsAndConditions] Starting...");

      const iswhitelabelledpartner = localStorage.getItem(
        "iswhitelabelledpartner"
      );
      const whitelabelledpartnerid = localStorage.getItem(
        "whitelabelledpartnerid"
      );
      const bearertoken = localStorage.getItem("bearertoken");

      console.log("🔍 Partner config:", {
        iswhitelabelledpartner,
        whitelabelledpartnerid,
        hasToken: !!bearertoken,
      });

      let partnerId;
      if (iswhitelabelledpartner === "1" && whitelabelledpartnerid) {
        partnerId = whitelabelledpartnerid;
      } else {
        partnerId = "0";
      }

      console.log(`📡 Fetching terms from: /terms-by-partner/${partnerId}`);

      const response = await api.get(`/terms-by-partner/${partnerId}`);

      console.log("✅ Terms API response:", {
        status: response.status,
        hasTerms: !!response.data?.terms,
        termsCount: response.data?.terms?.length || 0,
      });

      return response.data?.terms || [];
    } catch (error) {
      console.error("❌ [fetchTermsAndConditions] Error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });

      console.log("⚠️ Returning empty terms array (registration can continue)");
      return [];
    }
  }
);

export const fetchNationalities = createAsyncThunk(
  "signup/fetchNationalities",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/nationalities");

      const nationalitiesData =
        response.data || response.nationalities || response;

      if (Array.isArray(nationalitiesData)) {
        return nationalitiesData;
      } else if (nationalitiesData && typeof nationalitiesData === "object") {
        const nationalitiesArray = Object.values(nationalitiesData).find(
          Array.isArray
        );
        return nationalitiesArray || [];
      } else {
        return [];
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchIdDocumentTypes = createAsyncThunk(
  "signup/fetchIdDocumentTypes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/id-document-types");

      const documentTypesData =
        response.data || response.documentTypes || response;

      if (Array.isArray(documentTypesData)) {
        return documentTypesData;
      } else if (documentTypesData && typeof documentTypesData === "object") {
        const documentTypesArray = Object.values(documentTypesData).find(
          Array.isArray
        );
        return documentTypesArray || [];
      } else {
        return [];
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchGenders = createAsyncThunk(
  "signup/fetchGenders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/genders");

      const gendersData = response.data || response.genders || response;

      if (Array.isArray(gendersData)) {
        return gendersData;
      } else {
        return [];
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const submitIndividualSignup = createAsyncThunk(
  "signup/submitIndividual",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post("/customers/sign-up", formData);
      return response.data;
    } catch (error) {
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

  nationalities: [],
  idDocumentTypes: [],
  genders: [],
  termsConditions: [],

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

  showSSNField: false,
  hasNamedAccounts: false,
  isUSDSelected: false,
  ssnError: "",
  showSSNConfirmation: false,

  validationErrors: {},
  isFormValid: false,

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
        state.formData = {
          ...state.formData,
          [field]: value,
        };

        if (state.validationErrors[field]) {
          const newValidationErrors = { ...state.validationErrors };
          delete newValidationErrors[field];
          state.validationErrors = newValidationErrors;
        }

        if (field === "ssn" && state.ssnError) {
          state.ssnError = "";
        }
      }
    },

    setMetadataField: (state, action) => {
      const { field, value } = action.payload;
      if (field in state && field !== "formData") {
        state[field] = value;
      }
    },

    setTermsAccepted: (state, action) => {
      const { termId, accepted, metadata } = action.payload;

      // Ensure terms_and_conditions exists
      const currentTerms = state.formData.terms_and_conditions 
        ? [...state.formData.terms_and_conditions] 
        : [];

      if (accepted) {
        const existingIndex = currentTerms.findIndex(
          (item) => item.id === termId
        );
        if (existingIndex === -1) {
          // Add new term
          currentTerms.push({
            id: termId,
            accepted_at: metadata?.accepted_at || new Date().toISOString(),
            ip: metadata?.ip || "Unknown",
            location: metadata?.location || "Unknown",
            device: metadata?.device || "Unknown",
          });
        }
        // Update state with new array
        state.formData.terms_and_conditions = currentTerms;
      } else {
        // Remove term
        const filteredTerms = currentTerms.filter((item) => item.id !== termId);
        // Update state with new array
        state.formData.terms_and_conditions = filteredTerms;
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
      state.currentStep = Math.max(
        0,
        Math.min(state.totalSteps - 1, action.payload)
      );
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
      Object.keys(formikValues).forEach((key) => {
        if (key in state.formData) {
          state.formData[key] = formikValues[key];
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
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

export const selectFormData = (state) => state.signup.formData;
export const selectNationalities = (state) => state.signup.nationalities;
export const selectIdDocumentTypes = (state) => state.signup.idDocumentTypes;
export const selectGenders = (state) => state.signup.genders;
export const selectTermsConditions = (state) => state.signup.termsConditions;

export const selectTermsLoading = (state) => state.signup.termsLoading;
export const selectTermsError = (state) => state.signup.termsError;
export const selectTermsFetched = (state) => state.signup.termsFetched;
export const selectNationalitiesLoading = (state) =>
  state.signup.nationalitiesLoading;
export const selectNationalitiesError = (state) =>
  state.signup.nationalitiesError;
export const selectIdDocumentTypesLoading = (state) =>
  state.signup.idDocumentTypesLoading;
export const selectIdDocumentTypesError = (state) =>
  state.signup.idDocumentTypesError;
export const selectGendersLoading = (state) => state.signup.gendersLoading;
export const selectGendersError = (state) => state.signup.gendersError;
export const selectSubmissionLoading = (state) =>
  state.signup.submissionLoading;
export const selectSubmissionError = (state) => state.signup.submissionError;

export const selectAcceptedTerms = (state) =>
  state.signup.formData.terms_and_conditions;
export const selectShowSSNField = (state) => state.signup.showSSNField;
export const selectHasNamedAccounts = (state) => state.signup.hasNamedAccounts;
export const selectIsUSDSelected = (state) => state.signup.isUSDSelected;
export const selectSSNError = (state) => state.signup.ssnError;
export const selectShowSSNConfirmation = (state) =>
  state.signup.showSSNConfirmation;

export const selectValidationErrors = (state) => state.signup.validationErrors;
export const selectIsFormValid = (state) => state.signup.isFormValid;
export const selectCurrentStep = (state) => state.signup.currentStep;
export const selectFormProgress = (state) => state.signup.formProgress;
export const selectTotalSteps = (state) => state.signup.totalSteps;

export const selectIsInitializing = (state) =>
  state.signup.nationalitiesLoading ||
  state.signup.idDocumentTypesLoading ||
  state.signup.gendersLoading ||
  state.signup.termsLoading;

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