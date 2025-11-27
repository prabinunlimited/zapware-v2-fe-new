// src/features/Auth/components/SignUpInstitution.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form, Field, FieldArray } from "formik";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import Select from "react-select";

// Import components FIRST to avoid circular dependencies
import InstitutionPopup from "../../../components/PopupModal/InstitutionPopup";
import FormField from "./FormFields/FormField";
import PasswordField from "./FormFields/PasswordField";
import SelectField from "./FormFields/SelectField";
import BenefitsSection from "./FormFields/BenefitsSection";
import institutionSchema from "../../../components/Schema/InstitutionSchema";

// Import Redux actions and selectors - use direct imports to avoid circular deps
import {
  fetchCountries,
  selectCountriesOptions,
  selectCountriesLoading,
} from "../../../features/Auth/slices/countrySlice";

// Import institution registration actions and selectors
import {
  fetchInstitutionData,
  submitInstitutionForm,
  uploadFile,
  setCurrentStep,
  setOwnerField,
  addOwner,
  removeOwner,
  setShowPopup,
  setErrorMessage,
  selectInstitutionRegistration,
  fetchGenders,
  fetchNationalities,
  setLocationStateData,
  setAccountType,
  setPackageCurrencies,
  setKycRequirements,
  setDocumentRequirements,
  setReferralData,
  setSsnRequired,
  setEinRequired,
  setWhiteLabelInfo,
  syncControllerDataFromForm,
  validateOwnershipPercentage,
  togglePasswordVisibility,
  toggleConfirmPasswordVisibility,
} from "../slices/institutionRegistrationSlice";

// ========== UTILITY FUNCTIONS ==========

// Loading component for countries
const LoadingSelectField = ({ label, required }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 animate-pulse">
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
    </div>
    <p className="text-xs text-gray-500">Loading countries...</p>
  </div>
);

// Form Header Component
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

