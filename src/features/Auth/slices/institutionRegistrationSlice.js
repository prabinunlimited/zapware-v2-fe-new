// institutionRegistrationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../services/api";
import { handleApiError } from "../authThunk";
import { getBearerToken } from "../../../services/api";

// Utility validation functions
export const validateEIN = (ein, isNamedAccount) => {
  if (isNamedAccount && (!ein || ein.trim() === "")) {
    return "EIN is required";
  }
  if (ein && ein.trim() !== "") {
    const cleanEIN = ein.replace(/-/g, "");
    if (cleanEIN.length !== 9 || !/^\d+$/.test(cleanEIN)) {
      return "EIN must be 9 digits";
    }
  }
  return "";
};

export const validateSSN = (ssn, isNamedAccount, isUSSelected) => {
  if (isNamedAccount && isUSSelected) {
    if (!ssn || ssn.trim() === "") {
      return "SSN is required";
    }
    const cleanSSN = ssn.replace(/-/g, "");
    if (cleanSSN.length !== 9 || !/^\d+$/.test(cleanSSN)) {
      return "SSN must be 9 digits";
    }
  }
  return "";
};

export const validateBusinessAliasField = (businessAlias, isNamedAccount) => {
  if (isNamedAccount && (!businessAlias || businessAlias.trim() === "")) {
    return "Business alias is required";
  }
  return "";
};

export const validateBusinessEmailField = (businessEmail, isNamedAccount) => {
  if (isNamedAccount && (!businessEmail || businessEmail.trim() === "")) {
    return "Business email is required";
  }
  if (businessEmail && businessEmail.trim() !== "" && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(businessEmail)) {
    return "Invalid email format";
  }
  return "";
};

// Async Thunks
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
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        console.error("Unexpected nationalities response structure:", response.data);
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
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error, dispatch));
    }
  }
);

export const fetchInstitutionData = createAsyncThunk(
  "institution/fetchData",
  async (_, { getState, dispatch, rejectWithValue }) => {
    const state = getState().institutionRegistration;
    
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
        return rejectWithValue(errorMessages);
      }

      const handledError = handleApiError(error, dispatch);
      return rejectWithValue(handledError);
    }
  }
);

