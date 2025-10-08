// src/store/rootReducer.js
import { combineReducers } from "redux";
import authReducer from "../features/Auth/slices/authSlice";
import countriesReducer from "../features/Auth/slices/countrySlice";
import signupReducer from "../features/Auth/slices/signupSlice";
import uiReducer from "../features/Auth/slices/uiSlice";
import downloadReducer from "../features/Auth/slices/downloadSlice";
import kycReducer from "../features/Auth/slices/kycSlice";
import partnerReducer from "../features/Auth/slices/partnerSlice";
import hostnameReducer from "../features/Auth/slices/hostnameSlice";
import forgotPasswordReducer from "../features/Auth/slices/forgotPasswordSlice";
import institutionRegistrationReducer from "../features/Auth/slices/institutionRegistrationSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  countries: countriesReducer,
  signup: signupReducer,
  ui: uiReducer,
  download: downloadReducer,
  kyc: kycReducer,
  partner: partnerReducer,
  hostname: hostnameReducer,
  forgotPassword: forgotPasswordReducer,
  institutionRegistration: institutionRegistrationReducer,
});

export default rootReducer;