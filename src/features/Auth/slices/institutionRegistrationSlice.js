// institutionRegistrationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../services/api";

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
  if (
    businessEmail &&
    businessEmail.trim() !== "" &&
    !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(businessEmail)
  ) {
    return "Invalid email format";
  }
  return "";
};

export const validateOwnerSSN = (ssn, isNamedAccount, country) => {
  if (!isNamedAccount) return "";

  const isUSOwner = country === "United States";
  if (isUSOwner && (!ssn || ssn.trim() === "")) {
    return "SSN is required for US owners";
  }

  if (ssn && ssn.trim() !== "") {
    const cleanSSN = ssn.replace(/-/g, "");
    if (cleanSSN.length !== 9 || !/^\d+$/.test(cleanSSN)) {
      return "SSN must be 9 digits";
    }
  }

  return "";
};

export const validateOwnerDocuments = (owner, isNamedAccount, countries) => {
  const errors = {};
  const ownerCountry = countries.find(
    (c) => c.id === owner.owner_country_id,
  )?.name;
  const isUSOwner = ownerCountry === "United States";

  if (isNamedAccount && isUSOwner) {
    if (!owner.doc_type) errors.doc_type = "Document type is required";
    if (!owner.doc_id) errors.doc_id = "Document ID is required";

    if (
      (owner.doc_type === "id_passport" ||
        owner.doc_type === "doc_green_card") &&
      !owner.doc_country
    ) {
      errors.doc_country = "Document country is required";
    }

    if (
      (owner.doc_type === "id_state" ||
        owner.doc_type === "id_drivers_license") &&
      (!owner.doc_state || owner.doc_state.length !== 2)
    ) {
      errors.doc_state = "State code must be 2 letters";
    }
  }

  return errors;
};

export const validateBusinessAlias = createAsyncThunk(
  "institutionRegistration/validateBusinessAlias",
  async (businessAlias, { rejectWithValue }) => {
    try {
      const response = await api.post("/validate-business-alias", {
        business_alias: businessAlias,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || "Validation failed");
    }
  },
);

export const fetchIndustryTypesWithNAICS = createAsyncThunk(
  "institutionRegistration/fetchIndustryTypesWithNAICS",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/industry-types-with-naics");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch industry types");
    }
  },
);

export const fetchGenders = createAsyncThunk(
  "institutionRegistration/fetchGenders",
  async () => {
    try {
      const response = await api.get("/genders");

      // Handle different response structures
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        return [];
      }
    } catch (error) {
      throw error;
    }
  },
);

export const fetchNationalities = createAsyncThunk(
  "institutionRegistration/fetchNationalities",
  async () => {
    try {
      const response = await api.get("/nationalities");

      // Handle different response structures
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        return [];
      }
    } catch (error) {
      throw error;
    }
  },
);

export const fetchCountries = createAsyncThunk(
  "institution/fetchCountries",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/countries");
      return response.data?.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch countries");
    }
  },
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
        (result) => result.status === "rejected",
      );

      if (failedRequests.length > 0) {
        return rejectWithValue("Some data failed to load");
      }

      dispatch(setDataFetched(true));
      return { success: true };
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch institution data",
      );
    } finally {
      dispatch(setFetching(false));
    }
  },
);

export const validateInstitutionStep = createAsyncThunk(
  "institution/validateStep",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/customers/validate-institution-onboarding",
        data,
      );
      return response.data;
    } catch (error) {
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

      return rejectWithValue(error.message || "Validation failed");
    }
  },
);

export const submitInstitutionForm = createAsyncThunk(
  "institution/submitRegistration",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/customers/sign-up-institution",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (!response.data || Object.keys(response.data).length === 0) {
        return {
          success: true,
          message: "Registration completed successfully",
        };
      }

      return response.data;
    } catch (error) {
      // Enhanced error handling to preserve your API's error structure
      if (error.response?.data) {
        // Preserve the entire error response from your API
        // Your API returns: { status: "error", message: "...", data: "" }
        return rejectWithValue(error.response.data);
      }

      // Handle network errors or other issues
      return rejectWithValue({
        status: "error",
        message: error.message || "Submission failed",
        data: ""
      });
    }
  },
);

