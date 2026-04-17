const API_URL = import.meta.env.VITE_API_URL;

import {
  setEmail,
  setPasscode,
  setNewPassword,
  setConfirmPassword,
  setStep,
  setError,
  setSuccessMessage,
  setIsLoading,
  setShowPassword,
  setApiResponse,
  resetForgotPassword,
  updatePasscodeDigit,
  clearError,
} from "../slices/forgotPasswordSlice";

export {
  setEmail,
  setNewPassword,
  setConfirmPassword,
  setShowPassword,
  resetForgotPassword,
  clearError,
};

export const requestPasscode = (email) => async (dispatch) => {
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    dispatch(setError("Please enter a valid email address."));
    return;
  }

  dispatch(setIsLoading(true));
  dispatch(clearError());

  try {
    const response = await fetch(`${API_URL}/request-passcode-forgot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      dispatch(setStep(2));
      dispatch(setSuccessMessage(data.message || "Passcode sent to your email."));
    } else {
      dispatch(setError(data.error || data.message || "Failed to send passcode. Please try again."));
    }
  } catch (err) {
    dispatch(setError("Network error. Please try again."));
  } finally {
    dispatch(setIsLoading(false));
  }
};

export const validatePasscode = (email, passcode) => async (dispatch) => {
  const code = passcode.join("");
  if (!code || code.length !== 6) {
    dispatch(setError("Please enter a valid 6-digit passcode."));
    return;
  }

  dispatch(setIsLoading(true));
  dispatch(clearError());

  try {
    const response = await fetch(`${API_URL}/validate-passcode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, passcode: code }),
    });

    const data = await response.json();

    if (response.ok) {
      dispatch(setStep(3));
      dispatch(setSuccessMessage("Passcode validated! Set your new password."));
      if (data.token) {
        dispatch(setApiResponse({ token: data.token }));
      }
    } else {
      dispatch(setError(data.message || "Invalid passcode. Please try again."));
    }
  } catch (err) {
    dispatch(setError("Network error. Please try again."));
  } finally {
    dispatch(setIsLoading(false));
  }
};

export const resetPassword = (email, newPassword, confirmPassword, bearertoken, navigate) => async (dispatch) => {
  if (!newPassword || newPassword.length < 12) {
    dispatch(setError("Password must be at least 12 characters."));
    return;
  }

  if (newPassword !== confirmPassword) {
    dispatch(setError("Passwords do not match."));
    return;
  }

  dispatch(setIsLoading(true));
  dispatch(clearError());

  try {
    const response = await fetch(`${API_URL}/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearertoken}`,
      },
      body: JSON.stringify({
        email,
        newPassword,
        password_confirmation: confirmPassword,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      dispatch(setSuccessMessage(data.message || "Password reset successfully!"));
      setTimeout(() => {
        dispatch(resetForgotPassword());
        navigate("/");
      }, 2000);
    } else {
      let errorMessage = "Failed to reset password.";
      if (data.message) errorMessage = data.message;
      else if (data.error) errorMessage = data.error;
      else if (data.errors) {
        errorMessage = Object.values(data.errors).flat().join(". ");
      }
      dispatch(setError(errorMessage));
    }
  } catch (err) {
    dispatch(setError("Network error. Please try again."));
  } finally {
    dispatch(setIsLoading(false));
  }
};

export const handlePasscodeChange = (index, value) => (dispatch) => {
  dispatch(updatePasscodeDigit({ index, value }));
  dispatch(clearError());
};

export const handlePasscodePaste = (pasteData) => (dispatch) => {
  if (/^\d{6}$/.test(pasteData.trim())) {
    const newPasscode = pasteData.trim().split("");
    dispatch(setPasscode(newPasscode));
    dispatch(clearError());
  }
};

// Selectors
export const selectEmail = (state) => state.forgotPassword.email;
export const selectPasscode = (state) => state.forgotPassword.passcode;
export const selectNewPassword = (state) => state.forgotPassword.newPassword;
export const selectConfirmPassword = (state) => state.forgotPassword.confirmPassword;
export const selectStep = (state) => state.forgotPassword.step;
export const selectError = (state) => state.forgotPassword.error;
export const selectSuccessMessage = (state) => state.forgotPassword.successMessage;
export const selectIsLoading = (state) => state.forgotPassword.isLoading;
export const selectShowPassword = (state) => state.forgotPassword.showPassword;
export const selectApiResponse = (state) => state.forgotPassword.apiResponse;
export const selectProgressBarWidth = (state) => (state.forgotPassword.step / 3) * 100;
