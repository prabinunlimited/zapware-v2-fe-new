// src/features/BankAccounts/hooks/useBankLink.js
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPlaidBankAccounts,
  deletePlaidBankAccount,
  handleBankLinkSuccess,
  setShowPlaidLink,
  setShowSuccessModal,
  setCurrentPage,
  setKycStatus,
  clearErrors,
  // ... selectors
} from "../slices/bankLinkSlice";

export const useBankLink = (customerId) => {
  const dispatch = useDispatch();

  // Select all state
  const state = useSelector(state => state.bankLink);

  const refreshAccounts = useCallback(() => {
    if (customerId) {
      dispatch(fetchPlaidBankAccounts(customerId));
    }
  }, [customerId, dispatch]);

  const deleteAccount = useCallback((accountId, accountName) => {
    if (customerId) {
      dispatch(deletePlaidBankAccount({ accountId, accountName, customerId }));
    }
  }, [customerId, dispatch]);

  const onBankLinkSuccess = useCallback((response) => {
    if (customerId) {
      dispatch(handleBankLinkSuccess({ response, customerId }));
    }
  }, [customerId, dispatch]);

  const openPlaidLink = useCallback(() => {
    dispatch(setShowPlaidLink(true));
  }, [dispatch]);

  const closePlaidLink = useCallback(() => {
    dispatch(setShowPlaidLink(false));
  }, [dispatch]);

  const closeSuccessModal = useCallback(() => {
    if (!state.isProcessing && !state.isAddingAccount) {
      dispatch(setShowSuccessModal(false));
    }
  }, [state.isProcessing, state.isAddingAccount, dispatch]);

  const changePage = useCallback((pageNumber) => {
    dispatch(setCurrentPage(pageNumber));
  }, [dispatch]);

  const dismissErrors = useCallback(() => {
    dispatch(clearErrors());
  }, [dispatch]);

  return {
    // State
    ...state,
    
    // Actions
    refreshAccounts,
    deleteAccount,
    onBankLinkSuccess,
    openPlaidLink,
    closePlaidLink,
    closeSuccessModal,
    changePage,
    dismissErrors,
    
    // Derived values
    hasAccounts: state.accounts.length > 0,
    paginatedAccounts: state.accounts.slice(
      (state.currentPage - 1) * state.accountsPerPage,
      state.currentPage * state.accountsPerPage
    ),
    totalPages: Math.ceil(state.accounts.length / state.accountsPerPage),
  };
};