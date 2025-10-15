// institutionRegistrationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../services/api";
import { handleApiError } from "../authThunk";
import { getBearerToken } from "../../../services/api";

// institutionRegistrationSlice.js - Add these async thunks

export const fetchTermsAndConditions = createAsyncThunk(
  "institutionRegistration/fetchTermsAndConditions",
  async (partnerId, { dispatch, rejectWithValue }) => {
    try {
      const token = await getBearerToken();
      const response = await api.get(`/terms-and-conditions/${partnerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching terms:", error);
      return rejectWithValue(handleApiError(error, dispatch));
    }
  }
);

export const validateBusinessAlias = createAsyncThunk(
  "institutionRegistration/validateBusinessAlias",
  async (businessAlias, { dispatch, rejectWithValue }) => {
    try {
      const token = await getBearerToken();
      const response = await api.post(
        "/validate-business-alias",
        { business_alias: businessAlias },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error, dispatch));
    }
  }
);

export const fetchIndustryTypesWithNAICS = createAsyncThunk(
  "institutionRegistration/fetchIndustryTypesWithNAICS",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const token = await getBearerToken();
      const response = await api.get("/industry-types-with-naics", {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error, dispatch));
    }
  }
);

export const fetchGenders = createAsyncThunk(
  "institutionRegistration/fetchGenders",
  async () => {
    try {
      const response = await api.get("/genders");
      // Handle different response structures
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        console.error("Unexpected genders response structure:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Error fetching genders:", error);
      throw error;
    }
  }
);

export const fetchNationalities = createAsyncThunk(
  "institutionRegistration/fetchNationalities",
  async () => {
    try {
      const response = await api.get("/nationalities");
      // Handle different response structures
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        console.error(
          "Unexpected nationalities response structure:",
          response.data
        );
        return [];
      }
    } catch (error) {
      console.error("Error fetching nationalities:", error);
      throw error;
    }
  }
);

export const fetchCountries = createAsyncThunk(
  "institution/fetchCountries",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const token = await getBearerToken();
      const response = await api.get("/countries", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data; // Note: this returns response.data.data to match the structure
    } catch (error) {
      return rejectWithValue(handleApiError(error, dispatch));
    }
  }
);

export const fetchInstitutionData = createAsyncThunk(
  "institution/fetchData",
  async (_, { getState, dispatch, rejectWithValue }) => {
    const state = getState().institutionRegistration;

    // Prevent multiple simultaneous fetches
    if (state.isFetchingData || state.dataFetched) {
      return;
    }

    dispatch(setFetching(true));

    try {
      const results = await Promise.allSettled([
        dispatch(fetchNAICSCodes()),
        dispatch(fetchBusinessTypes()),
        dispatch(fetchIndustryTypes()),
        dispatch(fetchGenders()),
        dispatch(fetchNationalities()),
        dispatch(fetchCountries()),
        dispatch(fetchOwnerRoles()),
        dispatch(fetchDocumentTypes()),
        dispatch(fetchIdDocumentTypes()),
      ]);

      // Check if any requests failed
      const failedRequests = results.filter(
        (result) => result.status === "rejected"
      );

      if (failedRequests.length > 0) {
        console.error("Failed requests:", failedRequests);
        return rejectWithValue("Some data failed to load");
      }

      dispatch(setDataFetched(true));
      return { success: true };
    } catch (error) {
      return rejectWithValue(handleApiError(error, dispatch));
    } finally {
      dispatch(setFetching(false));
    }
  }
);

// Async thunks for institution registration
export const validateInstitutionStep = createAsyncThunk(
  "institution/validateStep",
  async (data, { dispatch, rejectWithValue }) => {
    try {
      const token = await getBearerToken();
      const response = await api.post(
        "/customers/validate-institution-onboarding",
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      console.log("API Error:", error.response?.data);

      // Extract and format the validation errors for the popup
      if (
        error.response?.data?.status === "error" &&
        error.response.data.message &&
        typeof error.response.data.message === "object"
      ) {
        const errorMessages = [];

        Object.values(error.response.data.message).forEach((fieldErrors) => {
          if (Array.isArray(fieldErrors)) {
            errorMessages.push(...fieldErrors);
          } else if (typeof fieldErrors === "string") {
            errorMessages.push(fieldErrors);
          }
        });

        console.log("Extracted error messages:", errorMessages);
        // Return the array of error messages directly
        return rejectWithValue(errorMessages);
      }

      // For other types of errors, use the standard error handler
      const handledError = handleApiError(error, dispatch);
      console.log("Handled error:", handledError);
      return rejectWithValue(handledError);
    }
  }
);

export const submitInstitutionForm = createAsyncThunk(
  "institution/submitRegistration",
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      console.log("=== API DEBUG: Starting submitInstitutionForm ===");
      console.log("Form data being sent:", formData);

      const token = await getBearerToken();
      console.log("Token retrieved:", token ? "Yes" : "No");

      const response = await api.post(
        "/customers/sign-up-institution",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("=== FULL API RESPONSE ===");
      console.log("Response status:", response.status);
      console.log("Response status text:", response.statusText);
      console.log("Response headers:", response.headers);
      console.log("Response data:", response.data);
      console.log("Response data type:", typeof response.data);
      console.log(
        "Response data length:",
        response.data ? Object.keys(response.data).length : 0
      );

      // Check if response.data is empty
      if (!response.data || Object.keys(response.data).length === 0) {
        console.warn(
          "⚠️ API returned empty response. This might be expected behavior."
        );
        // Return a success object anyway since the request didn't fail
        return { success: true, message: "Step completed successfully" };
      }

      return response.data;
    } catch (error) {
      console.error("API Error details:", error);
      console.log("Error status:", error.response?.status);
      console.log("Error data:", error.response?.data);
      return rejectWithValue(handleApiError(error, dispatch));
    }
  }
);

export const fetchNAICSCodes = createAsyncThunk(
  "institution/fetchNAICSCodes",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const token = await getBearerToken();
      const response = await api.get("/get-naice-code", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error, dispatch));
    }
  }
);

export const fetchBusinessTypes = createAsyncThunk(
  "institution/fetchBusinessTypes",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      console.log("Fetching business types...");
      const token = await getBearerToken();
      console.log("Token retrieved:", token ? "Yes" : "No");

      // Fix the endpoint - this might be the correct one
      const response = await api.get("/get-business-types", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Business types response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching business types:", error);

      // Try alternative endpoint if the first one fails
      try {
        const token = await getBearerToken();
        const response = await api.get("/business-types", {
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
      } catch (fallbackError) {
        return rejectWithValue(handleApiError(error, dispatch));
      }
    }
  }
);

export const fetchIndustryTypes = createAsyncThunk(
  "institution/fetchIndustryTypes",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const token = await getBearerToken();
      const response = await api.get("/industry-types", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error, dispatch));
    }
  }
);

export const fetchOwnerRoles = createAsyncThunk(
  "institution/fetchOwnerRoles",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const token = await getBearerToken();
      const response = await api.get("/owner-roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error, dispatch));
    }
  }
);

export const fetchDocumentTypes = createAsyncThunk(
  "institution/fetchDocumentTypes",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const token = await getBearerToken();
      const response = await api.get("/institution-upload-document-types", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error, dispatch));
    }
  }
);

export const fetchIdDocumentTypes = createAsyncThunk(
  "institution/fetchIdDocumentTypes",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const token = await getBearerToken();
      const response = await api.get("/all-id-document-types", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error, dispatch));
    }
  }
);

export const uploadFile = createAsyncThunk(
  "institution/uploadFile",
  async ({ documentId, file }, { dispatch, rejectWithValue }) => {
    try {
      const token = await getBearerToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", documentId);

      const response = await api.post("/upload-document", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      return { documentId, fileData: response.data };
    } catch (error) {
      return rejectWithValue(handleApiError(error, dispatch));
    }
  }
);

// CORRECTED: Renamed async thunk to avoid conflict
export const syncControllerDataForm = createAsyncThunk(
  "institutionRegistration/syncControllerData",
  async (responsiblePersonData, { dispatch, rejectWithValue }) => {
    try {
      console.log(
        "Syncing controller data with responsible person data:",
        responsiblePersonData
      );

      // Validate input data
      if (!responsiblePersonData || typeof responsiblePersonData !== "object") {
        throw new Error("Invalid responsible person data provided");
      }

      // Create a mapping of responsible person fields to controller fields
      const fieldMapping = {
        // Basic information
        first_name: "controller_first_name",
        last_name: "controller_last_name",
        email: "controller_email",
        designation: "controller_designation",

        // Contact information
        mobile_number: "controller_phone",
        mobilenumber_countrycode: "controller_phone_countrycode",

        // Personal details
        nationality: "controller_nationality",
        resident_country: "controller_country",
        gender: "controller_gender",
        dob: "controller_dob",
        ssn: "controller_ssn",

        // Address information
        street_address_1: "controller_street_address_1",
        street_address_2: "controller_street_address_2",
        city: "controller_city",
        state: "controller_state",
        zip_code: "controller_zip_code",
        country: "controller_country_address",
      };

      const syncData = {};

      // Map the fields
      Object.entries(fieldMapping).forEach(([sourceField, targetField]) => {
        if (responsiblePersonData[sourceField] !== undefined) {
          syncData[targetField] = responsiblePersonData[sourceField];
        }
      });

      console.log("Controller sync data mapped:", syncData);
      return syncData;
    } catch (error) {
      console.error("Error in syncControllerData:", error);
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // Form data
  currentStep: 1,
  formData: {
    // Business Information
    institution_name: "",
    registration_number: "",
    ein: "",
    naice_code: "",
    mobile_number: "",
    business_type: "",
    registered_address_street_country: "",
    registered_address_street_state: "",
    registered_address_street_city: "",
    registered_address_street_1: "",
    registered_address_street_2: "",
    registered_address_street_zip: "",
    date_incorporation: "",
    industry_type: "",
    country_of_registration: "",
    country_of_operation: "",
    operating_countries: [],
    business_alias: "",
    company_phone_number: "",
    companyphone_countrycode: "",
    business_email: "",
    business_website: "",

    // Responsible Person Information
    first_name: "",
    middleName: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
    resident_country: "",
    mobilenumber_countrycode: "",
    mobile_number: "",
    nationality: "",
    country: "",
    state: "",
    city: "",
    street_address_1: "",
    street_address_2: "",
    zip_code: "",
    house_number: "",
    gender: "",
    dob: "",
    designation: "",
    ssn: "",

    // Controller Information
    controller_first_name: "",
    controller_middle_name: "",
    controller_last_name: "",
    controller_email: "",
    controller_password: "",
    controller_confirm_password: "",
    controller_country: "",
    controller_phone_countrycode: "",
    controller_phone: "",
    controller_nationality: "",
    controller_country_address: "",
    controller_state: "",
    controller_city: "",
    controller_street_address_1: "",
    controller_street_address_2: "",
    controller_zip_code: "",
    controller_house_number: "",
    controller_gender: "",
    controller_dob: "",
    controller_designation: "",
    controller_ssn: "",

    // Owner Details
    owner_details: [
      {
        owner_type: "individual",
        owner_first_name: "",
        owner_middle_name: "",
        owner_last_name: "",
        owner_email: "",
        owner_phone_number: "",
        owner_phone_number_country_code: "",
        owner_country_id: "",
        owner_role_id: "",
        owner_needs_access_to_system: "",
        ownership_percentage: 0,
        owner_dob: "",
        ssn: "",
        doc_type: "",
        doc_id: "",
        doc_country: "",
        doc_state: "",
        owner_if: "no",
      },
    ],

    // Documents
    user_image: {},

    // Additional fields
    doc_type: "",
    doc_id: "",
    doc_country: "",
    doc_state: "",
    documentType: "",
    idDocumentTypeOther: "",
    ssnIssuedState: "NY",
    issuingCountryCode: "US",
    documentNumber: "",
    idIssuedDate: "",
  },

  // UI state
  loading: false,
  error: null,
  showPopup: false,
  errorMessage: "",

  // Dynamic field visibility
  showEINField: false,
  showNAICSField: false,
  showBusinessTypeField: false,
  showIndustryTypeField: false,
  showBusinessAliasField: false,
  showBusinessEmailField: false,
  showBusinessWebsiteField: false,
  showCompanyPhoneFields: false,
  showSSNField: false,

  // Data from APIs
  naicsCodes: [],
  businessTypes: [],
  industryTypes: [],
  genders: [],
  nationalities: [],
  countries: [],
  roles: [],
  documents: [],
  idDocumentTypes: [],
  termsConditions: [],

  // Selected values
  selectedCountry: null,
  selectedCurrency: null,
  selectedIndustry: null,

  // Ownership management - MOVE TO ROOT LEVEL
  ownershipValidation: {
    totalPercentage: 0,
    meetsMinimum: false,
    isValid: false,
  },
  totalOwnershipPercentage: 0,
  isOwner: "no",

  // Password visibility
  showPassword: false,
  showConfirmPassword: false,
  isFetchingData: false,
  dataFetched: false,

  // NEW: Missing feature state - MOVE TO ROOT LEVEL
  locationState: {},
  accountType: "pooled",
  packageCurrencies: [],
  kycVerify: true,
  documentUpload: true,
  ownerAdd: true,
  referralCode: "",
  agentCode: "",
  ssnRequired: false,
  einRequired: false,
  isNamedAccount: false,
  defaultCurrency: null,
  businessAlias: "",
  isWhiteLabelledPartner: false,
  whiteLabelledPartnerId: null,
  partnerPackageModule: false,
  controllerSynced: false,
  showUSDFields: false,
};

const institutionRegistrationSlice = createSlice({
  name: "institutionRegistration",
  initialState,
  reducers: {
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload;
    },
    setLocationStateData: (state, action) => {
      state.locationState = action.payload;
    },

    setAccountType: (state, action) => {
      state.accountType = action.payload;
      state.isNamedAccount = action.payload === "named";
    },

    setPackageCurrencies: (state, action) => {
      state.packageCurrencies = action.payload;
    },

    setKycRequirements: (state, action) => {
      state.kycVerify = action.payload;
    },

    setDocumentRequirements: (state, action) => {
      state.documentUpload = action.payload;
    },

    setOwnerAdd: (state, action) => {
      state.ownerAdd = action.payload;
    },

    setReferralData: (state, action) => {
      state.referralCode = action.payload.referralCode;
      state.agentCode = action.payload.agentCode;
    },

    setSsnRequired: (state, action) => {
      state.ssnRequired = action.payload;
    },

    setEinRequired: (state, action) => {
      state.einRequired = action.payload;
    },

    setBusinessAlias: (state, action) => {
      state.formData.business_alias = action.payload;
    },

    setTermsAgreement: (state, action) => {
      state.formData.terms_agreed = action.payload;
    },

    setWhiteLabelInfo: (state, action) => {
      state.isWhiteLabelledPartner = action.payload.isWhiteLabelledPartner;
      state.whiteLabelledPartnerId = action.payload.whiteLabelledPartnerId;
      state.partnerPackageModule = action.payload.partnerPackageModule;
    },

    // CORRECTED: Renamed reducer to avoid conflict with async thunk
    syncControllerDataFromForm: (state, action) => {
      const userData = action.payload;

      // Sync all controller fields with responsible person data
      state.formData.controller_first_name = userData.first_name || "";
      state.formData.controller_last_name = userData.last_name || "";
      state.formData.controller_email = userData.email || "";
      state.formData.controller_phone = userData.mobile_number || "";
      state.formData.controller_phone_countrycode =
        userData.mobilenumber_countrycode || "";
      state.formData.controller_nationality = userData.nationality || "";
      state.formData.controller_country = userData.resident_country || "";
      state.formData.controller_designation = userData.designation || "";
      state.formData.controller_gender = userData.gender || "";
      state.formData.controller_dob = userData.dob || "";
      state.formData.controller_street_address_1 =
        userData.street_address_1 || "";
      state.formData.controller_street_address_2 =
        userData.street_address_2 || "";
      state.formData.controller_city = userData.city || "";
      state.formData.controller_state = userData.state || "";
      state.formData.controller_zip_code = userData.zip_code || "";
      state.formData.controller_country_address = userData.country || "";
      state.formData.controller_ssn = userData.ssn || "";

      state.controllerSynced = true;

      console.log("Controller data synced successfully");
    },

    validateOwnershipPercentage: (state) => {
      // FIX: Access ownershipValidation from the root state, not formData
      const total = state.formData.owner_details.reduce(
        (sum, owner) => sum + (parseFloat(owner.ownership_percentage) || 0),
        0
      );

      // FIX: Initialize ownershipValidation if it doesn't exist
      if (!state.ownershipValidation) {
        state.ownershipValidation = {
          totalPercentage: 0,
          meetsMinimum: false,
          isValid: false,
        };
      }

      state.ownershipValidation.totalPercentage = total;
      state.ownershipValidation.meetsMinimum =
        state.formData.owner_details.some(
          (owner) => (parseFloat(owner.ownership_percentage) || 0) >= 25
        );
      state.ownershipValidation.isValid =
        Math.abs(total - 100) < 0.01 && state.ownershipValidation.meetsMinimum; // Allow for floating point precision
    },

    // Enhanced field visibility based on business rules
    updateFieldVisibility: (state, action) => {
      const { country, currency, accountType } = action.payload;

      // Currency-based visibility
      state.showUSDFields = currency === "USD";

      // Country-based visibility
      state.showSSNField = country === "United States";
      state.showEINField = country === "United States" && state.einRequired;

      // Account type based visibility
      state.showBusinessAliasField = accountType === "named";

      // Business type/NAICS field logic
      state.showNAICSField = country === "United States";
      state.showBusinessTypeField = true; // Always show for now
    },

    setFormField: (state, action) => {
      const { field, value } = action.payload;
      state.formData[field] = value;
    },
    setOwnerField: (state, action) => {
      const { index, field, value } = action.payload;
      if (state.formData.owner_details[index]) {
        state.formData.owner_details[index][field] = value;
      }
    },
    addOwner: (state) => {
      state.formData.owner_details.push({
        id: Date.now(),
        owner_type: "individual",
        owner_first_name: "",
        owner_middle_name: "",
        owner_last_name: "",
        owner_email: "",
        owner_phone_number: "",
        owner_phone_number_country_code: "",
        owner_country_id: "",
        owner_role_id: "",
        owner_needs_access_to_system: "",
        ownership_percentage: 0,
        owner_dob: "",
        ssn: "",
        doc_type: "",
        doc_id: "",
        doc_country: "",
        doc_state: "",
        owner_if: "no",
      });
    },
    removeOwner: (state, action) => {
      const index = action.payload;
      if (state.formData.owner_details.length > 1) {
        state.formData.owner_details.splice(index, 1);
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setShowPopup: (state, action) => {
      state.showPopup = action.payload;
    },
    setErrorMessage: (state, action) => {
      state.errorMessage = action.payload;
    },
    setFieldVisibility: (state, action) => {
      const { field, visible } = action.payload;
      state[field] = visible;
    },
    setSelectedCountry: (state, action) => {
      state.selectedCountry = action.payload;
    },
    setSelectedCurrency: (state, action) => {
      state.selectedCurrency = action.payload;
    },
    setSelectedIndustry: (state, action) => {
      state.selectedIndustry = action.payload;
    },
    updateTotalOwnership: (state) => {
      state.totalOwnershipPercentage = state.formData.owner_details.reduce(
        (total, owner) => total + (owner.ownership_percentage || 0),
        0
      );
    },
    setIsOwner: (state, action) => {
      state.isOwner = action.payload;
    },
    togglePasswordVisibility: (state) => {
      state.showPassword = !state.showPassword;
    },
    toggleConfirmPasswordVisibility: (state) => {
      state.showConfirmPassword = !state.showConfirmPassword;
    },
    initializeInstitutionSignup: (state, action) => {
      const locationState = action.payload || {};

      // Initialize form data with any values from location state
      if (locationState.institution_name) {
        state.formData.institution_name = locationState.institution_name;
      }
      if (locationState.business_email) {
        state.formData.business_email = locationState.business_email;
      }
      if (locationState.email) {
        state.formData.email = locationState.email;
      }

      // Reset other state if needed
      state.currentStep = 1;
      state.loading = false;
      state.error = null;
      state.showPopup = false;
    },
    setFile: (state, action) => {
      const { documentId, fileData } = action.payload;
      state.formData.user_image[documentId] = fileData;
    },
    setFetching: (state, action) => {
      state.isFetchingData = action.payload;
    },
    setDataFetched: (state, action) => {
      state.dataFetched = action.payload;
    },
    resetForm: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTermsAndConditions.fulfilled, (state, action) => {
        state.termsConditions = action.payload;
      })
      .addCase(fetchTermsAndConditions.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(validateBusinessAlias.fulfilled, (state, action) => {
        state.businessAliasValid = action.payload.valid;
      })
      .addCase(fetchIndustryTypesWithNAICS.fulfilled, (state, action) => {
        state.industryTypes = action.payload;
      })

      // Fetch genders
      .addCase(fetchGenders.fulfilled, (state, action) => {
        console.log("Genders fulfilled payload:", action.payload);
        state.genders = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchGenders.rejected, (state, action) => {
        console.error("Genders fetch failed:", action.payload);
        state.genders = [];
      })
      // Fetch nationalities
      .addCase(fetchNationalities.fulfilled, (state, action) => {
        console.log("Nationalities fulfilled payload:", action.payload);
        state.nationalities = Array.isArray(action.payload)
          ? action.payload
          : [];
      })
      .addCase(fetchNationalities.rejected, (state, action) => {
        console.error("Nationalities fetch failed:", action.payload);
        state.nationalities = [];
      })
      // Fetch countries
      .addCase(fetchCountries.fulfilled, (state, action) => {
        state.countries = action.payload;
      })
      // Fetch institution data
      .addCase(fetchInstitutionData.pending, (state) => {
        state.isFetchingData = true;
      })
      .addCase(fetchInstitutionData.fulfilled, (state) => {
        state.isFetchingData = false;
      })
      .addCase(fetchInstitutionData.rejected, (state, action) => {
        state.isFetchingData = false;
        state.error = action.payload;
      })
      // Validate onboarding
      .addCase(validateInstitutionStep.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(validateInstitutionStep.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(validateInstitutionStep.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.showPopup = true;

        console.log("=== DEBUG: Validation rejected ===");
        console.log("Action payload:", action.payload);
        console.log("Action error:", action.error);
        console.log("Full action:", action);

        // Check if this is the country code error
        if (
          action.payload &&
          typeof action.payload === "string" &&
          action.payload.includes("Country code")
        ) {
          console.log("This is the country code error we're looking for!");
        }

        if (Array.isArray(action.payload)) {
          state.errorMessage = action.payload;
        } else if (typeof action.payload === "string") {
          state.errorMessage = action.payload;
        } else {
          state.errorMessage =
            "Validation failed. Please check all required fields.";
        }
      })
      // Submit registration
      .addCase(submitInstitutionForm.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitInstitutionForm.fulfilled, (state, action) => {
        state.loading = false;
        console.log("=== Redux: API call fulfilled ===");
        console.log("Action payload:", action.payload);

        // Handle empty responses as success
        if (
          !action.payload ||
          action.payload.success === true ||
          action.payload.success === undefined
        ) {
          state.currentStep += 1;
        } else if (action.payload.success === false) {
          state.error = action.payload.message || "Registration failed";
          state.showPopup = true;
          state.errorMessage = action.payload.message || "Registration failed";
        }
      })
      .addCase(submitInstitutionForm.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.showPopup = true;
        state.errorMessage = action.payload;
      })
      // Upload file
      .addCase(uploadFile.fulfilled, (state, action) => {
        const { documentId, fileData } = action.payload;
        state.formData.user_image[documentId] = fileData;
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.error = action.payload;
        state.showPopup = true;
        state.errorMessage = "File Upload Failed";
      })
      // Fetch NAICS codes
      .addCase(fetchNAICSCodes.fulfilled, (state, action) => {
        state.naicsCodes = action.payload;
      })
      // Fetch business types
      .addCase(fetchBusinessTypes.fulfilled, (state, action) => {
        state.businessTypes = action.payload;
      })
      // Fetch industry types
      .addCase(fetchIndustryTypes.fulfilled, (state, action) => {
        state.industryTypes = action.payload;
      })
      // Fetch owner roles
      .addCase(fetchOwnerRoles.fulfilled, (state, action) => {
        state.roles = action.payload;
      })
      // Fetch document types
      .addCase(fetchDocumentTypes.fulfilled, (state, action) => {
        state.documents = action.payload;
      })
      // Fetch ID document types
      .addCase(fetchIdDocumentTypes.fulfilled, (state, action) => {
        state.idDocumentTypes = action.payload.data;
      })
      // CORRECTED: Updated to use the renamed async thunk
      .addCase(syncControllerDataForm.fulfilled, (state, action) => {
        const syncData = action.payload;

        // Update form data with synced values
        Object.keys(syncData).forEach((key) => {
          if (state.formData.hasOwnProperty(key)) {
            state.formData[key] = syncData[key];
          }
        });

        state.controllerSynced = true;
        console.log("Controller data synced via async thunk");
      })
      .addCase(syncControllerDataForm.rejected, (state, action) => {
        state.error = action.payload;
        console.error("Controller data sync failed:", action.payload);
      });
  },
});

export const {
  setCurrentStep,
  setFormField,
  setOwnerField,
  addOwner,
  removeOwner,
  setLoading,
  setError,
  setShowPopup,
  setErrorMessage,
  setFieldVisibility,
  setSelectedCountry,
  setSelectedCurrency,
  setSelectedIndustry,
  updateTotalOwnership,
  setIsOwner,
  togglePasswordVisibility,
  toggleConfirmPasswordVisibility,
  setFile,
  setFetching,
  setDataFetched,
  resetForm,
  initializeInstitutionSignup,
  setLocationStateData,
  setAccountType,
  setPackageCurrencies,
  setKycRequirements,
  setDocumentRequirements,
  setOwnerAdd,
  setReferralData,
  setSsnRequired,
  setEinRequired,
  setBusinessAlias,
  setTermsAgreement,
  setWhiteLabelInfo,
  // CORRECTED: Use the renamed reducer action
  syncControllerDataFromForm,
  validateOwnershipPercentage,
  updateFieldVisibility,
} = institutionRegistrationSlice.actions;

// Selectors
export const selectInstitutionRegistration = (state) =>
  state.institutionRegistration;
export const selectCurrentStep = (state) =>
  state.institutionRegistration.currentStep;
export const selectFormData = (state) => state.institutionRegistration.formData;
export const selectLoading = (state) => state.institutionRegistration.loading;
export const selectError = (state) => state.institutionRegistration.error;
export const selectShowPopup = (state) =>
  state.institutionRegistration.showPopup;
export const selectErrorMessage = (state) =>
  state.institutionRegistration.errorMessage;
export const selectNAICSCodes = (state) =>
  state.institutionRegistration.naicsCodes;
export const selectBusinessTypes = (state) =>
  state.institutionRegistration.businessTypes;
export const selectIndustryTypes = (state) =>
  state.institutionRegistration.industryTypes;
export const selectGenders = (state) => state.institutionRegistration.genders;
export const selectNationalities = (state) =>
  state.institutionRegistration.nationalities;
export const selectCountries = (state) =>
  state.institutionRegistration.countries;
export const selectRoles = (state) => state.institutionRegistration.roles;
export const selectDocuments = (state) =>
  state.institutionRegistration.documents;
export const selectIdDocumentTypes = (state) =>
  state.institutionRegistration.idDocumentTypes;
export const selectTotalOwnership = (state) =>
  state.institutionRegistration.totalOwnershipPercentage;
export const selectIsOwner = (state) => state.institutionRegistration.isOwner;
export const selectShowPassword = (state) =>
  state.institutionRegistration.showPassword;
export const selectShowConfirmPassword = (state) =>
  state.institutionRegistration.showConfirmPassword;
export const selectIsFetchingData = (state) =>
  state.institutionRegistration.isFetchingData;
export const selectDataFetched = (state) =>
  state.institutionRegistration.dataFetched;
export const selectLocationState = (state) =>
  state.institutionRegistration.locationState;
export const selectAccountType = (state) =>
  state.institutionRegistration.accountType;
export const selectPackageCurrencies = (state) =>
  state.institutionRegistration.packageCurrencies;
export const selectKycVerify = (state) =>
  state.institutionRegistration.kycVerify;
export const selectDocumentUpload = (state) =>
  state.institutionRegistration.documentUpload;
export const selectOwnerAdd = (state) => state.institutionRegistration.ownerAdd;
export const selectReferralCode = (state) =>
  state.institutionRegistration.referralCode;
export const selectAgentCode = (state) =>
  state.institutionRegistration.agentCode;
export const selectSsnRequired = (state) =>
  state.institutionRegistration.ssnRequired;
export const selectEinRequired = (state) =>
  state.institutionRegistration.einRequired;
export const selectIsNamedAccount = (state) =>
  state.institutionRegistration.isNamedAccount;
export const selectDefaultCurrency = (state) =>
  state.institutionRegistration.defaultCurrency;
export const selectTermsConditions = (state) =>
  state.institutionRegistration.termsConditions;
export const selectOwnershipValidation = (state) =>
  state.institutionRegistration.ownershipValidation;
export const selectControllerSynced = (state) =>
  state.institutionRegistration.controllerSynced;

export default institutionRegistrationSlice.reducer;
