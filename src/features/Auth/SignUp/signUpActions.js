// src/features/Auth/actions/signupActions.js
import axios from "axios";
import { UAParser } from "ua-parser-js";
import {
  setFormField,
  setMetadataField,
  setLoading,
  setError,
  setSuccessMessage,
  setCountries,
  setNationalities,
  setGenders,
  setTermsConditions,
  addTermsData,
  removeTermsData
} from "../slices/signupSlice";

const API_URL = import.meta.env.VITE_API_URL;

// Helper function to fetch data
const fetchData = async (url, token = null) => {
  try {
    const response = await axios.get(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  } catch (error) {
    
    throw error;
  }
};

// Action to initialize form data
export const initializeSignup = (locationState) => async (dispatch) => {
  const {
    package_currencies = [],
    service_provide_ids = [],
    accountOptions = [],
    bank_accounts = [],
    kyc_verify = [],
    referral_code = [],
    accountType = null,
    is_remit = false,
  } = locationState || {};

  dispatch(setFormField({ field: "service_providers", value: service_provide_ids }));
  dispatch(setFormField({ field: "referral_code", value: referral_code }));

  // Check for named accounts and USD
  const hasNamed = service_provide_ids.some((idWithType) => {
    const parts = idWithType.split("-");
    return parts.length > 1 && parts[1] === "named";
  });

  const hasUSD = service_provide_ids.some((idWithType) => {
    const id = parseInt(idWithType.split("-")[0]);
    const account = accountOptions.find((opt) => opt.service_provide_id === id);
    return account && account.currency === "USD";
  });

  dispatch(setMetadataField({ field: "hasNamedAccounts", value: hasNamed }));
  dispatch(setMetadataField({ field: "showSSNField", value: hasUSD }));
  dispatch(setMetadataField({ field: "isUSDSelected", value: hasUSD }));
};

// Action to fetch required data
export const fetchSignupData = () => async (dispatch, getState) => {
  const bearertoken = localStorage.getItem("bearertoken");
  const iswhitelabelledpartner = localStorage.getItem("iswhitelabelledpartner");
  const whitelabelledpartnerid = localStorage.getItem("whitelabelledpartnerid");

  try {
    dispatch(setLoading(true));

    // Fetch countries from localStorage
    const countries = JSON.parse(localStorage.getItem("allcountries") || "[]");
    dispatch(setCountries(countries));

    // Fetch other data in parallel
    const [nationalities, genders, termsConditions] = await Promise.all([
      fetchData(`${API_URL}/nationalities`, bearertoken),
      fetchData(`${API_URL}/genders`, bearertoken),
      iswhitelabelledpartner === "1"
        ? fetchData(
            `${API_URL}/terms-by-partner/${whitelabelledpartnerid}`,
            bearertoken
          )
        : fetchData(`${API_URL}/terms-by-partner/0`, bearertoken),
    ]);

    dispatch(setNationalities(nationalities));
    dispatch(setGenders(genders));
    dispatch(setTermsConditions(termsConditions.terms));
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

// Action to handle terms checkbox changes
export const handleTermsCheckbox = (termId) => async (dispatch, getState) => {
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
    const isSelected = state.signup.formData.terms_and_conditions.some(
      (item) => item.id === termId
    );

    if (isSelected) {
      dispatch(removeTermsData(termId));
    } else {
      dispatch(addTermsData(termData));
    }
  } catch (error) {
    
    const termData = {
      id: termId,
      accepted_at: new Date().toISOString(),
      ip: "Unknown",
      location: "Unknown",
      device: "Unknown",
    };
    dispatch(addTermsData(termData));
  }
};

// Action to submit the form
export const submitSignupForm = (navigate) => async (dispatch, getState) => {
  const state = getState();
  const { formData, metadata } = state.signup;
  const { hasNamedAccounts, showSSNField } = metadata;

  const bearertoken = localStorage.getItem("bearertoken");
  const isPartnerPackageModule = localStorage.getItem("isPartnerPackageModule");
  const whitelabelledpartnerid = localStorage.getItem("whitelabelledpartnerid");
  const isRemit = localStorage.getItem("is_remit") === "true";
  const bank_accounts = JSON.parse(localStorage.getItem("bank_accounts") || "[]");
  const package_currencies = JSON.parse(localStorage.getItem("package_currencies") || "[]");

  // Validate SSN if needed
  if (showSSNField && hasNamedAccounts) {
    const cleanSSN = formData.ssn.replace(/\D/g, "");
    if (!cleanSSN || cleanSSN.trim() === "") {
      dispatch(setMetadataField({
        field: "ssnError",
        value: "SSN is required for named accounts"
      }));
      return false;
    }
    if (cleanSSN.length !== 9 || !/^\d+$/.test(cleanSSN)) {
      dispatch(setMetadataField({ 
        field: "ssnError", 
        value: "SSN must be 9 digits" 
      }));
      return false;
    }
    dispatch(setMetadataField({ 
      field: "showSSNConfirmation", 
      value: true 
    }));
    return;
  }

  try {
    dispatch(setLoading(true));
    dispatch(setError(null));

    const submissionData = {
      ...formData,
      ssn: formData.ssn?.replace(/-/g, ""),
      hostname: window.location.hostname,
      remit_customer: isRemit,
      bank_account_options: bank_accounts,
      isPartnerPackageModule,
      package_currencies,
      whitelabelledpartnerid,
    };

    const response = await axios.post(
      `${API_URL}/customers/sign-up`,
      submissionData,
      {
        headers: {
          Authorization: `Bearer ${bearertoken}`,
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
        },
      });
    } else {
      dispatch(setError(response.data.message || "Registration failed"));
    }
  } catch (error) {
    const errorData = error.response?.data;
    let errorMessage = "Registration failed. Please try again.";

    if (errorData?.message) {
      errorMessage = typeof errorData.message === "object"
        ? Object.values(errorData.message).flat().join(", ")
        : errorData.message;
    }

    dispatch(setError(errorMessage));
  } finally {
    dispatch(setLoading(false));
  }
};

// Action to confirm SSN and submit
export const confirmSSNAndSubmit = (navigate) => async (dispatch) => {
  dispatch(setMetadataField({ 
    field: "showSSNConfirmation", 
    value: false 
  }));
  dispatch(submitSignupForm(navigate));
};