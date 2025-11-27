// src/features/Auth/actions/institutionActions.js
import axios from "axios";
import { UAParser } from "ua-parser-js";
import {
  setFormField,
  setOwnerField,
  addOwner,
  removeOwner,
  setLoading,
  setError,
  setSuccessMessage,
  setNAICSCodes,
  setBusinessTypes,
  setIndustryTypes,
  setGenders,
  setNationalities,
  setOwnerRoles,
  setDocumentTypes,
  setIdDocumentTypes,
  setCurrentStep,
  setFieldVisibility,
  setSelectedCountry,
  setSelectedCurrency,
  setSelectedIndustry,
  updateTotalOwnership,
  setIsOwner,
  togglePasswordVisibility,
  toggleConfirmPasswordVisibility,
  setFile,
  setShowPopup,
  setErrorMessage,
} from "../slices/institutionRegistrationSlice";

const API_URL = import.meta.env.VITE_API_URL;

// Helper function to fetch data
const fetchData = async (url, token = null) => {
  try {
    const response = await axios.get(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    throw error;
  }
};

// Action to initialize form data
export const initializeInstitutionSignup =
  (locationState) => async (dispatch) => {
    const {
      service_provide_ids = [],
      accountOptions = [],
      referral_code = [],
      agent_code = [],
    } = locationState || {};

    dispatch(
      setFormField({ field: "service_providers", value: service_provide_ids })
    );
    dispatch(setFormField({ field: "referral_code", value: referral_code }));
    dispatch(setFormField({ field: "agent_code", value: agent_code }));

    // Check for USD accounts
    const hasUSD = service_provide_ids.some((idWithType) => {
      const id = parseInt(idWithType.split("-")[0]);
      const account = accountOptions.find(
        (opt) => opt.service_provide_id === id
      );
      return account && account.currency === "USD";
    });

    dispatch(setFieldVisibility({ field: "showEINField", value: hasUSD }));
    dispatch(
      setFieldVisibility({ field: "showBusinessTypeField", value: hasUSD })
    );
    dispatch(setFieldVisibility({ field: "showNAICSField", value: hasUSD }));
    dispatch(
      setFieldVisibility({ field: "showIndustryTypeField", value: !hasUSD })
    );
    dispatch(
      setFieldVisibility({ field: "showBusinessAliasField", value: hasUSD })
    );
    dispatch(
      setFieldVisibility({ field: "showBusinessEmailField", value: hasUSD })
    );
    dispatch(
      setFieldVisibility({ field: "showBusinessWebsiteField", value: hasUSD })
    );
    dispatch(
      setFieldVisibility({ field: "showCompanyPhoneFields", value: hasUSD })
    );

    if (hasUSD) {
      dispatch(setSelectedCurrency("USD"));
    }
  };

// Action to fetch required data for institution registration
export const fetchInstitutionData = () => async (dispatch, getState) => {
  const bearertoken = localStorage.getItem("bearertoken");

  try {
    dispatch(setLoading(true));

    // Fetch all data in parallel
    const [
      naicsCodes,
      businessTypes,
      industryTypes,
      genders,
      nationalities,
      ownerRoles,
      documentTypes,
      idDocumentTypes,
    ] = await Promise.all([
      fetchData(`${API_URL}/get-naice-code`, bearertoken),
      fetchData(`${API_URL}/get-silabusiness_type`, bearertoken),
      fetchData(`${API_URL}/industry-types`, bearertoken),
      fetchData(`${API_URL}/genders`, bearertoken),
      fetchData(`${API_URL}/nationalities`, bearertoken),
      fetchData(`${API_URL}/owner-roles`, bearertoken),
      fetchData(`${API_URL}/institution-upload-document-types`, bearertoken),
      fetchData(`${API_URL}/all-id-document-types`, bearertoken),
    ]);

    dispatch(setNAICSCodes(naicsCodes));
    dispatch(setBusinessTypes(businessTypes));
    dispatch(setIndustryTypes(industryTypes));
    dispatch(setGenders(genders));
    dispatch(setNationalities(nationalities));
    dispatch(setOwnerRoles(ownerRoles));
    dispatch(setDocumentTypes(documentTypes));
    dispatch(setIdDocumentTypes(idDocumentTypes));
  } catch (error) {
    dispatch(setError("Failed to load initial data"));
    dispatch(setShowPopup(true));
    dispatch(setErrorMessage("Failed to load initial data"));
  } finally {
    dispatch(setLoading(false));
  }
};

// Action to validate step
export const validateInstitutionStep = (stepData) => async (dispatch) => {
  const bearertoken = localStorage.getItem("bearertoken");

  try {
    dispatch(setLoading(true));

    const response = await axios.post(
      `${API_URL}/customers/validate-institution-onboarding`,
      stepData,
      {
        headers: {
          Authorization: `Bearer ${bearertoken}`,
        },
      }
    );

    if (response.data.status === "success") {
      return true;
    } else {
      dispatch(setError(response.data.message || "Validation failed"));
      dispatch(setShowPopup(true));
      dispatch(setErrorMessage(response.data.message || "Validation failed"));
      return false;
    }
  } catch (error) {
    const errorData = error.response?.data;
    let errorMessage = "Validation failed. Please try again.";

    if (errorData?.message) {
      errorMessage =
        typeof errorData.message === "object"
          ? Object.values(errorData.message).flat().join(", ")
          : errorData.message;
    }

    dispatch(setError(errorMessage));
    dispatch(setShowPopup(true));
    dispatch(setErrorMessage(errorMessage));
    return false;
  } finally {
    dispatch(setLoading(false));
  }
};

// Action to submit the institution form
export const submitInstitutionForm =
  (navigate) => async (dispatch, getState) => {
    const state = getState();
    const { formData } = state.institutionRegistration;

    const bearertoken = localStorage.getItem("bearertoken");
    const isPartnerPackageModule = localStorage.getItem(
      "isPartnerPackageModule"
    );
    const whitelabelledpartnerid = localStorage.getItem(
      "whitelabelledpartnerid"
    );
    const package_currencies = JSON.parse(
      localStorage.getItem("package_currencies") || "[]"
    );

    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      // Prepare form data for submission
      const submissionData = new FormData();

      // Add all form fields to FormData
      Object.keys(formData).forEach((key) => {
        if (key === "owner_details") {
          submissionData.append(key, JSON.stringify(formData[key]));
        } else if (key === "user_image" && formData[key]) {
          // Handle file uploads
          Object.keys(formData[key]).forEach((docId) => {
            if (formData[key][docId] instanceof File) {
              submissionData.append(`document_${docId}`, formData[key][docId]);
            }
          });
        } else if (formData[key] !== null && formData[key] !== undefined) {
          submissionData.append(key, formData[key]);
        }
      });

      // Add additional fields
      submissionData.append("hostname", window.location.hostname);
      submissionData.append("isPartnerPackageModule", isPartnerPackageModule);
      submissionData.append(
        "package_currencies",
        JSON.stringify(package_currencies)
      );
      submissionData.append("whitelabelledpartnerid", whitelabelledpartnerid);

      const response = await axios.post(
        `${API_URL}/customers/sign-up-institution`,
        submissionData,
        {
          headers: {
            Authorization: `Bearer ${bearertoken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.status === "success") {
        const fullMobileNumber = `${formData.mobilenumber_countrycode} ${formData.mobile_number}`;
        localStorage.setItem("fullMobileNumber", fullMobileNumber);

        dispatch(setSuccessMessage(response.data.message));
        navigate("/phoneverification", {
          state: {
            mobileNumber: fullMobileNumber,
            kyc_verify: JSON.parse(localStorage.getItem("kyc_verify") || "[]"),
            owner_add: JSON.parse(localStorage.getItem("owner_add") || "[]"),
          },
        });
      } else {
        dispatch(setError(response.data.message || "Registration failed"));
        dispatch(setShowPopup(true));
        dispatch(
          setErrorMessage(response.data.message || "Registration failed")
        );
      }
    } catch (error) {
      const errorData = error.response?.data;
      let errorMessage = "Registration failed. Please try again.";

      if (errorData?.message) {
        errorMessage =
          typeof errorData.message === "object"
            ? Object.values(errorData.message).flat().join(", ")
            : errorData.message;
      }

      dispatch(setError(errorMessage));
      dispatch(setShowPopup(true));
      dispatch(setErrorMessage(errorMessage));
    } finally {
      dispatch(setLoading(false));
    }
  };

// Action to handle file upload
export const uploadFile = (documentId, file) => async (dispatch, getState) => {
  const state = getState();
  const currentFiles = state.institutionRegistration.formData.user_image || {};

  dispatch(setFile({ documentId, fileData: file }));

  return true;
};

// Action to handle terms checkbox changes
export const handleInstitutionTermsCheckbox =
  (termId) => async (dispatch, getState) => {
    try {
      const currentDateTimeLocal = new Date().toLocaleString();
      const ipResponse = await fetch("https://api.ipify.org?format=json");
      const { ip } = await ipResponse.json();
      const locationResponse = await fetch(`https://ipapi.co/${ip}/json/`);
      const locationData = await locationResponse.json();
      const parser = new UAParser();
      const deviceInfo = parser.getResult();

      const termData = {
        id: termId,
        accepted_at: currentDateTimeLocal,
        ip,
        location: `${locationData.city}, ${locationData.region}, ${locationData.country_name}`,
        device: `${deviceInfo.os.name} on ${
          deviceInfo.device.model || "Unknown Device"
        }`,
      };

      const state = getState();
      const currentTerms =
        state.institutionRegistration.formData.terms_and_conditions || [];
      const isSelected = currentTerms.some((item) => item.id === termId);

      if (isSelected) {
        // Remove term
        const updatedTerms = currentTerms.filter((item) => item.id !== termId);
        dispatch(
          setFormField({ field: "terms_and_conditions", value: updatedTerms })
        );
      } else {
        // Add term
        dispatch(
          setFormField({
            field: "terms_and_conditions",
            value: [...currentTerms, termData],
          })
        );
      }
    } catch (error) {
      console.error("Error handling terms checkbox:", error);
      const termData = {
        id: termId,
        accepted_at: new Date().toISOString(),
        ip: "Unknown",
        location: "Unknown",
        device: "Unknown",
      };

      const state = getState();
      const currentTerms =
        state.institutionRegistration.formData.terms_and_conditions || [];
      dispatch(
        setFormField({
          field: "terms_and_conditions",
          value: [...currentTerms, termData],
        })
      );
    }
  };

// Action to add document to owner
export const addOwnerDocument =
  (ownerIndex, documentId, file) => async (dispatch, getState) => {
    const state = getState();
    const owner =
      state.institutionRegistration.formData.owner_details[ownerIndex];

    if (owner) {
      const updatedOwner = {
        ...owner,
        doc_type: documentId,
        doc_file: file,
      };

      dispatch(
        setOwnerField({
          index: ownerIndex,
          field: "doc_type",
          value: documentId,
        })
      );
      // You might need to handle file storage differently based on your backend requirements
    }
  };