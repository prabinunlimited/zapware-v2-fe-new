import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInfoCircle,
  faEye,
  faEyeSlash,
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import { Formik, Form, Field, FieldArray } from "formik";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { RingLoader, ClipLoader } from "react-spinners";
import Select from "react-select";
import SSNConfirmationPopup from "../../../components/PopupModal/SSNConfirmationPopup";

import InstitutionPopup from "../../../components/PopupModal/InstitutionPopup";
import FormField from "./FormFields/FormField";
import PasswordField from "./FormFields/PasswordField";
import SelectField from "./FormFields/SelectField";
import BenefitsSection from "./FormFields/BenefitsSection";
import institutionSchema from "../../../components/Schema/InstitutionSchema";

import {
  fetchCountries,
  selectCountriesOptions,
  selectCountriesLoading,
} from "../../../features/Auth/slices/countrySlice";

import {
  selectIsNamedAccount,
  selectSelectedAccounts,
  selectAccountOptions,
} from "../SignUp/SelectCurrencyAccount/currencyAccountsSelectors";

import {
  fetchInstitutionData,
  submitInstitutionForm,
  setCurrentStep,
  setShowPopup,
  setErrorMessage,
  selectInstitutionRegistration,
  fetchGenders,
  fetchNationalities,
  setLocationStateData,
  setAccountType,
  fetchIndustryTypes,
  setPackageCurrencies,
  setKycRequirements,
  setDocumentRequirements,
  setReferralData,
  setSsnRequired,
  setEinRequired,
  setWhiteLabelInfo,
  togglePasswordVisibility,
  toggleConfirmPasswordVisibility,
  fetchTermsAndConditions,
  selectTermsConditions,
  selectTermsLoading,
  selectTermsFetched,
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
  fetchNAICSCodes,
  fetchBusinessTypes,
  fetchOwnerRoles,
  fetchDocumentTypes,
  fetchIdDocumentTypes,
  setBusinessAlias,
  setOwnerAdd,
} from "../slices/institutionRegistrationSlice";

import OwnerInfo from "./Steps/OwnerInfo";

const CustomPlaceholder = ({ children }) => (
  <div className="flex items-center text-gray-500 text-sm">
    <i className="fas fa-flag mr-2"></i>
    {children}
  </div>
);

const formatOptionLabel = (option) => (
  <div className="flex items-center justify-between w-full">
    <div className="flex items-center space-x-2">
      {option.flag && option.flag.startsWith("http") ? (
        <img
          src={option.flag}
          alt={`${option.label} flag`}
          className="w-6 h-4 object-cover rounded"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "inline";
          }}
        />
      ) : (
        <span className="text-base">{option.flag || "🏳️"}</span>
      )}
      <span className="font-medium text-gray-900 text-sm">{option.label}</span>
    </div>
    <span className="text-gray-500 text-sm font-medium bg-gray-100 px-2 py-1 rounded">
      {option.phoneCode || option.phone_code}
    </span>
  </div>
);

const filterOption = (option, inputValue) => {
  const searchTerm = inputValue.toLowerCase();
  const countryName = (option.label || "").toLowerCase();
  const countryCode = (
    option.country_code ||
    option.countryCode ||
    ""
  ).toLowerCase();
  const phoneCode = (option.phoneCode || option.phone_code || "").toLowerCase();

  // Search by country name, country code, or phone code
  return (
    countryName.includes(searchTerm) ||
    countryCode.includes(searchTerm) ||
    phoneCode.includes(searchTerm) ||
    `+${phoneCode}`.includes(searchTerm)
  );
};

const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const FormHeader = ({ title, subtitle, icon }) => {
  return (
    <div className="text-center mb-8">
      <div className="flex justify-center items-center mb-4">
        <div className="bg-blue-100 p-3 rounded-full">
          {icon || <i className="fas fa-building text-blue-600 text-xl"></i>}
        </div>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-lg text-gray-600">{subtitle}</p>
    </div>
  );
};