export const fetchNAICSCodes = createAsyncThunk(
  "institution/fetchNAICSCodes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/get-naice-code");

      // Format the response to match what your component expects
      const formattedNAICSCodes = response.data.map((item, index) => ({
        id: item.code, // Use the code as the ID
        code: item.code,
        description: `${item.category} - ${item.subcategory}`, // Combine category and subcategory
        category: item.category,
        subcategory: item.subcategory,
      }));

      return formattedNAICSCodes;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch NAICS codes");
    }
  },
);

export const fetchBusinessTypes = createAsyncThunk(
  "institution/fetchBusinessTypes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/get-silabusiness_type");

      const formattedBusinessTypes = response.data.map((item, index) => ({
        id: index + 1, // Generate IDs since the new API doesn't provide them
        name: item.name, // Use 'name' as the identifier
        label: item.label, // Use 'label' for display
      }));

      return formattedBusinessTypes;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch business types");
    }
  },
);

export const fetchIndustryTypes = createAsyncThunk(
  "institutionRegistration/fetchIndustryTypes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/industry-types");

      // Handle different response structures
      let industryTypesData = [];

      if (Array.isArray(response.data)) {
        industryTypesData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        industryTypesData = response.data.data;
      } else if (
        response.data?.industry_types &&
        Array.isArray(response.data.industry_types)
      ) {
        industryTypesData = response.data.industry_types;
      } else {
        industryTypesData = [];
      }

      return industryTypesData;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch industry types");
    }
  },
);

export const fetchInstitutionTypes = createAsyncThunk(
  "institutionRegistration/fetchInstitutionTypes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/institution-types");

      if (!Array.isArray(response.data)) {
        throw new Error("Invalid response format");
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch institution types",
      );
    }
  },
);

export const fetchOwnerRoles = createAsyncThunk(
  "institution/fetchOwnerRoles",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/owner-roles");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch owner roles");
    }
  },
);

export const fetchDocumentTypes = createAsyncThunk(
  "institution/fetchDocumentTypes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/institution-upload-document-types");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch document types");
    }
  },
);

export const fetchIdDocumentTypes = createAsyncThunk(
  "institution/fetchIdDocumentTypes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/all-id-document-types");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch ID document types",
      );
    }
  },
);

export const fetchEmployeesNumberTypes = createAsyncThunk(
  "institutionRegistration/fetchEmployeesNumberTypes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/employees-number-types");

      if (response.data?.status === "success" && response.data?.data?.lists) {
        return response.data.data.lists;
      }

      return [];
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch employees number types");
    }
  },
);

export const fetchDirectorRoles = createAsyncThunk(
  "institutionRegistration/fetchDirectorRoles",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/director-roles");

      // Handle the actual response structure: { status, message, data: { lists } }
      if (response.data?.status === "success" && response.data?.data?.lists) {
        return response.data.data.lists;
      }

      // Fallback for other possible structures
      if (Array.isArray(response.data)) {
        return response.data;
      }

      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      return [];
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch director roles");
    }
  }
);

export const fetchTermsAndConditions = createAsyncThunk(
  "institutionRegistration/fetchTermsAndConditions",
  async (_, { rejectWithValue }) => {
    try {
      const isWhiteLabelledPartner = localStorage.getItem(
        "iswhitelabelledpartner",
      );
      const whiteLabelledPartnerId = localStorage.getItem(
        "whitelabelledpartnerid",
      );

      const partnerId =
        isWhiteLabelledPartner === "1" ? whiteLabelledPartnerId : "0";

      const response = await api.get(`/terms-by-partner/${partnerId}`);

      // Handle various response structures
      const termsData = response.data || response;

      if (termsData && Array.isArray(termsData.terms)) {
        return termsData.terms;
      } else if (Array.isArray(termsData)) {
        return termsData;
      } else if (termsData && typeof termsData === "object") {
        const termsArray = Object.values(termsData).find(Array.isArray);
        return termsArray || [];
      } else {
        return [];
      }
    } catch (error) {
      // Don't block registration if terms fail to load
      return [];
    }
  },
);

