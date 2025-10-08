import * as Yup from "yup";

// Helper function for conditional validation
const whenCondition = (field, is, then, otherwise = Yup.mixed().optional()) => {
  return Yup.mixed().when(field, {
    is,
    then,
    otherwise,
  });
};

// Step 1 Validation Schema
const step1Validation = Yup.object().shape({
  institution_name: Yup.string().required("Institution Name is required"),
  registered_address_street_1: Yup.string().required(
    "Street Address 1 is required"
  ),
  registered_address_street_city: Yup.string().required("City is required"),
  registered_address_street_state: Yup.string().required("State is required"),
  registered_address_street_zip: Yup.string().required("Zip Code is required"),
  registered_address_street_country: Yup.number()
    .required("Country is required")
    .min(1, "Invalid country"),
  date_incorporation: Yup.string()
    .required("Date of Incorporation is required")
    .max(15, "Must be 15 characters or less"),
  industry_type: Yup.number()
    .required("Industry Type is required")
    .min(1, "Invalid industry type"),
  company_phone_countrycode: Yup.string()
    .required("Country code is required")
    .min(1, "Invalid country code"),
  company_phone_number: Yup.string().required("Phone number is required"),
});

// Step 2 Validation Schema
const step2Validation = Yup.object().shape({
  first_name: Yup.string()
    .required("First Name is required")
    .max(255, "Must be 255 characters or less"),
  last_name: Yup.string()
    .required("Last Name is required")
    .max(255, "Must be 255 characters or less"),
  gender: Yup.number().required("Gender is required").min(1, "Invalid gender"),
  dob: Yup.string()
    .required("Date of Birth is required")
    .max(15, "Must be 15 characters or less"),
  email: Yup.string()
    .required("Email is required")
    .email("Invalid email address")
    .max(255, "Must be 255 characters or less"),
  password: Yup.string()
    .required("Password is required")
    .min(12, "Password must be at least 12 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one special character"
    )
    .max(255, "Must be 255 characters or less"),
  confirm_password: Yup.string()
    .required("Confirm Password is required")
    .oneOf([Yup.ref("password"), null], "Passwords must match"),
  resident_country: Yup.number()
    .required("Resident Country is required")
    .min(1, "Invalid country"),
  mobilenumber_countrycode: Yup.string()
    .required("Country code is required")
    .min(1, "Invalid country code"),
  mobile_number: Yup.string()
    .required("Mobile Number is required")
    .max(255, "Must be 255 characters or less"),
  nationality: Yup.number()
    .required("Nationality is required")
    .min(1, "Invalid nationality"),
  street_address_1: Yup.string()
    .required("Street Address is required")
    .max(255, "Must be 255 characters or less"),
  city: Yup.string()
    .required("City is required")
    .max(255, "Must be 255 characters or less"),
  state: Yup.string()
    .required("State is required")
    .max(255, "Must be 255 characters or less"),
  zip_code: Yup.string()
    .required("Zip Code is required")
    .max(20, "Must be 20 characters or less"),
  country: Yup.number()
    .required("Country is required")
    .min(1, "Invalid country"),
  terms: Yup.array()
    .required("Terms acceptance is required")
    .min(1, "Please accept all terms and conditions"),
});

// Step 3 Validation Schema
const step3Validation = Yup.object().shape({
  owner_details: Yup.array()
    .required("At least one owner is required")
    .min(1, "At least one owner is required")
    .of(
      Yup.object().shape({
        owner_type: Yup.string()
          .required("Owner Type is required")
          .oneOf(["individual", "institution"], "Invalid owner type"),
        owner_name: whenCondition(
          "owner_type",
          (val) => val === "institution",
          Yup.string().required("Institution Name is required")
        ),
        owner_first_name: whenCondition(
          "owner_type",
          (val) => val === "individual",
          Yup.string().required("First Name is required")
        ),
        owner_last_name: whenCondition(
          "owner_type",
          (val) => val === "individual",
          Yup.string().required("Last Name is required")
        ),
        ownership_percentage: Yup.number()
          .required("Ownership Percentage is required")
          .min(0, "Minimum 0%")
          .max(100, "Maximum 100%"),
        owner_email: Yup.string()
          .required("Email is required")
          .email("Invalid email address"),
        owner_phone_number_country_code: Yup.string()
          .required("Country code is required")
          .min(1, "Invalid country code"),
        owner_phone_number: Yup.string().required("Phone Number is required"),
        owner_country_id: Yup.number()
          .required("Country is required")
          .min(1, "Invalid country"),
      })
    )
    .test(
      "total-percentage",
      "Total ownership must equal 100%",
      function (owners) {
        const total = owners?.reduce(
          (sum, owner) => sum + (owner.ownership_percentage || 0),
          0
        );
        return total === 100;
      }
    ),
});

// Complete Validation Schema
const completeValidation = Yup.object().shape({
  ...step1Validation.fields,
  ...step2Validation.fields,
  ...step3Validation.fields,
  user_image: Yup.mixed().required("User image is required"),
  logo: Yup.mixed().required("Company logo is required"),
});

// Validation function
const validateStep = async (step, values) => {
  try {
    let schema;
    switch (step) {
      case 1:
        schema = step1Validation;
        break;
      case 2:
        schema = step2Validation;
        break;
      case 3:
        schema = step3Validation;
        break;
      default:
        schema = completeValidation;
    }
    await schema.validate(values, { abortEarly: false });
    return null; // No errors
  } catch (err) {
    const errors = {};
    err.inner.forEach((error) => {
      errors[error.path] = error.message;
    });
    return errors;
  }
};

// Export all schemas and validation function
export {
  step1Validation,
  step2Validation,
  step3Validation,
  completeValidation,
  validateStep,
};

// Main export as a function that returns the appropriate schema
export const partnerValidationSchema = (step) => {
  switch (step) {
    case 1:
      return step1Validation;
    case 2:
      return step2Validation;
    case 3:
      return step3Validation;
    default:
      return completeValidation;
  }
};

// Default export
export default partnerValidationSchema;
