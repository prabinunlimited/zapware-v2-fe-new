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
  setUsername,
  setAccountType,
  setShowAccountTypeDropdown,
  setCurrentPasswordError,
  setNewPasswordError,
  setConfirmPasswordError,
} from "../slices/forgotPasswordSlice";

const API_URL = import.meta.env.VITE_API_URL;

export {
  setEmail,
  setNewPassword,
  setConfirmPassword,
  setShowPassword,
  resetForgotPassword,
  clearError,
  setUsername,
  setAccountType,
  setShowAccountTypeDropdown,
  setCurrentPasswordError,
  setNewPasswordError,
  setConfirmPasswordError,
  setStep
};

// Helper function to validate username (email or phone)
const isValidUsername = (username) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return emailRegex.test(username) || phoneRegex.test(username);
};

// Helper function to get bearer token
const getBearerToken = () => {
  return localStorage.getItem("bearertoken");
};

const formatErrorMessage = (errorData, defaultMessage = "An error occurred.") => {
  if (!errorData) return defaultMessage;
  if (typeof errorData === "string") return errorData;
  if (Array.isArray(errorData)) return errorData.join(" ");
  if (typeof errorData === "object") {
    return Object.values(errorData).flat().join(" ");
  }
  return String(errorData);
};

export const requestPasscode = (username, accountType) => async (dispatch) => {
  if (!username || !isValidUsername(username)) {
    dispatch(setError("Please enter a valid email address or mobile number."));
    return;
  }

  const token = getBearerToken();
  if (!token) {
    dispatch(setError("Authentication required. Please login again."));
    return;
  }

  dispatch(setIsLoading(true));
  dispatch(clearError());

  try {
    const checkResponse = await fetch(`${API_URL}/customers/multiple-accounts-username`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username }),
    });

    const checkData = await checkResponse.json();

    if (!checkResponse.ok && checkData?.data?.has_multiple_user_types !== "Y") {
      dispatch(setError(checkData.message || "Failed to verify account information."));
      dispatch(setIsLoading(false));
      return;
    }

    const hasMultipleAccounts = checkData?.data?.has_multiple_accounts;
    const hasMultipleUserTypes = checkData?.data?.has_multiple_user_types === "Y";

    if (checkData.data) {
      dispatch(setApiResponse(checkData.data));
    }

    if (hasMultipleAccounts === "Y" || hasMultipleUserTypes) {
      if (!accountType) {
        dispatch(setUsername(username));
        dispatch(setShowAccountTypeDropdown(true));
        dispatch(setError(checkData.message || "Please select an account type."));
        dispatch(setIsLoading(false));
        return;
      }
    } else if (hasMultipleAccounts === "N" && !hasMultipleUserTypes) {
      dispatch(setShowAccountTypeDropdown(false));
      dispatch(setAccountType(null));
    }

    const requestPayload = {
      username: username,
    };

    if (accountType) {
      if (hasMultipleUserTypes) {
        requestPayload.user_type = accountType;
      } else if (hasMultipleAccounts === "Y") {
        requestPayload.account_type = accountType;
      } else {
        requestPayload.user_type = accountType;
      }
    }

    const otpResponse = await fetch(`${API_URL}/request-username-otp-passcode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestPayload),
    });

    const otpData = await otpResponse.json();

    if (otpResponse.ok) {
      dispatch(setShowAccountTypeDropdown(false));
      dispatch(setStep(2));
      dispatch(setSuccessMessage(otpData.message || "Verification code sent to your email or phone."));
    } else {
      if (otpData?.data?.has_multiple_user_types === "Y") {
        if (otpData.data) dispatch(setApiResponse(otpData.data));
        dispatch(setShowAccountTypeDropdown(true));
      }
      dispatch(setError(otpData.error || otpData.message || "Failed to send verification code. Please try again."));
    }
  } catch (err) {
    console.error("Error in requestPasscode:", err);
    dispatch(setError("Network error. Please try again."));
  } finally {
    dispatch(setIsLoading(false));
  }
};

export const validatePasscode = (username, passcode, accountType) => async (dispatch, getState) => {
  const code = passcode.join("");
  if (!code || code.length !== 6) {
    dispatch(setError("Please enter a valid 6-digit verification code."));
    return;
  }

  const token = getBearerToken();
  if (!token) {
    dispatch(setError("Authentication required. Please login again."));
    return;
  }

  dispatch(setIsLoading(true));
  dispatch(clearError());

  try {
    const state = getState();
    const isMultiUserType = state.forgotPassword?.apiResponse?.has_multiple_user_types === "Y";

    const payload = {
      username: username,
      otp_passcode: code,
    };

    if (accountType) {
      if (isMultiUserType) {
        payload.user_type = accountType;
      } else {
        payload.account_type = accountType;
      }
    }

    const response = await fetch(`${API_URL}/verify-username-otp-passcode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      const userUuid = data?.data?.user_uuid || data?.user_uuid;

      if (userUuid) {
        dispatch(
          setApiResponse({
            user_uuid: userUuid,
            verificationData: data,
          })
        );

        localStorage.setItem("resetUserUuid", userUuid);
        dispatch(setStep(3));
        dispatch(setSuccessMessage("Verification successful! Set your new password."));
      } else {
        console.error("No user_uuid found in response:", data);
        dispatch(setError("User UUID not found in verification response. Please contact support."));
      }
    } else {
      const rawError = data?.message || data?.error || "Invalid verification code. Please try again.";
      const errorMessage = typeof rawError === "string" 
        ? rawError 
        : (typeof rawError === "object" ? Object.values(rawError).flat().join(". ") : String(rawError));

      const lowerMsg = errorMessage.toLowerCase();

      if (
        lowerMsg.includes("user type") ||
        lowerMsg.includes("account type")
      ) {
        dispatch(setStep(1));
        dispatch(setShowAccountTypeDropdown(true));
        dispatch(setError("Please select your account/user type to continue."));
      } else {
        dispatch(setError(errorMessage));
      }
    }
  } catch (err) {
    console.error("Error in validatePasscode:", err);
    dispatch(setError("Network error. Please try again."));
  } finally {
    dispatch(setIsLoading(false));
  }
};