export const syncControllerDataForm = createAsyncThunk(
  "institutionRegistration/syncControllerData",
  async (responsiblePersonData, { rejectWithValue }) => {
    try {
      const fieldMapping = {
        first_name: "controller_first_name",
        middle_name: "controller_middle_name",
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
  },
);

export const uploadFile = createAsyncThunk(
  "institutionRegistration/uploadFile",
  async ({ file, documentType, ownerIndex = null }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", documentType);

      if (ownerIndex !== null) {
        formData.append("owner_index", ownerIndex);
      }

      const response = await api.post("/upload-document", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return {
        ...response.data,
        documentType,
        ownerIndex,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "File upload failed",
      );
    }
  },
);

export const fetchInstitutionAccountTypes = createAsyncThunk(
  "institutionRegistration/fetchInstitutionAccountTypes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/institution-account-types");

      // Handle the response structure
      if (response.data?.status === "success" && response.data?.data) {
        return response.data.data.lists;
      }

      if (Array.isArray(response.data)) {
        return response.data;
      }

      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      return [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch institution account types"
      );
    }
  }
);

// Enhanced Initial State with ALL missing fields including owner_if and country_flag
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
    business_alias: "",
    company_phone_number: "",
    companyphone_countrycode: "",
    business_email: "",
    business_website: "",
    first_name: "",
    middle_name: "",
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
    controller_gender: "",
    controller_dob: "",
    controller_designation: "",
    controller_ssn: "",
    // Terms and Conditions
    terms_agreed: false,
    terms_and_conditions: [],
    owner_details: [
      {
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
        owner_if: "", // ← CRITICAL: First owner should be "yes"
        country_flag: "", // ← Added this for phone number display
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
    is_controller: "",
    institutionTypes: [],
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
    hasValidOwners: false,
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
  employeesNumberTypes: [],
  employeesNumber: "",
  employeesNumberLoading: false,
  directorRoles: [],
  directorRolesLoading: false,
  institutionAccountTypes: [],
  institutionAccountTypesLoading: false,
  selectedInstitutionAccountTypeId: null,
  institutionAccountTypeError: null,

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
  termsLoading: false,
  termsError: null,
  termsFetched: false,
};

const institutionRegistrationSlice = createSlice({
  name: "institutionRegistration",
  initialState,
  reducers: {
    // Step management
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload;
    },
    setDirectorsRoles: (state, action) => {
      state.directorsRoles = action.payload;
    },

    // Location state processing
    setLocationStateData: (state, action) => {
      const locationState = action.payload;
      state.locationState = locationState;

      // Process service provider IDs to determine account type
      if (locationState.service_provide_ids) {
        const isNamed = locationState.service_provide_ids.some(
          (id) => typeof id === "string" && id.includes("named"),
        );
        state.isNamedAccount = isNamed;
        state.accountType = isNamed ? "named" : "pooled";

        // FIX: Set NAICS field visibility for named accounts
        state.showNAICSField = isNamed;
        state.showEINField = isNamed;
        state.showBusinessAliasField = isNamed;
        state.showBusinessTypeField = isNamed;
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

      const hasUSD = serviceProvideIds.some((idWithType) => {
        const id = parseInt(idWithType.split("-")[0]);
        const account = accountOptions.find(
          (opt) => opt.service_provide_id === id,
        );
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

      // FIX: Set field visibility based on account type
      state.showNAICSField = action.payload === "named";
      state.showEINField = action.payload === "named";
      state.showBusinessAliasField = action.payload === "named";
      state.showBusinessTypeField = action.payload === "named";
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

    setEmployeesNumber: (state, action) => {
      state.employeesNumber = action.payload;
      state.formData.employees_number = action.payload;
    },

    setDirectorRoleId: (state, action) => {
      state.formData.director_role_id = action.payload;
    },

    setSelectedInstitutionAccountTypeId: (state, action) => {
      state.selectedInstitutionAccountTypeId = action.payload;
      state.formData.institution_account_type_id = action.payload;
    },
    clearInstitutionAccountTypeError: (state) => {
      state.institutionAccountTypeError = null;
    },

    // Controller sync
    syncControllerDataFromForm: (state, action) => {
      const userData = action.payload;
      state.formData.controller_first_name = userData.first_name || "";
      state.formData.controller_middle_name = userData.middle_name || "";
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
    },

    // Enhanced ownership validation
    validateOwnershipPercentage: (state) => {
      const total = state.formData.owner_details.reduce(
        (sum, owner) => sum + (parseFloat(owner.ownership_percentage) || 0),
        0,
      );

      state.totalOwnershipPercentage = total;

      // Enhanced validation logic from reference code
      state.ownershipValidation = {
        totalPercentage: total,
        meetsMinimum: state.formData.owner_details.some(
          (owner) => (parseFloat(owner.ownership_percentage) || 0) >= 25,
        ),
        isValid: Math.abs(total - 100) < 0.01,
        hasValidOwners: state.formData.owner_details.every(
          (owner) =>
            owner.ownership_percentage > 0 &&
            owner.owner_first_name &&
            owner.owner_last_name,
        ),
      };
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

    setResponsiblePersonMiddleName: (state, action) => {
      state.responsiblePersonMiddleName = action.payload;
      state.formData.middle_name = action.payload;
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

    setControllerMiddleName: (state, action) => {
      state.controllerMiddleName = action.payload;
      state.formData.controller_middle_name = action.payload;
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

    // Enhanced owner management
    setOwnerField: (state, action) => {
      const { index, field, value } = action.payload;
      if (state.formData.owner_details[index]) {
        state.formData.owner_details[index][field] = value;

        // Auto-sync when owner_if changes to "yes"
        if (field === "owner_if" && value === "yes" && index === 0) {
          const responsiblePerson = state.formData;
          state.formData.owner_details[index] = {
            ...state.formData.owner_details[index],
            owner_first_name: responsiblePerson.first_name,
            owner_middle_name: responsiblePerson.middle_name,
            owner_last_name: responsiblePerson.last_name,
            owner_email: responsiblePerson.email,
            owner_dob: responsiblePerson.dob,
            owner_phone_number: responsiblePerson.mobile_number,
            owner_phone_number_country_code:
              responsiblePerson.mobilenumber_countrycode,
            owner_country_id: responsiblePerson.country,
            country_flag: "", // You might want to store the flag URL here
          };
        }
      }
    },

    // Enhanced addOwner with proper initialization
    addOwner: (state) => {
      const newOwner = {
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
        owner_if: "",
        country_flag: "",
      };
      state.formData.owner_details.push(newOwner);
    },

    removeOwner: (state, action) => {
      const index = action.payload;
      if (state.formData.owner_details.length > 1) {
        state.formData.owner_details.splice(index, 1);
      }
    },

    // New reducer for owner country selection with flag
    setOwnerCountry: (state, action) => {
      const { index, country, phoneCode, flag } = action.payload;
      if (state.formData.owner_details[index]) {
        state.formData.owner_details[index].owner_country_id = country;
        state.formData.owner_details[index].owner_phone_number_country_code =
          phoneCode;
        state.formData.owner_details[index].country_flag = flag;
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
    setInstitutionTypes: (state, action) => {
      state.institutionTypes = action.payload;
    },

    // Ownership
    updateTotalOwnership: (state) => {
      state.totalOwnershipPercentage = state.formData.owner_details.reduce(
        (total, owner) => total + (owner.ownership_percentage || 0),
        0,
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

      // Ensure user_image object exists
      if (!state.formData.user_image) {
        state.formData.user_image = {};
      }

      // Store file data (could be File object or base64 data)
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
      const existingIndex = state.termsData.findIndex((item) => item.id === id);
      if (existingIndex >= 0) {
        state.termsData = state.termsData.filter((item) => item.id !== id);
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
    // FIX: Ensure all async thunks are properly handled
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

      // Business Alias Validation
      .addCase(validateBusinessAlias.pending, (state) => {
        state.businessAliasValid = null;
      })
      .addCase(validateBusinessAlias.fulfilled, (state, action) => {
        state.businessAliasValid = action.payload.valid;
      })
      .addCase(validateBusinessAlias.rejected, (state) => {
        state.businessAliasValid = false;
      })

      .addCase(uploadFile.pending, (state) => {
        state.loading = true;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.loading = false;
        // Handle the uploaded file data
        const { documentType, fileData, ownerIndex } = action.payload;

        if (ownerIndex !== null && ownerIndex !== undefined) {
          // Store owner document
          if (state.formData.owner_details[ownerIndex]) {
            state.formData.owner_details[ownerIndex].documents =
              state.formData.owner_details[ownerIndex].documents || {};
            state.formData.owner_details[ownerIndex].documents[documentType] =
              fileData;
          }
        } else {
          // Store institution document
          state.formData.user_image = state.formData.user_image || {};
          state.formData.user_image[documentType] = fileData;
        }
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Industry Types with NAICS
      .addCase(fetchIndustryTypesWithNAICS.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchIndustryTypesWithNAICS.fulfilled, (state, action) => {
        state.loading = false;
        state.industryTypes = action.payload;
      })
      .addCase(fetchIndustryTypesWithNAICS.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Genders
      .addCase(fetchGenders.pending, (state) => {
        // Optional: Add loading state if needed
      })
      .addCase(fetchGenders.fulfilled, (state, action) => {
        state.genders = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchGenders.rejected, (state) => {
        state.genders = [];
      })

      // Nationalities
      .addCase(fetchNationalities.pending, (state) => {
        // Optional: Add loading state if needed
      })
      .addCase(fetchNationalities.fulfilled, (state, action) => {
        state.nationalities = Array.isArray(action.payload)
          ? action.payload
          : [];
      })
      .addCase(fetchNationalities.rejected, (state) => {
        state.nationalities = [];
      })

      // Countries
      .addCase(fetchCountries.pending, (state) => {
        // Optional: Add loading state if needed
      })
      .addCase(fetchCountries.fulfilled, (state, action) => {
        state.countries = action.payload;
      })
      .addCase(fetchCountries.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Institution Data
      .addCase(fetchInstitutionData.pending, (state) => {
        state.isFetchingData = true;
      })
      .addCase(fetchInstitutionData.fulfilled, (state) => {
        state.isFetchingData = false;
        state.dataFetched = true;
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
          state.errorMessage = action.payload.join(", ");
        } else if (typeof action.payload === "string") {
          state.errorMessage = action.payload;
        } else {
          state.errorMessage =
            "Validation failed. Please check all required fields.";
        }
      })

      // Submit Form
      .addCase(submitInstitutionForm.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitInstitutionForm.fulfilled, (state, action) => {
        state.loading = false;
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
        state.errorMessage = action.payload || "Submission failed";
      })

      // NAICS Codes
      .addCase(fetchNAICSCodes.pending, (state) => {
        // Optional: Add loading state if needed
      })
      .addCase(fetchNAICSCodes.fulfilled, (state, action) => {
        state.naicsCodes = action.payload;
      })
      .addCase(fetchNAICSCodes.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Business Types
      .addCase(fetchBusinessTypes.pending, (state) => {
        // Optional: Add loading state if needed
      })
      .addCase(fetchBusinessTypes.fulfilled, (state, action) => {
        state.businessTypes = action.payload;
      })
      .addCase(fetchBusinessTypes.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Industry Types
      .addCase(fetchIndustryTypes.pending, (state) => {
        // Optional: Add loading state if needed
      })
      .addCase(fetchIndustryTypes.fulfilled, (state, action) => {
        state.industryTypes = action.payload;
      })
      .addCase(fetchIndustryTypes.rejected, (state, action) => {
        state.industryTypes = [];
      })

      // Institution Types
      .addCase(fetchInstitutionTypes.pending, (state) => {
        // optional loading state
      })
      .addCase(fetchInstitutionTypes.fulfilled, (state, action) => {
        state.institutionTypes = action.payload;
      })
      .addCase(fetchInstitutionTypes.rejected, (state, action) => {
        state.institutionTypes = [];
        state.error = action.payload;
      })

      // Owner Roles
      .addCase(fetchOwnerRoles.pending, (state) => {
        // Optional: Add loading state if needed
      })
      .addCase(fetchOwnerRoles.fulfilled, (state, action) => {
        state.roles = action.payload;
      })
      .addCase(fetchOwnerRoles.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Document Types
      .addCase(fetchDocumentTypes.pending, (state) => {
        // Optional: Add loading state if needed
      })
      .addCase(fetchDocumentTypes.fulfilled, (state, action) => {
        state.documents = action.payload;
      })
      .addCase(fetchDocumentTypes.rejected, (state, action) => {
        state.error = action.payload;
      })

      // ID Document Types
      .addCase(fetchIdDocumentTypes.pending, (state) => {
        // Optional: Add loading state if needed
      })
      .addCase(fetchIdDocumentTypes.fulfilled, (state, action) => {
        state.idDocumentTypes = action.payload.data || action.payload;
      })
      .addCase(fetchIdDocumentTypes.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Controller Data Sync
      .addCase(syncControllerDataForm.pending, (state) => {
        state.loading = true;
      })
      .addCase(syncControllerDataForm.fulfilled, (state, action) => {
        state.loading = false;
        const syncData = action.payload;
        Object.keys(syncData).forEach((key) => {
          if (state.formData.hasOwnProperty(key)) {
            state.formData[key] = syncData[key];
          }
        });
        state.controllerSynced = true;
      })
      .addCase(syncControllerDataForm.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchEmployeesNumberTypes.pending, (state) => {
        state.employeesNumberLoading = true;
      })
      .addCase(fetchEmployeesNumberTypes.fulfilled, (state, action) => {
        state.employeesNumberLoading = false;
        state.employeesNumberTypes = action.payload;
      })
      .addCase(fetchEmployeesNumberTypes.rejected, (state) => {
        state.employeesNumberLoading = false;
        state.employeesNumberTypes = [];
      })
      .addCase(fetchDirectorRoles.pending, (state) => {
        state.directorRolesLoading = true;
      })
      .addCase(fetchDirectorRoles.fulfilled, (state, action) => {
        state.directorRolesLoading = false;
        state.directorRoles = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchDirectorRoles.rejected, (state) => {
        state.directorRolesLoading = false;
        state.directorRoles = [];
      })
      .addCase(fetchInstitutionAccountTypes.pending, (state) => {
        state.institutionAccountTypesLoading = true;
        state.institutionAccountTypeError = null;
      })
      .addCase(fetchInstitutionAccountTypes.fulfilled, (state, action) => {
        state.institutionAccountTypesLoading = false;
        state.institutionAccountTypes = action.payload;
      })
      .addCase(fetchInstitutionAccountTypes.rejected, (state, action) => {
        state.institutionAccountTypesLoading = false;
        state.institutionAccountTypeError = action.payload;
        state.institutionAccountTypes = [];
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
  setResponsiblePersonMiddleName,
  setResponsiblePersonLastName,
  setResponsiblePersonEmail,
  setResponsiblePersonPassword,
  setControllerFirstName,
  setControllerMiddleName,
  setControllerLastName,
  setControllerEmail,
  setEinError,
  setSsnError,
  setBusinessAliasError,
  setOwnerField,
  addOwner,
  removeOwner,
  setOwnerCountry,
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
  setEmployeesNumber,
  setDirectorRoleId,
  setSelectedInstitutionAccountTypeId,
  clearInstitutionAccountTypeError,
} = institutionRegistrationSlice.actions;

// =============================================================================
// SELECTORS - Added the missing selectors
// =============================================================================

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

export const selectInstitutionTypes = (state) =>
  state.institutionRegistration.institutionTypes;

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

export const selectIsUSSelected = (state) =>
  state.institutionRegistration.isUSSelected;

export const selectIsControllerUSSelected = (state) =>
  state.institutionRegistration.isControllerUSSelected;

export const selectTermsData = (state) =>
  state.institutionRegistration.termsData;

export const selectBusinessAliasValid = (state) =>
  state.institutionRegistration.businessAliasValid;

export const selectTermsLoading = (state) =>
  state.institutionRegistration.termsLoading;

export const selectTermsFetched = (state) =>
  state.institutionRegistration.termsFetched;

export const selectEmployeesNumberTypes = (state) =>
  state.institutionRegistration.employeesNumberTypes;

export const selectEmployeesNumberLoading = (state) =>
  state.institutionRegistration.employeesNumberLoading;

export const selectDirectorRoles = (state) =>
  state.institutionRegistration.directorRoles;

export const selectDirectorRolesLoading = (state) =>
  state.institutionRegistration.directorRolesLoading;

export const selectInstitutionAccountTypes = (state) =>
  state.institutionRegistration.institutionAccountTypes;

export const selectInstitutionAccountTypesLoading = (state) =>
  state.institutionRegistration.institutionAccountTypesLoading;

export const selectSelectedInstitutionAccountTypeId = (state) =>
  state.institutionRegistration.selectedInstitutionAccountTypeId;

export const selectInstitutionAccountTypeError = (state) =>
  state.institutionRegistration.institutionAccountTypeError;

// =============================================================================
// NEW OWNER-RELATED SELECTORS - Added the missing selectors
// =============================================================================

export const selectOwners = (state) =>
  state.institutionRegistration.formData.owner_details;

export const selectFirstOwner = (state) =>
  state.institutionRegistration.formData.owner_details[0];

export const selectOwnerIf = (state) =>
  state.institutionRegistration.formData.owner_details[0]?.owner_if;

export const selectCanAddOwner = (state) => {
  const total = state.institutionRegistration.totalOwnershipPercentage;
  return total < 100 && state.institutionRegistration.ownerAdd === "Y";
};

export default institutionRegistrationSlice.reducer;