const SSNInfoPopup = () => {
  const [showSSNInfo, setShowSSNInfo] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setShowSSNInfo(!showSSNInfo)}
        className="ml-2 text-blue-600 hover:text-blue-800"
      >
        <FontAwesomeIcon icon={faInfoCircle} />
      </button>
      {showSSNInfo && (
        <div className="absolute z-10 w-64 p-3 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm text-gray-700">
            SSN is required for US residents for tax reporting purposes. Your
            information is secured with bank-level encryption.
          </p>
          <button
            type="button"
            onClick={() => setShowSSNInfo(false)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

const stepVariants = {
  hidden: { opacity: 0, x: 100 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
};

// Enhanced form field styling constants
const FIELD_STYLES = {
  base: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200",
  disabled: "bg-gray-100 opacity-60 cursor-not-allowed",
  error: "border-red-500 focus:ring-red-500",
  success: "border-green-500 focus:ring-green-500",
};

const Institution = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeField, setActiveField] = useState("");
  const [businessAliasValid, setBusinessAliasValid] = useState(null);
  const [localFormData, setLocalFormData] = useState({});
  const [showSSNConfirmation, setShowSSNConfirmation] = useState(false);
  const [pendingNextStep, setPendingNextStep] = useState(false);
  const [formValues, setFormValues] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFullScreenLoader, setShowFullScreenLoader] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const initialLoadRef = React.useRef(false);
  const institutionState = useSelector(selectInstitutionRegistration);
  const countries = useSelector(selectCountriesOptions);
  const countriesLoading = useSelector(selectCountriesLoading);

  const isNamedAccount = useSelector(selectIsNamedAccount);
  const selectedAccounts = useSelector(selectSelectedAccounts);
  const accountOptions = useSelector(selectAccountOptions);

  const termsConditions = useSelector(selectTermsConditions);
  const termsLoading = useSelector(selectTermsLoading);
  const termsFetched = useSelector(selectTermsFetched);

  // === ADD THE ACCOUNT ANALYSIS USEEFFECT RIGHT HERE ===
  useEffect(() => {
    console.log("ACCOUNT TYPE ANALYSIS:");
    console.log("- Selected Accounts:", selectedAccounts);
    console.log("- Account Options:", accountOptions);
    console.log("- isNamedAccount result:", isNamedAccount);

    if (selectedAccounts && selectedAccounts.length > 0) {
      selectedAccounts.forEach((account, index) => {
        console.log(`Account ${index}:`, {
          type: account.account_type,
          currency: account.currency,
          isNamed: account.account_type === "named",
          isUSD: account.currency === "USD",
        });
      });
    }
  }, [selectedAccounts, accountOptions, isNamedAccount]);
  // === END ACCOUNT ANALYSIS ===

  // === ADD SelectorDebug RIGHT HERE ===
  const SelectorDebug = () => {
    const isNamedAccount = useSelector(selectIsNamedAccount);
    const selectedAccounts = useSelector(selectSelectedAccounts);
    const accountOptions = useSelector(selectAccountOptions);

    React.useEffect(() => {
      console.log("SELECTOR DEBUG:", {
        isNamedAccount,
        selectedAccounts,
        accountOptions,
        selectedAccountsJSON: JSON.stringify(selectedAccounts),
      });
    }, [isNamedAccount, selectedAccounts, accountOptions]);

    return null;
  };

  const {
    currentStep,
    formData,
    loading,
    naicsCodes,
    businessTypes,
    industryTypes,
    genders,
    nationalities,
    roles,
    documents,
    idDocumentTypes,
    showEINField,
    showNAICSField,
    showBusinessTypeField,
    showIndustryTypeField,
    showBusinessEmailField,
    showBusinessWebsiteField,
    totalOwnershipPercentage,
    showPassword,
    showConfirmPassword,
    showPopup,
    errorMessage,
    accountType,
    packageCurrencies,
    kycVerify,
    documentUpload,
    ownerAdd,
    referralCode,
    agentCode,
    defaultCurrency,
    showSSNField,
    showBusinessAliasField,
  } = institutionState;

  const getInitialFormData = useCallback(() => {
    const mergedData = { ...formData, ...localFormData };
    const safeData = {
      owner_details: [
        {
          id: Date.now(),
          owner_type: "",
          owner_first_name: "",
          owner_middle_name: "",
          owner_last_name: "",
          owner_email: "",
          owner_phone_number: "",
          owner_phone_number_country_code: "",
          owner_country_id: "",
          ownership_percentage: 0,
          owner_dob: "",
          ssn: "",
          doc_type: "",
          doc_id: "",
          doc_country: "",
          doc_state: "",
          owner_if: "",
          owner_needs_access_to_system: "",
          owner_role_id: "",
        },
      ],
      terms_and_conditions: [],
      terms_agreement: false,
      user_image: {},

      industry_type: "", // ← ADD THIS LINE

      controller_first_name: "",
      controller_middle_name: "",
      controller_last_name: "",
      controller_email: "",
      controller_password: "",
      controller_confirm_password: "",
      controller_resident_country: "",
      controller_mobilenumber_countrycode: "",
      controller_mobile_number: "",
      controller_nationality: "",
      controller_country: "",
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
      is_controller: "",

      ...mergedData,
    };
    return safeData;
  }, [formData, localFormData]);

  useEffect(() => {
    if (
      Object.keys(formData).length > 0 &&
      Object.keys(localFormData).length === 0
    ) {
      setLocalFormData(formData);
    }
  }, [formData, localFormData]);

  const enhancedHandleChange = useCallback(
    (fieldName, setFieldValue, actionCreator = null) => {
      return (e) => {
        const value = e?.target?.value ?? e?.value ?? e;
        setFieldValue(fieldName, value);
        setLocalFormData((prev) => ({
          ...prev,
          [fieldName]: value,
        }));
        if (actionCreator) {
          dispatch(actionCreator(value));
        } else {
          dispatch(setFormField({ field: fieldName, value }));
        }
      };
    },
    [dispatch]
  );

  const enhancedSelectChange = useCallback(
    (fieldName, setFieldValue, actionCreator = null) => {
      return (option) => {
        const value = option?.value ?? option;
        setFieldValue(fieldName, value);
        setLocalFormData((prev) => ({
          ...prev,
          [fieldName]: value,
        }));
        if (actionCreator) {
          dispatch(actionCreator(value));
        } else {
          dispatch(setFormField({ field: fieldName, value }));
        }
      };
    },
    [dispatch]
  );

  const enhancedPasswordChange = useCallback(
    (fieldName, setFieldValue, actionCreator = null) => {
      return (e) => {
        const value = e.target.value;
        setFieldValue(fieldName, value);
        setLocalFormData((prev) => ({
          ...prev,
          [fieldName]: value,
        }));
        if (actionCreator) {
          dispatch(actionCreator(value));
        } else {
          dispatch(setFormField({ field: fieldName, value }));
        }
      };
    },
    [dispatch]
  );

  const getSafeCountryOptions = useCallback(() => {
    if (countries && countries.length > 0) {
      return countries.map((country) => {
        const countryName =
          country.name ||
          country.label ||
          country.country_name ||
          country.country_code ||
          "Unknown Country";
        const phoneCode = country.phone_code || country.phoneCode || "";

        return {
          value: country.id || country.country_id || countryName,
          label: countryName,
          phoneCode: phoneCode,
          country_code: country.country_code,
          id: country.id,
          flag: country.flag_url || "🏳️", // FIXED: Use flag_url instead of flag
          originalData: country,
        };
      });
    }
    return [];
  }, [countries]);

  const countryOptions = useMemo(
    () => getSafeCountryOptions(),
    [getSafeCountryOptions]
  );

  useEffect(() => {
    return () => {
      if (Object.keys(localFormData).length > 0) {
        localStorage.setItem(
          "institution_registration_backup",
          JSON.stringify({
            data: localFormData,
            timestamp: new Date().toISOString(),
            step: currentStep,
          })
        );
      }
    };
  }, [localFormData, currentStep]);

  useEffect(() => {
    const backup = localStorage.getItem("institution_registration_backup");
    if (backup) {
      try {
        const { data, timestamp } = JSON.parse(backup);
        const backupTime = new Date(timestamp);
        const currentTime = new Date();
        const diffHours = (currentTime - backupTime) / (1000 * 60 * 60);

        if (diffHours < 1) {
          setLocalFormData(data);
        }
      } catch (error) {
        // Backup restoration failed silently
      }
    }
  }, []);

  useEffect(() => {
    if (termsFetched && termsConditions && termsConditions.length > 0) {
      if (!localFormData.terms_and_conditions) {
        setLocalFormData((prev) => ({
          ...prev,
          terms_and_conditions: [],
        }));
      }
    }
  }, [termsFetched, termsConditions, localFormData]);

  const locationStateData = location.state || {};

  const processLocationState = useCallback(
    (data) => {
      if (data && Object.keys(data).length > 0) {
        dispatch(setLocationStateData(data));

        if (data.service_provide_ids) {
          // Process service provider IDs silently
        }

        if (data.package_currencies) {
          dispatch(setPackageCurrencies(data.package_currencies));
        }
        if (data.kyc_verify !== undefined) {
          dispatch(setKycRequirements(data.kyc_verify));
        }
        if (data.document_upload !== undefined) {
          dispatch(setDocumentRequirements(data.document_upload));
        }
        if (data.owner_add !== undefined) {
          dispatch(setOwnerAdd(data.owner_add));
        }
        if (data.referral_code) {
          dispatch(
            setReferralData({
              referralCode: data.referral_code,
              agentCode: data.agent_code,
            })
          );
        }
        if (data.ssn_required !== undefined) {
          dispatch(setSsnRequired(data.ssn_required));
        }
        if (data.ein_required !== undefined) {
          dispatch(setEinRequired(data.ein_required));
        }

        const isWhiteLabelled =
          localStorage.getItem("iswhitelabelledpartner") === "Y";
        const partnerId = localStorage.getItem("whitelabelledpartnerid");
        const packageModule = localStorage.getItem("isPartnerPackageModule");

        dispatch(
          setWhiteLabelInfo({
            isWhiteLabelledPartner: isWhiteLabelled,
            whiteLabelledPartnerId: partnerId,
            partnerPackageModule: packageModule,
          })
        );
      }
    },
    [dispatch]
  );

  useEffect(() => {
    if (locationStateData && Object.keys(locationStateData).length > 0) {
      processLocationState(locationStateData);
    }
  }, [locationStateData, processLocationState]);

  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      dispatch(fetchCountries());
      dispatch(fetchGenders());
      dispatch(fetchNationalities());
      dispatch(fetchIndustryTypes());
      dispatch(fetchTermsAndConditions());
      dispatch(fetchInstitutionData());
      setTimeout(() => {
        dispatch(fetchNAICSCodes());
        dispatch(fetchBusinessTypes());
        dispatch(fetchOwnerRoles());
        dispatch(fetchDocumentTypes());
        dispatch(fetchIdDocumentTypes());
      }, 1000);
    }
  }, [dispatch]);

  const validateEIN = useCallback(
    (ein) => {
      if (isNamedAccount && (!ein || ein.trim() === "")) {
        return "EIN is required for USD Named Accounts";
      }
      if (ein && ein.trim() !== "") {
        const cleanEIN = ein.replace(/-/g, "");
        if (cleanEIN.length !== 9 || !/^\d+$/.test(cleanEIN)) {
          return "EIN must be 9 digits";
        }
      }
      return "";
    },
    [isNamedAccount]
  );

  const validateSSN = useCallback(
    (ssn, isUSSelected) => {
      if (isNamedAccount && isUSSelected) {
        if (!ssn || ssn.trim() === "") {
          return "SSN is required for USD Named Accounts for US residents";
        }
        const cleanSSN = ssn.replace(/-/g, "");
        if (cleanSSN.length !== 9 || !/^\d+$/.test(cleanSSN)) {
          return "SSN must be 9 digits";
        }
      }
      return "";
    },
    [isNamedAccount]
  );

  const validateBusinessAliasField = useCallback(
    (businessAlias) => {
      if (isNamedAccount && (!businessAlias || businessAlias.trim() === "")) {
        return "Business alias is required for USD Named Accounts";
      }
      return "";
    },
    [isNamedAccount]
  );

  const formatTaxId = useCallback((value, type) => {
    if (!value) return value;
    const cleanValue = value.replace(/\D/g, "");
    if (type === "ein") {
      if (cleanValue.length <= 2) return cleanValue;
      return `${cleanValue.slice(0, 2)}-${cleanValue.slice(2, 9)}`;
    } else if (type === "ssn") {
      if (cleanValue.length <= 3) return cleanValue;
      if (cleanValue.length <= 5)
        return `${cleanValue.slice(0, 3)}-${cleanValue.slice(3)}`;
      return `${cleanValue.slice(0, 3)}-${cleanValue.slice(
        3,
        5
      )}-${cleanValue.slice(5, 9)}`;
    }
    return value;
  }, []);

  const isStepComplete = (step, values, errors, touched) => {
    const validationValues = { ...getInitialFormData(), ...values };

    switch (step) {
      case 1: {
        const requiredFields = [
          "institution_name",
          "registration_number",
          "registered_address_street_country",
          "registered_address_street_state",
          "registered_address_street_city",
          "registered_address_street_1",
          "registered_address_street_zip",
          "date_incorporation",
          "industry_type",
        ];

        const requiredFieldsFilled = requiredFields.every((field) => {
          const value = validationValues[field];
          return value && value.toString().trim() !== "";
        });

        let conditionalFieldsValid = true;
        if (showEINField && isNamedAccount) {
          conditionalFieldsValid =
            conditionalFieldsValid &&
            validationValues.ein &&
            !validateEIN(validationValues.ein);
        }
        // FIXED: NAICS validation for named accounts
        if (showNAICSField && isNamedAccount) {
          conditionalFieldsValid =
            conditionalFieldsValid &&
            validationValues.naice_code &&
            validationValues.naice_code.toString().trim() !== "";
        }
        if (showBusinessTypeField && isNamedAccount) {
          conditionalFieldsValid =
            conditionalFieldsValid && validationValues.business_type;
        }
        if (showBusinessAliasField && isNamedAccount) {
          conditionalFieldsValid =
            conditionalFieldsValid &&
            validationValues.business_alias &&
            !validateBusinessAliasField(validationValues.business_alias);
        }

        const hasValidationErrors = Object.keys(errors).some((key) => {
          const error = errors[key];
          return error && typeof error === "string" && error.length > 0;
        });

        return (
          requiredFieldsFilled && conditionalFieldsValid && !hasValidationErrors
        );
      }

      case 2: {
        const requiredFields = [
          "first_name",
          "last_name",
          "email",
          "password",
          "confirm_password",
          "resident_country",
          "mobilenumber_countrycode",
          "mobile_number",
          "nationality",
          "country",
          "state",
          "city",
          "street_address_1",
          "zip_code",
          "gender",
          "dob",
        ];

        const requiredFieldsFilled = requiredFields.every((field) => {
          const value = validationValues[field];
          return value && value.toString().trim() !== "";
        });

        const hasValidationErrors = requiredFields.some(
          (field) => errors[field] && touched[field]
        );
        const isUSSelected = validationValues.country === "United States";
        const ssnValid =
          !showSSNField ||
          !isUSSelected ||
          (validationValues.ssn &&
            !validateSSN(validationValues.ssn, isUSSelected));

        const allTermsAccepted =
          termsConditions && termsConditions.length > 0
            ? validationValues.terms_and_conditions?.length ===
              termsConditions.length
            : true;

        return (
          requiredFieldsFilled &&
          !hasValidationErrors &&
          ssnValid &&
          allTermsAccepted
        );
      }

      case 3: {
        if (
          !validationValues.is_controller ||
          validationValues.is_controller === ""
        )
          return false;
        if (validationValues.is_controller === "yes") return true;

        const controllerRequiredFields = [
          "controller_first_name",
          "controller_last_name",
          "controller_email",
          "controller_password",
          "controller_confirm_password",
          "controller_resident_country",
          "controller_phone_code",
          "controller_phone_number",
          "controller_nationality",
          "controller_country_address",
          "controller_state",
          "controller_city",
          "controller_street_address_1",
          "controller_zip_code",
          "controller_gender",
          "controller_dob",
        ];

        const controllerFieldsComplete = controllerRequiredFields.every(
          (field) => {
            const value = validationValues[field];
            return value && value.toString().trim() !== "";
          }
        );

        const isControllerUSSelected =
          validationValues.controller_country_address === "United States";
        const ssnValid =
          !showSSNField ||
          !isControllerUSSelected ||
          (validationValues.controller_ssn &&
            !validateSSN(
              validationValues.controller_ssn,
              isControllerUSSelected
            ));
        const passwordsMatch =
          validationValues.controller_password ===
          validationValues.controller_confirm_password;

        return controllerFieldsComplete && ssnValid && passwordsMatch;
      }

      case 4: {
        if (
          !validationValues.owner_details ||
          validationValues.owner_details.length === 0
        )
          return false;

        const totalOwnership = validationValues.owner_details.reduce(
          (total, owner) =>
            total + (parseFloat(owner.ownership_percentage) || 0),
          0
        );

        return Math.abs(totalOwnership - 100) < 0.01;
      }

      case 5: {
        const termsAccepted = validationValues.terms_agreement === true;
        let documentsValid = true;
        if (documentUpload) {
          const requiredDocs = documents.filter((doc) => doc.required);
          documentsValid = requiredDocs.every(
            (doc) =>
              validationValues.user_image && validationValues.user_image[doc.id]
          );
        }
        return termsAccepted && documentsValid;
      }
      default:
        return true;
    }
  };

  const getStepFields = useCallback(
    (step, values) => {
      switch (step) {
        case 1:
          const step1Fields = [
            "institution_name",
            "registration_number",
            "country_of_registration",
            "registered_address_street_state",
            "registered_address_street_city",
            "registered_address_street_1",
            "registered_address_street_zip",
            "date_incorporation",
            "industry_type",
          ];
          if (showEINField) step1Fields.push("ein");
          if (showNAICSField) step1Fields.push("naice_code");
          if (showBusinessTypeField) step1Fields.push("business_type");
          if (showBusinessAliasField) step1Fields.push("business_alias");
          if (showBusinessEmailField) step1Fields.push("business_email");
          if (showBusinessWebsiteField) step1Fields.push("business_website");
          return step1Fields;
        case 2:
          const step2Fields = [
            "first_name",
            "middle_name",
            "last_name",
            "email",
            "password",
            "confirm_password",
            "resident_country",
            "mobilenumber_countrycode",
            "mobile_number",
            "nationality",
            "country",
            "state",
            "city",
            "street_address_1",
            "zip_code",
            "gender",
            "dob",
          ];
          if (showSSNField && values.country === "United States")
            step2Fields.push("ssn");
          return step2Fields;
        case 3:
          const step3Fields = ["is_controller"];
          if (values.is_controller === "no") {
            step3Fields.push(
              "controller_first_name",
              "controller_middle_name",
              "controller_last_name",
              "controller_email",
              "controller_password",
              "controller_confirm_password",
              "controller_resident_country",
              "controller_mobilenumber_countrycode",
              "controller_mobile_number",
              "controller_nationality",
              "controller_country",
              "controller_state",
              "controller_city",
              "controller_street_address_1",
              "controller_zip_code",
              "controller_gender",
              "controller_dob"
            );
            if (showSSNField && values.controller_country === "United States") {
              step3Fields.push("controller_ssn");
            }
          }
          return step3Fields;
        case 4:
          const ownerFields = [];
          if (values.owner_details && values.owner_details.length > 0) {
            values.owner_details.forEach((owner, index) => {
              ownerFields.push(
                `owner_details[${index}].owner_first_name`,
                `owner_details[${index}].owner_middle_name`,
                `owner_details[${index}].owner_last_name`,
                `owner_details[${index}].owner_email`,
                `owner_details[${index}].owner_phone_number`,
                `owner_details[${index}].owner_country_id`,
                `owner_details[${index}].owner_phone_number_country_code`,
                `owner_details[${index}].ownership_percentage`,
                `owner_details[${index}].owner_dob`,
                `owner_details[${index}].owner_if`
              );
              if (owner.owner_if === "yes") {
                ownerFields.push(`owner_details[${index}].owner_type`);
              }
              if (owner.owner_if === "no" || index > 0) {
                ownerFields.push(
                  `owner_details[${index}].owner_needs_access_to_system`
                );
                if (owner.owner_needs_access_to_system === "yes") {
                  ownerFields.push(`owner_details[${index}].owner_role_id`);
                }
              }
              if (
                owner.owner_country_id === "United States" &&
                isNamedAccount
              ) {
                ownerFields.push(
                  `owner_details[${index}].ssn`,
                  `owner_details[${index}].doc_type`,
                  `owner_details[${index}].doc_id`
                );
              }
            });
          }
          return ownerFields;
        case 5:
          const step5Fields = ["terms_agreement"];
          if (documentUpload) {
            const requiredDocs = documents.filter((doc) => doc.required);
            requiredDocs.forEach((doc) =>
              step5Fields.push(`user_image.${doc.id}`)
            );
          }
          return step5Fields;
        default:
          return [];
      }
    },
    [
      showEINField,
      showNAICSField,
      showBusinessTypeField,
      showBusinessAliasField,
      showBusinessEmailField,
      showBusinessWebsiteField,
      showSSNField,
      documentUpload,
      isNamedAccount,
      documents,
    ]
  );

  const getFirstErrorMessage = useCallback(
    (errors, values = {}, currentStep = 1) => {
      if (currentStep === 2) {
        const allTermsAccepted =
          termsConditions && termsConditions.length > 0
            ? values.terms_and_conditions?.length === termsConditions.length
            : true;
        if (!allTermsAccepted)
          return "Please accept all Terms and Conditions to continue.";
      }
      if (currentStep === 5 && values.terms_agreement !== true)
        return "Please accept the Final Agreement to complete registration.";
      if (currentStep === 4 && errors.owner_details) {
        const ownershipError = Object.values(errors.owner_details).find(
          (error) =>
            error && typeof error === "string" && error.includes("ownership")
        );
        if (ownershipError) return ownershipError;
      }
      if (currentStep === 5 && errors.user_image) {
        const docError = Object.values(errors.user_image).find(
          (error) => error && typeof error === "string"
        );
        if (docError) return `Document required: ${docError}`;
      }

      for (const [key, value] of Object.entries(errors)) {
        if (value) {
          if (typeof value === "string") {
            if (key === "_form") continue;
            return value;
          } else if (Array.isArray(value)) {
            const firstArrayError = value.find(
              (item) => item && typeof item === "string"
            );
            if (firstArrayError) return firstArrayError;
          } else if (typeof value === "object") {
            const nestedError = getFirstErrorMessage(value);
            if (nestedError) return nestedError;
          }
        }
      }

      const stepSpecificMessages = {
        1: "Please complete all business information fields.",
        2: "Please complete all contact information and accept the terms.",
        3: "Please complete controller information.",
        4: "Please complete owner details and ensure ownership totals 100%.",
        5: "Please upload required documents and accept the final agreement.",
      };

      return (
        stepSpecificMessages[currentStep] || "Please check all required fields."
      );
    },
    []
  );

  const proceedToNextStep = useCallback(() => {
    let nextStep = currentStep + 1;
    if (currentStep === 4 && ownerAdd !== "Y") {
      nextStep = currentStep + 1;
    }
    dispatch(setCurrentStep(nextStep));
    dispatch(setErrorMessage(""));
    dispatch(setShowPopup(false));
    setPendingNextStep(false);
  }, [currentStep, dispatch, ownerAdd]);

  const handleNextStep = useCallback(
    async (values, { setErrors, setTouched, validateForm }) => {
      try {
        if (currentStep === 2) {
          validateStepDataFlow(2, 4, values);
        }
        setFormValues(values);
        setLocalFormData((prev) => ({ ...prev, ...values }));

        const stepFields = getStepFields(currentStep, values);
        const touchedFields = {};
        stepFields.forEach((field) => {
          if (field.includes("[") && field.includes("]")) {
            const baseField = field.split("[")[0];
            const index = field.match(/\[(\d+)\]/)?.[1];
            const subField = field.split(".")[1];
            if (index !== undefined) {
              if (!touchedFields[baseField]) touchedFields[baseField] = [];
              if (!touchedFields[baseField][index])
                touchedFields[baseField][index] = {};
              touchedFields[baseField][index][subField] = true;
            }
          } else {
            touchedFields[field] = true;
          }
        });
        setTouched(touchedFields);

        let formErrors = {};
        try {
          formErrors = await validateForm();
        } catch (validationError) {
          formErrors = {
            _form:
              "Validation error occurred. Please check all required fields are filled correctly.",
          };
        }

        // === ADD DEBUG FOR FORM ERRORS ===
        console.log("🔍 ALL FORM ERRORS:", formErrors);
        console.log(
          "🔍 CURRENT VALUES:",
          Object.keys(values)
            .filter((k) => values[k])
            .reduce((acc, key) => {
              acc[key] = values[key];
              return acc;
            }, {})
        );

        if (formErrors && typeof formErrors === "object" && !formErrors.then) {
          const stepComplete = isStepComplete(
            currentStep,
            values,
            formErrors,
            touchedFields
          );

          console.log("🔍 STEP COMPLETE:", stepComplete);
          console.log("🔍 FORM ERRORS COUNT:", Object.keys(formErrors).length);
          console.log("🔍 FORM ERROR KEYS:", Object.keys(formErrors));

          if (!stepComplete || Object.keys(formErrors).length > 0) {
            const firstError = getFirstErrorMessage(
              formErrors,
              values,
              currentStep
            );
            console.log("🔍 FIRST ERROR MESSAGE:", firstError);
            console.log(
              "🔍 ERROR SOURCE:",
              Object.keys(formErrors).find((key) => formErrors[key])
            );
            console.log(
              "🔍 SPECIFIC ERROR DETAILS:",
              Object.entries(formErrors).filter(([key, value]) => value)
            );

            dispatch(setErrorMessage(firstError));
            dispatch(setShowPopup(true));
            return;
          }

          if (
            currentStep === 2 &&
            isNamedAccount &&
            values.country === "United States"
          ) {
            setPendingNextStep(true);
            setShowSSNConfirmation(true);
            return;
          }
          proceedToNextStep();
        } else {
          dispatch(
            setErrorMessage(
              "Validation system error. Please refresh and try again."
            )
          );
          dispatch(setShowPopup(true));
        }
      } catch (error) {
        console.log("🔍 VALIDATION ERROR:", error);
        dispatch(
          setErrorMessage("An unexpected error occurred. Please try again.")
        );
        dispatch(setShowPopup(true));
      }
    },
    [
      currentStep,
      dispatch,
      getStepFields,
      isStepComplete,
      getFirstErrorMessage,
      isNamedAccount,
      proceedToNextStep,
    ]
  );

  const handleSSNConfirm = useCallback(() => {
    setShowSSNConfirmation(false);
    if (pendingNextStep) {
      proceedToNextStep();
    }
  }, [pendingNextStep, proceedToNextStep]);

  const handleSSNCancel = useCallback(() => {
    setShowSSNConfirmation(false);
    setPendingNextStep(false);
  }, []);

  const handleSubmit = useCallback(
    async (values, { setSubmitting, setErrors }) => {
      try {
        setIsSubmitting(true);
        setShowFullScreenLoader(true);

        const finalFormData = { ...getInitialFormData(), ...values };

        const userImagesArray = [];

        if (
          finalFormData.user_image &&
          typeof finalFormData.user_image === "object"
        ) {
          for (const [documentId, file] of Object.entries(
            finalFormData.user_image
          )) {
            if (file && file instanceof File) {
              try {
                const base64Data = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.readAsDataURL(file);
                  reader.onload = () => resolve(reader.result);
                  reader.onerror = (error) => reject(error);
                });

                userImagesArray.push({
                  document_id: documentId,
                  file_name: file.name,
                  file_data: base64Data,
                  file_type: file.type,
                  file_size: file.size,
                });
              } catch (error) {
                continue;
              }
            } else if (file && file.base64) {
              userImagesArray.push({
                document_id: documentId,
                file_name: file.name,
                file_data: file.base64,
                file_type: file.type,
                file_size: file.size,
              });
            }
          }
        }

        const finalErrors = await institutionSchema(5, {
          isNamedAccount,
          country: finalFormData.country_of_registration,
          currency: defaultCurrency?.code || defaultCurrency?.currency_code,
          kycVerify,
          documentUpload,
          ssnRequired: isNamedAccount,
          einRequired: isNamedAccount,
          accountType,
          showNAICSField: isNamedAccount,
          showEINField: isNamedAccount,
          showBusinessTypeField: isNamedAccount,
          showIndustryTypeField: true,
          showBusinessAliasField: isNamedAccount,
          showBusinessEmailField,
          showBusinessWebsiteField,
        })
          .validate(finalFormData, { abortEarly: false })
          .then(() => ({}))
          .catch((err) => {
            const validationErrors = {};
            err.inner.forEach((error) => {
              validationErrors[error.path] = error.message;
            });
            return validationErrors;
          });

        if (Object.keys(finalErrors).length > 0) {
          setErrors(finalErrors);
          setIsSubmitting(false);
          setShowFullScreenLoader(false);
          return;
        }

        const findCountryId = (countryName) => {
          if (!countryName) return null;
          const country = countryOptions.find(
            (opt) => opt.label === countryName
          );
          return country?.value || countryName;
        };

        const finalData = {
          ...finalFormData,
          agent_code: agentCode,
          referral_code: referralCode,
          ein: finalFormData.ein,
          naice_code: finalFormData.naice_code,
          business_type: finalFormData.business_type,
          business_alias: finalFormData.business_alias,
          company_phone_number: finalFormData.company_phone_number,
          companyphone_countrycode: finalFormData.companyphone_countrycode,
          business_email: finalFormData.business_email,
          business_website: finalFormData.business_website,

          user_images: userImagesArray,

          country_of_registration: findCountryId(
            finalFormData.country_of_registration
          ),
          country_of_operation: findCountryId(
            finalFormData.country_of_operation
          ),
          registered_address_street_country: findCountryId(
            finalFormData.registered_address_street_country
          ),
          resident_country: findCountryId(finalFormData.resident_country),
          country: findCountryId(finalFormData.country),
          doc_country: findCountryId(finalFormData.doc_country),

          controllerResidentCountry: findCountryId(
            finalFormData.controller_resident_country
          ),
          controllerCountry: findCountryId(finalFormData.controller_country),

          house_number: finalFormData.house_number,
          mobilenumber_countrycode: finalFormData.mobilenumber_countrycode,
          hostname: window.location.hostname,
          terms_and_conditions: finalFormData.terms_and_conditions || [],

          controllerFirstName: finalFormData.controller_first_name,
          controllerMiddleName: finalFormData.controller_middle_name,
          controllerLastName: finalFormData.controller_last_name,
          controllerCity: finalFormData.controller_city,
          controllerZipCode: finalFormData.controller_zip_code,
          controllerState: finalFormData.controller_state,
          controllerHouseNumber: finalFormData.controller_house_number,
          controllerDesignation: finalFormData.controller_designation,
          controllerDob: finalFormData.controller_dob,
          controllerEmail: finalFormData.controller_email,
          controllerPassword: finalFormData.controller_password,
          controllerPhoneCode:
            finalFormData.controller_mobilenumber_countrycode,
          controllerPhoneNumber: finalFormData.controller_mobile_number,
          controllerNationality: finalFormData.controller_nationality,
          controllerStreetAddress1: finalFormData.controller_street_address_1,
          controllerStreetAddress2:
            finalFormData.controller_street_address_2 || "",
          controllerGender: finalFormData.controller_gender,
          controllerSsn: finalFormData.controller_ssn,

          doc_type: finalFormData.doc_type,
          doc_id: finalFormData.doc_id,
          doc_state: finalFormData.doc_state,
          isPartnerPackageModule: institutionState.partnerPackageModule,
          package_currencies: packageCurrencies,
          whitelabelledpartnerid: institutionState.whiteLabelledPartnerId,
          kycVerify: kycVerify,
          documentType: finalFormData.selectedIdDocumentType,
          idDocumentTypeOther: finalFormData.idDocumentTypeOther,
          ssnIssuedState: finalFormData.ssnIssuedState,
          issuingCountryCode: finalFormData.idIssuedCountryCode,
          documentNumber: finalFormData.idDocumentNumber,
          idIssuedDate: finalFormData.idIssuedDate,
          ownerAdd: ownerAdd,

          owner_details: finalFormData.owner_details?.map((owner) => {
            const processedOwner = {
              ...owner,
              owner_country_id: findCountryId(owner.owner_country_id),
            };

            if (owner.owner_if === "no") {
              return processedOwner;
            }
            return {
              ...processedOwner,
              owner_dob:
                institutionState.isOwner === "yes"
                  ? finalFormData.dob
                  : owner.owner_dob,
            };
          }),

          is_named_account: isNamedAccount,
          has_usd_named_account: isNamedAccount,
          customer_type: "institution",
          selected_accounts: selectedAccounts,
        };

        delete finalData.user_image;

        const result = await dispatch(
          submitInstitutionForm(finalData)
        ).unwrap();

        if (
          result &&
          (result.status === "success" || result.success === true)
        ) {
          localStorage.removeItem("institution_registration_backup");
          localStorage.removeItem("uploadedFiles");

          const mobileNumber = `${finalData.mobilenumber_countrycode} ${finalData.mobile_number}`;

          navigate("/phoneverification", {
            state: {
              mobileNumber: mobileNumber,
              kyc_verify: kycVerify,
              customerData: result.data || null,
              customer_id: result.data?.customer_id,
              institution_name: finalData.institution_name,
            },
          });
        } else {
          if (result.message) {
            dispatch(setErrorMessage(result.message || "Registration failed"));
            dispatch(setShowPopup(true));
          } else if (result.errors) {
            const formattedErrors = {};
            Object.keys(result.errors).forEach((key) => {
              formattedErrors[key] = Array.isArray(result.errors[key])
                ? result.errors[key].join(", ")
                : result.errors[key];
            });

            setErrors(formattedErrors);

            const firstError = Object.values(formattedErrors)[0];
            dispatch(
              setErrorMessage(firstError || "Please check the form for errors")
            );
            dispatch(setShowPopup(true));
          } else {
            dispatch(setErrorMessage("Registration failed. Please try again."));
            dispatch(setShowPopup(true));
          }
        }
      } catch (error) {
        if (error.response && error.response.data) {
          const errorData = error.response.data;
          if (errorData.message) {
            dispatch(setErrorMessage(errorData.message));
          } else if (errorData.errors) {
            const firstError = Object.values(errorData.errors)[0];
            dispatch(
              setErrorMessage(
                Array.isArray(firstError) ? firstError[0] : firstError
              )
            );
          } else {
            dispatch(setErrorMessage("Registration failed. Please try again."));
          }
        } else {
          dispatch(
            setErrorMessage(
              error.message || "An unexpected error occurred. Please try again."
            )
          );
        }
        dispatch(setShowPopup(true));
      } finally {
        setIsSubmitting(false);
        setShowFullScreenLoader(false);
        setSubmitting(false);
      }
    },
    [
      dispatch,
      navigate,
      referralCode,
      agentCode,
      isNamedAccount,
      selectedAccounts,
      packageCurrencies,
      kycVerify,
      documentUpload,
      ownerAdd,
      getInitialFormData,
      defaultCurrency,
      accountType,
      showBusinessEmailField,
      showBusinessWebsiteField,
      institutionState,
      countryOptions,
    ]
  );

  const validateStepDataFlow = useCallback((fromStep, toStep, values) => {
    if (fromStep === 2 && toStep === 4) {
      const criticalFields = [
        "first_name",
        "last_name",
        "email",
        "country",
        "mobile_number",
        "mobilenumber_countrycode",
        "dob",
      ];
      const missingFields = criticalFields.filter((field) => !values[field]);
      if (missingFields.length > 0) {
        // Validation happens silently
      }
    }
  }, []);

  useEffect(() => {
    if (currentStep === 4) {
      validateStepDataFlow(2, 4, formValues);
    }
  }, [currentStep, formValues, validateStepDataFlow]);

  const naicsOptions = useMemo(
    () =>
      naicsCodes.map((code) => ({
        value: code.id || code.code, // Use id or code as value
        label: `${code.code} - ${
          code.description || `${code.category} - ${code.subcategory}`
        }`,
      })),
    [naicsCodes]
  );

  const businessTypeOptions = useMemo(
    () =>
      businessTypes.map((type) => ({
        value: type.name,
        label: type.label || type.name,
      })),
    [businessTypes]
  );
  const industryTypeOptions = useMemo(
    () =>
      industryTypes.map((type) => ({
        value: type.id.toString(),
        label: type.name,
      })),
    [industryTypes]
  );
  const genderOptions = useMemo(
    () => genders.map((gender) => ({ value: gender.id, label: gender.name })),
    [genders]
  );
  const nationalityOptions = useMemo(
    () =>
      nationalities.map((nationality) => ({
        value: nationality.id,
        label: nationality.name,
      })),
    [nationalities]
  );
  const roleOptions = useMemo(
    () => roles.map((role) => ({ value: role.id, label: role.name })),
    [roles]
  );
  const idDocumentTypeOptions = useMemo(
    () => idDocumentTypes.map((doc) => ({ value: doc.id, label: doc.name })),
    [idDocumentTypes]
  );

  const passwordValidationRules = useMemo(
    () => [
      { label: "At least 12 characters", regex: /^.{12,}$/ },
      { label: "At least one uppercase letter", regex: /[A-Z]/ },
      { label: "At least one lowercase letter", regex: /[a-z]/ },
      { label: "At least one number", regex: /\d/ },
      {
        label: "At least one special character",
        regex: /[!@#$%^&*(),.?":{}|<>]/,
      },
    ],
    []
  );

  const ControllerSection = React.memo(
    ({
      values,
      setFieldValue,
      handleBlur,
      touched,
      errors,
      countryOptions,
      countriesLoading,
      nationalityOptions,
      genderOptions,
      showPassword,
      showConfirmPassword,
      institutionState,
      showSSNField,
      enhancedHandleChange,
      enhancedPasswordChange,
      enhancedSelectChange,
      passwordValidationRules,
      formatTaxId,
    }) => {
      const dispatch = useDispatch();
      const syncControllerFromPrimary = useCallback(() => {
        const primaryContactFields = {
          controller_first_name: values.first_name,
          controller_middle_name: values.middle_name,
          controller_last_name: values.last_name,
          controller_email: values.email,
          controller_password: values.password,
          controller_confirm_password: values.confirm_password,
          controller_resident_country: values.resident_country,
          controller_nationality: values.nationality,
          controller_mobilenumber_countrycode: values.mobilenumber_countrycode,
          controller_mobile_number: values.mobile_number,
          controller_country: values.country,
          controller_state: values.state,
          controller_city: values.city,
          controller_street_address_1: values.street_address_1,
          controller_street_address_2: values.street_address_2,
          controller_zip_code: values.zip_code,
          controller_house_number: values.house_number,
          controller_gender: values.gender,
          controller_dob: values.dob,
          controller_designation: values.designation,
          controller_ssn: values.ssn,
        };
        Object.entries(primaryContactFields).forEach(([field, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            setFieldValue(field, value);
            dispatch(setFormField({ field, value }));
          }
        });
      }, [values, setFieldValue, dispatch]);

      const handleControllerCheckboxChange = (e) => {
        const isController = e.target.checked;
        setFieldValue("is_controller", isController ? "yes" : "no");
        if (isController) {
          syncControllerFromPrimary();
        } else {
          const controllerFields = [
            "controller_first_name",
            "controller_middle_name",
            "controller_last_name",
            "controller_email",
            "controller_password",
            "controller_confirm_password",
            "controller_resident_country",
            "controller_mobilenumber_countrycode",
            "controller_mobile_number",
            "controller_nationality",
            "controller_country",
            "controller_state",
            "controller_city",
            "controller_street_address_1",
            "controller_street_address_2",
            "controller_zip_code",
            "controller_house_number",
            "controller_gender",
            "controller_dob",
            "controller_designation",
            "controller_ssn",
          ];
          controllerFields.forEach((field) => {
            setFieldValue(field, "");
            dispatch(setFormField({ field, value: "" }));
          });
        }
      };

      return (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-medium mb-4 text-blue-600">
            Controller Information
          </h3>
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <label className="flex items-center">
              <Field
                type="checkbox"
                name="is_controller"
                className="mr-3 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                onChange={handleControllerCheckboxChange}
                checked={values.is_controller === "yes"}
              />
              <span className="text-lg font-medium text-gray-900">
                I am the controller of this institution
              </span>
            </label>
            <p className="text-sm text-gray-600 mt-2 ml-8">
              {values.is_controller === "yes"
                ? "✓ You have indicated that you are the controller. Your primary contact information has been automatically filled in the controller fields below."
                : "If you are not the controller, please provide the controller's details below."}
            </p>
          </div>

          <div
            className={`space-y-6 ${
              values.is_controller === "yes" ? "opacity-75" : ""
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Row 1: First Name & Middle Name */}
              <FormField
                id="controller_first_name"
                label="First Name"
                name="controller_first_name"
                value={values.controller_first_name || ""}
                onChange={enhancedHandleChange(
                  "controller_first_name",
                  setFieldValue,
                  setControllerFirstName
                )}
                onBlur={handleBlur}
                touched={touched.controller_first_name}
                error={errors.controller_first_name}
                required={values.is_controller === "no"}
                disabled={values.is_controller === "yes"}
                fieldStyles={FIELD_STYLES}
              />
              <FormField
                id="controller_middle_name"
                label="Middle Name (Optional)"
                name="controller_middle_name"
                value={values.controller_middle_name || ""}
                onChange={enhancedHandleChange(
                  "controller_middle_name",
                  setFieldValue,
                  setControllerMiddleName
                )}
                onBlur={handleBlur}
                touched={touched.controller_middle_name}
                error={errors.controller_middle_name}
                disabled={values.is_controller === "yes"}
                fieldStyles={FIELD_STYLES}
              />

              {/* Row 2: Last Name & Email */}
              <FormField
                id="controller_last_name"
                label="Last Name"
                name="controller_last_name"
                value={values.controller_last_name || ""}
                onChange={enhancedHandleChange(
                  "controller_last_name",
                  setFieldValue,
                  setControllerLastName
                )}
                onBlur={handleBlur}
                touched={touched.controller_last_name}
                error={errors.controller_last_name}
                required={values.is_controller === "no"}
                disabled={values.is_controller === "yes"}
                fieldStyles={FIELD_STYLES}
              />
              <FormField
                id="controller_email"
                label="Email"
                name="controller_email"
                type="email"
                value={values.controller_email || ""}
                onChange={enhancedHandleChange(
                  "controller_email",
                  setFieldValue,
                  setControllerEmail
                )}
                onBlur={handleBlur}
                touched={touched.controller_email}
                error={errors.controller_email}
                required={values.is_controller === "no"}
                disabled={values.is_controller === "yes"}
                fieldStyles={FIELD_STYLES}
              />

              {/* Row 3: Password & Confirm Password */}
              <PasswordField
                id="controller_password"
                label="Password"
                name="controller_password"
                value={values.controller_password || ""}
                onChange={enhancedPasswordChange(
                  "controller_password",
                  setFieldValue
                )}
                onBlur={handleBlur}
                touched={touched.controller_password}
                error={errors.controller_password}
                required={values.is_controller === "no"}
                disabled={values.is_controller === "yes"}
                visible={showPassword}
                onToggleVisibility={() => dispatch(togglePasswordVisibility())}
                validationRules={passwordValidationRules}
                fieldStyles={FIELD_STYLES}
              />
              <PasswordField
                id="controller_confirm_password"
                label="Confirm Password"
                name="controller_confirm_password"
                value={values.controller_confirm_password || ""}
                onChange={enhancedPasswordChange(
                  "controller_confirm_password",
                  setFieldValue
                )}
                onBlur={handleBlur}
                touched={touched.controller_confirm_password}
                error={errors.controller_confirm_password}
                required={values.is_controller === "no"}
                disabled={values.is_controller === "yes"}
                visible={showConfirmPassword}
                onToggleVisibility={() =>
                  dispatch(toggleConfirmPasswordVisibility())
                }
                fieldStyles={FIELD_STYLES}
              />

              {/* Row 4: Resident Country & Nationality */}
              <SelectField
                id="controller_resident_country"
                label="Resident Country"
                options={countryOptions || []}
                onChange={(option) => {
                  if (option) {
                    setFieldValue("controller_resident_country", option.value);
                    dispatch(
                      setFormField({
                        field: "controller_resident_country",
                        value: option.value,
                      })
                    );
                  }
                }}
                value={(countryOptions || []).find(
                  (opt) => opt.value === values.controller_resident_country
                )}
                touched={touched.controller_resident_country}
                error={errors.controller_resident_country}
                required={values.is_controller === "no"}
                disabled={values.is_controller === "yes"}
                isLoading={countriesLoading || countryOptions.length === 0}
                isCountryField={true}
                showPhoneCode={false}
                fieldStyles={FIELD_STYLES}
              />
              <SelectField
                id="controller_nationality"
                label="Nationality"
                options={nationalityOptions}
                onChange={(option) => {
                  if (option) {
                    setFieldValue("controller_nationality", option.value);
                    dispatch(
                      setFormField({
                        field: "controller_nationality",
                        value: option.value,
                      })
                    );
                  }
                }}
                value={nationalityOptions.find(
                  (opt) => opt.value === values.controller_nationality
                )}
                touched={touched.controller_nationality}
                error={errors.controller_nationality}
                required={values.is_controller === "no"}
                disabled={values.is_controller === "yes"}
                isCountryField={true}
                showPhoneCode={false}
                fieldStyles={FIELD_STYLES}
              />

              {/* Row 5: Phone Number (Full Width) */}
              <div className="md:col-span-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-3">
                    <div className="w-1/2 min-w-[180px]">
                      <SelectField
                        id="controller_mobilenumber_countrycode"
                        label="Country Code"
                        options={countryOptions}
                        value={countryOptions.find(
                          (opt) =>
                            opt.phoneCode ===
                              values.controller_mobilenumber_countrycode ||
                            opt.phone_code ===
                              values.controller_mobilenumber_countrycode
                        )}
                        onChange={(option) => {
                          if (option) {
                            setFieldValue(
                              "controller_mobilenumber_countrycode",
                              option.phoneCode || option.phone_code || ""
                            );
                            if (
                              option.value &&
                              option.value !== values.controller_country
                            ) {
                              setFieldValue("controller_country", option.value);
                            }
                          }
                        }}
                        onBlur={handleBlur}
                        touched={touched.controller_mobilenumber_countrycode}
                        error={errors.controller_mobilenumber_countrycode}
                        required={values.is_controller === "no"}
                        disabled={values.is_controller === "yes"}
                        isLoading={countriesLoading}
                        isCountryField={true}
                        showPhoneCode={true}
                        fieldStyles={FIELD_STYLES}
                      />
                    </div>
                    <div className="w-1/2">
                      <FormField
                        id="controller_mobile_number"
                        label="Phone Number"
                        name="controller_mobile_number"
                        value={values.controller_mobile_number || ""}
                        onChange={enhancedHandleChange(
                          "controller_mobile_number",
                          setFieldValue
                        )}
                        onBlur={handleBlur}
                        touched={touched.controller_mobile_number}
                        error={errors.controller_mobile_number}
                        required={values.is_controller === "no"}
                        disabled={values.is_controller === "yes"}
                        placeholder="e.g., 1234567890"
                        fieldStyles={FIELD_STYLES}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 6: Country & State */}
              <SelectField
                id="controller_country"
                label="Country"
                options={countryOptions}
                onChange={(option) => {
                  if (option) {
                    setFieldValue("controller_country", option.value);
                    dispatch(
                      setFormField({
                        field: "controller_country",
                        value: option.value,
                      })
                    );
                  }
                }}
                value={countryOptions.find(
                  (opt) => opt.value === values.controller_country
                )}
                touched={touched.controller_country}
                error={errors.controller_country}
                required={values.is_controller === "no"}
                disabled={values.is_controller === "yes"}
                isLoading={countriesLoading}
                isCountryField={true}
                showPhoneCode={false}
                fieldStyles={FIELD_STYLES}
              />
              <FormField
                id="controller_state"
                label="State/Province"
                name="controller_state"
                value={values.controller_state || ""}
                onChange={enhancedHandleChange(
                  "controller_state",
                  setFieldValue
                )}
                onBlur={handleBlur}
                touched={touched.controller_state}
                error={errors.controller_state}
                required={values.is_controller === "no"}
                disabled={values.is_controller === "yes"}
                fieldStyles={FIELD_STYLES}
              />

              {/* Row 7: City & Street Address 1 */}
              <FormField
                id="controller_city"
                label="City"
                name="controller_city"
                value={values.controller_city || ""}
                onChange={enhancedHandleChange(
                  "controller_city",
                  setFieldValue
                )}
                onBlur={handleBlur}
                touched={touched.controller_city}
                error={errors.controller_city}
                required={values.is_controller === "no"}
                disabled={values.is_controller === "yes"}
                fieldStyles={FIELD_STYLES}
              />
              <FormField
                id="controller_street_address_1"
                label="Street Address 1"
                name="controller_street_address_1"
                value={values.controller_street_address_1 || ""}
                onChange={enhancedHandleChange(
                  "controller_street_address_1",
                  setFieldValue
                )}
                onBlur={handleBlur}
                touched={touched.controller_street_address_1}
                error={errors.controller_street_address_1}
                required={values.is_controller === "no"}
                disabled={values.is_controller === "yes"}
                fieldStyles={FIELD_STYLES}
              />

              {/* Row 8: Street Address 2 & ZIP Code */}
              <FormField
                id="controller_street_address_2"
                label="Street Address 2 (Optional)"
                name="controller_street_address_2"
                value={values.controller_street_address_2 || ""}
                onChange={enhancedHandleChange(
                  "controller_street_address_2",
                  setFieldValue
                )}
                onBlur={handleBlur}
                touched={touched.controller_street_address_2}
                error={errors.controller_street_address_2}
                disabled={values.is_controller === "yes"}
                fieldStyles={FIELD_STYLES}
              />
              <FormField
                id="controller_zip_code"
                label="ZIP/Postal Code"
                name="controller_zip_code"
                value={values.controller_zip_code || ""}
                onChange={enhancedHandleChange(
                  "controller_zip_code",
                  setFieldValue
                )}
                onBlur={handleBlur}
                touched={touched.controller_zip_code}
                error={errors.controller_zip_code}
                required={values.is_controller === "no"}
                disabled={values.is_controller === "yes"}
                fieldStyles={FIELD_STYLES}
              />

              {/* Row 9: House Number & Gender */}
              <FormField
                id="controller_house_number"
                label="House Number"
                name="controller_house_number"
                value={values.controller_house_number || ""}
                onChange={enhancedHandleChange(
                  "controller_house_number",
                  setFieldValue
                )}
                onBlur={handleBlur}
                touched={touched.controller_house_number}
                error={errors.controller_house_number}
                required={values.is_controller === "no"}
                disabled={values.is_controller === "yes"}
                fieldStyles={FIELD_STYLES}
              />
              <SelectField
                id="controller_gender"
                label="Gender"
                options={genderOptions}
                onChange={(option) => {
                  if (option) {
                    setFieldValue("controller_gender", option.value);
                    dispatch(
                      setFormField({
                        field: "controller_gender",
                        value: option.value,
                      })
                    );
                  }
                }}
                value={genderOptions.find(
                  (opt) => opt.value === values.controller_gender
                )}
                touched={touched.controller_gender}
                error={errors.controller_gender}
                required={values.is_controller === "no"}
                disabled={values.is_controller === "yes"}
                fieldStyles={FIELD_STYLES}
              />

              {/* Row 10: Date of Birth & Designation */}
              <FormField
                id="controller_dob"
                label="Date of Birth"
                name="controller_dob"
                type="date"
                value={values.controller_dob || ""}
                onChange={enhancedHandleChange("controller_dob", setFieldValue)}
                onBlur={handleBlur}
                touched={touched.controller_dob}
                error={errors.controller_dob}
                required={values.is_controller === "no"}
                disabled={values.is_controller === "yes"}
                fieldStyles={FIELD_STYLES}
              />
              <FormField
                id="controller_designation"
                label="Designation"
                name="controller_designation"
                value={values.controller_designation || ""}
                onChange={enhancedHandleChange(
                  "controller_designation",
                  setFieldValue
                )}
                onBlur={handleBlur}
                touched={touched.controller_designation}
                error={errors.controller_designation}
                disabled={values.is_controller === "yes"}
                fieldStyles={FIELD_STYLES}
              />

              {/* Row 11: SSN Field (Conditional - Full Width) */}
              {values.controller_country === "United States" &&
                isNamedAccount &&
                values.is_controller === "no" && (
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <FormField
                          id="controller_ssn"
                          label="Social Security Number (SSN)"
                          name="controller_ssn"
                          value={values.controller_ssn || ""}
                          onChange={(e) => {
                            const formatted = formatTaxId(
                              e.target.value,
                              "ssn"
                            );
                            enhancedHandleChange(
                              "controller_ssn",
                              setFieldValue
                            )({ target: { value: formatted } });
                          }}
                          onBlur={handleBlur}
                          touched={touched.controller_ssn}
                          error={errors.controller_ssn}
                          required={true}
                          disabled={values.is_controller === "yes"}
                          placeholder="XXX-XX-XXXX"
                          fieldStyles={FIELD_STYLES}
                        />
                      </div>
                      <div className="mt-6">
                        <SSNInfoPopup />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Required for US residents with USD Named Accounts for tax
                      reporting purposes.
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      );
    }
  );

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* ADD FULL SCREEN LOADER */}
      {showFullScreenLoader && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center">
            <RingLoader
              color="#3b82f6"
              size={80}
              loading={showFullScreenLoader}
            />
            <p className="mt-6 text-gray-700 font-medium text-lg">
              Setting up your business account...
            </p>
            <p className="mt-2 text-gray-500 text-sm">
              This may take a few moments
            </p>
          </div>
        </div>
      )}

      {/* ADD SUBMITTING LOADER */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center">
            <RingLoader color="#3b82f6" size={50} loading={isSubmitting} />
            <p className="mt-4 text-gray-600 font-medium">
              Processing your business registration...
            </p>
          </div>
        </div>
      )}

      <SelectorDebug />
      {loading && (
        <>
          <div className="fixed inset-0 bg-gray-900 bg-opacity-60 z-50"></div>
          <div className="absolute inset-0 flex justify-center items-center z-50">
            <RingLoader color="#36d7b7" loading={loading} size={50} />
          </div>
        </>
      )}

      <FormHeader
        title="Business Account Registration"
        subtitle="Complete your business account setup in a few simple steps"
        icon={<i className="fas fa-building text-blue-600 text-xl"></i>}
      />

      <BenefitsSection />

      <Formik
        initialValues={getInitialFormData()}
        validationSchema={institutionSchema(currentStep, {
          isNamedAccount,
          country: getInitialFormData().country_of_registration,
          currency: defaultCurrency?.code || defaultCurrency?.currency_code,
          kycVerify,
          documentUpload,
          ssnRequired: isNamedAccount,
          einRequired: isNamedAccount,
          accountType,
          showNAICSField: isNamedAccount,
          showEINField,
          showBusinessTypeField,
          showIndustryTypeField,
          showBusinessAliasField,
          showBusinessEmailField,
          showBusinessWebsiteField,
        })}
        validateOnBlur={true}
        validateOnChange={false}
        onSubmit={handleSubmit}
        enableReinitialize={false}
      >
        {({
          values,
          setFieldValue,
          handleBlur,
          handleChange,
          errors,
          touched,
          validateForm,
          setErrors,
          setTouched,
          isSubmitting,
        }) => {
          React.useEffect(() => {
            setFormValues(values);
          }, [values]);

          const shouldShowSSNField = isNamedAccount && values.country === 186;

          return (
            <Form className="space-y-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div key={step} className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          currentStep >= step
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {step}
                      </div>
                      <span className="text-xs mt-1">Step {step}</span>
                    </div>
                  ))}
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / 5) * 100}%` }}
                  ></div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.5 }}
                    className="bg-white p-6 rounded-lg shadow-sm"
                  >
                    <h2 className="text-xl font-semibold mb-4">
                      Business Information
                    </h2>
                    {accountType && (
                      <div
                        className={`mb-4 p-3 rounded-lg ${
                          accountType === "named"
                            ? "bg-green-50 border border-green-200"
                            : "bg-blue-50 border border-blue-200"
                        }`}
                      >
                        <p className="text-sm font-medium">
                          Account Type:{" "}
                          <span className="capitalize">{accountType}</span>
                          {isNamedAccount && " - Business Alias Required"}
                        </p>
                      </div>
                    )}

                    {/* Business Name and Registration Number on same row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <FormField
                        id="institution_name"
                        label="Business Name"
                        name="institution_name"
                        value={values.institution_name || ""}
                        onChange={enhancedHandleChange(
                          "institution_name",
                          setFieldValue,
                          setBusinessInstitutionName
                        )}
                        onBlur={handleBlur}
                        onFocus={() => setActiveField("institution_name")}
                        touched={touched.institution_name}
                        error={errors.institution_name}
                        required
                        activeField={activeField}
                        fieldStyles={FIELD_STYLES}
                      />
                      <FormField
                        id="registration_number"
                        label="Registration Number"
                        name="registration_number"
                        value={values.registration_number || ""}
                        onChange={enhancedHandleChange(
                          "registration_number",
                          setFieldValue
                        )}
                        onBlur={handleBlur}
                        onFocus={() => setActiveField("registration_number")}
                        touched={touched.registration_number}
                        error={errors.registration_number}
                        required
                        activeField={activeField}
                        fieldStyles={FIELD_STYLES}
                      />
                    </div>

                    {/* Business Alias and Business Type on same row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {showBusinessAliasField && (
                        <FormField
                          id="business_alias"
                          label="Business Alias"
                          name="business_alias"
                          value={values.business_alias || ""}
                          onChange={enhancedHandleChange(
                            "business_alias",
                            setFieldValue,
                            setBusinessAlias
                          )}
                          onBlur={handleBlur}
                          onFocus={() => setActiveField("business_alias")}
                          touched={touched.business_alias}
                          error={errors.business_alias}
                          required={showBusinessAliasField}
                          activeField={activeField}
                          placeholder="Unique business identifier"
                          fieldStyles={FIELD_STYLES}
                        />
                      )}
                      {showBusinessTypeField && (
                        <SelectField
                          id="business_type"
                          label="Business Type"
                          options={businessTypeOptions}
                          onChange={enhancedSelectChange(
                            "business_type",
                            setFieldValue,
                            setBusinessInstitutionBusinessType
                          )}
                          value={businessTypeOptions.find(
                            (opt) => opt.value === values.business_type
                          )}
                          touched={touched.business_type}
                          error={errors.business_type}
                          required={showBusinessTypeField}
                          fieldStyles={FIELD_STYLES}
                        />
                      )}
                    </div>

                    {/* EIN and NAICS Code on same row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {showEINField && (
                        <FormField
                          id="ein"
                          label="EIN (Employer Identification Number)"
                          name="ein"
                          value={values.ein || ""}
                          onChange={(e) => {
                            const formatted = formatTaxId(
                              e.target.value,
                              "ein"
                            );
                            enhancedHandleChange(
                              "ein",
                              setFieldValue,
                              setBusinessInstitutionEIN
                            )({ target: { value: formatted } });
                          }}
                          onBlur={handleBlur}
                          onFocus={() => setActiveField("ein")}
                          touched={touched.ein}
                          error={errors.ein}
                          required={showEINField}
                          placeholder="XX-XXXXXXX"
                          activeField={activeField}
                          fieldStyles={FIELD_STYLES}
                        />
                      )}

                      {/* NAICS Code Field */}
                      {showNAICSField && isNamedAccount && (
                        <SelectField
                          id="naice_code"
                          label="NAICS Code (Required for USD Named Accounts)"
                          options={naicsOptions}
                          onChange={enhancedSelectChange(
                            "naice_code",
                            setFieldValue,
                            setBusinessInstitutionNAICS
                          )}
                          value={naicsOptions.find(
                            (opt) => opt.value === values.naice_code
                          )}
                          touched={touched.naice_code}
                          error={errors.naice_code}
                          required={true}
                          fieldStyles={FIELD_STYLES}
                        />
                      )}
                    </div>

                    {/* Industry Type on full row */}
                    <div className="mb-6">
                      <label
                        htmlFor="industry_type"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Industry Type <span className="text-red-500">*</span>
                      </label>
                      <Select
                        inputId="industry_type"
                        name="industry_type"
                        options={industryTypeOptions}
                        value={industryTypeOptions.find(
                          (opt) =>
                            opt.value === values.industry_type?.toString()
                        )}
                        onChange={enhancedSelectChange(
                          "industry_type",
                          setFieldValue
                        )}
                        onBlur={handleBlur}
                        isSearchable
                        placeholder="Select Industry Type"
                        className="basic-single"
                        classNamePrefix="select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: "50px",
                            borderColor:
                              touched.industry_type && errors.industry_type
                                ? "#ef4444"
                                : "#d1d5db",
                            borderRadius: "0.5rem",
                            padding: "0.25rem 0.5rem",
                            fontSize: "0.875rem",
                            "&:hover": {
                              borderColor:
                                touched.industry_type && errors.industry_type
                                  ? "#ef4444"
                                  : "#9ca3af",
                            },
                          }),
                          placeholder: (base) => ({
                            ...base,
                            fontSize: "0.875rem",
                            color: "#6b7280",
                          }),
                          menu: (base) => ({
                            ...base,
                            fontSize: "0.875rem",
                          }),
                        }}
                      />
                      {touched.industry_type && errors.industry_type && (
                        <div className="text-red-500 text-xs mt-1">
                          {errors.industry_type}
                        </div>
                      )}
                    </div>

                    <div className="mt-8">
                      <h3 className="text-lg font-medium mb-4 text-blue-600 border-b border-blue-200 pb-2">
                        Country Information
                      </h3>

                      {/* Country of Registration and Primary Country of Operation on same row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <SelectField
                          id="country_of_registration"
                          label="Country of Registration"
                          options={countryOptions}
                          onChange={enhancedSelectChange(
                            "country_of_registration",
                            setFieldValue
                          )}
                          value={countryOptions.find(
                            (opt) =>
                              opt.value === values.country_of_registration
                          )}
                          touched={touched.country_of_registration}
                          error={errors.country_of_registration}
                          required
                          isLoading={countriesLoading}
                          fieldStyles={FIELD_STYLES}
                          isCountryField={true}
                          showPhoneCode={false}
                        />
                        <SelectField
                          id="country_of_operation"
                          label="Primary Country of Operation"
                          options={countryOptions}
                          onChange={enhancedSelectChange(
                            "country_of_operation",
                            setFieldValue
                          )}
                          value={countryOptions.find(
                            (opt) => opt.value === values.country_of_operation
                          )}
                          touched={touched.country_of_operation}
                          error={errors.country_of_operation}
                          required
                          isLoading={countriesLoading}
                          fieldStyles={FIELD_STYLES}
                          isCountryField={true}
                          showPhoneCode={false}
                        />
                      </div>

                      {/* Additional Operating Countries on full row */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Operating Countries (Optional)
                        </label>
                        <Select
                          isMulti
                          options={countryOptions}
                          value={countryOptions.filter((opt) =>
                            values.operating_countries?.includes(opt.value)
                          )}
                          onChange={(selectedOptions) => {
                            setFieldValue(
                              "operating_countries",
                              selectedOptions
                                ? selectedOptions.map((opt) => opt.value)
                                : []
                            );
                          }}
                          placeholder="Select countries..."
                          isLoading={countriesLoading}
                          isCountryField={true}
                          showPhoneCode={false}
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: "50px",
                              borderColor: "#d1d5db",
                              borderRadius: "0.5rem",
                              "&:hover": {
                                borderColor: "#9ca3af",
                              },
                            }),
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-8">
                      <h3 className="text-lg font-medium mb-3">
                        Registered Address
                      </h3>

                      {/* Street Address and Street Address 2 on same row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormField
                          id="registered_address_street_1"
                          label="Street Address"
                          name="registered_address_street_1"
                          value={values.registered_address_street_1 || ""}
                          onChange={enhancedHandleChange(
                            "registered_address_street_1",
                            setFieldValue
                          )}
                          onBlur={handleBlur}
                          onFocus={() =>
                            setActiveField("registered_address_street_1")
                          }
                          touched={touched.registered_address_street_1}
                          error={errors.registered_address_street_1}
                          required
                          activeField={activeField}
                          fieldStyles={FIELD_STYLES}
                        />
                        <FormField
                          id="registered_address_street_2"
                          label="Street Address 2 (Optional)"
                          name="registered_address_street_2"
                          value={values.registered_address_street_2 || ""}
                          onChange={enhancedHandleChange(
                            "registered_address_street_2",
                            setFieldValue
                          )}
                          onBlur={handleBlur}
                          onFocus={() =>
                            setActiveField("registered_address_street_2")
                          }
                          touched={touched.registered_address_street_2}
                          error={errors.registered_address_street_2}
                          activeField={activeField}
                          fieldStyles={FIELD_STYLES}
                        />
                      </div>

                      {/* City and State/Province on same row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormField
                          id="registered_address_street_city"
                          label="City"
                          name="registered_address_street_city"
                          value={values.registered_address_street_city || ""}
                          onChange={enhancedHandleChange(
                            "registered_address_street_city",
                            setFieldValue
                          )}
                          onBlur={handleBlur}
                          onFocus={() =>
                            setActiveField("registered_address_street_city")
                          }
                          touched={touched.registered_address_street_city}
                          error={errors.registered_address_street_city}
                          required
                          activeField={activeField}
                          fieldStyles={FIELD_STYLES}
                        />
                        <FormField
                          id="registered_address_street_state"
                          label="State/Province"
                          name="registered_address_street_state"
                          value={values.registered_address_street_state || ""}
                          onChange={enhancedHandleChange(
                            "registered_address_street_state",
                            setFieldValue
                          )}
                          onBlur={handleBlur}
                          onFocus={() =>
                            setActiveField("registered_address_street_state")
                          }
                          touched={touched.registered_address_street_state}
                          error={errors.registered_address_street_state}
                          required
                          activeField={activeField}
                          fieldStyles={FIELD_STYLES}
                        />
                      </div>

                      {/* ZIP/Postal Code and Registered Address Country on same row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormField
                          id="registered_address_street_zip"
                          label="ZIP/Postal Code"
                          name="registered_address_street_zip"
                          value={values.registered_address_street_zip || ""}
                          onChange={enhancedHandleChange(
                            "registered_address_street_zip",
                            setFieldValue
                          )}
                          onBlur={handleBlur}
                          onFocus={() =>
                            setActiveField("registered_address_street_zip")
                          }
                          touched={touched.registered_address_street_zip}
                          error={errors.registered_address_street_zip}
                          required
                          activeField={activeField}
                          fieldStyles={FIELD_STYLES}
                        />
                        <SelectField
                          id="registered_address_street_country"
                          label="Registered Address Country"
                          options={countryOptions}
                          onChange={enhancedSelectChange(
                            "registered_address_street_country",
                            setFieldValue
                          )}
                          value={countryOptions.find(
                            (opt) =>
                              opt.value ===
                              values.registered_address_street_country
                          )}
                          touched={touched.registered_address_street_country}
                          error={errors.registered_address_street_country}
                          required
                          isLoading={countriesLoading}
                          fieldStyles={FIELD_STYLES}
                          isCountryField={true}
                          showPhoneCode={false}
                        />
                      </div>

                      {/* Date of Incorporation on full row */}
                      <div className="mt-4">
                        <FormField
                          id="date_incorporation"
                          label="Date of Incorporation"
                          name="date_incorporation"
                          type="date"
                          value={values.date_incorporation || ""}
                          onChange={enhancedHandleChange(
                            "date_incorporation",
                            setFieldValue
                          )}
                          onBlur={handleBlur}
                          onFocus={() => setActiveField("date_incorporation")}
                          touched={touched.date_incorporation}
                          error={errors.date_incorporation}
                          required
                          activeField={activeField}
                          fieldStyles={FIELD_STYLES}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.5 }}
                    className="bg-white p-6 rounded-lg shadow-sm"
                  >
                    <h2 className="text-xl font-semibold mb-4">
                      Responsible Person Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        id="first_name"
                        label="First Name"
                        name="first_name"
                        value={values.first_name || ""}
                        onChange={enhancedHandleChange(
                          "first_name",
                          setFieldValue,
                          setResponsiblePersonFirstName
                        )}
                        onBlur={handleBlur}
                        onFocus={() => setActiveField("first_name")}
                        touched={touched.first_name}
                        error={errors.first_name}
                        required
                        activeField={activeField}
                        fieldStyles={FIELD_STYLES}
                      />
                      <FormField
                        id="middle_name"
                        label="Middle Name (Optional)"
                        name="middle_name"
                        value={values.middle_name || ""}
                        onChange={enhancedHandleChange(
                          "middle_name",
                          setFieldValue,
                          setResponsiblePersonMiddleName
                        )}
                        onBlur={handleBlur}
                        onFocus={() => setActiveField("middle_name")}
                        touched={touched.middle_name}
                        error={errors.middle_name}
                        activeField={activeField}
                        fieldStyles={FIELD_STYLES}
                      />
                      <FormField
                        id="last_name"
                        label="Last Name"
                        name="last_name"
                        value={values.last_name || ""}
                        onChange={enhancedHandleChange(
                          "last_name",
                          setFieldValue,
                          setResponsiblePersonLastName
                        )}
                        onBlur={handleBlur}
                        onFocus={() => setActiveField("last_name")}
                        touched={touched.last_name}
                        error={errors.last_name}
                        required
                        activeField={activeField}
                        fieldStyles={FIELD_STYLES}
                      />
                      <FormField
                        id="email"
                        label="Email Address"
                        name="email"
                        type="email"
                        value={values.email || ""}
                        onChange={enhancedHandleChange(
                          "email",
                          setFieldValue,
                          setResponsiblePersonEmail
                        )}
                        onBlur={handleBlur}
                        onFocus={() => setActiveField("email")}
                        touched={touched.email}
                        error={errors.email}
                        required
                        activeField={activeField}
                        fieldStyles={FIELD_STYLES}
                      />
                      <PasswordField
                        id="password"
                        label="Password"
                        name="password"
                        value={values.password || ""}
                        onChange={enhancedPasswordChange(
                          "password",
                          setFieldValue,
                          setResponsiblePersonPassword
                        )}
                        onBlur={handleBlur}
                        onFocus={() => setActiveField("password")}
                        touched={touched.password}
                        error={errors.password}
                        required
                        activeField={activeField}
                        visible={showPassword}
                        onToggleVisibility={() =>
                          dispatch(togglePasswordVisibility())
                        }
                        validationRules={passwordValidationRules}
                        fieldStyles={FIELD_STYLES}
                      />
                      <PasswordField
                        id="confirm_password"
                        label="Confirm Password"
                        name="confirm_password"
                        value={values.confirm_password || ""}
                        onChange={enhancedPasswordChange(
                          "confirm_password",
                          setFieldValue
                        )}
                        onBlur={handleBlur}
                        onFocus={() => setActiveField("confirm_password")}
                        touched={touched.confirm_password}
                        error={errors.confirm_password}
                        required
                        activeField={activeField}
                        visible={showConfirmPassword}
                        onToggleVisibility={() =>
                          dispatch(toggleConfirmPasswordVisibility())
                        }
                        fieldStyles={FIELD_STYLES}
                        // Add password match validation
                        showPasswordMatch={
                          values.password && values.confirm_password
                        }
                        passwordsMatch={
                          values.password === values.confirm_password
                        }
                      />

                      {/* Resident Country and Phone Number on same row */}
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SelectField
                          id="resident_country"
                          label="Resident Country"
                          options={countryOptions}
                          onChange={enhancedSelectChange(
                            "resident_country",
                            setFieldValue
                          )}
                          value={countryOptions.find(
                            (opt) => opt.value === values.resident_country
                          )}
                          touched={touched.resident_country}
                          error={errors.resident_country}
                          required
                          isLoading={countriesLoading}
                          fieldStyles={FIELD_STYLES}
                          isCountryField={true}
                          showPhoneCode={false}
                        />

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <div className="flex space-x-3">
                            <div className="w-1/2 min-w-[180px]">
                              <Select
                                options={countryOptions}
                                value={countryOptions.find(
                                  (opt) =>
                                    opt.phoneCode ===
                                      values.mobilenumber_countrycode ||
                                    opt.phone_code ===
                                      values.mobilenumber_countrycode
                                )}
                                onChange={(option) => {
                                  if (option) {
                                    setFieldValue(
                                      "mobilenumber_countrycode",
                                      option.phoneCode ||
                                        option.phone_code ||
                                        ""
                                    );
                                  }
                                }}
                                onBlur={handleBlur}
                                placeholder="Select Country Code"
                                formatOptionLabel={formatOptionLabel}
                                filterOption={filterOption} // Add this line
                                isSearchable
                                isLoading={countriesLoading}
                                styles={{
                                  control: (base) => ({
                                    ...base,
                                    minHeight: "50px",
                                    borderColor: "#d1d5db",
                                    borderRadius: "0.5rem",
                                    "&:hover": {
                                      borderColor: "#9ca3af",
                                    },
                                  }),
                                }}
                              />
                            </div>
                            <div className="w-1/2">
                              <input
                                type="tel"
                                name="mobile_number"
                                value={values.mobile_number || ""}
                                onChange={enhancedHandleChange(
                                  "mobile_number",
                                  setFieldValue
                                )}
                                onBlur={handleBlur}
                                className={`${FIELD_STYLES.base} h-[50px]`}
                                placeholder="e.g., 1234567890"
                              />
                            </div>
                          </div>
                          {touched.mobile_number && errors.mobile_number && (
                            <p className="text-red-500 text-xs flex items-center mt-1">
                              <FontAwesomeIcon
                                icon={faInfoCircle}
                                className="mr-1 w-3 h-3"
                              />
                              {errors.mobile_number}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Nationality and Gender on same row */}
                      <SelectField
                        id="nationality"
                        label="Nationality"
                        options={nationalityOptions}
                        onChange={enhancedSelectChange(
                          "nationality",
                          setFieldValue
                        )}
                        value={nationalityOptions.find(
                          (opt) => opt.value === values.nationality
                        )}
                        touched={touched.nationality}
                        error={errors.nationality}
                        required
                        fieldStyles={FIELD_STYLES}
                      />
                      <SelectField
                        id="gender"
                        label="Gender"
                        options={genderOptions}
                        onChange={enhancedSelectChange("gender", setFieldValue)}
                        value={genderOptions.find(
                          (opt) => opt.value === values.gender
                        )}
                        touched={touched.gender}
                        error={errors.gender}
                        required
                        fieldStyles={FIELD_STYLES}
                      />

                      {/* Date of Birth and Designation on same row */}
                      <FormField
                        id="dob"
                        label="Date of Birth"
                        name="dob"
                        type="date"
                        value={values.dob || ""}
                        onChange={enhancedHandleChange("dob", setFieldValue)}
                        onBlur={handleBlur}
                        onFocus={() => setActiveField("dob")}
                        touched={touched.dob}
                        error={errors.dob}
                        required
                        activeField={activeField}
                        fieldStyles={FIELD_STYLES}
                      />
                      <FormField
                        id="designation"
                        label="Designation"
                        name="designation"
                        value={values.designation || ""}
                        onChange={enhancedHandleChange(
                          "designation",
                          setFieldValue
                        )}
                        onBlur={handleBlur}
                        onFocus={() => setActiveField("designation")}
                        touched={touched.designation}
                        error={errors.designation}
                        activeField={activeField}
                        fieldStyles={FIELD_STYLES}
                      />

                      {/* ID Document Type and ID Document Number on same row */}
                      <SelectField
                        id="doc_type"
                        label="ID Document Type"
                        options={idDocumentTypeOptions}
                        onChange={enhancedSelectChange(
                          "doc_type",
                          setFieldValue
                        )}
                        value={idDocumentTypeOptions.find(
                          (opt) => opt.value === values.doc_type
                        )}
                        touched={touched.doc_type}
                        error={errors.doc_type}
                        required
                        fieldStyles={FIELD_STYLES}
                      />
                      <FormField
                        id="doc_id"
                        label="ID Document Number"
                        name="doc_id"
                        value={values.doc_id || ""}
                        onChange={enhancedHandleChange("doc_id", setFieldValue)}
                        onBlur={handleBlur}
                        onFocus={() => setActiveField("doc_id")}
                        touched={touched.doc_id}
                        error={errors.doc_id}
                        required
                        activeField={activeField}
                        fieldStyles={FIELD_STYLES}
                      />

                      {/* ID Issuing Country and ID Issue Date on same row */}
                      <SelectField
                        id="doc_country"
                        label="ID Issuing Country"
                        options={countryOptions}
                        onChange={enhancedSelectChange(
                          "doc_country",
                          setFieldValue
                        )}
                        value={countryOptions.find(
                          (opt) => opt.value === values.doc_country
                        )}
                        touched={touched.doc_country}
                        error={errors.doc_country}
                        required
                        isLoading={countriesLoading}
                        fieldStyles={FIELD_STYLES}
                        isCountryField={true}
                        showPhoneCode={false}
                      />
                      <FormField
                        id="id_issued_date"
                        label="ID Issue Date"
                        name="id_issued_date"
                        type="date"
                        value={values.id_issued_date || ""}
                        onChange={enhancedHandleChange(
                          "id_issued_date",
                          setFieldValue
                        )}
                        onBlur={handleBlur}
                        onFocus={() => setActiveField("id_issued_date")}
                        touched={touched.id_issued_date}
                        error={errors.id_issued_date}
                        required
                        activeField={activeField}
                        fieldStyles={FIELD_STYLES}
                      />

                      {/* === SSN FIELD DEBUG === */}
                      {console.log("=== SSN FIELD DEBUG ===") || true}
                      {console.log("Current Step:", currentStep) || true}
                      {console.log("isNamedAccount:", isNamedAccount) || true}
                      {console.log("Account Type:", accountType) || true}
                      {console.log("Selected Country ID:", values.country) ||
                        true}
                      {console.log("isNamedAccount value:", isNamedAccount) ||
                        true}
                      {console.log("isUS Country:", values.country === 186) ||
                        true}
                      {console.log(
                        "Should Show SSN:",
                        isNamedAccount && values.country === 186
                      ) || true}
                      {console.log("=======================") || true}

                      {/* FIXED: Check by country ID instead of name */}
                      {isNamedAccount && values.country === 186 && (
                        <div className="md:col-span-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <FormField
                                id="ssn"
                                label="Social Security Number (SSN)"
                                name="ssn"
                                value={values.ssn || ""}
                                onChange={(e) => {
                                  const formatted = formatTaxId(
                                    e.target.value,
                                    "ssn"
                                  );
                                  enhancedHandleChange(
                                    "ssn",
                                    setFieldValue
                                  )({ target: { value: formatted } });
                                }}
                                onBlur={handleBlur}
                                onFocus={() => setActiveField("ssn")}
                                touched={touched.ssn}
                                error={errors.ssn}
                                required={true}
                                placeholder="XXX-XX-XXXX"
                                activeField={activeField}
                                fieldStyles={FIELD_STYLES}
                              />
                            </div>
                            <div className="mt-6">
                              <SSNInfoPopup />
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            Required for US residents with USD Named Accounts
                            for tax reporting purposes.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-8">
                      <h3 className="text-lg font-medium mb-4 text-blue-600 border-b border-blue-200 pb-2">
                        Contact Address
                      </h3>

                      {/* Country and State/Province on same row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <SelectField
                          id="country"
                          label="Country"
                          options={countryOptions}
                          onChange={enhancedSelectChange(
                            "country",
                            setFieldValue
                          )}
                          value={countryOptions.find(
                            (opt) => opt.value === values.country
                          )}
                          touched={touched.country}
                          error={errors.country}
                          required
                          isLoading={countriesLoading}
                          fieldStyles={FIELD_STYLES}
                          isCountryField={true}
                          showPhoneCode={false}
                        />
                        <FormField
                          id="state"
                          label="State/Province"
                          name="state"
                          value={values.state || ""}
                          onChange={enhancedHandleChange(
                            "state",
                            setFieldValue
                          )}
                          onBlur={handleBlur}
                          onFocus={() => setActiveField("state")}
                          touched={touched.state}
                          error={errors.state}
                          required
                          activeField={activeField}
                          fieldStyles={FIELD_STYLES}
                        />
                      </div>

                      {/* City and Street Address 1 on same row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <FormField
                          id="city"
                          label="City"
                          name="city"
                          value={values.city || ""}
                          onChange={enhancedHandleChange("city", setFieldValue)}
                          onBlur={handleBlur}
                          onFocus={() => setActiveField("city")}
                          touched={touched.city}
                          error={errors.city}
                          required
                          activeField={activeField}
                          fieldStyles={FIELD_STYLES}
                        />
                        <FormField
                          id="street_address_1"
                          label="Street Address 1"
                          name="street_address_1"
                          value={values.street_address_1 || ""}
                          onChange={enhancedHandleChange(
                            "street_address_1",
                            setFieldValue
                          )}
                          onBlur={handleBlur}
                          onFocus={() => setActiveField("street_address_1")}
                          touched={touched.street_address_1}
                          error={errors.street_address_1}
                          required
                          activeField={activeField}
                          fieldStyles={FIELD_STYLES}
                        />
                      </div>

                      {/* Street Address 2 and ZIP/Postal Code on same row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <FormField
                          id="street_address_2"
                          label="Street Address 2 (Optional)"
                          name="street_address_2"
                          value={values.street_address_2 || ""}
                          onChange={enhancedHandleChange(
                            "street_address_2",
                            setFieldValue
                          )}
                          onBlur={handleBlur}
                          onFocus={() => setActiveField("street_address_2")}
                          touched={touched.street_address_2}
                          error={errors.street_address_2}
                          activeField={activeField}
                          fieldStyles={FIELD_STYLES}
                        />
                        <FormField
                          id="zip_code"
                          label="ZIP/Postal Code"
                          name="zip_code"
                          value={values.zip_code || ""}
                          onChange={enhancedHandleChange(
                            "zip_code",
                            setFieldValue
                          )}
                          onBlur={handleBlur}
                          onFocus={() => setActiveField("zip_code")}
                          touched={touched.zip_code}
                          error={errors.zip_code}
                          required
                          activeField={activeField}
                          fieldStyles={FIELD_STYLES}
                        />
                      </div>

                      {/* House Number on full row */}
                      <div className="mb-4">
                        <FormField
                          id="house_number"
                          label="House Number"
                          name="house_number"
                          value={values.house_number || ""}
                          onChange={enhancedHandleChange(
                            "house_number",
                            setFieldValue
                          )}
                          onBlur={handleBlur}
                          onFocus={() => setActiveField("house_number")}
                          touched={touched.house_number}
                          error={errors.house_number}
                          required
                          activeField={activeField}
                          fieldStyles={FIELD_STYLES}
                        />
                      </div>
                    </div>

                    <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Terms and Conditions{" "}
                        <span className="text-red-500">*</span>
                      </h3>
                      {termsLoading ? (
                        <div className="flex items-center">
                          <RingLoader
                            color="#0284c7"
                            size={16}
                            className="mr-2"
                          />
                          <p className="text-sm text-gray-500">
                            Loading terms...
                          </p>
                        </div>
                      ) : termsConditions && termsConditions.length > 0 ? (
                        <div className="space-y-3">
                          {termsConditions.map((term) => (
                            <div key={term.id} className="flex items-start">
                              <div className="flex items-center h-5">
                                <input
                                  id={`term-${term.id}`}
                                  name={`term-${term.id}`}
                                  type="checkbox"
                                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                  checked={
                                    values.terms_and_conditions?.some(
                                      (t) => t.id === term.id
                                    ) || false
                                  }
                                  onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    const currentTerms =
                                      values.terms_and_conditions || [];
                                    if (isChecked) {
                                      const newTerm = {
                                        id: term.id,
                                        accepted_at:
                                          new Date().toLocaleString(),
                                        ip: "Unknown",
                                        location: "Unknown",
                                        device: "Unknown",
                                      };
                                      setFieldValue("terms_and_conditions", [
                                        ...currentTerms,
                                        newTerm,
                                      ]);
                                    } else {
                                      const updatedTerms = currentTerms.filter(
                                        (t) => t.id !== term.id
                                      );
                                      setFieldValue(
                                        "terms_and_conditions",
                                        updatedTerms
                                      );
                                    }
                                  }}
                                />
                              </div>
                              <div className="ml-3 text-sm">
                                <label
                                  htmlFor={`term-${term.id}`}
                                  className="font-medium text-gray-700"
                                >
                                  I agree to the{" "}
                                  <a
                                    href={term.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-500 hover:underline"
                                  >
                                    {term.title}
                                  </a>
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No terms available. Please contact support.
                        </p>
                      )}
                      {touched.terms_and_conditions &&
                        errors.terms_and_conditions && (
                          <div className="text-red-500 text-xs mt-2">
                            {errors.terms_and_conditions}
                          </div>
                        )}
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.5 }}
                    className="bg-white p-6 rounded-lg shadow-sm"
                  >
                    <h2 className="text-xl font-semibold mb-4">
                      Controller Information
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Please specify if you are the controller of this
                      institution or provide controller details.
                    </p>
                    <ControllerSection
                      values={values}
                      setFieldValue={setFieldValue}
                      handleBlur={handleBlur}
                      touched={touched}
                      errors={errors}
                      countryOptions={countryOptions}
                      countriesLoading={countriesLoading}
                      nationalityOptions={nationalityOptions}
                      genderOptions={genderOptions}
                      showPassword={showPassword}
                      showConfirmPassword={showConfirmPassword}
                      institutionState={institutionState}
                      showSSNField={showSSNField}
                      enhancedHandleChange={enhancedHandleChange}
                      enhancedPasswordChange={enhancedPasswordChange}
                      enhancedSelectChange={enhancedSelectChange}
                      passwordValidationRules={passwordValidationRules}
                      formatTaxId={formatTaxId}
                    />
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.5 }}
                    className="bg-white p-6 rounded-lg shadow-sm"
                  >
                    <OwnerInfo
                      values={values}
                      setFieldValue={setFieldValue}
                      handleChange={handleChange}
                      handleBlur={handleBlur}
                      errors={errors}
                      touched={touched}
                      activeField={activeField}
                      setActiveField={setActiveField}
                      nationalityOptions={nationalityOptions}
                      roleOptions={roleOptions}
                      idDocumentTypeOptions={idDocumentTypeOptions}
                      totalOwnershipPercentage={totalOwnershipPercentage}
                      dispatch={dispatch}
                      countryOptions={countryOptions}
                      countriesLoading={countriesLoading}
                      ownerAdd={ownerAdd}
                      isNamedAccount={isNamedAccount}
                      countries={countries}
                      selectedCurrency={defaultCurrency}
                    />
                  </motion.div>
                )}

                {currentStep === 5 && (
                  <motion.div
                    key="step5"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.5 }}
                    className="bg-white p-6 rounded-lg shadow-sm"
                  >
                    <h2 className="text-xl font-semibold mb-4">
                      Document Upload & Final Review
                    </h2>
                    {documentUpload && (
                      <div className="mb-8">
                        <h3 className="text-lg font-medium mb-4 text-blue-600">
                          Required Documents
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="border border-gray-200 rounded-lg p-4"
                            >
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {doc.name}{" "}
                                {doc.required && (
                                  <span className="text-red-500">*</span>
                                )}
                              </label>
                              <input
                                type="file"
                                onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    const base64Data =
                                      await convertFileToBase64(file);
                                    const fileData = {
                                      name: file.name,
                                      type: file.type,
                                      size: file.size,
                                      base64: base64Data,
                                    };

                                    setFieldValue(
                                      `user_image.${doc.id}`,
                                      fileData
                                    );
                                  }
                                }}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                accept=".jpg,.jpeg,.png,.pdf"
                              />
                              {values.user_image &&
                                values.user_image[doc.id] && (
                                  <p className="text-sm text-green-600 mt-1">
                                    ✓ Document uploaded:{" "}
                                    {values.user_image[doc.id].name}
                                  </p>
                                )}
                              {touched.user_image?.[doc.id] &&
                                errors.user_image?.[doc.id] && (
                                  <div className="text-red-500 text-xs mt-1">
                                    {errors.user_image[doc.id]}
                                  </div>
                                )}
                              {doc.description && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {doc.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">
                        Final Agreement
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <label className="flex items-start space-x-3 cursor-pointer">
                          <Field
                            name="terms_agreement"
                            type="checkbox"
                            checked={values.terms_agreement || false}
                            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            I certify that all information provided is true and
                            accurate to the best of my knowledge. I agree to
                            abide by the terms and conditions of this
                            institution registration.
                          </span>
                        </label>
                        {touched.terms_agreement && errors.terms_agreement && (
                          <div className="text-red-500 text-xs mt-2 ml-7">
                            {errors.terms_agreement}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
                      <i className="fas fa-check-circle text-green-600 mt-1"></i>
                      <div>
                        <h3 className="text-lg font-medium text-green-800 mb-1">
                          Ready to Submit!
                        </h3>
                        <p className="text-green-700 text-sm">
                          Please review all information before submitting. Once
                          submitted, your application will be processed and you
                          will receive a confirmation email.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-8 flex items-center justify-between gap-4 md:gap-12">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => dispatch(setCurrentStep(currentStep - 1))}
                    className="flex items-center justify-center w-full md:w-auto gap-2 rounded-xl bg-gray-100 px-6 py-3 text-gray-700 shadow-sm hover:bg-gray-200 transition-all duration-200 font-medium"
                  >
                    ← Previous
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={() =>
                      handleNextStep(values, {
                        setErrors,
                        setTouched,
                        validateForm,
                      })
                    }
                    disabled={loading}
                    className="flex items-center justify-center w-full md:w-auto gap-2 rounded-xl bg-blue-600 px-8 py-3 text-white shadow-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                  >
                    {loading ? <RingLoader size={20} color="#fff" /> : "Next →"}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !isStepComplete(5, values, errors, touched) ||
                      isSubmitting
                    }
                    className="flex items-center justify-center w-full md:w-auto gap-2 rounded-xl bg-green-600 px-8 py-3 text-white shadow-md hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <RingLoader size={20} color="#fff" />
                        <span>Processing Registration...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check"></i> Complete Registration
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="mt-4 border-t pt-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-full py-2 text-red-500 hover:text-red-700 text-sm transition-colors"
                >
                  Cancel Registration
                </button>
              </div>

              {showPopup && errorMessage && (
                <InstitutionPopup
                  onClose={() => dispatch(setShowPopup(false))}
                  message={errorMessage}
                  type="error"
                />
              )}
              {showSSNConfirmation && (
                <SSNConfirmationPopup
                  onClose={handleSSNCancel}
                  onConfirm={handleSSNConfirm}
                />
              )}
              {Object.keys(errors).length > 0 &&
                Object.keys(touched).length > 0 && (
                  <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50 flex items-center animate-bounce">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    <span className="text-sm font-medium">
                      Please correct the errors in the form
                    </span>
                  </div>
                )}
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default Institution;