// Phone Number Field Component
const PhoneNumberField = ({
  id,
  label,
  name,
  value,
  onChange,
  onBlur,
  touched,
  error,
  required,
  countryCodeName,
  countryCodeValue,
}) => {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const countryOptions = useSelector((state) => state.countries?.options || []);
  const countriesLoading = useSelector(
    (state) => state.countries?.loading || false
  );

  useEffect(() => {
    if (countryCodeValue && countryOptions.length > 0) {
      const country = countryOptions.find(
        (opt) =>
          opt.phoneCode === countryCodeValue ||
          opt.phone_code === countryCodeValue
      );
      setSelectedCountry(country);
    }
  }, [countryCodeValue, countryOptions]);

  const handleCountryCodeBlur = () => {
    if (onBlur) {
      onBlur({
        target: { name: countryCodeName },
      });
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex space-x-2">
        <div className="w-1/3">
          {countriesLoading ? (
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
            </div>
          ) : (
            <Select
              options={countryOptions}
              value={selectedCountry}
              onChange={(option) => {
                setSelectedCountry(option);
                if (countryCodeName) {
                  onChange({
                    target: {
                      name: countryCodeName,
                      value: option?.phoneCode || option?.phone_code,
                    },
                  });
                }
              }}
              onBlur={handleCountryCodeBlur}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Code"
              isSearchable
              isLoading={countriesLoading}
            />
          )}
        </div>
        <div className="w-2/3">
          <input
            type="tel"
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter phone number"
          />
        </div>
      </div>
      {touched && error && (
        <div className="text-red-500 text-xs mt-1">{error}</div>
      )}
    </div>
  );
};

// SSN Info Popup Component
const SSNInfoPopup = () => {
  const [showSSNInfo, setShowSSNInfo] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setShowSSNInfo(!showSSNInfo)}
        className="ml-2 text-blue-600 hover:text-blue-800"
      >
        <i className="fas fa-info-circle"></i>
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

// ========== MAIN COMPONENT ==========

const Institution = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeField, setActiveField] = useState("");
  const [businessAliasValid, setBusinessAliasValid] = useState(null);

  const initialLoadRef = React.useRef(false);
  const institutionState = useSelector(selectInstitutionRegistration);
  const countries = useSelector(selectCountriesOptions);
  const countriesLoading = useSelector(selectCountriesLoading);

  // Select state from Redux store
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
    isNamedAccount,
    defaultCurrency,
    showSSNField,
    showBusinessAliasField,
  } = institutionState;

  // Debug effects
  useEffect(() => {
    console.log("🔍 Industry Type Debug:");
    console.log("- industry_type value:", formData.industry_type);
    console.log("- showIndustryTypeField:", showIndustryTypeField);
    console.log("- industryTypes from Redux:", industryTypes);
  }, [formData.industry_type, showIndustryTypeField, industryTypes]);

  // Location state processing
  const locationStateData = location.state || {};

  const processLocationState = useCallback(
    (data) => {
      if (data && Object.keys(data).length > 0) {
        dispatch(setLocationStateData(data));

        if (data.service_provide_ids) {
          const isNamed = data.service_provide_ids.some(
            (id) => typeof id === "string" && id.includes("named")
          );
          dispatch(setAccountType(isNamed ? "named" : "pooled"));
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
      console.log("🚀 Institution component mounted - fetching initial data");
      initialLoadRef.current = true;

      dispatch(fetchCountries());
      dispatch(fetchGenders());
      dispatch(fetchNationalities());
      dispatch(fetchInstitutionData());
    }
  }, [dispatch]);

  // Validation functions
  const validateEIN = useCallback(
    (ein) => {
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
    },
    [isNamedAccount]
  );

  const validateSSN = useCallback(
    (ssn, isUSSelected) => {
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
    },
    [isNamedAccount]
  );

  const validateBusinessAliasField = useCallback(
    (businessAlias) => {
      if (isNamedAccount && (!businessAlias || businessAlias.trim() === "")) {
        return "Business alias is required";
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

  // FIXED: Step completion validation
const isStepComplete = useCallback((step, values, errors, touched) => {
  console.log("🔍 ========== STEP COMPLETION VALIDATION ==========");
  console.log(`📝 Validating Step ${step} Completion`);
  console.log("📊 Current Values:", values);
  console.log("❌ Current Errors:", JSON.stringify(errors));
  console.log("👆 Touched Fields:", touched);

  switch (step) {
    case 1: {
      console.log("🏢 STEP 1: Business Information Validation");
      
      // Check if required fields have values AND no errors
      const requiredFields = [
        'institution_name',
        'registration_number', 
        'country_of_registration',
        'registered_address_street_state',
        'registered_address_street_city',
        'registered_address_street_1',
        'registered_address_street_zip',
        'date_incorporation',
        'industry_type'
      ];

      const hasValues = requiredFields.every(field => 
        values[field] && values[field].toString().trim() !== ''
      );
      
      const hasNoErrors = requiredFields.every(field => !errors[field]);
      
      console.log("✅ Required fields filled:", hasValues);
      console.log("✅ No validation errors:", hasNoErrors);
      
      // Check conditional fields
      const einValid = !showEINField || (values.ein && !errors.ein);
      const naicsValid = !showNAICSField || (values.naice_code && !errors.naice_code);
      const businessTypeValid = !showBusinessTypeField || (values.business_type && !errors.business_type);
      const businessAliasValid = !showBusinessAliasField || (values.business_alias && !errors.business_alias);

      console.log("🔍 Conditional fields:", {
        einValid, naicsValid, businessTypeValid, businessAliasValid
      });

      const isComplete = hasValues && hasNoErrors && einValid && naicsValid && businessTypeValid && businessAliasValid;
      
      console.log("🎯 Step 1 complete:", isComplete);
      return isComplete;
    }

    case 2: {
      console.log("👤 STEP 2: Primary Contact Information Validation");
      
      const requiredFields = [
        'first_name',
        'last_name',
        'email',
        'password',
        'confirm_password',
        'resident_country',
        'mobilenumber_countrycode',
        'mobile_number',
        'nationality',
        'country',
        'state',
        'city',
        'street_address_1',
        'zip_code',
        'gender',
        'dob',
        'terms_agreement'
      ];

      const hasValues = requiredFields.every(field => {
        if (field === 'terms_agreement') {
          return values[field] === true;
        }
        return values[field] && values[field].toString().trim() !== '';
      });
      
      const hasNoErrors = requiredFields.every(field => !errors[field]);
      
      console.log("✅ Required fields filled:", hasValues);
      console.log("✅ No validation errors:", hasNoErrors);

      // Check SSN validation for US residents
      const isUS = values.country === "United States";
      const ssnValid = !showSSNField || !isUS || (values.ssn && !errors.ssn);
      
      // Check password match
      const passwordsMatch = values.password === values.confirm_password && !errors.confirm_password;

      console.log("🔍 Additional validations:", {
        isUS,
        ssnValid,
        passwordsMatch,
        termsAccepted: values.terms_agreement
      });

      const isComplete = hasValues && hasNoErrors && ssnValid && passwordsMatch;
      
      console.log("🎯 Step 2 complete:", isComplete);
      return isComplete;
    }

    case 3: {
      console.log("🎛️ STEP 3: Controller Information Validation");
      
      // Always require is_controller field
      if (!values.is_controller || values.is_controller === "") {
        console.log("❌ is_controller not selected");
        return false;
      }

      // If user is NOT the controller, validate controller fields
      if (values.is_controller === "no") {
        const requiredFields = [
          'controller_first_name',
          'controller_last_name',
          'controller_email',
          'controller_password',
          'controller_confirm_password',
          'controller_resident_country',
          'controller_mobilenumber_countrycode',
          'controller_mobile_number',
          'controller_nationality',
          'controller_country',
          'controller_state',
          'controller_city',
          'controller_street_address_1',
          'controller_zip_code',
          'controller_gender',
          'controller_dob'
        ];

        const hasValues = requiredFields.every(field => 
          values[field] && values[field].toString().trim() !== ''
        );
        
        const hasNoErrors = requiredFields.every(field => !errors[field]);
        
        console.log("✅ Controller fields filled:", hasValues);
        console.log("✅ No controller errors:", hasNoErrors);

        // Check SSN validation for US controller residents
        const isControllerUS = values.controller_country === "United States";
        const ssnValid = !showSSNField || !isControllerUS || (values.controller_ssn && !errors.controller_ssn);
        
        // Check controller passwords match
        const passwordsMatch = values.controller_password === values.controller_confirm_password && !errors.controller_confirm_password;

        console.log("🔍 Controller validations:", {
          isControllerUS,
          ssnValid,
          passwordsMatch
        });

        const isComplete = hasValues && hasNoErrors && ssnValid && passwordsMatch;
        
        console.log("🎯 Step 3 complete:", isComplete);
        return isComplete;
      }

      // If user IS the controller, step is complete
      console.log("✅ User is controller, step complete");
      return values.is_controller === "yes";
    }

    case 4: {
      console.log("👥 STEP 4: Ownership Information Validation");
      
      // Check if there are any owners
      if (!values.owner_details || values.owner_details.length === 0) {
        console.log("❌ No owners added");
        return false;
      }
      
      // Calculate total ownership percentage
      const totalOwnership = values.owner_details.reduce(
        (total, owner) => total + (parseFloat(owner.ownership_percentage) || 0),
        0
      );
      
      console.log("📊 Total ownership percentage:", totalOwnership);
      
      // Check if total ownership equals 100%
      const ownershipValid = Math.abs(totalOwnership - 100) <= 0.01;
      if (!ownershipValid) {
        console.log("❌ Ownership percentage not 100%:", totalOwnership);
        return false;
      }

      // Validate each owner
      const allOwnersComplete = values.owner_details.every((owner, index) => {
        const baseFieldsValid = 
          owner.owner_first_name && owner.owner_first_name.trim() !== '' &&
          owner.owner_last_name && owner.owner_last_name.trim() !== '' &&
          owner.owner_email && owner.owner_email.trim() !== '' &&
          owner.owner_country_id && owner.owner_country_id.toString().trim() !== '' &&
          owner.owner_phone_number_country_code && owner.owner_phone_number_country_code.toString().trim() !== '' &&
          owner.owner_phone_number && owner.owner_phone_number.toString().trim() !== '' &&
          owner.ownership_percentage > 0 &&
          owner.owner_dob && owner.owner_dob.trim() !== '';

        // Check role if system access is needed
        const roleValid = owner.owner_needs_access_to_system !== "yes" || 
                         (owner.owner_role_id && owner.owner_role_id.toString().trim() !== '');

        // Check US-specific fields for named accounts
        const ownerCountry = countryOptions.find((c) => c.value === owner.owner_country_id);
        const isUSOwner = ownerCountry?.label === "United States" || ownerCountry?.value === "United States";
        
        let usFieldsValid = true;
        if (isNamedAccount && isUSOwner) {
          usFieldsValid = owner.ssn && owner.ssn.trim() !== '' && 
                         owner.doc_type && owner.doc_type.toString().trim() !== '' && 
                         owner.doc_id && owner.doc_id.trim() !== '';
        }
        
        const ownerValid = baseFieldsValid && roleValid && usFieldsValid;
        
        if (!ownerValid) {
          console.log(`❌ Owner ${index + 1} incomplete:`, {
            baseFieldsValid,
            roleValid,
            usFieldsValid,
            isUSOwner,
            isNamedAccount
          });
        }
        
        return ownerValid;
      });
      
      console.log("✅ All owners complete:", allOwnersComplete);
      console.log("✅ Ownership percentage valid:", ownershipValid);
      
      return allOwnersComplete && ownershipValid;
    }

    case 5: {
      console.log("📄 STEP 5: Document Upload & Final Review Validation");
      
      let documentsValid = true;
      
      // Validate document uploads if required
      if (documentUpload) {
        const requiredDocuments = documents.filter(doc => doc.required);
        const allRequiredUploaded = requiredDocuments.every(doc => {
          const hasFile = values.user_image && values.user_image[doc.id];
          if (!hasFile) {
            console.log(`❌ Required document missing: ${doc.name}`);
          }
          return hasFile;
        });
        
        documentsValid = allRequiredUploaded;
        console.log("✅ All required documents uploaded:", allRequiredUploaded);
      }

      // Check terms agreement
      const termsAccepted = values.terms_agreement === true;
      if (!termsAccepted) {
        console.log("❌ Terms not accepted");
      }

      console.log("✅ Terms accepted:", termsAccepted);
      
      const isComplete = documentsValid && termsAccepted;
      console.log("🎯 Step 5 complete:", isComplete);
      
      return isComplete;
    }

    default: {
      console.log("❓ Unknown step:", step);
      return true;
    }
  }
}, [
  showEINField,
  showNAICSField,
  showBusinessTypeField,
  showBusinessAliasField,
  showSSNField,
  documentUpload,
  isNamedAccount,
  countries,
  countryOptions,
  documents,
  validateEIN,
  validateSSN,
  validateBusinessAliasField
]);

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

          if (showSSNField && values.country === "United States") {
            step2Fields.push("ssn");
          }

          return step2Fields;

        case 3:
          const step3Fields = ["is_controller"];

          if (values.is_controller === "no") {
            step3Fields.push(
              "controller_first_name",
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
                `owner_details[${index}].owner_last_name`,
                `owner_details[${index}].owner_email`,
                `owner_details[${index}].owner_phone_number`,
                `owner_details[${index}].owner_country_id`,
                `owner_details[${index}].ownership_percentage`,
                `owner_details[${index}].owner_dob`
              );

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
            requiredDocs.forEach((doc) => {
              step5Fields.push(`user_image.${doc.id}`);
            });
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

  const getFirstErrorMessage = useCallback((errors) => {
    for (const [key, value] of Object.entries(errors)) {
      if (value) {
        if (typeof value === "string") {
          return value;
        } else if (Array.isArray(value)) {
          return value[0] || "Validation error";
        } else if (typeof value === "object") {
          const nestedError = getFirstErrorMessage(value);
          if (nestedError) return nestedError;
        }
      }
    }
    return "Please check all required fields.";
  }, []);

  // FIXED: handleNextStep
  const handleNextStep = useCallback(
    async (values, setErrors, setTouched, validateForm) => {
      try {
        console.log("🚀 Handling next step...");

        // Mark all step fields as touched
        const stepFields = getStepFields(currentStep, values);
        const touchedFields = {};

        stepFields.forEach((field) => {
          if (field.includes("[") && field.includes("]")) {
            // Handle array fields (like owner_details)
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

        console.log("👆 Setting touched fields:", touchedFields);
        setTouched(touchedFields);

        // Validate form
        const formErrors = await validateForm();
        console.log("❌ Form errors after validation:", formErrors);

        // Check if step is complete
        const stepComplete = isStepComplete(
          currentStep,
          values,
          formErrors,
          touchedFields
        );
        console.log("✅ Step complete:", stepComplete);

        if (!stepComplete || Object.keys(formErrors).length > 0) {
          const firstError =
            getFirstErrorMessage(formErrors) ||
            "Please complete all required fields for this step.";
          console.log("🚫 Blocking navigation - error:", firstError);
          dispatch(setErrorMessage(firstError));
          dispatch(setShowPopup(true));
          return;
        }

        // Proceed to next step
        console.log("✅ Proceeding to next step");
        let nextStep = currentStep + 1;

        if (currentStep === 4 && ownerAdd !== "Y") {
          nextStep = currentStep + 1;
        }

        dispatch(setCurrentStep(nextStep));
        dispatch(setErrorMessage(""));
        dispatch(setShowPopup(false));
      } catch (error) {
        console.error("❌ Error in handleNextStep:", error);
        dispatch(
          setErrorMessage("Validation failed. Please check all fields.")
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
      ownerAdd,
    ]
  );

  const handleSubmit = useCallback(
    async (values, { setSubmitting }) => {
      try {
        console.log("=== FINAL SUBMISSION ===");

        const finalData = {
          ...values,
          referral_code: referralCode,
          agent_code: agentCode,
          is_named_account: isNamedAccount,
          package_currencies: packageCurrencies,
          customer_type: "institution",
          kyc_verify: kycVerify,
          document_upload: documentUpload,
          owner_add: ownerAdd,
        };

        console.log("Final submission data:", finalData);

        const result = await dispatch(
          submitInstitutionForm(finalData)
        ).unwrap();
        console.log("Final API response:", result);

        if (
          result &&
          (result.success === true || result.success === undefined)
        ) {
          console.log("Registration completed successfully");
          navigate("/success");
        } else {
          dispatch(setErrorMessage(result.message || "Registration failed"));
          dispatch(setShowPopup(true));
        }
      } catch (error) {
        console.error("Final submission error:", error);
        dispatch(setErrorMessage("Registration failed. Please try again."));
        dispatch(setShowPopup(true));
      } finally {
        setSubmitting(false);
      }
    },
    [
      dispatch,
      navigate,
      referralCode,
      agentCode,
      isNamedAccount,
      packageCurrencies,
      kycVerify,
      documentUpload,
      ownerAdd,
    ]
  );

  // FIXED: Proper country options transformation
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
          value: countryName,
          label: countryName,
          phoneCode: phoneCode,
          country_code: country.country_code,
          id: country.id,
        };
      });
    }

    return [];
  }, [countries]);

  const countryOptions = useMemo(
    () => getSafeCountryOptions(),
    [getSafeCountryOptions]
  );

  const naicsOptions = useMemo(
    () =>
      naicsCodes.map((code) => ({
        value: code.id,
        label: `${code.code} - ${code.description}`,
      })),
    [naicsCodes]
  );

  const businessTypeOptions = useMemo(
    () => businessTypes.map((type) => ({ value: type.id, label: type.name })),
    [businessTypes]
  );

  // FIXED: Industry type options with fallback
  const industryTypeOptions = useMemo(() => {
    if (industryTypes && industryTypes.length > 0) {
      return industryTypes.map((type) => ({
        value: type.id,
        label: type.name,
      }));
    }

    // Fallback options for testing
    return [
      { value: 1, label: "Technology" },
      { value: 2, label: "Finance" },
      { value: 3, label: "Healthcare" },
      { value: 4, label: "Education" },
      { value: 5, label: "Manufacturing" },
    ];
  }, [industryTypes]);

  const genderOptions = useMemo(() => {
    return genders.map((gender) => ({
      value: gender.id,
      label: gender.name,
    }));
  }, [genders]);

  const nationalityOptions = useMemo(() => {
    return nationalities.map((nationality) => ({
      value: nationality.id,
      label: nationality.name,
    }));
  }, [nationalities]);

  const roleOptions = useMemo(
    () => roles.map((role) => ({ value: role.id, label: role.name })),
    [roles]
  );

  const idDocumentTypeOptions = useMemo(
    () => idDocumentTypes.map((doc) => ({ value: doc.id, label: doc.name })),
    [idDocumentTypes]
  );

  const documentTypeOptions = useMemo(
    () => documents.map((doc) => ({ value: doc.id, label: doc.name })),
    [documents]
  );

  // Nested Components
  const ControllerSection = ({
    values,
    setFieldValue,
    handleBlur,
    touched,
    errors,
  }) => {
    if (currentStep !== 3) return null;

    return (
      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-medium mb-4 text-blue-600">
          Controller Information
        </h3>

        <div className="mb-4">
          <label className="flex items-center">
            <Field
              type="checkbox"
              name="is_controller"
              className="mr-2"
              onChange={(e) => {
                const isController = e.target.checked;
                setFieldValue("is_controller", isController ? "yes" : "no");

                if (isController) {
                  dispatch(syncControllerDataFromForm(values));
                }
              }}
            />
            <span className="text-sm text-gray-700">
              I am the controller of this institution
            </span>
          </label>
        </div>

        {values.is_controller === "no" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              id="controller_first_name"
              label="Controller First Name"
              name="controller_first_name"
              value={values.controller_first_name}
              onChange={(e) =>
                setFieldValue("controller_first_name", e.target.value)
              }
              onBlur={handleBlur}
              touched={touched.controller_first_name}
              error={errors.controller_first_name}
              required
            />

            <FormField
              id="controller_last_name"
              label="Controller Last Name"
              name="controller_last_name"
              value={values.controller_last_name}
              onChange={(e) =>
                setFieldValue("controller_last_name", e.target.value)
              }
              onBlur={handleBlur}
              touched={touched.controller_last_name}
              error={errors.controller_last_name}
              required
            />

            <FormField
              id="controller_email"
              label="Controller Email"
              name="controller_email"
              type="email"
              value={values.controller_email}
              onChange={(e) =>
                setFieldValue("controller_email", e.target.value)
              }
              onBlur={handleBlur}
              touched={touched.controller_email}
              error={errors.controller_email}
              required
            />

            <PhoneNumberField
              id="controller_phone"
              label="Controller Phone"
              name="controller_phone"
              value={values.controller_phone}
              onChange={(e) =>
                setFieldValue("controller_phone", e.target.value)
              }
              onBlur={handleBlur}
              touched={touched.controller_phone}
              error={errors.controller_phone}
              required
              countryCodeName="controller_phone_countrycode"
              countryCodeValue={values.controller_phone_countrycode}
            />

            <SelectField
              id="controller_nationality"
              label="Controller Nationality"
              options={nationalityOptions}
              onChange={(option) =>
                setFieldValue("controller_nationality", option?.value)
              }
              value={nationalityOptions.find(
                (opt) => opt.value === values.controller_nationality
              )}
              touched={touched.controller_nationality}
              error={errors.controller_nationality}
              required
            />

            {/* Country of Registration */}
            <SelectField
              id="country_of_registration"
              label="Country of Registration"
              options={countryOptions}
              onChange={(option) => {
                setFieldValue("country_of_registration", option?.value || "");
              }}
              value={countryOptions.find(
                (opt) => opt.value === values.country_of_registration
              )}
              touched={touched.country_of_registration}
              error={errors.country_of_registration}
              required
              isLoading={countriesLoading}
            />

            <FormField
              id="controller_designation"
              label="Controller Designation"
              name="controller_designation"
              value={values.controller_designation}
              onChange={(e) =>
                setFieldValue("controller_designation", e.target.value)
              }
              onBlur={handleBlur}
              touched={touched.controller_designation}
              error={errors.controller_designation}
            />

            <SelectField
              id="controller_gender"
              label="Controller Gender"
              options={genderOptions}
              onChange={(option) =>
                setFieldValue("controller_gender", option?.value)
              }
              value={genderOptions.find(
                (opt) => opt.value === values.controller_gender
              )}
              touched={touched.controller_gender}
              error={errors.controller_gender}
              required
            />

            <FormField
              id="controller_dob"
              label="Controller Date of Birth"
              name="controller_dob"
              type="date"
              value={values.controller_dob}
              onChange={(e) => setFieldValue("controller_dob", e.target.value)}
              onBlur={handleBlur}
              touched={touched.controller_dob}
              error={errors.controller_dob}
              required
            />

            <FormField
              id="controller_street_address_1"
              label="Controller Street Address 1"
              name="controller_street_address_1"
              value={values.controller_street_address_1}
              onChange={(e) =>
                setFieldValue("controller_street_address_1", e.target.value)
              }
              onBlur={handleBlur}
              touched={touched.controller_street_address_1}
              error={errors.controller_street_address_1}
              required
            />

            <FormField
              id="controller_street_address_2"
              label="Controller Street Address 2 (Optional)"
              name="controller_street_address_2"
              value={values.controller_street_address_2}
              onChange={(e) =>
                setFieldValue("controller_street_address_2", e.target.value)
              }
              onBlur={handleBlur}
              touched={touched.controller_street_address_2}
              error={errors.controller_street_address_2}
            />

            <FormField
              id="controller_city"
              label="Controller City"
              name="controller_city"
              value={values.controller_city}
              onChange={(e) => setFieldValue("controller_city", e.target.value)}
              onBlur={handleBlur}
              touched={touched.controller_city}
              error={errors.controller_city}
              required
            />

            <FormField
              id="controller_state"
              label="Controller State/Province"
              name="controller_state"
              value={values.controller_state}
              onChange={(e) =>
                setFieldValue("controller_state", e.target.value)
              }
              onBlur={handleBlur}
              touched={touched.controller_state}
              error={errors.controller_state}
              required
            />

            <FormField
              id="controller_zip_code"
              label="Controller ZIP/Postal Code"
              name="controller_zip_code"
              value={values.controller_zip_code}
              onChange={(e) =>
                setFieldValue("controller_zip_code", e.target.value)
              }
              onBlur={handleBlur}
              touched={touched.controller_zip_code}
              error={errors.controller_zip_code}
              required
            />

            {/* Controller Country */}
            <SelectField
              id="controller_country_address"
              label="Controller Country"
              options={countryOptions}
              onChange={(option) => {
                setFieldValue(
                  "controller_country_address",
                  option?.value || ""
                );
              }}
              value={countryOptions.find(
                (opt) => opt.value === values.controller_country_address
              )}
              touched={touched.controller_country_address}
              error={errors.controller_country_address}
              required
              isLoading={countriesLoading}
            />

            {values.controller_country === "United States" && (
              <FormField
                id="controller_ssn"
                label="Controller SSN"
                name="controller_ssn"
                value={values.controller_ssn}
                onChange={(e) => {
                  const formatted = formatTaxId(e.target.value, "ssn");
                  setFieldValue("controller_ssn", formatted);
                }}
                onBlur={handleBlur}
                touched={touched.controller_ssn}
                error={errors.controller_ssn}
                required
                placeholder="XXX-XX-XXXX"
              />
            )}
          </div>
        )}
      </div>
    );
  };

  const EnhancedDocumentSection = ({
    values,
    setFieldValue,
    handleChange,
    handleBlur,
    touched,
    errors,
    index,
    owner,
  }) => {
    return (
      <div className="mt-4 border-t pt-4">
        <h4 className="font-medium mb-3">Identity Document</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            id={`owner_details[${index}].doc_type`}
            label="Document Type"
            options={idDocumentTypeOptions}
            onChange={(option) => {
              setFieldValue(`owner_details[${index}].doc_type`, option?.value);
              setFieldValue(`owner_details[${index}].doc_id`, "");
              setFieldValue(`owner_details[${index}].doc_country`, "");
              setFieldValue(`owner_details[${index}].doc_state`, "");
            }}
            value={idDocumentTypeOptions.find(
              (opt) => opt.value === owner.doc_type
            )}
            touched={touched.owner_details?.[index]?.doc_type}
            error={errors.owner_details?.[index]?.doc_type}
            required
          />

          <FormField
            id={`owner_details[${index}].doc_id`}
            label="Document ID Number"
            name={`owner_details[${index}].doc_id`}
            value={owner.doc_id}
            onChange={handleChange}
            onBlur={handleBlur}
            touched={touched.owner_details?.[index]?.doc_id}
            error={errors.owner_details?.[index]?.doc_id}
            required
          />

          {owner.doc_type && (
            <>
              {/* Issuing Country */}
              <SelectField
                id={`owner_details[${index}].doc_country`}
                label="Issuing Country"
                options={countryOptions}
                onChange={(option) => {
                  setFieldValue(
                    `owner_details[${index}].doc_country`,
                    option?.value || ""
                  );
                }}
                value={countryOptions.find(
                  (opt) => opt.value === owner.doc_country
                )}
                touched={touched.owner_details?.[index]?.doc_country}
                error={errors.owner_details?.[index]?.doc_country}
                required
                isLoading={countriesLoading}
              />

              {owner.doc_country === "United States" && (
                <FormField
                  id={`owner_details[${index}].doc_state`}
                  label="Issuing State"
                  name={`owner_details[${index}].doc_state`}
                  value={owner.doc_state}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  touched={touched.owner_details?.[index]?.doc_state}
                  error={errors.owner_details?.[index]?.doc_state}
                  required
                />
              )}

              <FormField
                id={`owner_details[${index}].id_issued_date`}
                label="Document Issue Date"
                name={`owner_details[${index}].id_issued_date`}
                type="date"
                value={owner.id_issued_date}
                onChange={handleChange}
                onBlur={handleBlur}
                touched={touched.owner_details?.[index]?.id_issued_date}
                error={errors.owner_details?.[index]?.id_issued_date}
                required
              />

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload ID Document
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      dispatch(
                        setOwnerField({
                          index,
                          field: "doc_file",
                          value: file,
                        })
                      );
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  accept=".jpg,.jpeg,.png,.pdf"
                />
                {owner.doc_file && (
                  <p className="text-sm text-green-600 mt-1">
                    File selected: {owner.doc_file.name}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Password validation rules
  const passwordValidationRules = useMemo(
    () => [
      {
        label: "At least 12 characters",
        regex: /^.{12,}$/,
      },
      {
        label: "At least one uppercase letter",
        regex: /[A-Z]/,
      },
      {
        label: "At least one lowercase letter",
        regex: /[a-z]/,
      },
      {
        label: "At least one number",
        regex: /\d/,
      },
      {
        label: "At least one special character",
        regex: /[!@#$%^&*(),.?":{}|<>]/,
      },
    ],
    []
  );

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {loading && (
        <>
          <div className="fixed inset-0 bg-gray-900 bg-opacity-60 z-50"></div>
          <div className="absolute inset-0 flex justify-center items-center z-50">
            <ClipLoader color="#36d7b7" loading={loading} size={50} />
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
        initialValues={formData}
        validationSchema={institutionSchema(currentStep, {
          isNamedAccount,
          country: formData.country_of_registration,
          currency: defaultCurrency?.code || defaultCurrency?.currency_code,
          kycVerify,
          documentUpload,
          ssnRequired: true,
          einRequired: true,
          accountType,
          showNAICSField,
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
        enableReinitialize
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
        }) => (
          <Form className="space-y-6">
            {/* Progress indicator */}
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
              {/* STEP 1: Business Information */}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      id="institution_name"
                      label="Business Name"
                      name="institution_name"
                      value={values.institution_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={() => setActiveField("institution_name")}
                      touched={touched.institution_name}
                      error={errors.institution_name}
                      required
                      activeField={activeField}
                    />

                    <FormField
                      id="registration_number"
                      label="Registration Number"
                      name="registration_number"
                      value={values.registration_number}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={() => setActiveField("registration_number")}
                      touched={touched.registration_number}
                      error={errors.registration_number}
                      required
                      activeField={activeField}
                    />

                    {showBusinessAliasField && (
                      <div className="md:col-span-2">
                        <FormField
                          id="business_alias"
                          label="Business Alias"
                          name="business_alias"
                          value={values.business_alias}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          onFocus={() => setActiveField("business_alias")}
                          touched={touched.business_alias}
                          error={errors.business_alias}
                          required={showBusinessAliasField}
                          activeField={activeField}
                          placeholder="Unique business identifier"
                        />
                        {businessAliasValid !== null && (
                          <p
                            className={`text-xs mt-1 ${
                              businessAliasValid
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {businessAliasValid
                              ? "✓ Business alias available"
                              : "✗ Business alias not available"}
                          </p>
                        )}
                      </div>
                    )}

                    {showEINField && (
                      <FormField
                        id="ein"
                        label="EIN (Employer Identification Number)"
                        name="ein"
                        value={values.ein}
                        onChange={(e) => {
                          const formatted = formatTaxId(e.target.value, "ein");
                          setFieldValue("ein", formatted);
                        }}
                        onBlur={handleBlur}
                        onFocus={() => setActiveField("ein")}
                        touched={touched.ein}
                        error={errors.ein}
                        required={showEINField}
                        placeholder="XX-XXXXXXX"
                        activeField={activeField}
                      />
                    )}

                    {showNAICSField && (
                      <SelectField
                        id="naice_code"
                        label="NAICS Code"
                        options={naicsOptions}
                        onChange={(option) =>
                          setFieldValue("naice_code", option?.value)
                        }
                        value={naicsOptions.find(
                          (opt) => opt.value === values.naice_code
                        )}
                        touched={touched.naice_code}
                        error={errors.naice_code}
                        required={showNAICSField}
                      />
                    )}

                    {showBusinessTypeField && (
                      <SelectField
                        id="business_type"
                        label="Business Type"
                        options={businessTypeOptions}
                        onChange={(option) =>
                          setFieldValue("business_type", option?.value)
                        }
                        value={businessTypeOptions.find(
                          (opt) => opt.value === values.business_type
                        )}
                        touched={touched.business_type}
                        error={errors.business_type}
                        required={showBusinessTypeField}
                      />
                    )}

                    {/* Industry Type Field */}
                    {showIndustryTypeField && (
                      <div className="space-y-2">
                        <label
                          htmlFor="industry_type"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Industry Type <span className="text-red-500">*</span>
                        </label>
                        <Select
                          id="industry_type"
                          name="industry_type"
                          options={industryTypeOptions}
                          onChange={(option) => {
                            console.log(
                              "🎯 Industry type selected:",
                              option?.value
                            );
                            setFieldValue("industry_type", option?.value || "");
                            // Manually trigger blur for validation
                            setTimeout(() => {
                              handleBlur({ target: { name: "industry_type" } });
                            }, 100);
                          }}
                          onBlur={() =>
                            handleBlur({ target: { name: "industry_type" } })
                          }
                          value={industryTypeOptions.find(
                            (opt) => opt.value === values.industry_type
                          )}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          placeholder="Select Industry Type"
                          isSearchable
                        />
                        {touched.industry_type && errors.industry_type && (
                          <p className="text-red-500 text-xs mt-1 flex items-center">
                            <i className="fas fa-info-circle mr-1"></i>
                            {errors.industry_type}
                          </p>
                        )}
                        {/* Debug info */}
                        <div className="text-xs text-gray-500">
                          Selected value:{" "}
                          {values.industry_type || "Not selected"} | Options
                          loaded: {industryTypeOptions.length}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Country Section */}
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4 text-blue-600 border-b border-blue-200 pb-2">
                      Country Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Country of Registration */}
                      <SelectField
                        id="country_of_registration"
                        label="Country of Registration"
                        options={countryOptions}
                        onChange={(option) => {
                          setFieldValue(
                            "country_of_registration",
                            option?.value || ""
                          );
                        }}
                        value={countryOptions.find(
                          (opt) => opt.value === values.country_of_registration
                        )}
                        touched={touched.country_of_registration}
                        error={errors.country_of_registration}
                        required
                        isLoading={countriesLoading}
                      />

                      {/* Primary Country of Operation */}
                      <SelectField
                        id="country_of_operation"
                        label="Primary Country of Operation"
                        options={countryOptions}
                        onChange={(option) => {
                          setFieldValue(
                            "country_of_operation",
                            option?.value || ""
                          );
                        }}
                        value={countryOptions.find(
                          (opt) => opt.value === values.country_of_operation
                        )}
                        touched={touched.country_of_operation}
                        error={errors.country_of_operation}
                        required
                        isLoading={countriesLoading}
                      />

                      {/* Multi-select for additional operating countries */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Operating Countries (Optional)
                        </label>
                        {countriesLoading ? (
                          <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 animate-pulse">
                            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                          </div>
                        ) : (
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
                            className="react-select-container"
                            classNamePrefix="react-select"
                            placeholder="Select countries..."
                            isLoading={countriesLoading}
                          />
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          Select all countries where your business operates
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Registered Address Section */}
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-3">
                      Registered Address
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        id="registered_address_street_1"
                        label="Street Address"
                        name="registered_address_street_1"
                        value={values.registered_address_street_1}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={() =>
                          setActiveField("registered_address_street_1")
                        }
                        touched={touched.registered_address_street_1}
                        error={errors.registered_address_street_1}
                        required
                        activeField={activeField}
                      />

                      <FormField
                        id="registered_address_street_2"
                        label="Street Address 2 (Optional)"
                        name="registered_address_street_2"
                        value={values.registered_address_street_2}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={() =>
                          setActiveField("registered_address_street_2")
                        }
                        touched={touched.registered_address_street_2}
                        error={errors.registered_address_street_2}
                        activeField={activeField}
                      />

                      <FormField
                        id="registered_address_street_city"
                        label="City"
                        name="registered_address_street_city"
                        value={values.registered_address_street_city}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={() =>
                          setActiveField("registered_address_street_city")
                        }
                        touched={touched.registered_address_street_city}
                        error={errors.registered_address_street_city}
                        required
                        activeField={activeField}
                      />

                      <FormField
                        id="registered_address_street_state"
                        label="State/Province"
                        name="registered_address_street_state"
                        value={values.registered_address_street_state}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={() =>
                          setActiveField("registered_address_street_state")
                        }
                        touched={touched.registered_address_street_state}
                        error={errors.registered_address_street_state}
                        required
                        activeField={activeField}
                      />

                      <FormField
                        id="registered_address_street_zip"
                        label="ZIP/Postal Code"
                        name="registered_address_street_zip"
                        value={values.registered_address_street_zip}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={() =>
                          setActiveField("registered_address_street_zip")
                        }
                        touched={touched.registered_address_street_zip}
                        error={errors.registered_address_street_zip}
                        required
                        activeField={activeField}
                      />

                      {/* Registered Address Country */}
                      <SelectField
                        id="registered_address_street_country"
                        label="Registered Address Country"
                        options={countryOptions}
                        onChange={(option) => {
                          setFieldValue(
                            "registered_address_street_country",
                            option?.value || ""
                          );
                        }}
                        value={countryOptions.find(
                          (opt) =>
                            opt.value ===
                            values.registered_address_street_country
                        )}
                        touched={touched.registered_address_street_country}
                        error={errors.registered_address_street_country}
                        required
                        isLoading={countriesLoading}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <FormField
                      id="date_incorporation"
                      label="Date of Incorporation"
                      name="date_incorporation"
                      type="date"
                      value={values.date_incorporation}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={() => setActiveField("date_incorporation")}
                      touched={touched.date_incorporation}
                      error={errors.date_incorporation}
                      required
                      activeField={activeField}
                    />
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Primary Contact Information */}
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
                    Primary Contact Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      id="first_name"
                      label="First Name"
                      name="first_name"
                      value={values.first_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      touched={touched.first_name}
                      error={errors.first_name}
                      required
                    />

                    <FormField
                      id="last_name"
                      label="Last Name"
                      name="last_name"
                      value={values.last_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      touched={touched.last_name}
                      error={errors.last_name}
                      required
                    />

                    <FormField
                      id="email"
                      label="Email Address"
                      name="email"
                      type="email"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      touched={touched.email}
                      error={errors.email}
                      required
                    />

                    <PasswordField
                      id="password"
                      label="Password"
                      name="password"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      touched={touched.password}
                      error={errors.password}
                      required
                      showPassword={showPassword}
                      onToggleVisibility={() =>
                        dispatch(togglePasswordVisibility())
                      }
                      validationRules={passwordValidationRules}
                    />

                    <PasswordField
                      id="confirm_password"
                      label="Confirm Password"
                      name="confirm_password"
                      value={values.confirm_password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      touched={touched.confirm_password}
                      error={errors.confirm_password}
                      required
                      showPassword={showConfirmPassword}
                      onToggleVisibility={() =>
                        dispatch(toggleConfirmPasswordVisibility())
                      }
                    />

                    <SelectField
                      id="gender"
                      label="Gender"
                      options={genderOptions}
                      onChange={(option) =>
                        setFieldValue("gender", option?.value)
                      }
                      value={genderOptions.find(
                        (opt) => opt.value === values.gender
                      )}
                      touched={touched.gender}
                      error={errors.gender}
                      required
                    />

                    <FormField
                      id="dob"
                      label="Date of Birth"
                      name="dob"
                      type="date"
                      value={values.dob}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      touched={touched.dob}
                      error={errors.dob}
                      required
                    />

                    <SelectField
                      id="nationality"
                      label="Nationality"
                      options={nationalityOptions}
                      onChange={(option) =>
                        setFieldValue("nationality", option?.value)
                      }
                      value={nationalityOptions.find(
                        (opt) => opt.value === values.nationality
                      )}
                      touched={touched.nationality}
                      error={errors.nationality}
                      required
                    />

                    {/* Country of Residence */}
                    <SelectField
                      id="resident_country"
                      label="Country of Residence"
                      options={countryOptions}
                      onChange={(option) => {
                        setFieldValue("resident_country", option?.value || "");
                      }}
                      value={countryOptions.find(
                        (opt) => opt.value === values.resident_country
                      )}
                      touched={touched.resident_country}
                      error={errors.resident_country}
                      required
                      isLoading={countriesLoading}
                    />

                    <PhoneNumberField
                      id="mobile_number"
                      label="Mobile Number"
                      name="mobile_number"
                      value={values.mobile_number}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      touched={touched.mobile_number}
                      error={errors.mobile_number}
                      required
                      countryCodeName="mobilenumber_countrycode"
                      countryCodeValue={values.mobilenumber_countrycode}
                    />

                    {values.resident_country === "United States" &&
                      showSSNField && (
                        <FormField
                          id="ssn"
                          label="Social Security Number (SSN)"
                          name="ssn"
                          value={values.ssn}
                          onChange={(e) => {
                            const formatted = formatTaxId(
                              e.target.value,
                              "ssn"
                            );
                            setFieldValue("ssn", formatted);
                          }}
                          onBlur={handleBlur}
                          touched={touched.ssn}
                          error={errors.ssn}
                          required={values.resident_country === "United States"}
                          placeholder="XXX-XX-XXXX"
                        />
                      )}
                  </div>

                  {/* Address Section */}
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4 text-blue-600 border-b border-blue-200 pb-2">
                      Contact Address
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        id="street_address_1"
                        label="Street Address 1"
                        name="street_address_1"
                        value={values.street_address_1}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        touched={touched.street_address_1}
                        error={errors.street_address_1}
                        required
                      />

                      <FormField
                        id="street_address_2"
                        label="Street Address 2 (Optional)"
                        name="street_address_2"
                        value={values.street_address_2}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        touched={touched.street_address_2}
                        error={errors.street_address_2}
                      />

                      <FormField
                        id="city"
                        label="City"
                        name="city"
                        value={values.city}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        touched={touched.city}
                        error={errors.city}
                        required
                      />

                      <FormField
                        id="state"
                        label="State/Province"
                        name="state"
                        value={values.state}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        touched={touched.state}
                        error={errors.state}
                        required
                      />

                      <FormField
                        id="zip_code"
                        label="ZIP/Postal Code"
                        name="zip_code"
                        value={values.zip_code}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        touched={touched.zip_code}
                        error={errors.zip_code}
                        required
                      />

                      {/* Country */}
                      <SelectField
                        id="country"
                        label="Country"
                        options={countryOptions}
                        onChange={(option) => {
                          setFieldValue("country", option?.value || "");
                        }}
                        value={countryOptions.find(
                          (opt) => opt.value === values.country
                        )}
                        touched={touched.country}
                        error={errors.country}
                        required
                        isLoading={countriesLoading}
                      />
                    </div>
                  </div>

                  {/* Terms Agreement */}
                  <div className="mt-6">
                    <label className="flex items-start space-x-3">
                      <Field
                        type="checkbox"
                        name="terms_agreement"
                        className="mt-1"
                      />
                      <span className="text-sm text-gray-700">
                        I agree to the Terms and Conditions and Privacy Policy
                      </span>
                    </label>
                    {touched.terms_agreement && errors.terms_agreement && (
                      <div className="text-red-500 text-xs mt-1">
                        {errors.terms_agreement}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Controller Information */}
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
                    Please specify if you are the controller of this institution
                    or provide controller details.
                  </p>

                  <ControllerSection
                    values={values}
                    setFieldValue={setFieldValue}
                    handleBlur={handleBlur}
                    touched={touched}
                    errors={errors}
                  />
                </motion.div>
              )}

              {/* STEP 4: Ownership Information */}
              {currentStep === 4 && ownerAdd === "Y" && (
                <motion.div
                  key="step4"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.5 }}
                  className="bg-white p-6 rounded-lg shadow-sm"
                >
                  <h2 className="text-xl font-semibold mb-4">
                    Ownership Information
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Add all owners with 25% or more ownership in the
                    institution.
                  </p>

                  <FieldArray name="owner_details">
                    {({ push, remove }) => (
                      <div className="space-y-6">
                        {values.owner_details &&
                          values.owner_details.map((owner, index) => (
                            <div
                              key={index}
                              className="border border-gray-200 rounded-lg p-4"
                            >
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-blue-600">
                                  Owner {index + 1}
                                </h3>
                                {values.owner_details.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      remove(index);
                                      dispatch(removeOwner(index));
                                    }}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <i className="fas fa-trash"></i> Remove
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  id={`owner_details[${index}].owner_first_name`}
                                  label="First Name"
                                  name={`owner_details[${index}].owner_first_name`}
                                  value={owner.owner_first_name}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  touched={
                                    touched.owner_details?.[index]
                                      ?.owner_first_name
                                  }
                                  error={
                                    errors.owner_details?.[index]
                                      ?.owner_first_name
                                  }
                                  required
                                />

                                <FormField
                                  id={`owner_details[${index}].owner_last_name`}
                                  label="Last Name"
                                  name={`owner_details[${index}].owner_last_name`}
                                  value={owner.owner_last_name}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  touched={
                                    touched.owner_details?.[index]
                                      ?.owner_last_name
                                  }
                                  error={
                                    errors.owner_details?.[index]
                                      ?.owner_last_name
                                  }
                                  required
                                />

                                <FormField
                                  id={`owner_details[${index}].owner_email`}
                                  label="Email"
                                  name={`owner_details[${index}].owner_email`}
                                  type="email"
                                  value={owner.owner_email}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  touched={
                                    touched.owner_details?.[index]?.owner_email
                                  }
                                  error={
                                    errors.owner_details?.[index]?.owner_email
                                  }
                                  required
                                />

                                <FormField
                                  id={`owner_details[${index}].ownership_percentage`}
                                  label="Ownership Percentage"
                                  name={`owner_details[${index}].ownership_percentage`}
                                  type="number"
                                  value={owner.ownership_percentage}
                                  onChange={(e) => {
                                    handleChange(e);
                                    dispatch(validateOwnershipPercentage());
                                  }}
                                  onBlur={handleBlur}
                                  touched={
                                    touched.owner_details?.[index]
                                      ?.ownership_percentage
                                  }
                                  error={
                                    errors.owner_details?.[index]
                                      ?.ownership_percentage
                                  }
                                  required
                                  min="0"
                                  max="100"
                                  step="0.01"
                                />

                                <FormField
                                  id={`owner_details[${index}].owner_dob`}
                                  label="Date of Birth"
                                  name={`owner_details[${index}].owner_dob`}
                                  type="date"
                                  value={owner.owner_dob}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  touched={
                                    touched.owner_details?.[index]?.owner_dob
                                  }
                                  error={
                                    errors.owner_details?.[index]?.owner_dob
                                  }
                                  required
                                />

                                {/* Owner Country */}
                                <SelectField
                                  id={`owner_details[${index}].owner_country_id`}
                                  label="Country"
                                  options={countryOptions}
                                  onChange={(option) => {
                                    setFieldValue(
                                      `owner_details[${index}].owner_country_id`,
                                      option?.value || ""
                                    );
                                  }}
                                  value={countryOptions.find(
                                    (opt) =>
                                      opt.value === owner.owner_country_id
                                  )}
                                  touched={
                                    touched.owner_details?.[index]
                                      ?.owner_country_id
                                  }
                                  error={
                                    errors.owner_details?.[index]
                                      ?.owner_country_id
                                  }
                                  required
                                  isLoading={countriesLoading}
                                />

                                <PhoneNumberField
                                  id={`owner_details[${index}].owner_phone_number`}
                                  label="Phone Number"
                                  name={`owner_details[${index}].owner_phone_number`}
                                  value={owner.owner_phone_number}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  touched={
                                    touched.owner_details?.[index]
                                      ?.owner_phone_number
                                  }
                                  error={
                                    errors.owner_details?.[index]
                                      ?.owner_phone_number
                                  }
                                  required
                                  countryCodeName={`owner_details[${index}].owner_phone_number_country_code`}
                                  countryCodeValue={
                                    owner.owner_phone_number_country_code
                                  }
                                />

                                {/* US-specific fields for named accounts */}
                                {owner.owner_country_id === "United States" &&
                                  isNamedAccount && (
                                    <>
                                      <FormField
                                        id={`owner_details[${index}].ssn`}
                                        label="SSN"
                                        name={`owner_details[${index}].ssn`}
                                        value={owner.ssn}
                                        onChange={(e) => {
                                          const formatted = formatTaxId(
                                            e.target.value,
                                            "ssn"
                                          );
                                          setFieldValue(
                                            `owner_details[${index}].ssn`,
                                            formatted
                                          );
                                        }}
                                        onBlur={handleBlur}
                                        touched={
                                          touched.owner_details?.[index]?.ssn
                                        }
                                        error={
                                          errors.owner_details?.[index]?.ssn
                                        }
                                        required
                                        placeholder="XXX-XX-XXXX"
                                      />

                                      <EnhancedDocumentSection
                                        values={values}
                                        setFieldValue={setFieldValue}
                                        handleChange={handleChange}
                                        handleBlur={handleBlur}
                                        touched={touched}
                                        errors={errors}
                                        index={index}
                                        owner={owner}
                                      />
                                    </>
                                  )}

                                {/* System Access */}
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Does this owner need access to the system?
                                  </label>
                                  <div className="flex space-x-4">
                                    <label className="flex items-center">
                                      <Field
                                        type="radio"
                                        name={`owner_details[${index}].owner_needs_access_to_system`}
                                        value="yes"
                                        className="mr-2"
                                      />
                                      <span>Yes</span>
                                    </label>
                                    <label className="flex items-center">
                                      <Field
                                        type="radio"
                                        name={`owner_details[${index}].owner_needs_access_to_system`}
                                        value="no"
                                        className="mr-2"
                                      />
                                      <span>No</span>
                                    </label>
                                  </div>

                                  {owner.owner_needs_access_to_system ===
                                    "yes" && (
                                    <div className="mt-3">
                                      <SelectField
                                        id={`owner_details[${index}].owner_role_id`}
                                        label="Role"
                                        options={roleOptions}
                                        onChange={(option) =>
                                          setFieldValue(
                                            `owner_details[${index}].owner_role_id`,
                                            option?.value
                                          )
                                        }
                                        value={roleOptions.find(
                                          (opt) =>
                                            opt.value === owner.owner_role_id
                                        )}
                                        touched={
                                          touched.owner_details?.[index]
                                            ?.owner_role_id
                                        }
                                        error={
                                          errors.owner_details?.[index]
                                            ?.owner_role_id
                                        }
                                        required
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}

                        {/* Add Owner Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const newOwner = {
                              owner_first_name: "",
                              owner_last_name: "",
                              owner_email: "",
                              owner_phone_number: "",
                              owner_country_id: "",
                              ownership_percentage: 0,
                              owner_dob: "",
                              owner_needs_access_to_system: "no",
                              owner_role_id: "",
                              ssn: "",
                              doc_type: "",
                              doc_id: "",
                              doc_country: "",
                              doc_state: "",
                              id_issued_date: "",
                              doc_file: null,
                            };
                            push(newOwner);
                            dispatch(addOwner(newOwner));
                          }}
                          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors"
                        >
                          <i className="fas fa-plus mr-2"></i>
                          Add Another Owner
                        </button>

                        {/* Total Ownership Display */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">
                              Total Ownership:
                            </span>
                            <span
                              className={`text-lg font-bold ${
                                Math.abs(totalOwnershipPercentage - 100) < 0.01
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {totalOwnershipPercentage.toFixed(2)}%
                            </span>
                          </div>
                          {Math.abs(totalOwnershipPercentage - 100) > 0.01 && (
                            <p className="text-red-600 text-sm mt-2">
                              Total ownership must equal 100%. Current
                              difference:{" "}
                              {(100 - totalOwnershipPercentage).toFixed(2)}%
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </FieldArray>
                </motion.div>
              )}

              {/* STEP 5: Document Upload & Final Review */}
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
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  setFieldValue(`user_image.${doc.id}`, file);
                                  dispatch(
                                    uploadFile({ documentId: doc.id, file })
                                  );
                                }
                              }}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              accept=".jpg,.jpeg,.png,.pdf"
                            />
                            {values.user_image && values.user_image[doc.id] && (
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

                  {/* Final Terms Agreement */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">
                      Final Agreement
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="flex items-start space-x-3">
                        <Field
                          type="checkbox"
                          name="terms_agreement"
                          className="mt-1"
                        />
                        <span className="text-sm text-gray-700">
                          I certify that all information provided is true and
                          accurate to the best of my knowledge. I agree to abide
                          by the terms and conditions of this institution
                          registration.
                        </span>
                      </label>
                      {touched.terms_agreement && errors.terms_agreement && (
                        <div className="text-red-500 text-xs mt-1">
                          {errors.terms_agreement}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary Section */}
                  <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-green-800 mb-2">
                      Ready to Submit!
                    </h3>
                    <p className="text-green-700 text-sm">
                      Please review all information before submitting. Once
                      submitted, your application will be processed and you will
                      receive a confirmation email.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="mt-8 flex items-center justify-between gap-12">
              {/* Previous Button */}
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => dispatch(setCurrentStep(currentStep - 1))}
                  className="flex items-center justify-center w-full gap-2 rounded-xl bg-gray-100 px-6 py-3 text-gray-700 shadow-sm hover:bg-gray-200 transition-all duration-200"
                >
                  ← Previous
                </button>
              ) : (
                <div /> // keeps spacing consistent
              )}

              {/* Next / Complete Button */}
              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={() =>
                    handleNextStep(values, setErrors, setTouched, validateForm)
                  }
                  disabled={loading}
                  className="flex items-center justify-center w-full gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white shadow-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? <ClipLoader size={20} color="#fff" /> : "Next →"}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={
                    loading || !isStepComplete(5, values, errors, touched)
                  }
                  className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-white shadow-md hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? (
                    <ClipLoader size={20} color="#fff" />
                  ) : (
                    "✅ Complete Registration"
                  )}
                </button>
              )}
            </div>

            {/* Cancel Button */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="bg-red-500 w-full py-3 text-white rounded-lg hover:bg-red-600 transition duration-200"
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

            {errors._form && touched._form && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {errors._form}
              </div>
            )}
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default Institution;