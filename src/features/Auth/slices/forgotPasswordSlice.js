import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  email: "",
  passcode: Array(6).fill(""),
  newPassword: "",
  confirmPassword: "",
  step: 1,
  error: null,
  successMessage: "",
  isLoading: false,
  showPassword: false,
  currentPasswordError: "",
  newPasswordError: "",
  confirmPasswordError: "",
  apiResponse: null,
};

const forgotPasswordSlice = createSlice({
  name: "forgotPassword",
  initialState,
  reducers: {
    setEmail: (state, action) => {
      state.email = action.payload;
      state.error = null;
    },
    setPasscode: (state, action) => {
      state.passcode = action.payload;
      state.error = null;
    },
    setNewPassword: (state, action) => {
      state.newPassword = action.payload;
      state.error = null;
    },
    setConfirmPassword: (state, action) => {
      state.confirmPassword = action.payload;
      state.error = null;
    },
    setStep: (state, action) => {
      state.step = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.successMessage = "";
    },
    clearError: (state) => {
      state.error = null;
    },
    setSuccessMessage: (state, action) => {
      state.successMessage = action.payload;
      state.error = null;
    },
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setShowPassword: (state, action) => {
      state.showPassword = action.payload;
    },
    setApiResponse: (state, action) => {
      state.apiResponse = action.payload;
    },
    resetForgotPassword: () => initialState,
    updatePasscodeDigit: (state, action) => {
      const { index, value } = action.payload;
      state.passcode[index] = value;
      state.error = null;
    },
  },
});

export const {
  setEmail,
  setPasscode,
  setNewPassword,
  setConfirmPassword,
  setStep,
  setError,
  clearError,
  setSuccessMessage,
  setIsLoading,
  setShowPassword,
  setApiResponse,
  resetForgotPassword,
  updatePasscodeDigit,
} = forgotPasswordSlice.actions;

export default forgotPasswordSlice.reducer;