export const submitInstitutionForm = createAsyncThunk(
  "institution/submitRegistration",
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      const token = await getBearerToken();
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

      if (!response.data || Object.keys(response.data).length === 0) {
        return { success: true, message: "Step completed successfully" };
      }

      return response.data;
    } catch (error) {
      console.error("API Error details:", error);
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
      const token = await getBearerToken();
      const response = await api.get("/get-business-types", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
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

export const syncControllerDataForm = createAsyncThunk(
  "institutionRegistration/syncControllerData",
  async (responsiblePersonData, { dispatch, rejectWithValue }) => {
    try {
      const fieldMapping = {
        first_name: "controller_first_name",
        last_name: "controller_last_name",
        email: "controller_email",
        designation: "controller_designation",
        mobile_number: "controller_phone",
        mobilenumber_countrycode: "controller_phone_countrycode",
        nationality: "controller_nationality",
        resident_country: "controller_country",
        gender: "controller_gender",
        dob: "controller_dob",
        ssn: "controller_ssn",
        street_address_1: "controller_street_address_1",
        street_address_2: "controller_street_address_2",
        city: "controller_city",
        state: "controller_state",
        zip_code: "controller_zip_code",
        country: "controller_country_address",
      };

      const syncData = {};
      Object.entries(fieldMapping).forEach(([sourceField, targetField]) => {
        if (responsiblePersonData[sourceField] !== undefined) {
          syncData[targetField] = responsiblePersonData[sourceField];
        }
      });

      return syncData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Enhanced Initial State with ALL missing fields
const initialState = {
  // Form data
  currentStep: 1,
  formData: {
    institution_name: "",
    registration_number: "",
    ein: "",
    naice_code: "",
    mobile_number: "",
    business_type: "",
  registered_address_street_country: "", // Should store country name
  operating_countries: [],
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
    first_name: "",
    middleName: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
    resident_country: "",
    mobilenumber_countrycode: "",
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
    user_image: {},
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
  showUSDFields: false,

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

  // Ownership management
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

  // Location state and business logic
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

  // NEW: All missing individual field states
  searchTerm: "",
  businessInstitutionName: "",
  businessInstitutionEIN: "",
  businessInstitutionNAICS: "",
  businessInstitutionBusinessType: "",
  einError: "",
  businessTypeError: "",
  businessAliasError: "",
  businessEmailError: "",
  businessWebsiteError: "",
  companyPhoneError: "",
  companyPhoneCountryCodeError: "",
  
  // Responsible Person individual states
  responsiblePersonFirstName: "",
  responsiblePersonMiddleName: "",
  responsiblePersonLastName: "",
  responsiblePersonGender: "",
  responsiblePersonEmail: "",
  responsiblePersonPassword: "",
  responsiblePersonResidentCountry: "",
  responsiblePersonCountry: "",
  responsiblePersonCountryId: null,
  responsiblePersonMobileNumberCountryCode: "",
  responsiblePersonMobileCountryFlag: "",
  responsiblePersonMobileNumber: "",
  responsiblePersonNationality: "",
  responsiblePersonHouseNumber: "",
  responsiblePersonStreetAddress1: "",
  responsiblePersonCity: "",
  responsiblePersonState: "",
  responsiblePersonSelectedCountry: null,
  responsiblePersonZipCode: "",
  responsiblePersonDob: "",
  responsiblePersonSSN: "",
  
  // Controller individual states
  controllerFirstName: "",
  controllerMiddleName: "",
  controllerLastName: "",
  controllerGender: "",
  controllerEmail: "",
  controllerPassword: "",
  controllerResidentCountry: "",
  controllerCountry: "",
  controllerCountryId: null,
  controllerMobileNumberCountryCode: "",
  controllerMobileCountryFlag: "",
  controllerMobileNumber: "",
  controllerNationality: "",
  controllerHouseNumber: "",
  controllerStreetAddress1: "",
  controllerStreetAddress2: "",
  controllerCity: "",
  controllerState: "",
  controllerSelectedCountry: null,
  controllerZipCode: "",
  controllerDob: "",
  controllerDesignation: "",
  controllerConfirmPassword: "",
  controllerSsn: "",
  
  // Additional missing state
  ssnError: "",
  isUSSelected: false,
  isControllerUSSelected: false,
  ssnIssuedState: "NY",
  idIssuedCountryCode: "US",
  idIssuedDate: "",
  idDocumentNumber: "",
  selectedIdDocumentType: "",
  idDocumentTypeOther: "",
  isCancelling: false,
  isAddingOwner: false,
  
  // Terms and conditions
  termsData: [],
  businessAliasValid: null,
};

const institutionRegistrationSlice = createSlice({
  name: "institutionRegistration",
  initialState,
  reducers: {
    // Step management
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload;
    },

    // Location state processing
    setLocationStateData: (state, action) => {
      const locationState = action.payload;
      state.locationState = locationState;
      
      // Process service provider IDs to determine account type
      if (locationState.service_provide_ids) {
        const isNamed = locationState.service_provide_ids.some(
          id => typeof id === 'string' && id.includes('named')
        );
        state.isNamedAccount = isNamed;
        state.accountType = isNamed ? "named" : "pooled";
      }
      
      // Set requirements from location state
      state.ssnRequired = locationState.ssn_required === "Y";
      state.einRequired = locationState.ein_required === "Y";
      state.kycVerify = locationState.kyc_verify || [];
      state.documentUpload = locationState.document_upload || [];
      state.ownerAdd = locationState.owner_add || [];
      
      // Store other location data
      state.referralCode = locationState.referral_code;
      state.agentCode = locationState.agent_code;
      state.packageCurrencies = locationState.package_currencies || [];
    },

    // Dynamic field visibility
    updateDynamicFieldVisibility: (state, action) => {
      const { serviceProvideIds, accountOptions } = action.payload;
      
      const hasUSD = serviceProvideIds.some(idWithType => {
        const id = parseInt(idWithType.split("-")[0]);
        const account = accountOptions.find(opt => opt.service_provide_id === id);
        return account && account.currency === "USD";
      });

      state.showEINField = hasUSD;
      state.showBusinessTypeField = hasUSD;
      state.showNAICSField = hasUSD;
      state.showIndustryTypeField = !hasUSD;
      state.showBusinessAliasField = hasUSD;
      state.showBusinessEmailField = hasUSD;
      state.showBusinessWebsiteField = hasUSD;
      state.showCompanyPhoneFields = hasUSD;
      state.selectedCurrency = hasUSD ? "USD" : null;
      state.showUSDFields = hasUSD;
    },

    // Country-specific handlers
    setUSCountrySelected: (state, action) => {
      const isUS = action.payload;
      state.isUSSelected = isUS;
      if (isUS) {
        state.showSSNField = true;
      }
    },

    setControllerUSSelected: (state, action) => {
      const isUS = action.payload;
      state.isControllerUSSelected = isUS;
    },

    // Account type
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

    // Controller sync
    syncControllerDataFromForm: (state, action) => {
      const userData = action.payload;
      state.formData.controller_first_name = userData.first_name || "";
      state.formData.controller_last_name = userData.last_name || "";
      state.formData.controller_email = userData.email || "";
      state.formData.controller_phone = userData.mobile_number || "";
      state.formData.controller_phone_countrycode = userData.mobilenumber_countrycode || "";
      state.formData.controller_nationality = userData.nationality || "";
      state.formData.controller_country = userData.resident_country || "";
      state.formData.controller_designation = userData.designation || "";
      state.formData.controller_gender = userData.gender || "";
      state.formData.controller_dob = userData.dob || "";
      state.formData.controller_street_address_1 = userData.street_address_1 || "";
      state.formData.controller_street_address_2 = userData.street_address_2 || "";
      state.formData.controller_city = userData.city || "";
      state.formData.controller_state = userData.state || "";
      state.formData.controller_zip_code = userData.zip_code || "";
      state.formData.controller_country_address = userData.country || "";
      state.formData.controller_ssn = userData.ssn || "";
      state.controllerSynced = true;
    },

    // Ownership validation
    validateOwnershipPercentage: (state) => {
      const total = state.formData.owner_details.reduce(
        (sum, owner) => sum + (parseFloat(owner.ownership_percentage) || 0),
        0
      );

      if (!state.ownershipValidation) {
        state.ownershipValidation = {
          totalPercentage: 0,
          meetsMinimum: false,
          isValid: false,
        };
      }

      state.ownershipValidation.totalPercentage = total;
      state.ownershipValidation.meetsMinimum = state.formData.owner_details.some(
        (owner) => (parseFloat(owner.ownership_percentage) || 0) >= 25
      );
      state.ownershipValidation.isValid = Math.abs(total - 100) < 0.01 && state.ownershipValidation.meetsMinimum;
    },

    // Enhanced field visibility based on business rules
    updateFieldVisibility: (state, action) => {
      const { country, currency, accountType } = action.payload;
      state.showUSDFields = currency === "USD";
      state.showSSNField = country === "United States";
      state.showEINField = country === "United States" && state.einRequired;
      state.showBusinessAliasField = accountType === "named";
      state.showNAICSField = country === "United States";
      state.showBusinessTypeField = true;
    },

    // Form field management
    setFormField: (state, action) => {
      const { field, value } = action.payload;
      state.formData[field] = value;
    },

    // Individual field setters for all missing fields
    setBusinessInstitutionName: (state, action) => {
      state.businessInstitutionName = action.payload;
      state.formData.institution_name = action.payload;
    },
    
    setBusinessInstitutionEIN: (state, action) => {
      state.businessInstitutionEIN = action.payload;
      state.formData.ein = action.payload;
    },
    
    setBusinessInstitutionNAICS: (state, action) => {
      state.businessInstitutionNAICS = action.payload;
      state.formData.naice_code = action.payload;
    },
    
    setBusinessInstitutionBusinessType: (state, action) => {
      state.businessInstitutionBusinessType = action.payload;
      state.formData.business_type = action.payload;
    },

    // Responsible Person individual fields
    setResponsiblePersonFirstName: (state, action) => {
      state.responsiblePersonFirstName = action.payload;
      state.formData.first_name = action.payload;
    },
    
    setResponsiblePersonLastName: (state, action) => {
      state.responsiblePersonLastName = action.payload;
      state.formData.last_name = action.payload;
    },
    
    setResponsiblePersonEmail: (state, action) => {
      state.responsiblePersonEmail = action.payload;
      state.formData.email = action.payload;
    },
    
    setResponsiblePersonPassword: (state, action) => {
      state.responsiblePersonPassword = action.payload;
      state.formData.password = action.payload;
    },

    // Controller individual fields
    setControllerFirstName: (state, action) => {
      state.controllerFirstName = action.payload;
      state.formData.controller_first_name = action.payload;
    },
    
    setControllerLastName: (state, action) => {
      state.controllerLastName = action.payload;
      state.formData.controller_last_name = action.payload;
    },
    
    setControllerEmail: (state, action) => {
      state.controllerEmail = action.payload;
      state.formData.controller_email = action.payload;
    },

    // Error setters
    setEinError: (state, action) => {
      state.einError = action.payload;
    },
    
    setSsnError: (state, action) => {
      state.ssnError = action.payload;
    },
    
    setBusinessAliasError: (state, action) => {
      state.businessAliasError = action.payload;
    },

    // Owner management
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

    // UI state
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

    // Field visibility
    setFieldVisibility: (state, action) => {
      const { field, visible } = action.payload;
      state[field] = visible;
    },

    // Selection management
    setSelectedCountry: (state, action) => {
      state.selectedCountry = action.payload;
    },
    
    setSelectedCurrency: (state, action) => {
      state.selectedCurrency = action.payload;
    },
    
    setSelectedIndustry: (state, action) => {
      state.selectedIndustry = action.payload;
    },

    // Ownership
    updateTotalOwnership: (state) => {
      state.totalOwnershipPercentage = state.formData.owner_details.reduce(
        (total, owner) => total + (owner.ownership_percentage || 0),
        0
      );
    },
    
    setIsOwner: (state, action) => {
      state.isOwner = action.payload;
    },

    // Password visibility
    togglePasswordVisibility: (state) => {
      state.showPassword = !state.showPassword;
    },
    
    toggleConfirmPasswordVisibility: (state) => {
      state.showConfirmPassword = !state.showConfirmPassword;
    },

    // File management
    setFile: (state, action) => {
      const { documentId, fileData } = action.payload;
      state.formData.user_image[documentId] = fileData;
    },

    // Data fetching
    setFetching: (state, action) => {
      state.isFetchingData = action.payload;
    },
    
    setDataFetched: (state, action) => {
      state.dataFetched = action.payload;
    },

    // Terms and conditions
    setTermsData: (state, action) => {
      state.termsData = action.payload;
    },
    
    addTermAcceptance: (state, action) => {
      const { id, accepted_at, ip, location, device } = action.payload;
      const existingIndex = state.termsData.findIndex(item => item.id === id);
      if (existingIndex >= 0) {
        state.termsData = state.termsData.filter(item => item.id !== id);
      } else {
        state.termsData.push({ id, accepted_at, ip, location, device });
      }
    },

    // Additional missing field setters
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    
    setSsnIssuedState: (state, action) => {
      state.ssnIssuedState = action.payload;
    },
    
    setIdIssuedCountryCode: (state, action) => {
      state.idIssuedCountryCode = action.payload;
    },
    
    setIdIssuedDate: (state, action) => {
      state.idIssuedDate = action.payload;
    },
    
    setIdDocumentNumber: (state, action) => {
      state.idDocumentNumber = action.payload;
    },
    
    setSelectedIdDocumentType: (state, action) => {
      state.selectedIdDocumentType = action.payload;
    },
    
    setIdDocumentTypeOther: (state, action) => {
      state.idDocumentTypeOther = action.payload;
    },
    
    setIsCancelling: (state, action) => {
      state.isCancelling = action.payload;
    },
    
    setIsAddingOwner: (state, action) => {
      state.isAddingOwner = action.payload;
    },

    // Initialize
    initializeInstitutionSignup: (state, action) => {
      const locationState = action.payload || {};
      if (locationState.institution_name) {
        state.formData.institution_name = locationState.institution_name;
      }
      if (locationState.business_email) {
        state.formData.business_email = locationState.business_email;
      }
      if (locationState.email) {
        state.formData.email = locationState.email;
      }
      state.currentStep = 1;
      state.loading = false;
      state.error = null;
      state.showPopup = false;
    },

    resetForm: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Terms and Conditions
      .addCase(fetchTermsAndConditions.fulfilled, (state, action) => {
        state.termsConditions = action.payload;
      })
      .addCase(fetchTermsAndConditions.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Business Alias Validation
      .addCase(validateBusinessAlias.fulfilled, (state, action) => {
        state.businessAliasValid = action.payload.valid;
      })
      
      // Industry Types with NAICS
      .addCase(fetchIndustryTypesWithNAICS.fulfilled, (state, action) => {
        state.industryTypes = action.payload;
      })
      
      // Genders
      .addCase(fetchGenders.fulfilled, (state, action) => {
        state.genders = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchGenders.rejected, (state, action) => {
        state.genders = [];
      })
      
      // Nationalities
      .addCase(fetchNationalities.fulfilled, (state, action) => {
        state.nationalities = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchNationalities.rejected, (state, action) => {
        state.nationalities = [];
      })
      
      // Countries
      .addCase(fetchCountries.fulfilled, (state, action) => {
        state.countries = action.payload;
      })
      
      // Institution Data
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
      
      // Validate Step
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
        if (Array.isArray(action.payload)) {
          state.errorMessage = action.payload;
        } else if (typeof action.payload === "string") {
          state.errorMessage = action.payload;
        } else {
          state.errorMessage = "Validation failed. Please check all required fields.";
        }
      })
      
      // Submit Form
      .addCase(submitInstitutionForm.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitInstitutionForm.fulfilled, (state, action) => {
        state.loading = false;
        if (!action.payload || action.payload.success === true || action.payload.success === undefined) {
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
      
      // Upload File
      .addCase(uploadFile.fulfilled, (state, action) => {
        const { documentId, fileData } = action.payload;
        state.formData.user_image[documentId] = fileData;
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.error = action.payload;
        state.showPopup = true;
        state.errorMessage = "File Upload Failed";
      })
      
      // NAICS Codes
      .addCase(fetchNAICSCodes.fulfilled, (state, action) => {
        state.naicsCodes = action.payload;
      })
      
      // Business Types
      .addCase(fetchBusinessTypes.fulfilled, (state, action) => {
        state.businessTypes = action.payload;
      })
      
      // Industry Types
      .addCase(fetchIndustryTypes.fulfilled, (state, action) => {
        state.industryTypes = action.payload;
      })
      
      // Owner Roles
      .addCase(fetchOwnerRoles.fulfilled, (state, action) => {
        state.roles = action.payload;
      })
      
      // Document Types
      .addCase(fetchDocumentTypes.fulfilled, (state, action) => {
        state.documents = action.payload;
      })
      
      // ID Document Types
      .addCase(fetchIdDocumentTypes.fulfilled, (state, action) => {
        state.idDocumentTypes = action.payload.data;
      })
      
      // Controller Data Sync
      .addCase(syncControllerDataForm.fulfilled, (state, action) => {
        const syncData = action.payload;
        Object.keys(syncData).forEach((key) => {
          if (state.formData.hasOwnProperty(key)) {
            state.formData[key] = syncData[key];
          }
        });
        state.controllerSynced = true;
      })
      .addCase(syncControllerDataForm.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

// Export all actions
export const {
  setCurrentStep,
  setLocationStateData,
  updateDynamicFieldVisibility,
  setUSCountrySelected,
  setControllerUSSelected,
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
  syncControllerDataFromForm,
  validateOwnershipPercentage,
  updateFieldVisibility,
  setFormField,
  setBusinessInstitutionName,
  setBusinessInstitutionEIN,
  setBusinessInstitutionNAICS,
  setBusinessInstitutionBusinessType,
  setResponsiblePersonFirstName,
  setResponsiblePersonLastName,
  setResponsiblePersonEmail,
  setResponsiblePersonPassword,
  setControllerFirstName,
  setControllerLastName,
  setControllerEmail,
  setEinError,
  setSsnError,
  setBusinessAliasError,
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
  setTermsData,
  addTermAcceptance,
  setSearchTerm,
  setSsnIssuedState,
  setIdIssuedCountryCode,
  setIdIssuedDate,
  setIdDocumentNumber,
  setSelectedIdDocumentType,
  setIdDocumentTypeOther,
  setIsCancelling,
  setIsAddingOwner,
  initializeInstitutionSignup,
  resetForm,
} = institutionRegistrationSlice.actions;

// Selectors
export const selectInstitutionRegistration = (state) => state.institutionRegistration;
export const selectCurrentStep = (state) => state.institutionRegistration.currentStep;
export const selectFormData = (state) => state.institutionRegistration.formData;
export const selectLoading = (state) => state.institutionRegistration.loading;
export const selectError = (state) => state.institutionRegistration.error;
export const selectShowPopup = (state) => state.institutionRegistration.showPopup;
export const selectErrorMessage = (state) => state.institutionRegistration.errorMessage;
export const selectNAICSCodes = (state) => state.institutionRegistration.naicsCodes;
export const selectBusinessTypes = (state) => state.institutionRegistration.businessTypes;
export const selectIndustryTypes = (state) => state.institutionRegistration.industryTypes;
export const selectGenders = (state) => state.institutionRegistration.genders;
export const selectNationalities = (state) => state.institutionRegistration.nationalities;
export const selectCountries = (state) => state.institutionRegistration.countries;
export const selectRoles = (state) => state.institutionRegistration.roles;
export const selectDocuments = (state) => state.institutionRegistration.documents;
export const selectIdDocumentTypes = (state) => state.institutionRegistration.idDocumentTypes;
export const selectTotalOwnership = (state) => state.institutionRegistration.totalOwnershipPercentage;
export const selectIsOwner = (state) => state.institutionRegistration.isOwner;
export const selectShowPassword = (state) => state.institutionRegistration.showPassword;
export const selectShowConfirmPassword = (state) => state.institutionRegistration.showConfirmPassword;
export const selectIsFetchingData = (state) => state.institutionRegistration.isFetchingData;
export const selectDataFetched = (state) => state.institutionRegistration.dataFetched;
export const selectLocationState = (state) => state.institutionRegistration.locationState;
export const selectAccountType = (state) => state.institutionRegistration.accountType;
export const selectPackageCurrencies = (state) => state.institutionRegistration.packageCurrencies;
export const selectKycVerify = (state) => state.institutionRegistration.kycVerify;
export const selectDocumentUpload = (state) => state.institutionRegistration.documentUpload;
export const selectOwnerAdd = (state) => state.institutionRegistration.ownerAdd;
export const selectReferralCode = (state) => state.institutionRegistration.referralCode;
export const selectAgentCode = (state) => state.institutionRegistration.agentCode;
export const selectSsnRequired = (state) => state.institutionRegistration.ssnRequired;
export const selectEinRequired = (state) => state.institutionRegistration.einRequired;
export const selectIsNamedAccount = (state) => state.institutionRegistration.isNamedAccount;
export const selectDefaultCurrency = (state) => state.institutionRegistration.defaultCurrency;
export const selectTermsConditions = (state) => state.institutionRegistration.termsConditions;
export const selectOwnershipValidation = (state) => state.institutionRegistration.ownershipValidation;
export const selectControllerSynced = (state) => state.institutionRegistration.controllerSynced;
export const selectIsUSSelected = (state) => state.institutionRegistration.isUSSelected;
export const selectIsControllerUSSelected = (state) => state.institutionRegistration.isControllerUSSelected;
export const selectTermsData = (state) => state.institutionRegistration.termsData;
export const selectBusinessAliasValid = (state) => state.institutionRegistration.businessAliasValid;

export default institutionRegistrationSlice.reducer;