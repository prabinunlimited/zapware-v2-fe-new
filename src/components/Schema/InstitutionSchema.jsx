// src/components/Schema/InstitutionSchema.js
import * as Yup from "yup";

const institutionSchema = (currentStep, options = {}) => {
  const {
    isNamedAccount = false,
    country = "",
    currency = "",
    kycVerify = true,
    documentUpload = true,
    ssnRequired = false,
    einRequired = false,
    accountType = "pooled",
    showNAICSField = false,
    showEINField = false,
    showBusinessTypeField = false,
    showIndustryTypeField = false,
    showBusinessAliasField = false,
    showBusinessEmailField = false,
    showBusinessWebsiteField = false,
  } = options;

  // Common validation patterns
  const nameValidation = Yup.string()
    .min(2, "Must be at least 2 characters")
    .max(50, "Must be less than 50 characters")
    .matches(
      /^[a-zA-Z\s\-']+$/,
      "Only letters, spaces, hyphens, and apostrophes allowed"
    );

  const emailValidation = Yup.string()
    .email("Invalid email address")
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format");

  const phoneValidation = Yup.string().matches(
    /^\d{10,15}$/,
    "Phone number must be 10-15 digits"
  );

  const taxIdValidation = (type) =>
    Yup.string()
      .test("format", `Invalid ${type} format`, (value) => {
        if (!value) return true;
        const cleanValue = value.replace(/\D/g, "");
        return cleanValue.length === 9;
      })
      .test("valid-prefix", `Invalid ${type}`, (value) => {
        if (!value || type !== "ssn") return true;
        const cleanValue = value.replace(/\D/g, "");
        const areaNumber = parseInt(cleanValue.substring(0, 3));
        return areaNumber > 0 && areaNumber !== 666 && areaNumber < 900;
      });

  const baseSchemas = {
    1: Yup.object().shape({
      institution_name: Yup.string()
        .required("Business name is required")
        .min(2, "Business name must be at least 2 characters")
        .max(100, "Business name must be less than 100 characters"),

      registration_number: Yup.string()
        .required("Registration number is required")
        .min(3, "Registration number must be at least 3 characters"),

      business_alias: isNamedAccount
        ? Yup.string()
            .required("Business alias is required for named accounts")
            .min(3, "Business alias must be at least 3 characters")
            .max(30, "Business alias must be less than 30 characters")
            .matches(
              /^[a-zA-Z0-9_-]+$/,
              "Only letters, numbers, hyphens, and underscores allowed"
            )
        : Yup.string().nullable(),

      ein: showEINField
        ? taxIdValidation("ein").required("EIN is required")
        : Yup.string().nullable(),

      country_of_registration: Yup.string().required(
        "Country of registration is required"
      ),
      country_of_operation: Yup.string().required(
        "Primary country of operation is required"
      ),

      registered_address_street_1: Yup.string().required(
        "Street address is required"
      ),
      registered_address_street_city: Yup.string().required("City is required"),
      registered_address_street_state: Yup.string().required(
        "State/Province is required"
      ),
      registered_address_street_zip: Yup.string().required(
        "ZIP/Postal code is required"
      ),
      registered_address_street_country: Yup.string().required(
        "Country is required"
      ),

      date_incorporation: Yup.date()
        .required("Date of incorporation is required")
        .max(new Date(), "Date cannot be in the future"),

      naice_code: showNAICSField
        ? Yup.string().required("NAICS code is required")
        : Yup.string().nullable(),
      business_type: showBusinessTypeField
        ? Yup.string().required("Business type is required")
        : Yup.string().nullable(),
      industry_type: showIndustryTypeField
        ? Yup.string().required("Industry type is required")
        : Yup.string().nullable(),
    }),

    2: Yup.object().shape({
      mobilenumber_countrycode: Yup.string().required(
        "Country code is required"
      ),
      mobile_number: phoneValidation.required("Mobile number is required"),

      business_email: showBusinessEmailField
        ? emailValidation.required("Business email is required")
        : emailValidation.nullable(),

      business_website: showBusinessWebsiteField
        ? Yup.string().url("Invalid website URL")
        : Yup.string().nullable(),
    }),

    3: Yup.object().shape({
      first_name: nameValidation.required("First name is required"),
      last_name: nameValidation.required("Last name is required"),
      email: emailValidation.required("Email is required"),
      designation: Yup.string().required("Designation is required"),

      password: Yup.string()
        .required("Password is required")
        .min(12, "Password must be at least 12 characters")
        .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
        .matches(/[a-z]/, "Password must contain at least one lowercase letter")
        .matches(/\d/, "Password must contain at least one number")
        .matches(
          /[!@#$%^&*(),.?":{}|<>]/,
          "Password must contain at least one special character"
        ),

      confirm_password: Yup.string()
        .required("Confirm password is required")
        .oneOf([Yup.ref("password")], "Passwords must match"),

      gender: Yup.string().required("Gender is required"),
      dob: Yup.date()
        .required("Date of birth is required")
        .max(
          new Date(new Date().setFullYear(new Date().getFullYear() - 18)),
          "Must be at least 18 years old"
        ),

      nationality: Yup.string().required("Nationality is required"),
      resident_country: Yup.string().required(
        "Country of residence is required"
      ),

      ssn:
        country === "United States" && ssnRequired
          ? taxIdValidation("ssn").required("SSN is required for US residents")
          : Yup.string().nullable(),

      street_address_1: Yup.string().required("Street address is required"),
      city: Yup.string().required("City is required"),
      state: Yup.string().required("State/Province is required"),
      zip_code: Yup.string().required("ZIP/Postal code is required"),
      country: Yup.string().required("Country is required"),

      is_controller: Yup.string().required(
        "Please specify if you are the controller"
      ),

      controller_first_name: Yup.string().when("is_controller", {
        is: (val) => val === "no",
        then: nameValidation.required("Controller first name is required"),
        otherwise: Yup.string().nullable(),
      }),

      controller_last_name: Yup.string().when("is_controller", {
        is: (val) => val === "no",
        then: nameValidation.required("Controller last name is required"),
        otherwise: Yup.string().nullable(),
      }),

      controller_email: Yup.string().when("is_controller", {
        is: (val) => val === "no",
        then: emailValidation.required("Controller email is required"),
        otherwise: Yup.string().nullable(),
      }),

      controller_country: Yup.string().when("is_controller", {
        is: (val) => val === "no",
        then: Yup.string().required("Controller country is required"),
        otherwise: Yup.string().nullable(),
      }),

      controller_dob: Yup.string().when("is_controller", {
        is: (val) => val === "no",
        then: Yup.date()
          .required("Controller date of birth is required")
          .max(
            new Date(new Date().setFullYear(new Date().getFullYear() - 18)),
            "Controller must be at least 18 years old"
          ),
        otherwise: Yup.string().nullable(),
      }),

      // Fixed: Correct syntax for multiple dependencies
      controller_ssn: Yup.string().when(
        ["is_controller", "controller_country"],
        {
          is: (is_controller, controller_country) =>
            is_controller === "no" &&
            controller_country === "United States" &&
            ssnRequired,
          then: taxIdValidation("ssn").required("Controller SSN is required"),
          otherwise: Yup.string().nullable(),
        }
      ),
    }),

    4: Yup.object().shape({
      owner_details: Yup.array()
        .of(
          Yup.object().shape({
            owner_first_name: nameValidation.required(
              "Owner first name is required"
            ),
            owner_last_name: nameValidation.required(
              "Owner last name is required"
            ),
            owner_email: emailValidation.required("Owner email is required"),
            owner_phone_number: phoneValidation.required(
              "Phone number is required"
            ),
            owner_country_id: Yup.string().required("Country is required"),
            owner_role_id: Yup.string().required("Role is required"),

            ownership_percentage: Yup.number()
              .typeError("Ownership must be a number")
              .min(0.01, "Ownership must be greater than 0")
              .max(100, "Ownership cannot exceed 100%")
              .required("Ownership percentage is required"),

            owner_dob: Yup.date()
              .required("Date of birth is required")
              .max(
                new Date(new Date().setFullYear(new Date().getFullYear() - 18)),
                "Must be at least 18 years old"
              ),

            ssn: Yup.string().when("owner_country_id", {
              is: (val) => val === "United States",
              then: taxIdValidation("ssn").required(
                "SSN is required for US owners"
              ),
              otherwise: Yup.string().nullable(),
            }),

            doc_type: Yup.string().required("Document type is required"),
            doc_id: Yup.string().required("Document ID is required"),
            doc_country: Yup.string().required("Issuing country is required"),
            id_issued_date: Yup.date()
              .required("Issue date is required")
              .max(new Date(), "Issue date cannot be in the future"),
          })
        )
        .min(1, "At least one owner is required")
        .test(
          "ownership-total",
          "Total ownership must equal 100%",
          function (owners) {
            if (!owners || owners.length === 0) return false;
            const total = owners.reduce(
              (sum, owner) =>
                sum + (parseFloat(owner.ownership_percentage) || 0),
              0
            );
            return Math.abs(total - 100) < 0.01;
          }
        )
        .test(
          "minimum-ownership",
          "At least one owner must have 25% or more ownership",
          function (owners) {
            if (!owners || owners.length === 0) return false;
            return owners.some(
              (owner) => (parseFloat(owner.ownership_percentage) || 0) >= 25
            );
          }
        ),
    }),

    5: Yup.object().shape({
      terms_agreement: Yup.boolean()
        .oneOf([true], "You must agree to the terms and conditions")
        .required("Terms agreement is required"),

      user_image: documentUpload
        ? Yup.object().test(
            "has-required-documents",
            "Required documents must be uploaded",
            function (documents) {
              const requiredDocs = [
                "business_license",
                "tax_certificate",
                "ownership_proof",
              ];
              if (!documents) return false;
              return requiredDocs.every((doc) => documents[doc]);
            }
          )
        : Yup.object().nullable(),

      privacy_policy_agreement: Yup.boolean()
        .oneOf([true], "You must agree to the privacy policy")
        .required("Privacy policy agreement is required"),

      marketing_agreement: Yup.boolean(),
    }),
  };

  return baseSchemas[currentStep] || Yup.object().shape({});
};

export default institutionSchema;
