// hooks/useConversion.js
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCustomerBankAccounts,
  performConversion,
  submitConversion,
  setConversionForm,
  resetConversion,
  resetConversionForm,
  resetConversionResult,
  clearError,
  clearSuccessMessage,
  clearConversionId,
  clearLastSuccessfulConversion,
  clearAllConversionState,
} from "../slice/ConversionSlice";

export const useConversion = () => {
  const dispatch = useDispatch();
  const conversionState = useSelector((state) => state.conversion);

  return {
    // State
    ...conversionState,

    // Actions
    fetchBankAccounts: (customerId, authtoken) =>
      dispatch(fetchCustomerBankAccounts({ customerId, authtoken })),

    convert: (data) => dispatch(performConversion(data)),

    submit: (data) => dispatch(submitConversion(data)),

    updateForm: (formData) => dispatch(setConversionForm(formData)),

    reset: () => dispatch(resetConversion()),

    resetForm: () => dispatch(resetConversionForm()),

    resetResult: () => dispatch(resetConversionResult()),

    clearAllState: () => dispatch(clearAllConversionState()),

    clearConversionError: () => dispatch(clearError()),

    clearConversionSuccess: () => dispatch(clearSuccessMessage()),

    clearConversionId: () => dispatch(clearConversionId()),

    clearLastConversion: () => dispatch(clearLastSuccessfulConversion()),
  };
};
