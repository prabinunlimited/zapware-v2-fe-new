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

export const requestPasscode = (username, accountType, setShowAccountTypeDropdown) => async (dispatch) => {
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
    // First API call to check if user has multiple accounts
    const checkResponse = await fetch(`${API_URL}/customers/multiple-accounts-username`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ username }),
    });

    const checkData = await checkResponse.json();

    if (!checkResponse.ok) {
      dispatch(setError(checkData.message || "Failed to verify account information."));
      dispatch(setIsLoading(false));
      return;
    }

    // Check the has_multiple_accounts value from the response
    const hasMultipleAccounts = checkData?.data?.has_multiple_accounts;
    
    // If has_multiple_accounts is "Y", show account type dropdown
    if (hasMultipleAccounts === "Y") {
      if (!accountType) {
        // Store the username for later use
        dispatch(setUsername(username));
        dispatch(setShowAccountTypeDropdown(true));
        dispatch(setIsLoading(false));
        return;
      }
    } else if (hasMultipleAccounts === "N") {
      // If response is "N", proceed without account type
      dispatch(setShowAccountTypeDropdown(false));
      // Clear any previously selected account type
      dispatch(setAccountType(null));
    }

    // Second API call to request OTP
    const requestPayload = {
      username: username,
    };
    
    // Add account_type only if it exists and hasMultipleAccounts is "Y"
    if (accountType && hasMultipleAccounts === "Y") {
      requestPayload.account_type = accountType;
    }

    const otpResponse = await fetch(`${API_URL}/request-username-otp-passcode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(requestPayload),
    });

    const otpData = await otpResponse.json();

    if (otpResponse.ok) {
      dispatch(setStep(2));
      dispatch(setSuccessMessage(otpData.message || "Verification code sent to your email or phone."));
    } else {
      dispatch(setError(otpData.error || otpData.message || "Failed to send verification code. Please try again."));
    }
  } catch (err) {
    console.error("Error in requestPasscode:", err);
    dispatch(setError("Network error. Please try again."));
  } finally {
    dispatch(setIsLoading(false));
  }
};

export const validatePasscode = (username, passcode, accountType) => async (dispatch) => {
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
    const payload = {
      username: username,
      otp_passcode: code,
    };
    
    // Add account_type only if it exists
    if (accountType) {
      payload.account_type = accountType;
    }

    console.log("Verify payload:", payload);

    const response = await fetch(`${API_URL}/verify-username-otp-passcode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("Verify response:", data);

    if (response.ok) {
      // Extract customerId from response - check different possible paths
      const customerId = data?.data?.customerId || data?.customerId;
      
      console.log("Extracted customerId:", customerId);
      
      if (customerId) {
        // Store customerId in apiResponse
        dispatch(setApiResponse({ 
          customerId: customerId,
          verificationData: data 
        }));
        
        // Also store in localStorage as backup
        localStorage.setItem("resetCustomerId", customerId);
        
        dispatch(setStep(3));
        dispatch(setSuccessMessage("Verification successful! Set your new password."));
      } else {
        console.error("No customerId found in response:", data);
        dispatch(setError("Customer ID not found in verification response. Please contact support."));
      }
    } else {
      // Check if the error message indicates account type is needed
      const errorMessage = data.message || "Invalid verification code. Please try again.";
      if (errorMessage.toLowerCase().includes("account type") || 
          errorMessage.toLowerCase().includes("please mention account type")) {
        // Go back to step 1 and show account type dropdown
        dispatch(setStep(1));
        dispatch(setShowAccountTypeDropdown(true));
        dispatch(setError("Please select your account type to continue."));
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

export const resetPassword = (username, newPassword, confirmPassword, bearertoken, navigate, customerId) => async (dispatch, getState) => {
  console.log("resetPassword called with:", { username, newPassword, confirmPassword, customerId });
  
  // Password validation
  if (!newPassword || newPassword.length < 12) {
    dispatch(setNewPasswordError("Password must be at least 12 characters."));
    return;
  }

  if (newPassword !== confirmPassword) {
    dispatch(setConfirmPasswordError("Passwords do not match."));
    return;
  }

  // Password strength validation
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumbers = /\d/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*]/.test(newPassword);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    dispatch(setNewPasswordError("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."));
    return;
  }

  // Clear password-specific errors
  dispatch(setNewPasswordError(null));
  dispatch(setConfirmPasswordError(null));

  const token = bearertoken || getBearerToken();
  console.log("Token available:", !!token);
  
  if (!token) {
    dispatch(setError("Authentication required. Please login again."));
    return;
  }

  // Get customerId from apiResponse in state if not provided
  let finalCustomerId = customerId;
  if (!finalCustomerId) {
    const state = getState();
    finalCustomerId = state.forgotPassword.apiResponse?.customerId;
    console.log("CustomerId from state:", finalCustomerId);
  }

  if (!finalCustomerId) {
    dispatch(setError("Customer information not found. Please restart the password reset process."));
    return;
  }

  dispatch(setIsLoading(true));
  dispatch(clearError());

  try {
    const payload = {
      customerId: finalCustomerId,
      password: newPassword,
      confirmPassword: confirmPassword,
    };
    
    console.log("Reset password payload:", payload);
    console.log("API URL:", `${API_URL}/reset-password-customer`);

    const response = await fetch(`${API_URL}/reset-password-customer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("Response status:", response.status);
    
    const data = await response.json();
    console.log("Response data:", data);

    if (response.ok) {
      dispatch(setSuccessMessage(data.message || "Password reset successfully!"));
      // Clear stored customerId
      localStorage.removeItem("resetCustomerId");
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
      console.error("Reset password error:", errorMessage);
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