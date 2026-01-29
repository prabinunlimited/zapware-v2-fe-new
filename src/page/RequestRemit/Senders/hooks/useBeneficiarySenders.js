// src/features/BeneficiarySenders/hooks/useBeneficiarySenders.js
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import {
  fetchSenders,
  addSender,
  searchSenders,
  searchCustomers,
  setSearchQuery,
  setFilterVisibility,
  clearSearch,
  clearAllFilters,
  toggleSenderVisibility,
  showDeleteModal,
  hideDeleteModal,
  showAddSenderModal,
  hideAddSenderModal,
} from "../Slice/beneficiarySendersSlice";

export const useBeneficiarySenders = () => {
  const dispatch = useDispatch();

  const handleFetchSenders = useCallback(
    (beneficiaryId) => {
      return dispatch(fetchSenders(beneficiaryId));
    },
    [dispatch]
  );

  const handleAddSender = useCallback(
    ({ customerId, beneficiaryId }) => {
      return dispatch(addSender({ customerId, beneficiaryId }));
    },
    [dispatch]
  );

  const handleSearchSenders = useCallback(
    (query, searchType) => {
      return dispatch(searchSenders({ query, searchType }));
    },
    [dispatch]
  );

  const handleSearchCustomers = useCallback(
    (query) => {
      return dispatch(searchCustomers(query));
    },
    [dispatch]
  );

  const handleSetSearchQuery = useCallback(
    (query) => {
      dispatch(setSearchQuery(query));
    },
    [dispatch]
  );

  const handleSetFilterVisibility = useCallback(
    (visibility) => {
      dispatch(setFilterVisibility(visibility));
    },
    [dispatch]
  );

  const handleClearSearch = useCallback(() => {
    dispatch(clearSearch());
  }, [dispatch]);

  const handleClearAllFilters = useCallback(() => {
    dispatch(clearAllFilters());
  }, [dispatch]);

  const handleToggleVisibility = useCallback(
    (senderId) => {
      dispatch(toggleSenderVisibility(senderId));
    },
    [dispatch]
  );

  const handleShowDeleteModal = useCallback(
    (senderId) => {
      dispatch(showDeleteModal(senderId));
    },
    [dispatch]
  );

  const handleHideDeleteModal = useCallback(() => {
    dispatch(hideDeleteModal());
  }, [dispatch]);

  const handleShowAddSenderModal = useCallback(() => {
    dispatch(showAddSenderModal());
  }, [dispatch]);

  const handleHideAddSenderModal = useCallback(() => {
    dispatch(hideAddSenderModal());
  }, [dispatch]);

  return {
    fetchSenders: handleFetchSenders,
    addSender: handleAddSender,
    searchSenders: handleSearchSenders,
    searchCustomers: handleSearchCustomers,
    setSearchQuery: handleSetSearchQuery,
    setFilterVisibility: handleSetFilterVisibility,
    clearSearch: handleClearSearch,
    clearAllFilters: handleClearAllFilters,
    toggleVisibility: handleToggleVisibility,
    showDeleteModal: handleShowDeleteModal,
    hideDeleteModal: handleHideDeleteModal,
    showAddSenderModal: handleShowAddSenderModal,
    hideAddSenderModal: handleHideAddSenderModal,
  };
};
