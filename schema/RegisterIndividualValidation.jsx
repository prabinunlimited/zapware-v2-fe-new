import * as Yup from "yup";

export const clientSchema = Yup.object().shape({
  customer_type: Yup.string()
    .oneOf(["individual", "institution"], "Invalid customer type")
    .required("Customer type is required"),

  first_name: Yup.string().required("First Name is required"),

  middle_name: Yup.string().notRequired(),

  last_name: Yup.string().required("Last Name is required"),

  email: Yup.string()
    .matches(
      /^[a-zA-Z0-9][a-zA-Z0-9._%+]*[a-zA-Z0-9]@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Invalid email format"
    )
    .required("Email is required"),

  // password: Yup.string()
  //   .min(8, "Password must be at least 8 characters long")
  //   .matches(
  //     /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{12,}$/,
  //     'Password must contain at least one uppercase character, one special character (e.g., !@#$%^&*(),.?":{}|<>), and be at least 12 characters long. (requirements do not meet)'
  //   )
  //   .required("Password is required"),

  password: Yup.string()
    .min(8, "Password must be at least 8 characters long")
    .matches(
      /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{12,}$/,
      "Requirements do not meet"
    )
    .required("Password is required"),

  confirmPassword: Yup.string()
  .oneOf([Yup.ref("password"), null], "Passwords must match")
  .required("Confirm Password is required"),

  // mobile_number: Yup.string()
  //   .matches(/^\d{20}$/, "Mobile number length exceeded!")
  //   .required("Mobile number is required"),

  // dob: Yup.date()
  //   .max(new Date(), "Date of Birth cannot be in the future")
  //   .required("Date of Birth is required"),

  // nationality: Yup.string().required("Nationality is required"),

  // street_address_1: Yup.string().required("Street Address 1 is required"),

  // city: Yup.string().required("City is required"),

  // state: Yup.string().required("State/Province is required"),

  // zip_code: Yup.string().required("Zip Code is required"),

  // country: Yup.string().required("Country is required"),
});