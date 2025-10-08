// src/features/Auth/components/SignUpInstitution.js
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Formik,
  Form,
  Field,
  ErrorMessage,
  useFormikContext,
  FieldArray,
} from "formik";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import Select from "react-select";
import InstitutionPopup from "../../../components/PopupModal/InstitutionPopup";
import FormField from "../../Auth/SignUp/FormFields/FormField";
import PasswordField from "../../Auth/SignUp/FormFields/PasswordField";
import SelectField from "../../Auth/SignUp/FormFields/SelectField";
import BenefitsSection from "../../Auth/SignUp/FormFields/BenefitsSection";
import institutionSchema from "../../../components/Schema/InstitutionSchema";

// Import Redux actions and selectors
import {
  initializeInstitutionSignup,
  fetchInstitutionData,
  submitInstitutionForm,
  uploadFile,
  validateInstitutionStep,
  setCurrentStep,
  setFormField,
  setOwnerField,
  addOwner,
  removeOwner,
  setFieldVisibility,
  setSelectedCountry,
  setSelectedCurrency,
  setSelectedIndustry,
  updateTotalOwnership,
  setIsOwner,
  togglePasswordVisibility,
  toggleConfirmPasswordVisibility,
  setShowPopup,
  setErrorMessage,
  selectInstitutionRegistration,
  fetchGenders,
  fetchNationalities,
  // NEW: Missing feature actions
  setLocationStateData,
  setAccountType,
  setPackageCurrencies,
  setKycRequirements,
  setDocumentRequirements,
  setReferralData,
  setSsnRequired,
  setEinRequired,
  setBusinessAlias,
  setTermsAgreement,
  setWhiteLabelInfo,
  syncControllerDataFromForm,
  validateOwnershipPercentage,
  updateFieldVisibility,
  fetchTermsAndConditions,
  validateBusinessAlias,
  fetchIndustryTypesWithNAICS,
} from "../slices/institutionRegistrationSlice";

// Import country actions and selectors
import {
  fetchCountries,
  selectCountriesOptions,
} from "../../../features/Auth/slices/countrySlice";

