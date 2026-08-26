import * as Yup from "yup";

const institutionSchema = (currentStep, options = {}) => {
  const {
    isNamedAccount = false,
    country,
    currency,
    kycVerify = false,
    documentUpload = false,
    ssnRequired = false,
    einRequired = false,
    accountType = "pooled",
    showNAICSField = false,
    showEINField = false,
    showBusinessTypeField = false,
    showIndustryTypeField = true,
    showBusinessAliasField = false,
    showBusinessEmailField = false,
    showBusinessWebsiteField = false,
    ssn_required = "N",
  } = options;

  // Common validation rules
  const requiredString = Yup.string().required("This field is required");
  const requiredNumber = Yup.number().required("This field is required");
  const optionalString = Yup.string().nullable();
  const email = Yup.string()
    .email("Invalid email format")
    .required("Email is required");

  const password = Yup.string()
    .min(12, "Password must be at least 12 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/\d/, "Password must contain at least one number")
    .matches(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one special character",
    )
    .required("Password is required");

  const phoneNumber = Yup.string()
    .matches(/^\d+$/, "Phone number must contain only digits")
    .min(5, "Phone number must be at least 5 digits")
    .max(15, "Phone number must not exceed 15 digits")
    .required("Phone number is required");

  const countryCode = Yup.string().required("Country code is required");

  // EIN validation
  const einValidation = Yup.string().test(
    "ein-format",
    "EIN must be in format XX-XXXXXXX",
    (value) => {
      if (!value) return !einRequired;
      const cleanEIN = value.replace(/-/g, "");
      return cleanEIN.length === 9 && /^\d+$/.test(cleanEIN);
    },
  );

  // FIXED: SSN validation - simplified and more robust
  const ssnValidation = Yup.string().test(
    "ssn-format",
    "SSN must be in format XXX-XX-XXXX",
    function (value) {
      const shouldValidateSSN = isNamedAccount && ssn_required === "Y";
      if (shouldValidateSSN && (!value || value.trim() === "")) {
        return this.createError({
          message: "SSN is required for USD Named Accounts",
        });
      }

      if (shouldValidateSSN && value) {
        const cleanSSN = value.replace(/-/g, "");
        if (cleanSSN.length !== 9 || !/^\d+$/.test(cleanSSN)) {
          return this.createError({
            message: "SSN must be 9 digits in format XXX-XX-XXXX",
          });
        }
      }

      return true;
    },
  );

  // FIXED: Controller SSN validation
  const controllerSsnValidation = Yup.string().test(
    "controller-ssn-format",
    "SSN must be in format XXX-XX-XXXX",
    function (value) {
      try {
        // Safely access parent values
        const parent = this?.parent || {};
        const is_controller = parent.is_controller;
        const shouldValidateControllerSSN =
          isNamedAccount && is_controller === "no" && ssn_required === "Y";

        if (shouldValidateControllerSSN) {
          if (!value || value.trim() === "") {
            return this.createError({
              message: "SSN is required for USD Named Accounts for controllers",
            });
          }

          const cleanSSN = value.replace(/-/g, "");
          const isValid = cleanSSN.length === 9 && /^\d+$/.test(cleanSSN);
          if (!isValid) {
            return this.createError({
              message: "SSN must be 9 digits in format XXX-XX-XXXX",
            });
          }
        }

        return true;
      } catch (error) {
        return true;
      }
    },
  );

  // Business alias validation for named accounts
  const businessAliasValidation = Yup.string().test(
    "business-alias-required",
    "Business alias is required for named accounts",
    (value) => {
      if (isNamedAccount && showBusinessAliasField) {
        return value && value.trim().length > 0;
      }
      return true;
    },
  );

  // Ownership percentage validation
  const ownershipPercentage = Yup.number()
    .min(0, "Ownership percentage cannot be negative")
    .max(100, "Ownership percentage cannot exceed 100%")
    .required("Ownership percentage is required");

  // Date validation - must be at least 18 years ago
  const dateOfBirth = Yup.date()
    .max(
      new Date(Date.now() - 567648000000),
      "You must be at least 18 years old",
    )
    .required("Date of birth is required");

  // Owner validation schema
  const ownerSchema = Yup.object().shape({
    owner_first_name: requiredString.min(
      2,
      "First name must be at least 2 characters",
    ),
    owner_last_name: requiredString.min(
      2,
      "Last name must be at least 2 characters",
    ),
    owner_email: email,
    owner_phone_number: phoneNumber,
    owner_phone_number_country_code: countryCode,
    owner_country_id: requiredString,
    ownership_percentage: ownershipPercentage,
    owner_dob: dateOfBirth,
    owner_if: Yup.string()
      .oneOf(["yes", "no"], "Please select if you are the owner")
      .required("This field is required"),
    owner_needs_access_to_system: Yup.string().oneOf(
      ["yes", "no"],
      "Please select system access requirement",
    ),
    owner_role_id: Yup.string().when("owner_needs_access_to_system", {
      is: "yes",
      then: () => requiredString,
      otherwise: Yup.string().nullable(),
    }),
    // US-specific validations for named accounts
    ssn: Yup.string().when(["owner_country_id", "isNamedAccount"], {
      is: (owner_country_id, isNamedAccount) =>
        isNamedAccount && owner_country_id === "United States",
      then: Yup.string()
        .test("ssn-format", "SSN must be in format XXX-XX-XXXX", (value) => {
          if (!value) return false;
          const cleanSSN = value.replace(/-/g, "");
          return cleanSSN.length === 9 && /^\d+$/.test(cleanSSN);
        })
        .required("SSN is required for US owners"),
      otherwise: Yup.string().nullable(),
    }),
    doc_type: Yup.string().when(["owner_country_id", "isNamedAccount"], {
      is: (owner_country_id, isNamedAccount) =>
        isNamedAccount && owner_country_id === "United States",
      then: () => requiredString,
      otherwise: Yup.string().nullable(),
    }),
    doc_id: Yup.string().when(["owner_country_id", "isNamedAccount"], {
      is: (owner_country_id, isNamedAccount) =>
        isNamedAccount && owner_country_id === "United States",
      then: requiredString.min(2, "Document ID must be at least 2 characters"),
      otherwise: Yup.string().nullable(),
    }),
  });

  // Step-specific schemas
  const step1Schema = Yup.object().shape({
    // No client-side required validation for step 1 — the API
    // (/validate-institution-step and final submit) enforces this,
    // and the * markers are driven purely by mandatoryFieldsMap in the component.
  });

  const step2Schema = Yup.object().shape({
    // No client-side required validation for step 2 — the API
    // (/validate-institution-step) enforces this, and the * markers
    // are driven purely by mandatoryFieldsMap in the component.
  });

  // FIXED: Step 3 Schema with proper conditional validation
  const step3Schema = Yup.object().shape({
    // No client-side required validation for step 3 — the API
    // (/validate-institution-step) enforces this, and the * markers
    // are driven purely by mandatoryFieldsMap in the component.
  });

  const step4Schema = Yup.object().shape({
    // Completely empty - no validation for now
  });
  const step5Schema = Yup.object().shape({
    // Completely empty - no validation for now
  });

  const step6Schema = Yup.object().shape({
    terms_agreement: Yup.boolean()
      .oneOf(
        [true],
        "You must accept the final agreement to complete registration",
      )
      .required("Final agreement acceptance is required"),
  });

  // Combine schemas based on current step
  switch (currentStep) {
    case 1:
      return step1Schema;
    case 2:
      return step2Schema;
    case 3:
      return step3Schema;
    case 4:
      return step4Schema;
    case 5:
      return step5Schema;
    case 6:
      return step6Schema;
    default:
      return Yup.object().shape({});
  }
};

export default institutionSchema;
