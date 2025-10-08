import * as Yup from 'yup';

export const OwnerSchema = Yup.object().shape({
  // first_name: Yup.string().required("First Name is required"),
  // middleName: Yup.string().notRequired(),
  //last_name: Yup.string().required("Last Name is required"),
  //password: Yup.string().min(8, "Password must be at least 8 characters long").required("Password is required"),
  //confirmPassword: Yup.string().oneOf([Yup.ref('password'), null], "Passwords must match").required("Confirm Password is required"),
  //state: Yup.string().required("State/Province is required"),
  //city: Yup.string().required("City is required"),
  //country: Yup.string().required("Country is required"),
  //street_address_1: Yup.string().required("Street Address 1 is required"),
  //street_address_2: Yup.string().notRequired(),
  //gender: Yup.number()
        //.typeError('Must be a number') // Custom error message if the value is not a number
       // .integer('Must be an integer') // Custom error message if the number is not an integer
        //.required('Gender is required'),
 // dob: Yup.date().max(new Date(), "Date of Birth cannot be in the future").required("Date of Birth is required"),
});