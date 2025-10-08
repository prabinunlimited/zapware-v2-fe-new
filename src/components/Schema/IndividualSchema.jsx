import * as Yup from 'yup';

const IndividualSchema = Yup.object().shape({
  // Name fields
  first_name: Yup.string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),

  middleName: Yup.string()
    .nullable()
    .max(50, 'Middle name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s'-]*$/, 'Middle name contains invalid characters'),

  last_name: Yup.string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),

  // Contact information
  email: Yup.string()
    .required('Email is required')
    .email('Email is invalid')
    .max(100, 'Email must not exceed 100 characters'),

  mobile_number: Yup.string()
    .required('Phone number is required')
    .matches(/^[0-9]+$/, 'Phone number must contain only digits')
    .min(6, 'Phone number must be at least 6 digits')
    .max(15, 'Phone number must not exceed 15 digits'),

  mobilenumber_countrycode: Yup.string()
    .required('Country code is required'),

  // Password validation
  password: Yup.string()
    .required('Password is required')
    .min(12, 'Password must be at least 12 characters')
    .matches(
      /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).+$/,
      'Password must contain at least one uppercase letter and one special character'
    ),

  confirmPassword: Yup.string()
    .required('Confirm Password is required')
    .oneOf([Yup.ref('password'), null], 'Passwords must match'),

  // Personal details
  dob: Yup.date()
    .required('Date of birth is required')
    .max(new Date(Date.now() - 567648000000), 'You must be at least 18 years old'), // 18 years in milliseconds

  gender: Yup.string()
    .required('Gender is required'),

  nationality: Yup.string()
    .required('Nationality is required'),

  // Address information
  street_address_1: Yup.string()
    .required('Street address is required')
    .max(100, 'Street address must not exceed 100 characters'),

  street_address_2: Yup.string()
    .nullable()
    .max(100, 'Street address must not exceed 100 characters'),

  city: Yup.string()
    .required('City is required')
    .max(50, 'City must not exceed 50 characters'),

  state: Yup.string()
    .required('State/Province is required')
    .max(50, 'State/Province must not exceed 50 characters'),

  country: Yup.string()
    .required('Country is required'),

  resident_country: Yup.string()
    .required('Resident country is required'),

  zip_code: Yup.string()
    .required('Zip code is required')
    .max(20, 'Zip code must not exceed 20 characters'),

  // Terms and conditions
  terms_and_conditions: Yup.array()
    .min(1, 'You must accept at least one term and condition')
    .required('You must accept the terms and conditions'),

  // Conditional SSN validation (if required)
  ssn: Yup.string().when('hasNamedAccounts', {
    is: true,
    then: Yup.string()
      .required('SSN is required for named accounts')
      .matches(
        /^\d{3}-\d{2}-\d{4}$/,
        'SSN must be in the format XXX-XX-XXXX'
      ),
    otherwise: Yup.string().nullable()
  })
});

export default IndividualSchema;