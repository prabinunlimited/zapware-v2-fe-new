// src/hooks/useBeneficiaryHeader.js
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBeneficiaryData,
  fetchLocationData,
  selectBeneficiaryData,
  selectBeneficiaryLoading,
  selectBeneficiaryError,
  selectLocationData,
  selectFormData,
  selectIsEditMode,
  selectUpdating,
  setEditMode,
  updateFormData,
  updateBankAccount,
  addBankAccount,
  removeBankAccount,
} from "../Header/BeneficiariesHeaderSlice";

export const useBeneficiaryHeader = (beneficiaryId) => {
  const dispatch = useDispatch();

  // Select data from Redux store
  const beneficiaryData = useSelector(selectBeneficiaryData);
  const loading = useSelector(selectBeneficiaryLoading);
  const error = useSelector(selectBeneficiaryError);
  const locationData = useSelector(selectLocationData);
  const formData = useSelector(selectFormData);
  const isEditMode = useSelector(selectIsEditMode);
  const updating = useSelector(selectUpdating);

  // Fetch data on mount
  useEffect(() => {
    if (beneficiaryId) {
      console.log(
        "🔍 useBeneficiaryHeader: Fetching data for ID:",
        beneficiaryId
      );
      dispatch(fetchBeneficiaryData(beneficiaryId));
      dispatch(fetchLocationData());
    }
  }, [dispatch, beneficiaryId]);

  // Helper functions
  const getDisplayName = () => {
    const { merchantData, profileData } = beneficiaryData;
    return merchantData?.data?.name || profileData?.first_name || "Beneficiary";
  };

  const getBeneficiaryRole = () => {
    const { merchantData } = beneficiaryData;
    return merchantData?.data?.beneftype || "beneficiary";
  };

  const getBankAccounts = () => {
    const { merchantData } = beneficiaryData;
    return merchantData?.data?.benef_banks || [];
  };

  // Form helpers
  const handleInputChange = (field, value) => {
    dispatch(updateFormData({ [field]: value }));
  };

  const handleBankChange = (index, field, value) => {
    dispatch(updateBankAccount({ index, updates: { [field]: value } }));
  };

  const handleAddBank = () => {
    dispatch(addBankAccount());
  };

  const handleRemoveBank = (index) => {
    dispatch(removeBankAccount(index));
  };

  const toggleEditMode = () => {
    dispatch(setEditMode(!isEditMode));
  };

  return {
    // Data
    data: beneficiaryData,
    loading,
    error,
    locationData,
    formData,

    // State
    isEditMode,
    updating,

    // Helpers
    getDisplayName,
    getBeneficiaryRole,
    getBankAccounts,

    // Actions
    handleInputChange,
    handleBankChange,
    handleAddBank,
    handleRemoveBank,
    toggleEditMode,

    // Convenience getters
    displayName: getDisplayName(),
    role: getBeneficiaryRole(),
    banks: getBankAccounts(),
  };
};