const stepVariants = {
  hidden: { opacity: 0, x: 100 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
};

const Institution = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeField, setActiveField] = useState("");
  const [businessAliasValid, setBusinessAliasValid] = useState(null);

  // Select state from Redux store
  const institutionState = useSelector(
    (state) => state.institutionRegistration
  );
  const {
    currentStep,
    formData,
    loading,
    error,
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
    // NEW: Missing feature state
    locationState,
    accountType,
    packageCurrencies,
    kycVerify,
    documentUpload,
    ownerAdd,
    referralCode,
    agentCode,
    ssnRequired,
    einRequired,
    isNamedAccount,
    defaultCurrency,
    businessAlias,
    termsConditions,
    isWhiteLabelledPartner,
    whiteLabelledPartnerId,
    partnerPackageModule,
    controllerSynced,
    ownershipValidation,
    showUSDFields,
    showSSNField,
    showBusinessAliasField,
  } = institutionState;

  // Get countries from the country slice
  const countries = useSelector(selectCountriesOptions);

  // FIX: Correct the variable name - it was locationStateData in the error
  const locationStateData = location.state || {};

  // NEW: Location state processing on component mount
  useEffect(() => {
    if (locationStateData && Object.keys(locationStateData).length > 0) {
      dispatch(setLocationStateData(locationStateData));

      // Process service provider IDs to determine account type
      if (locationStateData.service_provide_ids) {
        const isNamed = determineAccountType(
          locationStateData.service_provide_ids
        );
        dispatch(setAccountType(isNamed ? "named" : "pooled"));
      }

      // Set package currencies
      if (locationStateData.package_currencies) {
        dispatch(setPackageCurrencies(locationStateData.package_currencies));
      }

      // Set KYC and document requirements
      if (locationStateData.kyc_verify !== undefined) {
        dispatch(setKycRequirements(locationStateData.kyc_verify));
      }
      if (locationStateData.document_upload !== undefined) {
        dispatch(setDocumentRequirements(locationStateData.document_upload));
      }
      if (locationStateData.owner_add !== undefined) {
        dispatch(setOwnerAdd(locationStateData.owner_add));
      }

      // Set referral data
      if (locationStateData.referral_code) {
        dispatch(
          setReferralData({
            referralCode: locationStateData.referral_code,
            agentCode: locationStateData.agent_code,
          })
        );
      }

      // Set SSN/EIN requirements
      if (locationStateData.ssn_required !== undefined) {
        dispatch(setSsnRequired(locationStateData.ssn_required));
      }
      if (locationStateData.ein_required !== undefined) {
        dispatch(setEinRequired(locationStateData.ein_required));
      }

      // Set white-labeling info
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
  }, [locationStateData, dispatch]); // FIX: Correct dependency array

  // NEW: Determine account type based on service providers
  const determineAccountType = (serviceProviderIds) => {
    if (!serviceProviderIds || !Array.isArray(serviceProviderIds)) return false;

    // Logic to determine if this is a named account
    // Named account providers typically have specific IDs
    const namedAccountProviders = ["HK6V7709", "NAMED_ACCOUNT_PROVIDER"];
    return serviceProviderIds.some((id) =>
      namedAccountProviders.includes(id.toString())
    );
  };

  // NEW: Currency determination logic
  useEffect(() => {
    if (packageCurrencies && packageCurrencies.length > 0) {
      // Determine default currency - prefer USD if available, otherwise first currency
      const usdCurrency = packageCurrencies.find(
        (currency) =>
          currency.code === "USD" || currency.currency_code === "USD"
      );
      const defaultCurrency = usdCurrency || packageCurrencies[0];

      if (defaultCurrency) {
        dispatch(setSelectedCurrency(defaultCurrency));

        // Set field visibility based on currency
        const isUSD =
          defaultCurrency.code === "USD" ||
          defaultCurrency.currency_code === "USD";
        dispatch(
          setFieldVisibility({ field: "showUSDFields", visible: isUSD })
        );
      }
    }
  }, [packageCurrencies, dispatch]);

  // NEW: Country-specific logic
  useEffect(() => {
    if (formData.country_of_registration) {
      const isUS = formData.country_of_registration === "United States";

      // Update field visibility based on country and business rules
      dispatch(
        updateFieldVisibility({
          country: formData.country_of_registration,
          currency: defaultCurrency?.code || defaultCurrency?.currency_code,
          accountType: accountType,
        })
      );

      // Set SSN/EIN requirements based on country and business rules
      if (isUS) {
        dispatch(setSsnRequired(true));
        if (einRequired === undefined) {
          dispatch(setEinRequired(true));
        }
      }
    }
  }, [
    formData.country_of_registration,
    defaultCurrency,
    accountType,
    einRequired,
    dispatch,
  ]);

  // NEW: Controller sync logic
  useEffect(() => {
    // If user indicates they are the controller, auto-fill their information
    if (
      formData.is_controller === "yes" &&
      currentStep === 3 &&
      !controllerSynced
    ) {
      dispatch(syncControllerDataFromForm(formData));
    }
  }, [formData.is_controller, currentStep, controllerSynced, dispatch]);

  // NEW: Fetch terms and conditions
  useEffect(() => {
    if (isWhiteLabelledPartner && whiteLabelledPartnerId) {
      dispatch(fetchTermsAndConditions(whiteLabelledPartnerId));
    }
  }, [isWhiteLabelledPartner, whiteLabelledPartnerId, dispatch]);

  // NEW: Ownership validation
  useEffect(() => {
    dispatch(validateOwnershipPercentage());
  }, [formData.owner_details, dispatch]);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(updateTotalOwnership());
    }, 300);

    // Fetch all necessary data if not already loaded
    if (countries.length === 0) {
      dispatch(fetchCountries());
    }

    // Add these lines to fetch genders and nationalities
    if (genders.length === 0) {
      dispatch(fetchGenders());
    }
    if (nationalities.length === 0) {
      dispatch(fetchNationalities());
    }

    return () => clearTimeout(timer);
  }, [
    formData.owner_details,
    dispatch,
    countries.length,
    genders.length,
    nationalities.length,
  ]);

  // Update total ownership percentage when owner details change
  useEffect(() => {
    dispatch(updateTotalOwnership());
  }, [formData.owner_details, dispatch]);

  // Memoized country options for select fields
  const countryOptions = useMemo(() => {
    return countries.map((country) => ({
      value: country.countryName || country.name || country.label,
      label: country.name || country.label,
      phoneCode: country.phoneCode || country.phone_code,
      countryCode: country.countryCode || country.code, // Add this for short codes
    }));
  }, [countries]);

  useEffect(() => {
    // Only validate if we have owner details
    if (formData.owner_details && formData.owner_details.length > 0) {
      dispatch(validateOwnershipPercentage());
    }
  }, [formData.owner_details, dispatch]);

  // Memoized options for other select fields
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

  const industryTypeOptions = useMemo(
    () => industryTypes.map((type) => ({ value: type.id, label: type.name })),
    [industryTypes]
  );

  const genderOptions = useMemo(() => {
    const options = genders.map((gender) => ({
      value: gender.id,
      label: gender.name,
    }));
    return options;
  }, [genders]);

  const nationalityOptions = useMemo(() => {
    const options = nationalities.map((nationality) => ({
      value: nationality.id,
      label: nationality.name,
    }));
    return options;
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

  // NEW: Enhanced validation helper for EIN/SSN formatting
  const formatTaxId = (value, type) => {
    if (!value) return value;

    const cleanValue = value.replace(/\D/g, "");

    if (type === "ein") {
      // EIN format: XX-XXXXXXX
      if (cleanValue.length <= 2) return cleanValue;
      return `${cleanValue.slice(0, 2)}-${cleanValue.slice(2, 9)}`;
    } else if (type === "ssn") {
      // SSN format: XXX-XX-XXXX
      if (cleanValue.length <= 3) return cleanValue;
      if (cleanValue.length <= 5)
        return `${cleanValue.slice(0, 3)}-${cleanValue.slice(3)}`;
      return `${cleanValue.slice(0, 3)}-${cleanValue.slice(
        3,
        5
      )}-${cleanValue.slice(5, 9)}`;
    }

    return value;
  };

  // NEW: Business alias validation
  const validateBusinessAliasField = async (value) => {
    if (!value) return "Business alias is required";
    if (value.length < 3) return "Business alias must be at least 3 characters";

    try {
      const result = await dispatch(validateBusinessAlias(value)).unwrap();
      setBusinessAliasValid(result.valid);
      return result.valid ? null : "Business alias is already taken";
    } catch (error) {
      return "Error validating business alias";
    }
  };

  // NEW: Enhanced phone number handling with country flags
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

    useEffect(() => {
      if (countryCodeValue && countryOptions.length > 0) {
        const country = countryOptions.find(
          (opt) => opt.phoneCode === countryCodeValue
        );
        setSelectedCountry(country);
      }
    }, [countryCodeValue, countryOptions]);

    useEffect(() => {
      // If user indicates they are the controller, auto-fill their information
      if (
        formData.is_controller === "yes" &&
        currentStep === 3 &&
        !controllerSynced
      ) {
        dispatch(syncControllerData(formData))
          .unwrap()
          .then(() => {
            console.log("Controller data synced successfully");
          })
          .catch((error) => {
            console.error("Failed to sync controller data:", error);
            // You might want to show an error message to the user
            dispatch(
              setErrorMessage(
                "Failed to auto-fill controller information. Please fill manually."
              )
            );
            dispatch(setShowPopup(true));
          });
      }
    }, [formData.is_controller, currentStep, controllerSynced, dispatch]);

    return (
      <div className="space-y-2">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex space-x-2">
          <div className="w-1/3">
            <Select
              options={countryOptions.map((country) => ({
                value: country.phoneCode,
                label: (
                  <div className="flex items-center">
                    <span className="mr-2 text-lg">
                      {getCountryFlag(country.countryCode)}
                    </span>
                    {country.countryCode} (+{country.phoneCode})
                  </div>
                ),
                country: country,
              }))}
              value={
                selectedCountry
                  ? {
                      value: selectedCountry.phoneCode,
                      label: (
                        <div className="flex items-center">
                          <span className="mr-2 text-lg">
                            {getCountryFlag(selectedCountry.countryCode)}
                          </span>
                          {selectedCountry.countryCode} (+
                          {selectedCountry.phoneCode})
                        </div>
                      ),
                    }
                  : null
              }
              onChange={(option) => {
                setSelectedCountry(option.country);
                if (countryCodeName) {
                  onChange({
                    target: { name: countryCodeName, value: option.value },
                  });
                }
              }}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Code"
            />
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

  // NEW: Helper function to get country flag (simplified version)
  const getCountryFlag = (countryCode) => {
    const flags = {
      us: "🇺🇸",
      ca: "🇨🇦",
      gb: "🇬🇧",
      de: "🇩🇪",
      fr: "🇫🇷",
      it: "🇮🇹",
      es: "🇪🇸",
      au: "🇦🇺",
      jp: "🇯🇵",
      cn: "🇨🇳",
      in: "🇮🇳",
      br: "🇧🇷",
      mx: "🇲🇽",
      // Add more country codes as needed
    };
    return flags[countryCode.toLowerCase()] || "🇺🇳";
  };

  // NEW: SSN Info Popup Component
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

  // NEW: Controller Information Section (Step 3 Enhanced)
  // Enhanced ControllerSection with all the same fields as Responsible Person
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
            {/* Include ALL the same fields as Responsible Person Information */}
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

            <SelectField
              id="controller_country"
              label="Controller Country of Residence"
              options={countryOptions}
              onChange={(option) =>
                setFieldValue("controller_country", option?.value)
              }
              value={countryOptions.find(
                (opt) => opt.value === values.controller_country
              )}
              touched={touched.controller_country}
              error={errors.controller_country}
              required
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

            {/* Address Information - Same as Responsible Person */}
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

            <SelectField
              id="controller_country_address"
              label="Controller Country"
              options={countryOptions}
              onChange={(option) =>
                setFieldValue("controller_country_address", option?.value)
              }
              value={countryOptions.find(
                (opt) => opt.value === values.controller_country_address
              )}
              touched={touched.controller_country_address}
              error={errors.controller_country_address}
              required
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

  // NEW: Enhanced document upload section with country-specific validation
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
              // Reset dependent fields when document type changes
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
              <SelectField
                id={`owner_details[${index}].doc_country`}
                label="Issuing Country"
                options={countryOptions}
                onChange={(option) =>
                  setFieldValue(
                    `owner_details[${index}].doc_country`,
                    option?.value
                  )
                }
                value={countryOptions.find(
                  (opt) => opt.value === owner.doc_country
                )}
                touched={touched.owner_details?.[index]?.doc_country}
                error={errors.owner_details?.[index]?.doc_country}
                required
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
  const passwordValidationRules = [
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
  ];

  const handleNextStep = async (
    values,
    setErrors,
    setTouched,
    validateForm
  ) => {
    try {
      console.log("=== DEBUG: Starting handleNextStep ===");
      console.log("Current step:", currentStep);

      // Mark all fields for the current step as touched to show validation errors
      const stepFields = getStepFields(currentStep, values);
      const touchedFields = {};

      stepFields.forEach((field) => {
        if (field.includes("[") && field.includes("]")) {
          // Handle array fields (owner_details)
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
          // Handle regular fields
          touchedFields[field] = true;
        }
      });

      setTouched(touchedFields);

      // Validate the form
      const formErrors = await validateForm();
      console.log("Form validation errors:", formErrors);

      if (Object.keys(formErrors).length > 0) {
        console.log(
          `Step ${currentStep} validation failed with errors:`,
          formErrors
        );

        // Get the first error message for the popup
        const firstError = getFirstErrorMessage(formErrors);
        dispatch(setErrorMessage(firstError));
        dispatch(setShowPopup(true));
        return;
      }

      console.log(
        `Step ${currentStep} validation passed, preparing step data...`
      );

      // Prepare step-specific data for API
      let stepData = prepareStepData(currentStep, values);
      console.log("Sending data to API...");
      console.log("Step data:", stepData);

      // Proceed with API call
      const result = await dispatch(submitInstitutionForm(stepData)).unwrap();
      console.log("API response:", result);

      // Handle the response
      if (result && (result.success === true || result.success === undefined)) {
        console.log("Step completed successfully, moving to next step");
        dispatch(setCurrentStep(currentStep + 1));

        // Reset any previous errors
        dispatch(setErrorMessage(""));
        dispatch(setShowPopup(false));
      } else if (result && result.success === false) {
        console.log("Server validation failed:", result.message);
        dispatch(setErrorMessage(result.message || "Validation failed"));
        dispatch(setShowPopup(true));
      } else if (result && result.message) {
        console.log("Server response:", result.message);
        dispatch(setErrorMessage(result.message));
        dispatch(setShowPopup(true));
      } else {
        console.log("Empty API response received - assuming success");
        dispatch(setCurrentStep(currentStep + 1));
      }
    } catch (error) {
      console.error("Error in handleNextStep:", error);

      let errorMessage = "An error occurred. Please try again.";

      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (Array.isArray(error)) {
        errorMessage = error.join(", ");
      }

      dispatch(setErrorMessage(errorMessage));
      dispatch(setShowPopup(true));
    }
  };

  // Helper function to get fields for each step
  const getStepFields = (step, values) => {
    switch (step) {
      case 1:
        const step1Fields = [
          "institution_name",
          "registration_number",
          "country_of_registration",
          "country_of_operation",
          "registered_address_street_1",
          "registered_address_street_city",
          "registered_address_street_state",
          "registered_address_street_zip",
          "registered_address_street_country",
          "date_incorporation",
        ];

        if (showEINField) step1Fields.push("ein");
        if (showNAICSField) step1Fields.push("naice_code");
        if (showBusinessTypeField) step1Fields.push("business_type");
        if (showIndustryTypeField) step1Fields.push("industry_type");
        if (showBusinessAliasField) step1Fields.push("business_alias");

        return step1Fields;

      case 2:
        const fields = ["mobilenumber_countrycode", "mobile_number"];
        if (values.showBusinessEmailField) fields.push("business_email");
        if (values.showBusinessWebsiteField) fields.push("business_website");
        return fields;

      case 3:
        const step3Fields = [
          "first_name",
          "last_name",
          "email",
          "designation",
          "password",
          "confirm_password",
          "gender",
          "dob",
          "nationality",
          "resident_country",
          "street_address_1",
          "city",
          "state",
          "zip_code",
          "country",
          "is_controller",
        ];

        if (values.resident_country === "United States" && ssnRequired) {
          step3Fields.push("ssn");
        }

        if (values.is_controller === "no") {
          step3Fields.push(
            "controller_first_name",
            "controller_last_name",
            "controller_email",
            "controller_phone",
            "controller_nationality",
            "controller_country"
          );
          if (values.controller_country === "United States" && ssnRequired) {
            step3Fields.push("controller_ssn");
          }
        }

        return step3Fields;

      case 4:
        const ownerFields = [];
        values.owner_details.forEach((owner, index) => {
          ownerFields.push(
            `owner_details[${index}].owner_first_name`,
            `owner_details[${index}].owner_last_name`,
            `owner_details[${index}].owner_email`,
            `owner_details[${index}].owner_phone_number`,
            `owner_details[${index}].owner_country_id`,
            `owner_details[${index}].owner_role_id`,
            `owner_details[${index}].ownership_percentage`,
            `owner_details[${index}].owner_dob`,
            `owner_details[${index}].doc_type`,
            `owner_details[${index}].doc_id`,
            `owner_details[${index}].doc_country`
          );

          if (owner.owner_country_id === "United States" && ssnRequired) {
            ownerFields.push(`owner_details[${index}].ssn`);
          }

          if (owner.doc_country === "United States") {
            ownerFields.push(`owner_details[${index}].doc_state`);
          }

          if (owner.doc_type) {
            ownerFields.push(`owner_details[${index}].id_issued_date`);
          }
        });
        return ownerFields;

      case 5:
        return ["terms_agreement"];

      default:
        return [];
    }
  };

  // Helper function to get the first error message
  const getFirstErrorMessage = (errors) => {
    for (const [key, value] of Object.entries(errors)) {
      if (value) {
        if (typeof value === "string") {
          return value;
        } else if (Array.isArray(value)) {
          return value[0] || "Validation error";
        } else if (typeof value === "object") {
          // Handle nested errors (like owner_details array)
          const nestedError = getFirstErrorMessage(value);
          if (nestedError) return nestedError;
        }
      }
    }
    return "Please check all required fields.";
  };

  // Helper function to prepare data for each step
  const prepareStepData = (step, values) => {
    const baseData = {
      step: step.toString(),
      referral_code: referralCode,
      agent_code: agentCode,
      is_named_account: isNamedAccount,
      package_currencies: packageCurrencies,
    };

    switch (step) {
      case 1:
        return {
          ...baseData,
          institution_name: values.institution_name,
          registration_number: values.registration_number,
          ein: values.ein || "",
          naice_code: values.naice_code || "",
          business_type: values.business_type || "",
          country_of_registration: values.country_of_registration,
          country_of_operation: values.country_of_operation,
          operating_countries: values.operating_countries || [],
          registered_address_street_1: values.registered_address_street_1,
          registered_address_street_2: values.registered_address_street_2 || "",
          registered_address_street_city: values.registered_address_street_city,
          registered_address_street_state:
            values.registered_address_street_state,
          registered_address_street_zip: values.registered_address_street_zip,
          registered_address_street_country:
            values.registered_address_street_country,
          date_incorporation: values.date_incorporation,
          industry_type: values.industry_type || "",
          business_alias: values.business_alias || "",
        };

      case 2:
        return {
          ...baseData,
          business_email: values.business_email || "",
          business_website: values.business_website || "",
          mobilenumber_countrycode: values.mobilenumber_countrycode,
          mobile_number: values.mobile_number,
        };

      case 3:
        const step3Data = {
          ...baseData,
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          designation: values.designation,
          password: values.password,
          confirm_password: values.confirm_password,
          gender: values.gender,
          dob: values.dob,
          nationality: values.nationality,
          resident_country: values.resident_country,
          street_address_1: values.street_address_1,
          street_address_2: values.street_address_2 || "",
          city: values.city,
          state: values.state,
          zip_code: values.zip_code,
          country: values.country,
          is_controller: values.is_controller,
        };

        if (values.resident_country === "United States" && ssnRequired) {
          step3Data.ssn = values.ssn || "";
        }

        if (values.is_controller === "no") {
          step3Data.controller_first_name = values.controller_first_name;
          step3Data.controller_last_name = values.controller_last_name;
          step3Data.controller_email = values.controller_email;
          step3Data.controller_phone = values.controller_phone;
          step3Data.controller_nationality = values.controller_nationality;
          step3Data.controller_country = values.controller_country;

          if (values.controller_country === "United States" && ssnRequired) {
            step3Data.controller_ssn = values.controller_ssn || "";
          }
        }

        return step3Data;

      case 4:
        return {
          ...baseData,
          owner_details: values.owner_details.map((owner) => ({
            owner_type: owner.owner_type,
            owner_first_name: owner.owner_first_name,
            owner_middle_name: owner.owner_middle_name || "",
            owner_last_name: owner.owner_last_name,
            owner_email: owner.owner_email,
            owner_phone_number: owner.owner_phone_number,
            owner_phone_number_country_code:
              owner.owner_phone_number_country_code || "",
            owner_country_id: owner.owner_country_id,
            owner_role_id: owner.owner_role_id,
            owner_needs_access_to_system:
              owner.owner_needs_access_to_system || "no",
            ownership_percentage: parseFloat(owner.ownership_percentage) || 0,
            owner_dob: owner.owner_dob,
            ssn: owner.ssn || "",
            doc_type: owner.doc_type,
            doc_id: owner.doc_id,
            doc_country: owner.doc_country || "",
            doc_state: owner.doc_state || "",
            id_issued_date: owner.id_issued_date || "",
            owner_if: owner.owner_if || "no",
          })),
        };

      case 5:
        return {
          ...baseData,
          user_image: values.user_image,
          terms_agreed: values.terms_agreement || true,
          agreement_metadata: {
            ip_address: values.agreement_ip || "",
            user_agent: navigator.userAgent,
            accepted_at: new Date().toISOString(),
          },
        };

      default:
        return baseData;
    }
  };

  const validateStep = async (step, values) => {
    try {
      const result = await dispatch(
        validateInstitutionStep({ step, values })
      ).unwrap();
      return result.isValid;
    } catch (error) {
      console.error("Validation error:", error);
      return false;
    }
  };

  const handleFileChange = (e, docType) => {
    const file = e.target.files[0];
    if (file) {
      dispatch(uploadFile({ file, docType }));
    }
  };

  const handleOwnerFileChange = (e, index, docType) => {
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
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Submit the complete form data
      const result = await dispatch(submitInstitutionForm(values)).unwrap();

      // Handle successful submission
      if (result.success) {
        navigate("/success");
      } else {
        dispatch(setErrorMessage(result.message || "Registration failed"));
        dispatch(setShowPopup(true));
      }
    } catch (error) {
      console.error("Registration error:", error);
      dispatch(setErrorMessage("Registration failed. Please try again."));
      dispatch(setShowPopup(true));
    } finally {
      setSubmitting(false);
    }
  };

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
          ssnRequired,
          einRequired,
          accountType,
          // ADD THESE FIELD VISIBILITY VARIABLES
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
          isValid,
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

                  {/* Account Type Indicator */}
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

                    {/* Business Alias for Named Accounts */}
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

                    {showIndustryTypeField && (
                      <SelectField
                        id="industry_type"
                        label="Industry Type"
                        options={industryTypeOptions}
                        onChange={(option) =>
                          setFieldValue("industry_type", option?.value)
                        }
                        value={industryTypeOptions.find(
                          (opt) => opt.value === values.industry_type
                        )}
                        touched={touched.industry_type}
                        error={errors.industry_type}
                        required={showIndustryTypeField}
                      />
                    )}
                  </div>

                  {/* Country Section */}
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4 text-blue-600 border-b border-blue-200 pb-2">
                      Country Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SelectField
                        id="country_of_registration"
                        label="Country of Registration"
                        name="country_of_registration"
                        options={countryOptions}
                        onChange={(option) =>
                          setFieldValue(
                            "country_of_registration",
                            option?.value
                          )
                        }
                        value={countryOptions.find(
                          (opt) => opt.value === values.country_of_registration
                        )}
                        touched={touched.country_of_registration}
                        error={errors.country_of_registration}
                        required
                      />

                      <SelectField
                        id="country_of_operation"
                        label="Primary Country of Operation"
                        name="country_of_operation"
                        options={countryOptions}
                        onChange={(option) =>
                          setFieldValue("country_of_operation", option?.value)
                        }
                        value={countryOptions.find(
                          (opt) => opt.value === values.country_of_operation
                        )}
                        touched={touched.country_of_operation}
                        error={errors.country_of_operation}
                        required
                      />

                      {/* Multi-select for additional operating countries */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Operating Countries (Optional)
                        </label>
                        <Select
                          isMulti
                          options={countryOptions}
                          value={countryOptions.filter((opt) =>
                            values.operating_countries?.includes(opt.value)
                          )}
                          onChange={(selectedOptions) =>
                            setFieldValue(
                              "operating_countries",
                              selectedOptions
                                ? selectedOptions.map((opt) => opt.value)
                                : []
                            )
                          }
                          className="react-select-container"
                          classNamePrefix="react-select"
                          placeholder="Select countries..."
                        />
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

                      <SelectField
                        id="registered_address_street_country"
                        label="Registered Address Country"
                        name="registered_address_street_country"
                        options={countryOptions}
                        onChange={(option) =>
                          setFieldValue(
                            "registered_address_street_country",
                            option?.value
                          )
                        }
                        value={countryOptions.find(
                          (opt) =>
                            opt.value ===
                            values.registered_address_street_country
                        )}
                        touched={touched.registered_address_street_country}
                        error={errors.registered_address_street_country}
                        required
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
                    Contact Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {showBusinessEmailField && (
                      <FormField
                        id="business_email"
                        label="Business Email"
                        name="business_email"
                        type="email"
                        value={values.business_email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={() => setActiveField("business_email")}
                        touched={touched.business_email}
                        error={errors.business_email}
                        required={showBusinessEmailField}
                        activeField={activeField}
                      />
                    )}

                    {showBusinessWebsiteField && (
                      <FormField
                        id="business_website"
                        label="Business Website"
                        name="business_website"
                        type="url"
                        value={values.business_website}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={() => setActiveField("business_website")}
                        touched={touched.business_website}
                        error={errors.business_website}
                        activeField={activeField}
                      />
                    )}

                    {/* Enhanced Mobile Number Section */}
                    <div className="md:col-span-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                          <label
                            htmlFor="mobilenumber_countrycode"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Country Code *
                          </label>
                          <Select
                            id="mobilenumber_countrycode"
                            name="mobilenumber_countrycode"
                            options={countryOptions.map((country) => ({
                              value: country.phoneCode,
                              label: (
                                <div className="flex items-center">
                                  <span className="mr-2 text-lg">
                                    {getCountryFlag(country.value)}
                                  </span>
                                  {country.phoneCode}
                                </div>
                              ),
                            }))}
                            value={countryOptions
                              .map((country) => ({
                                value: country.phoneCode,
                                label: (
                                  <div className="flex items-center">
                                    <span className="mr-2 text-lg">
                                      {getCountryFlag(country.value)}
                                    </span>
                                    {country.phoneCode}
                                  </div>
                                ),
                              }))
                              .find(
                                (opt) =>
                                  opt.value === values.mobilenumber_countrycode
                              )}
                            onChange={(option) => {
                              setFieldValue(
                                "mobilenumber_countrycode",
                                option?.value || ""
                              );
                              setTouched({
                                ...touched,
                                mobilenumber_countrycode: true,
                              });
                            }}
                            onBlur={() =>
                              setTouched({
                                ...touched,
                                mobilenumber_countrycode: true,
                              })
                            }
                            className="react-select-container"
                            classNamePrefix="react-select"
                            placeholder="Select country code"
                            isSearchable
                          />
                          {touched.mobilenumber_countrycode &&
                            errors.mobilenumber_countrycode && (
                              <div className="text-red-500 text-xs mt-1">
                                {errors.mobilenumber_countrycode}
                              </div>
                            )}
                        </div>

                        <div className="md:col-span-2">
                          <FormField
                            id="mobile_number"
                            label="Mobile Number *"
                            name="mobile_number"
                            value={values.mobile_number}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            onFocus={() => setActiveField("mobile_number")}
                            touched={touched.mobile_number}
                            error={errors.mobile_number}
                            required
                            activeField={activeField}
                            placeholder="Enter your mobile number"
                            type="tel"
                          />
                        </div>
                      </div>
                    </div>
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
                    Responsible Person Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      id="first_name"
                      label="First Name"
                      name="first_name"
                      value={values.first_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={() => setActiveField("first_name")}
                      touched={touched.first_name}
                      error={errors.first_name}
                      required
                      activeField={activeField}
                    />

                    <FormField
                      id="last_name"
                      label="Last Name"
                      name="last_name"
                      value={values.last_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={() => setActiveField("last_name")}
                      touched={touched.last_name}
                      error={errors.last_name}
                      required
                      activeField={activeField}
                    />

                    <FormField
                      id="email"
                      label="Email Address"
                      name="email"
                      type="email"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={() => setActiveField("email")}
                      touched={touched.email}
                      error={errors.email}
                      required
                      activeField={activeField}
                    />

                    <FormField
                      id="designation"
                      label="Designation"
                      name="designation"
                      value={values.designation}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={() => setActiveField("designation")}
                      touched={touched.designation}
                      error={errors.designation}
                      required
                      activeField={activeField}
                    />

                    <PasswordField
                      id="password"
                      label="Password"
                      name="password"
                      value={values.password}
                      onChange={handleChange}
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
                    />

                    <PasswordField
                      id="confirm_password"
                      label="Confirm Password"
                      name="confirm_password"
                      value={values.confirm_password}
                      onChange={handleChange}
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
                      onFocus={() => setActiveField("dob")}
                      touched={touched.dob}
                      error={errors.dob}
                      required
                      activeField={activeField}
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

                    <SelectField
                      id="resident_country"
                      label="Country of Residence"
                      options={countryOptions}
                      onChange={(option) =>
                        setFieldValue("resident_country", option?.value)
                      }
                      value={countryOptions.find(
                        (opt) => opt.value === values.resident_country
                      )}
                      touched={touched.resident_country}
                      error={errors.resident_country}
                      required
                    />

                    {values.resident_country === "United States" &&
                      ssnRequired && (
                        <div className="md:col-span-2">
                          <div className="flex items-center">
                            <FormField
                              id="ssn"
                              label="SSN (Social Security Number)"
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
                              onFocus={() => setActiveField("ssn")}
                              touched={touched.ssn}
                              error={errors.ssn}
                              required={
                                values.resident_country === "United States" &&
                                ssnRequired
                              }
                              placeholder="XXX-XX-XXXX"
                              activeField={activeField}
                            />
                            <SSNInfoPopup />
                          </div>
                        </div>
                      )}
                  </div>

                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-3">
                      Address Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        id="street_address_1"
                        label="Street Address"
                        name="street_address_1"
                        value={values.street_address_1}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={() => setActiveField("street_address_1")}
                        touched={touched.street_address_1}
                        error={errors.street_address_1}
                        required
                        activeField={activeField}
                      />

                      <FormField
                        id="street_address_2"
                        label="Street Address 2 (Optional)"
                        name="street_address_2"
                        value={values.street_address_2}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={() => setActiveField("street_address_2")}
                        touched={touched.street_address_2}
                        error={errors.street_address_2}
                        activeField={activeField}
                      />

                      <FormField
                        id="city"
                        label="City"
                        name="city"
                        value={values.city}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={() => setActiveField("city")}
                        touched={touched.city}
                        error={errors.city}
                        required
                        activeField={activeField}
                      />

                      <FormField
                        id="state"
                        label="State/Province"
                        name="state"
                        value={values.state}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={() => setActiveField("state")}
                        touched={touched.state}
                        error={errors.state}
                        required
                        activeField={activeField}
                      />

                      <FormField
                        id="zip_code"
                        label="ZIP/Postal Code"
                        name="zip_code"
                        value={values.zip_code}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={() => setActiveField("zip_code")}
                        touched={touched.zip_code}
                        error={errors.zip_code}
                        required
                        activeField={activeField}
                      />

                      <SelectField
                        id="country"
                        label="Country"
                        options={countryOptions}
                        onChange={(option) =>
                          setFieldValue("country", option?.value)
                        }
                        value={countryOptions.find(
                          (opt) => opt.value === values.country
                        )}
                        touched={touched.country}
                        error={errors.country}
                        required
                      />
                    </div>
                  </div>

                  {/* Controller Section */}
                  <ControllerSection
                    values={values}
                    setFieldValue={setFieldValue}
                    handleBlur={handleBlur}
                    touched={touched}
                    errors={errors}
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
                  <h2 className="text-xl font-semibold mb-4">
                    Owner Information
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Add all owners with 25% or more ownership in the business.
                    Total ownership must equal 100%.
                  </p>

                  {/* Ownership Validation Display */}
                  <div
                    className={`p-3 rounded-lg mb-4 ${
                      ownershipValidation.isValid
                        ? "bg-green-50 border border-green-200"
                        : "bg-yellow-50 border border-yellow-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">
                          Total Ownership:{" "}
                          <span
                            className={
                              ownershipValidation.totalPercentage === 100
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {ownershipValidation.totalPercentage}%
                          </span>
                        </p>
                        <p className="text-xs text-gray-600">
                          {ownershipValidation.meetsMinimum
                            ? "✓ At least one owner has 25% or more ownership"
                            : "✗ Need at least one owner with 25% or more ownership"}
                        </p>
                      </div>
                      {ownershipValidation.isValid && (
                        <span className="text-green-600">✓ Valid</span>
                      )}
                    </div>
                  </div>

                  <FieldArray name="owner_details">
                    {({ push, remove }) => (
                      <div className="space-y-6">
                        {values.owner_details.map((owner, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-lg font-medium">
                                Owner {index + 1}
                              </h3>
                              {values.owner_details.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    remove(index);
                                    dispatch(removeOwner(index));
                                  }}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove Owner
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
                                onFocus={() =>
                                  setActiveField(
                                    `owner_details[${index}].owner_first_name`
                                  )
                                }
                                touched={
                                  touched.owner_details?.[index]
                                    ?.owner_first_name
                                }
                                error={
                                  errors.owner_details?.[index]
                                    ?.owner_first_name
                                }
                                required
                                activeField={activeField}
                              />

                              <FormField
                                id={`owner_details[${index}].owner_last_name`}
                                label="Last Name"
                                name={`owner_details[${index}].owner_last_name`}
                                value={owner.owner_last_name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onFocus={() =>
                                  setActiveField(
                                    `owner_details[${index}].owner_last_name`
                                  )
                                }
                                touched={
                                  touched.owner_details?.[index]
                                    ?.owner_last_name
                                }
                                error={
                                  errors.owner_details?.[index]?.owner_last_name
                                }
                                required
                                activeField={activeField}
                              />

                              <FormField
                                id={`owner_details[${index}].owner_email`}
                                label="Email Address"
                                name={`owner_details[${index}].owner_email`}
                                type="email"
                                value={owner.owner_email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onFocus={() =>
                                  setActiveField(
                                    `owner_details[${index}].owner_email`
                                  )
                                }
                                touched={
                                  touched.owner_details?.[index]?.owner_email
                                }
                                error={
                                  errors.owner_details?.[index]?.owner_email
                                }
                                required
                                activeField={activeField}
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

                              <SelectField
                                id={`owner_details[${index}].owner_country_id`}
                                label="Country"
                                options={countryOptions}
                                onChange={(option) =>
                                  setFieldValue(
                                    `owner_details[${index}].owner_country_id`,
                                    option?.value
                                  )
                                }
                                value={countryOptions.find(
                                  (opt) => opt.value === owner.owner_country_id
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
                              />

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
                                  (opt) => opt.value === owner.owner_role_id
                                )}
                                touched={
                                  touched.owner_details?.[index]?.owner_role_id
                                }
                                error={
                                  errors.owner_details?.[index]?.owner_role_id
                                }
                                required
                              />

                              <FormField
                                id={`owner_details[${index}].ownership_percentage`}
                                label="Ownership Percentage"
                                name={`owner_details[${index}].ownership_percentage`}
                                type="number"
                                value={owner.ownership_percentage}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onFocus={() =>
                                  setActiveField(
                                    `owner_details[${index}].ownership_percentage`
                                  )
                                }
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
                                activeField={activeField}
                              />

                              <FormField
                                id={`owner_details[${index}].owner_dob`}
                                label="Date of Birth"
                                name={`owner_details[${index}].owner_dob`}
                                type="date"
                                value={owner.owner_dob}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onFocus={() =>
                                  setActiveField(
                                    `owner_details[${index}].owner_dob`
                                  )
                                }
                                touched={
                                  touched.owner_details?.[index]?.owner_dob
                                }
                                error={errors.owner_details?.[index]?.owner_dob}
                                required
                                activeField={activeField}
                              />

                              {owner.owner_country_id === "United States" &&
                                ssnRequired && (
                                  <div className="md:col-span-2">
                                    <div className="flex items-center">
                                      <FormField
                                        id={`owner_details[${index}].ssn`}
                                        label="SSN (Social Security Number)"
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
                                        onFocus={() =>
                                          setActiveField(
                                            `owner_details[${index}].ssn`
                                          )
                                        }
                                        touched={
                                          touched.owner_details?.[index]?.ssn
                                        }
                                        error={
                                          errors.owner_details?.[index]?.ssn
                                        }
                                        required={
                                          owner.owner_country_id ===
                                            "United States" && ssnRequired
                                        }
                                        placeholder="XXX-XX-XXXX"
                                        activeField={activeField}
                                      />
                                      <SSNInfoPopup />
                                    </div>
                                  </div>
                                )}

                              {/* Enhanced Document Section */}
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
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            push({
                              owner_type: "individual",
                              owner_first_name: "",
                              owner_last_name: "",
                              owner_email: "",
                              owner_phone_number: "",
                              owner_country_id: "",
                              owner_role_id: "",
                              ownership_percentage: 0,
                              owner_dob: "",
                              ssn: "",
                              doc_type: "",
                              doc_id: "",
                              doc_country: "",
                              doc_state: "",
                              id_issued_date: "",
                              doc_file: null,
                            });
                            dispatch(addOwner());
                          }}
                          className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition duration-200"
                        >
                          + Add Another Owner
                        </button>
                      </div>
                    )}
                  </FieldArray>
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
                    Documents & Verification
                  </h2>

                  <div className="space-y-6">
                    {/* Document Upload Section */}
                    {documentUpload && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">
                          Business Documents
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Please upload required business documents for
                          verification.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {documentTypeOptions.map((docType) => (
                            <div
                              key={docType.value}
                              className="border rounded-lg p-4"
                            >
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {docType.label}
                              </label>
                              <input
                                type="file"
                                onChange={(e) =>
                                  handleFileChange(e, docType.value)
                                }
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                accept=".jpg,.jpeg,.png,.pdf"
                              />
                              {values.user_image[docType.value] && (
                                <p className="text-sm text-green-600 mt-1">
                                  File selected:{" "}
                                  {values.user_image[docType.value].name}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Enhanced Terms and Conditions Section */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">
                        Terms and Conditions
                      </h3>

                      {termsConditions && termsConditions.length > 0 ? (
                        <div className="space-y-4">
                          {termsConditions.map((term, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 p-4 rounded-lg"
                            >
                              <div className="flex items-start">
                                <Field
                                  type="checkbox"
                                  name={`terms_agreed_${index}`}
                                  className="mt-1 mr-3"
                                  required
                                />
                                <div>
                                  <h4 className="font-medium">{term.title}</h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {term.content}
                                  </p>
                                  {term.link && (
                                    <a
                                      href={term.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 text-sm hover:underline"
                                    >
                                      View full terms
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-start">
                            <Field
                              id="terms-agreement"
                              name="terms_agreement"
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                              required
                            />
                            <label
                              htmlFor="terms-agreement"
                              className="ml-3 text-sm text-gray-700"
                            >
                              I agree to the{" "}
                              <a
                                href="/terms"
                                target="_blank"
                                className="text-blue-600 hover:text-blue-500"
                              >
                                Terms and Conditions
                              </a>{" "}
                              and{" "}
                              <a
                                href="/privacy"
                                target="_blank"
                                className="text-blue-600 hover:text-blue-500"
                              >
                                Privacy Policy
                              </a>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Agreement Metadata */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">
                          <strong>Note:</strong> By agreeing, you acknowledge
                          that we will capture your IP address, device
                          information, and location for security and compliance
                          purposes. This information is stored securely and used
                          only for verification and regulatory requirements.
                        </p>
                      </div>

                      {/* Referral Code Display */}
                      {(referralCode || agentCode) && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-700">
                            <strong>Referral Information:</strong>
                            {referralCode && ` Code: ${referralCode}`}
                            {agentCode && ` Agent: ${agentCode}`}
                          </p>
                        </div>
                      )}
                    </div>
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
                  disabled={loading || !ownershipValidation.isValid}
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
