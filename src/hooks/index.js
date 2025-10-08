// src/hooks/redux.js
import { useDispatch, useSelector, useStore } from 'react-redux';

// Custom hooks for Redux
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;
export const useAppStore = () => useStore();

// Additional utility hooks
export const useAuth = () => {
  return useAppSelector((state) => state.auth);
};

export const useAuthLoading = () => {
  return useAppSelector((state) => state.auth.isLoading);
};

export const useAuthError = () => {
  return useAppSelector((state) => state.auth.error);
};

export const useAuthUser = () => {
  return useAppSelector((state) => state.auth.user);
};

export const useIsAuthenticated = () => {
  return useAppSelector((state) => state.auth.isAuthenticated);
};

export const useOtpState = () => {
  return useAppSelector((state) => ({
    otp: state.auth.otp,
    resendTimer: state.auth.resendTimer,
    resendAttempts: state.auth.resendAttempts,
    showOtpInput: state.auth.showOtpInput,
    otpSent: state.auth.otpSent,
  }));
};

export const useModalState = () => {
  return useAppSelector((state) => state.auth.modalData);
};

// Additional utility hooks for other state slices
export const useKyc = () => {
  return useAppSelector((state) => state.kyc);
};

export const useCountries = () => {
  return useAppSelector((state) => state.countries);
};

export const usePartner = () => {
  return useAppSelector((state) => state.partner);
};

export const useHostname = () => {
  return useAppSelector((state) => state.hostname);
};

export const useUi = () => {
  return useAppSelector((state) => state.ui);
};

export const useDownload = () => {
  return useAppSelector((state) => state.download);
};

export const useForgotPassword = () => {
  return useAppSelector((state) => state.forgotPassword);
};

export const useSignup = () => {
  return useAppSelector((state) => state.signup);
};