export const resetPassword =
  (username, newPassword, confirmPassword, bearertoken, navigate, userUuid) =>
  async (dispatch, getState) => {
    if (!newPassword || newPassword.length < 12) {
      dispatch(setNewPasswordError("Password must be at least 12 characters."));
      return;
    }

    if (newPassword !== confirmPassword) {
      dispatch(setConfirmPasswordError("Passwords do not match."));
      return;
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      dispatch(
        setNewPasswordError(
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
        )
      );
      return;
    }

    dispatch(setNewPasswordError(null));
    dispatch(setConfirmPasswordError(null));

    const token = bearertoken || getBearerToken();
    if (!token) {
      dispatch(setError("Authentication required. Please login again."));
      return;
    }

    let finalUserUuid = userUuid;
    if (!finalUserUuid) {
      const state = getState();
      finalUserUuid =
        state.forgotPassword?.apiResponse?.user_uuid ||
        localStorage.getItem("resetUserUuid");
    }

    if (!finalUserUuid) {
      dispatch(
        setError("User information not found. Please restart the password reset process.")
      );
      return;
    }

    dispatch(setIsLoading(true));
    dispatch(clearError());

    try {
      const payload = {
        user_uuid: finalUserUuid,
        password: newPassword,
        confirmPassword: confirmPassword,
      };

      const response = await fetch(`${API_URL}/reset-password-username`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        dispatch(setSuccessMessage(data.message || "Password reset successfully!"));
        localStorage.removeItem("resetUserUuid");
        setTimeout(() => {
          dispatch(resetForgotPassword());
          navigate("/");
        }, 2000);
      } else {
        const rawError = data.message || data.error || data.errors || "Failed to reset password.";
        const errorMessage = formatErrorMessage(rawError, "Failed to reset password.");
        dispatch(setError(errorMessage));
      }
    } catch (err) {
      console.error("Error in resetPassword:", err);
      dispatch(setError("Network error. Please try again."));
    } finally {
      dispatch(setIsLoading(false));
    }
  };

export const handlePasscodeChange = (index, value) => (dispatch) => {
  // Allow only digits
  const digit = value.replace(/\D/g, "");
  dispatch(updatePasscodeDigit({ index, value: digit }));
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
export const selectUsername = (state) => state.forgotPassword.username;
export const selectPasscode = (state) => state.forgotPassword.passcode;
export const selectNewPassword = (state) => state.forgotPassword.newPassword;
export const selectConfirmPassword = (state) => state.forgotPassword.confirmPassword;
export const selectStep = (state) => state.forgotPassword.step;
export const selectError = (state) => state.forgotPassword.error;
export const selectSuccessMessage = (state) => state.forgotPassword.successMessage;
export const selectIsLoading = (state) => state.forgotPassword.isLoading;
export const selectShowPassword = (state) => state.forgotPassword.showPassword;
export const selectCurrentPasswordError = (state) => state.forgotPassword.currentPasswordError;
export const selectNewPasswordError = (state) => state.forgotPassword.newPasswordError;
export const selectConfirmPasswordError = (state) => state.forgotPassword.confirmPasswordError;
export const selectApiResponse = (state) => state.forgotPassword.apiResponse;
export const selectProgressBarWidth = (state) => (state.forgotPassword.step / 3) * 100;
export const selectAccountType = (state) => state.forgotPassword.accountType;
export const selectShowAccountTypeDropdown = (state) => state.forgotPassword.showAccountTypeDropdown;