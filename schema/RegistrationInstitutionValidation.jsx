import * as Yup from "yup";

const institutionSchema = Yup.object().shape({
  // Institution fields
  // institution_name: Yup.string().required("Institution name is required"),
  // registration_number: Yup.string().required("Registration number is required"),
  // registered_address_street_1: Yup.string().required(
  //   "Registered address street 1 is required"
  // ),
  // registered_address_street_city: Yup.string().required(
  //   "Registered address city is required"
  // ),
  // registered_address_street_state: Yup.string().required(
  //   "Registered address state is required"
  // ),
  // registered_address_street_zip: Yup.string().required(
  //   "Registered address zip is required"
  // ),
  // registered_address_street_country: Yup.number()
  //   .required("Registered address country is required")
  //   .test("exists", "Country does not exist", (value) => !!value), // Simulating exists check
  // date_incorporation: Yup.string()
  //   .required("Date of incorporation is required")
  //   .max(15, "Date of incorporation must not exceed 15 characters"),
  // industry_type: Yup.number()
  //   .required("Industry type is required")
  //   .test("exists", "Industry type does not exist", (value) => !!value), // Simulating exists check

  // Personal information fields
  // first_name: Yup.string()
  //   .required("First name is required")
  //   .max(255, "First name must not exceed 255 characters"),
  // last_name: Yup.string()
  //   .required("Last name is required")
  //   .max(255, "Last name must not exceed 255 characters"),
  // gender: Yup.number()
  //   .required("Gender is required")
  //   .test("exists", "Gender does not exist", (value) => !!value), // Simulating exists check
  // dob: Yup.string()
  //   .required("Date of birth is required")
  //   .max(15, "Date of birth must not exceed 15 characters"),
  // email: Yup.string()
  //   .email("Invalid email")
  //   .required("Email is required")
  //   .max(255, "Email must not exceed 255 characters"),
  // password: Yup.string()
  //   .required("Password is required")
  //   .min(12, "Password must be at least 12 characters")
  //   .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
  //   .matches(
  //     /[!@#$%^&*(),.?":{}|<>]/,
  //     "Password must contain at least one special character"
  //   )
  //   .max(255, "Password must not exceed 255 characters"),
  // confirm_password: Yup.string()
  //   .required("Confirm password is required")
  //   .min(12, "Confirm password must be at least 12 characters")
  //   .matches(
  //     /[A-Z]/,
  //     "Confirm password must contain at least one uppercase letter"
  //   )
  //   .matches(
  //     /[!@#$%^&*(),.?":{}|<>]/,
  //     "Confirm password must contain at least one special character"
  //   )
  //   .max(255, "Confirm password must not exceed 255 characters")
  //   .oneOf([Yup.ref("password"), null], "Passwords must match"),
  // resident_country: Yup.number()
  //   .required("Resident country is required")
  //   .test("exists", "Country does not exist", (value) => !!value), // Simulating exists check
  // mobilenumber_countrycode: Yup.string()
  //   .required("Mobile country code is required")
  //   .test("exists", "Country code does not exist", (value) => !!value), // Simulating exists check for phone_code
  // mobile_number: Yup.string()
  //   .required("Mobile number is required")
  //   .max(255, "Mobile number must not exceed 255 characters"),
  // nationality: Yup.number()
  //   .required("Nationality is required")
  //   .test("exists", "Nationality does not exist", (value) => !!value), // Simulating exists check
  // street_address_1: Yup.string()
  //   .required("Street address is required")
  //   .max(255, "Street address must not exceed 255 characters"),
  // city: Yup.string()
  //   .required("City is required")
  //   .max(255, "City must not exceed 255 characters"),
  // state: Yup.string()
  //   .required("State is required")
  //   .max(255, "State must not exceed 255 characters"),
  // zip_code: Yup.string()
  //   .required("Zip code is required")
  //   .max(20, "Zip code must not exceed 20 characters"),
  // country: Yup.number()
  //   .required("Country is required")
  //   .test("exists", "Country does not exist", (value) => !!value), // Simulating exists check
  // terms: Yup.boolean()
  //   .required("You must accept the terms and conditions")
  //   .oneOf([true], "You must accept the terms and conditions"),
});

export default institutionSchema;