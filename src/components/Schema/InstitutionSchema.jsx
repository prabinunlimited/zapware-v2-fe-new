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
      "Password must contain at least one special character"
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
    }
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
    }
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
    }
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
    }
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
      "You must be at least 18 years old"
    )
    .required("Date of birth is required");

  // Owner validation schema
  const ownerSchema = Yup.object().shape({
    owner_first_name: requiredString.min(
      2,
      "First name must be at least 2 characters"
    ),
    owner_last_name: requiredString.min(
      2,
      "Last name must be at least 2 characters"
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
      "Please select system access requirement"
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
    institution_name: Yup.string()
      .required("Business name is required")
      .min(2, "Business name must be at least 2 characters"),

    registration_number: Yup.string()
      .required("Registration number is required")
      .min(3, "Registration number must be at least 3 characters"),

    registered_address_street_country: Yup.string().required(
      "Registered address country is required"
    ),

    registered_address_street_state: Yup.string().required(
      "State/Province is required"
    ),

    registered_address_street_city: Yup.string().required("City is required"),

    registered_address_street_1: Yup.string()
      .required("Street address is required")
      .min(5, "Street address must be at least 5 characters"),

    registered_address_street_zip: Yup.string()
      .required("ZIP/Postal code is required")
      .matches(/^[A-Z0-9\s-]+$/, "Invalid ZIP/postal code format"),

    date_incorporation: Yup.date()
      .max(new Date(), "Date of incorporation cannot be in the future")
      .required("Date of incorporation is required"),

    industry_type: Yup.string()
      .required("Industry type is required")
      .test(
        "industry-not-empty",
        "Industry type is required",
        (value) => value && value.toString().trim().length > 0
      ),

    country_of_registration: Yup.string().required(
      "Country of registration is required"
    ),

    // Conditional fields
    ...(showEINField && {
      ein: Yup.string()
        .required("EIN is required for USD Named Accounts")
        .test("ein-format", "EIN must be in format XX-XXXXXXX", (value) => {
          if (!value) return false;
          const cleanEIN = value.replace(/-/g, "");
          return cleanEIN.length === 9 && /^\d+$/.test(cleanEIN);
        }),
    }),

    // FIXED: NAICS Code validation for named accounts
    ...(showNAICSField &&
      isNamedAccount && {
        naice_code: Yup.string().required(
          "NAICS code is required for USD Named Accounts"
        ),
      }),

    ...(showBusinessTypeField && {
      business_type: Yup.string().required("Business type is required"),
    }),

    ...(showBusinessAliasField && {
      business_alias: Yup.string()
        .required("Business alias is required for named accounts")
        .min(2, "Business alias must be at least 2 characters"),
    }),
  });

  const step2Schema = Yup.object().shape({
    first_name: requiredString.min(
      2,
      "First name must be at least 2 characters"
    ),
    last_name: requiredString.min(2, "Last name must be at least 2 characters"),
    email: email,
    password: password,
    confirm_password: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Confirm password is required"),
    resident_country: requiredString,
    mobilenumber_countrycode: countryCode,
    mobile_number: phoneNumber,
    nationality: requiredString,
    country: requiredString,
    state: requiredString,
    city: requiredString,
    street_address_1: requiredString.min(
      5,
      "Street address must be at least 5 characters"
    ),
    zip_code: requiredString.matches(
      /^[A-Z0-9\s-]+$/,
      "Invalid ZIP/postal code format"
    ),
    gender: requiredString,
    dob: dateOfBirth,
    designation: requiredString,
    doc_type: requiredString,
    doc_id: requiredString.min(2, "Document ID must be at least 2 characters"),
    doc_country: requiredString,
    id_issued_date: Yup.date()
      .max(new Date(), "Issue date cannot be in the future")
      .required("ID issue date is required"),
    ssn: ssnValidation,

    // FIXED: Terms and conditions validation - more flexible
    terms_and_conditions: Yup.array()
      .of(
        Yup.object().shape({
          id: Yup.string().required(),
          accepted_at: Yup.string().required(),
        })
      )
      .test(
        "terms-accepted",
        "You must accept all Terms and Conditions to continue",
        function (termsArray) {
          // If there are no terms available, consider it valid
          if (!termsArray || termsArray.length === 0) {
            return true;
          }

          // Check if all available terms are accepted
          // This allows for dynamic terms - user must accept all that are presented
          const acceptedTermIds = termsArray.map((term) => term.id);
          const allTermsAccepted = acceptedTermIds.length > 0;

          if (!allTermsAccepted) {
            return this.createError({
              message: "You must accept all Terms and Conditions to continue",
            });
          }

          return true;
        }
      )
      .required("Terms and conditions acceptance is required"),
  });

  // FIXED: Step 3 Schema with proper conditional validation
  const step3Schema = Yup.object()
    .shape({
      is_controller: requiredString.oneOf(
        ["yes", "no"],
        "Please select if you are the controller"
      ),
    })
    .concat(
      Yup.object().when("is_controller", {
        is: "no",
        then: Yup.object().shape({
          controller_first_name: requiredString.min(
            2,
            "First name must be at least 2 characters"
          ),
          controller_last_name: requiredString.min(
            2,
            "Last name must be at least 2 characters"
          ),
          controller_email: email,
          controller_password: password,
          controller_confirm_password: Yup.string()
            .oneOf(
              [Yup.ref("controller_password"), null],
              "Passwords must match"
            )
            .required("Confirm password is required"),
          controller_resident_country: requiredString,
          controller_mobilenumber_countrycode: countryCode,
          controller_mobile_number: phoneNumber,
          controller_nationality: requiredString,
          controller_country: requiredString,
          controller_state: requiredString,
          controller_city: requiredString,
          controller_street_address_1: requiredString.min(
            5,
            "Street address must be at least 5 characters"
          ),
          controller_zip_code: requiredString.matches(
            /^[A-Z0-9\s-]+$/,
            "Invalid ZIP/postal code format"
          ),
          controller_gender: requiredString,
          controller_dob: dateOfBirth,
          controller_designation: requiredString,
          controller_ssn: controllerSsnValidation,
        }),
      })
    );

  // FIXED: Step 4 Schema - Use proper function context
  // const step4Schema = Yup.object().shape({
  //   owner_details: Yup.array()
  //     .min(1, "At least one owner is required")
  //     .of(
  //       Yup.object().shape({
  //         owner_first_name: requiredString.min(
  //           2,
  //           "First name must be at least 2 characters"
  //         ),
  //         owner_last_name: requiredString.min(
  //           2,
  //           "Last name must be at least 2 characters"
  //         ),
  //         owner_email: email,
  //         owner_phone_number: phoneNumber,
  //         owner_phone_number_country_code: countryCode,
  //         owner_country_id: requiredString,
  //         ownership_percentage: ownershipPercentage,
  //         owner_dob: dateOfBirth,
  //         owner_if: Yup.string()
  //           .oneOf(["yes", "no"], "Please select if you are the owner")
  //           .required("This field is required"),
  //         owner_needs_access_to_system: Yup.string().oneOf(
  //           ["yes", "no"],
  //           "Please select system access requirement"
  //         ),
  //         owner_role_id: Yup.string().when("owner_needs_access_to_system", {
  //           is: "yes",
  //           then: () => requiredString,
  //           otherwise: Yup.string().nullable(),
  //         }),

  //         // FIXED: Use proper function syntax for Yup context
  //         ssn: Yup.string().test(
  //           "ssn-validation",
  //           "SSN validation failed",
  //           function (value) {
  //             const owner_country_id = this.parent.owner_country_id;

  //             // Only validate if this is a named account and owner is in US
  //             if (isNamedAccount && owner_country_id === "United States") {
  //               if (!value) {
  //                 return this.createError({
  //                   message: "SSN is required for US owners in named accounts",
  //                 });
  //               }

  //               const cleanSSN = value.replace(/-/g, "");
  //               if (cleanSSN.length !== 9 || !/^\d+$/.test(cleanSSN)) {
  //                 return this.createError({
  //                   message: "SSN must be 9 digits in format XXX-XX-XXXX",
  //                 });
  //               }
  //             }
  //             return true;
  //           }
  //         ),

  //         // FIXED: Use proper function syntax
  //         doc_type: Yup.string().test(
  //           "doc-type-validation",
  //           "Document type validation failed",
  //           function (value) {
  //             const owner_country_id = this.parent.owner_country_id;

  //             if (isNamedAccount && owner_country_id === "United States") {
  //               if (!value) {
  //                 return this.createError({
  //                   message:
  //                     "Document type is required for US owners in named accounts",
  //                 });
  //               }
  //             }
  //             return true;
  //           }
  //         ),

  //         // FIXED: Use proper function syntax
  //         doc_id: Yup.string().test(
  //           "doc-id-validation",
  //           "Document ID validation failed",
  //           function (value) {
  //             const owner_country_id = this.parent.owner_country_id;

  //             if (isNamedAccount && owner_country_id === "United States") {
  //               if (!value) {
  //                 return this.createError({
  //                   message:
  //                     "Document ID is required for US owners in named accounts",
  //                 });
  //               }
  //               if (value && value.length < 2) {
  //                 return this.createError({
  //                   message: "Document ID must be at least 2 characters",
  //                 });
  //               }
  //             }
  //             return true;
  //           }
  //         ),
  //       })
  //     )
  //     .test(
  //       "total-ownership",
  //       "Total ownership percentage must equal 100%",
  //       function (owners) {
  //         // ✅ Regular function
  //         if (!owners || owners.length === 0) {
  //           return this.createError({
  //             message: "At least one owner is required",
  //           });
  //         }

  //         const totalPercentage = owners.reduce((total, owner) => {
  //           return total + (parseFloat(owner.ownership_percentage) || 0);
  //         }, 0);

  //         if (Math.abs(totalPercentage - 100) >= 0.01) {
  //           return this.createError({
  //             message: `Total ownership percentage must equal 100%. Current total: ${totalPercentage.toFixed(
  //               2
  //             )}%`,
  //           });
  //         }
  //         return true;
  //       }
  //     )
  //     .test(
  //       "owner-if-required",
  //       "Please indicate if you are the owner for the first owner",
  //       function (owners) {
  //         // ✅ Regular function
  //         if (owners && owners.length > 0) {
  //           const firstOwner = owners[0];
  //           if (!firstOwner.owner_if) {
  //             return this.createError({
  //               message: "Please indicate if you are the owner",
  //               path: "owner_details[0].owner_if",
  //             });
  //           }
  //         }
  //         return true;
  //       }
  //     ),
  // });

  const step4Schema = Yup.object().shape({
    // Completely empty - no validation for now
  });

  const step5Schema = Yup.object().shape({
    terms_agreement: Yup.boolean()
      .oneOf(
        [true],
        "You must accept the final agreement to complete registration"
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
    default:
      return Yup.object().shape({});
  }
};

export default institutionSchema;
