import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { RingLoader } from "react-spinners";
import BankDetailsPopup from "../../../components/PopupModal/BankDetailsPopup";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import PropTypes from "prop-types";

// Import from MyBeneficiaries/BeneficiariesSlice
import {
  selectBeneficiaries,
  selectFilteredBeneficiaries,
  selectBeneficiariesLoading,
  selectBeneficiariesError,
  selectBeneficiariesSuccess,
  selectSearchQuery,
  selectFilterVisibility,
  selectVisibleBeneficiaries,
  selectBeneficiariesCount,
  setSearchQuery,
  setFilterVisibility,
  clearError,
  clearSuccess,
  fetchBeneficiaries,
  deleteBeneficiary,
  toggleBeneficiaryVisibility,
} from "../MyBeneficiaries/BeneficiariesSlice";

// Import ModalSlice actions
import { showDeleteModal, showBulkDeleteModal } from "./ModalSlice";

// Import FontAwesome icons
import {
  FaEye,
  FaEyeSlash,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaTimes,
  FaPlus,
  FaMoneyBillWave,
  FaUser,
  FaUniversity,
  FaExclamationTriangle,
  FaArrowLeft,
} from "react-icons/fa";

const Beneficiaries = ({ mode = "list" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const params = useParams();

  // Add useRef to track mounted state
  const isMounted = useRef(true);

  // Get customerId from params or location state
  const customerId =
    params.customerId ||
    location.state?.customerId ||
    localStorage.getItem("currentCustomerId");

  // Redux selectors
  const beneficiaries = useSelector(selectBeneficiaries);
  const filteredBeneficiaries = useSelector(selectFilteredBeneficiaries);
  const loading = useSelector(selectBeneficiariesLoading);
  const error = useSelector(selectBeneficiariesError);
  const success = useSelector(selectBeneficiariesSuccess);
  const searchQuery = useSelector(selectSearchQuery);
  const filterVisibility = useSelector(selectFilterVisibility);
  const visibleBeneficiaries = useSelector(selectVisibleBeneficiaries);
  const beneficiariesCount = useSelector(selectBeneficiariesCount);
  const deleteModal = useSelector((state) => state.modal.deleteModal);

  // Local states
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState([]);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Search timeout ref
  const searchTimeoutRef = useRef(null);

  // Ref to track current searching state (avoids stale closures)
  const isSearchingRef = useRef(false);

  // Combined cleanup function for component unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      dispatch(clearError());
      dispatch(clearSuccess());

      // Clear any pending timeouts
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }

      // Always reset searching state on unmount
      setIsSearching(false);
      isSearchingRef.current = false;

      // Reset search query in Redux
      dispatch(setSearchQuery(""));
    };
  }, [dispatch]);

  // Refresh beneficiaries when delete is successful
  useEffect(() => {
    if (deleteModal.showSuccess && customerId) {
      dispatch(fetchBeneficiaries(customerId));
      setSelectedBeneficiaries([]);
    }
  }, [deleteModal.showSuccess, customerId, dispatch]);

  // Fetch beneficiaries on component mount
  useEffect(() => {
    if (customerId && isMounted.current && !hasFetchedOnce) {
      console.log(
        "🔍 Beneficiaries Component mounted with customerId:",
        customerId
      );

      const loadBeneficiaries = async () => {
        try {
          setIsLoading(true); // Show loading during initial fetch
          const result = await dispatch(
            fetchBeneficiaries(customerId)
          ).unwrap();
          console.log("📥 Fetched beneficiaries:", result);

          // Handle the case where API returns { data: null }
          if (!result || result === null) {
            console.log("📭 No beneficiaries found, initializing empty array");
          }

          setHasFetchedOnce(true);
        } catch (error) {
          console.error("❌ Error loading beneficiaries:", error);
          if (isMounted.current) {
            toast.error("Failed to load beneficiaries");
          }
        } finally {
          setIsLoading(false);
        }
      };

      loadBeneficiaries();
    }
  }, [dispatch, customerId, hasFetchedOnce]);

  // Sync search input with Redux search query
  useEffect(() => {
    setSearchInput(searchQuery || "");
    // Reset searching state when search query changes
    setIsSearching(false);
  }, [searchQuery]);

  // Handle success and error messages
  useEffect(() => {
    if (success && isMounted.current) {
      toast.success(success);
      dispatch(clearSuccess());
    }

    if (error && isMounted.current) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [success, error, dispatch]);

  useEffect(() => {
    isSearchingRef.current = isSearching;
  }, [isSearching]);

  useEffect(() => {
    console.log(
      "📊 Beneficiaries updated:",
      beneficiaries?.length,
      "Searching:",
      isSearching
    );

    if (beneficiaries && beneficiaries.length === 0 && isSearching) {
      console.log("⚠️ No beneficiaries but searching - forcing reset");
      setIsSearching(false);
      isSearchingRef.current = false;

      // Clear any pending timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }

      // Also clear search query if it exists
      if (searchQuery) {
        dispatch(setSearchQuery(""));
      }
    }
  }, [beneficiaries, isSearching, searchQuery, dispatch]);

  useEffect(() => {
    if (isSearching) {
      const safetyTimer = setTimeout(() => {
        console.log("⏰ Safety timer triggered - resetting isSearching");
        setIsSearching(false);
        isSearchingRef.current = false;
      }, 2000); // Reset after 2 seconds max

      return () => {
        clearTimeout(safetyTimer);
      };
    }
  }, [isSearching]);

  // Handle search input changes with debounce - FIXED VERSION
  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      console.log("🔍 handleSearchChange called:", value);
      setSearchInput(value);

      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }

      // If empty, clear search query and reset searching state
      if (!value.trim()) {
        setIsSearching(false);
        isSearchingRef.current = false;
        dispatch(setSearchQuery(""));
        return;
      }

      // Set searching state
      setIsSearching(true);
      isSearchingRef.current = true;

      // Debounce the search dispatch
      searchTimeoutRef.current = setTimeout(() => {
        console.log("⏰ Dispatching search query:", value);
        dispatch(setSearchQuery(value));

        // DON'T set isSearching to false here - let the useEffect handle it
        // based on whether results are found
        searchTimeoutRef.current = null;
      }, 300);
    },
    [dispatch]
  );

  // Remove or modify the problematic useEffect that resets isSearching:
  useEffect(() => {
    if (filteredBeneficiaries.length > 0 && isSearching) {
      // We have results, can stop searching
      setIsSearching(false);
      isSearchingRef.current = false;
    }
    // Don't automatically reset when there are no beneficiaries
    // Let the search timeout handle completion
  }, [filteredBeneficiaries, isSearching]);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    dispatch(setSearchQuery(""));
    setIsSearching(false);
    isSearchingRef.current = false; // Add this line

    // Clear any pending timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  }, [dispatch]);

  // Toggle filter visibility
  const handleToggleFilter = () => {
    dispatch(setFilterVisibility(!filterVisibility));
  };

  // Navigate to add beneficiary page
  const handleAddBeneficiary = () => {
    navigate(`/addbeneficiary/${customerId}`);
  };

  // Navigate to edit beneficiary page
  const handleEditBeneficiary = (beneficiary) => {
    navigate(`/editbeneficiary/${beneficiary.id}`, {
      state: { customerId, beneficiaryData: beneficiary },
    });
  };

  // Show bank details popup - FIXED: Now correctly sets the selected beneficiary
  const handleViewBankDetails = (beneficiary) => {
    console.log("Viewing bank details for:", beneficiary);
    setSelectedBeneficiary(beneficiary);
    setShowBankDetails(true);
  };

  // Handle delete - Using Redux modal with correct parameters
  const handleDeleteClick = (beneficiary) => {
    dispatch(showDeleteModal({
      id: beneficiary.id,
      name: beneficiary.name,
    }));
  };

  // Toggle beneficiary visibility
  const handleToggleVisibility = async (beneficiaryId) => {
    if (customerId) {
      try {
        await dispatch(
          toggleBeneficiaryVisibility({
            customerId,
            beneficiaryId,
          })
        ).unwrap();

        // Refresh the list
        dispatch(fetchBeneficiaries(customerId));
      } catch (error) {
        toast.error(error.message || "Failed to toggle visibility");
      }
    }
  };

  // Handle beneficiary selection for bulk actions
  const handleBeneficiarySelect = (beneficiaryId) => {
    setSelectedBeneficiaries((prev) => {
      if (prev.includes(beneficiaryId)) {
        return prev.filter((id) => id !== beneficiaryId);
      } else {
        return [...prev, beneficiaryId];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedBeneficiaries.length === filteredBeneficiaries.length) {
      setSelectedBeneficiaries([]);
    } else {
      setSelectedBeneficiaries(filteredBeneficiaries.map((b) => b.id));
    }
  };

  // Handle bulk delete - Using Redux modal with correct parameters
  const handleBulkDeleteClick = () => {
    if (selectedBeneficiaries.length > 0) {
      dispatch(showBulkDeleteModal({
        ids: selectedBeneficiaries,
        count: selectedBeneficiaries.length,
      }));
    } else {
      toast.warning("Please select at least one beneficiary to delete");
    }
  };

  // Close bank details popup
  const handleCloseBankDetails = () => {
    setShowBankDetails(false);
    setSelectedBeneficiary(null);
  };

  // Navigate back
  const handleGoBack = () => {
    navigate(-1);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Determine if we should show initial loading
  const showInitialLoading =
    loading && !hasFetchedOnce && beneficiaries.length === 0;

  // Loading overlay for initial load
  if (showInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RingLoader size={60} color="#3B82F6" />
          <p className="mt-4 text-gray-600">Loading beneficiaries...</p>
        </div>
      </div>
    );
  }

  // Check if customerId exists
  if (!customerId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Customer ID Missing
          </h2>
          <p className="text-gray-600 mb-6">
            Please navigate to this page through the proper route.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Loading overlay for actions */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-75 z-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center">
            <RingLoader size={60} color="#3B82F6" />
            <p className="mt-6 text-gray-700 font-medium">Processing...</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center">
                  <FaMoneyBillWave className="mr-3" size={28} />
                  My Beneficiaries
                </h1>
                <p className="text-blue-100 mt-1">
                  Manage your beneficiaries for sending money
                </p>
              </div>
              <button
                onClick={handleGoBack}
                className="flex items-center text-white hover:text-blue-100 transition-colors duration-200 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg mt-4 md:mt-0"
              >
                <FaArrowLeft className="mr-2" />
                Back
              </button>
            </div>
          </div>

          {/* Stats and Actions */}
          <div className="p-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 mr-3">
                    <FaUser size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Beneficiaries</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {beneficiariesCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 mr-3">
                    <FaEye size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Visible</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {visibleBeneficiaries.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 mr-3">
                    <FaEyeSlash size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Hidden</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {beneficiariesCount - visibleBeneficiaries.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                <button
                  onClick={handleAddBeneficiary}
                  className="w-full h-full flex items-center justify-center p-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <FaPlus className="mr-2" size={20} />
                  <span className="font-semibold">Add New Beneficiary</span>
                </button>
              </div>
            </div>

            {/* Search and Filter Bar - FIXED */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  {isSearching ? (
                    <div className="w-4 h-4 flex items-center justify-center">
                      <RingLoader size={14} color="#3B82F6" />
                    </div>
                  ) : (
                    <FaSearch />
                  )}
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={handleSearchChange}
                  placeholder="Search beneficiaries by name, phone, or email..."
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading && !hasFetchedOnce}
                  onKeyDown={(e) => {
                    // Clear search on Escape key
                    if (e.key === "Escape") {
                      handleClearSearch();
                    }
                  }}
                />
                {searchInput && !isSearching && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    type="button"
                    disabled={loading}
                  >
                    <FaTimes />
                  </button>
                )}
                {/* Show searching text when searching */}
                {isSearching && (
                  <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                    <span className="text-xs text-gray-500">Searching...</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleToggleFilter}
                disabled={loading && !hasFetchedOnce}
                className={`px-6 py-3 rounded-xl flex items-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                  filterVisibility
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <FaFilter className="mr-2" />
                Filter
              </button>

              {selectedBeneficiaries.length > 0 && (
                <button
                  onClick={handleBulkDeleteClick}
                  disabled={isLoading}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaTrash className="mr-2" />
                  Delete Selected ({selectedBeneficiaries.length})
                </button>
              )}
            </div>

            {/* Filter Panel */}
            {filterVisibility && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">All Currencies</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="NPR">NPR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Added
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Beneficiaries Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Show loading indicator only when searching within existing data */}
          {loading && !hasFetchedOnce ? (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center">
                <RingLoader size={40} color="#3B82F6" />
                <p className="mt-4 text-gray-600">Loading beneficiaries...</p>
              </div>
            </div>
          ) : filteredBeneficiaries.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center">
                <FaUser className="text-gray-300 text-6xl mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {searchQuery ? "No Results Found" : "No Beneficiaries Found"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery
                    ? `No beneficiaries found matching "${searchQuery}"`
                    : "You haven't added any beneficiaries yet."}
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleAddBeneficiary}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <FaPlus className="inline mr-2" />
                    Add Your First Beneficiary
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-4 px-6">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={
                              selectedBeneficiaries.length ===
                                filteredBeneficiaries.length &&
                              filteredBeneficiaries.length > 0
                            }
                            onChange={handleSelectAll}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="ml-3 text-sm font-semibold text-gray-700">
                            Select
                          </span>
                        </div>
                      </th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                        Name
                      </th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                        Contact
                      </th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                        Country
                      </th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                        Currency
                      </th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                        Date Added
                      </th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredBeneficiaries.map((beneficiary) => (
                      <tr
                        key={beneficiary.id}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="py-4 px-6">
                          <input
                            type="checkbox"
                            checked={selectedBeneficiaries.includes(
                              beneficiary.id
                            )}
                            onChange={() =>
                              handleBeneficiarySelect(beneficiary.id)
                            }
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                              {beneficiary.name?.charAt(0) || "?"}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {beneficiary.name || "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {beneficiary.relationtobenef || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-900">
                            {beneficiary.phone_number || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {beneficiary.email || "N/A"}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-900">
                            {beneficiary.beneficiarycountryname || "N/A"}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {beneficiary.currency || "N/A"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <button
                              onClick={() =>
                                handleToggleVisibility(beneficiary.id)
                              }
                              className={`p-2 rounded-full ${
                                beneficiary.status === 1 ||
                                beneficiary.active_status === 1
                                  ? "text-green-600 hover:bg-green-50"
                                  : "text-gray-400 hover:bg-gray-100"
                              }`}
                            >
                              {beneficiary.status === 1 ||
                              beneficiary.active_status === 1 ? (
                                <FaEye size={16} />
                              ) : (
                                <FaEyeSlash size={16} />
                              )}
                            </button>
                            <span
                              className={`ml-2 px-3 py-1 text-xs font-semibold rounded-full ${
                                beneficiary.status === 1 ||
                                beneficiary.active_status === 1
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {beneficiary.status === 1 ||
                              beneficiary.active_status === 1
                                ? "Visible"
                                : "Hidden"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-500">
                          {formatDate(beneficiary.created_at)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewBankDetails(beneficiary)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              title="View Bank Details"
                            >
                              <FaUniversity size={16} />
                            </button>
                            <button
                              onClick={() => handleEditBeneficiary(beneficiary)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors duration-200"
                              title="Edit"
                            >
                              <FaEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(beneficiary)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Delete"
                            >
                              <FaTrash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination or footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="text-sm text-gray-500 mb-4 md:mb-0">
                    Showing {filteredBeneficiaries.length} of{" "}
                    {beneficiariesCount} beneficiaries
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Page 1 of 1
                    </span>
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bank Details Popup - FIXED: Now passing correct props */}
      {showBankDetails && selectedBeneficiary && (
        <BankDetailsPopup
          beneficiaryId={selectedBeneficiary.id}
          beneficiaryName={selectedBeneficiary.name}
          onClose={handleCloseBankDetails}
        />
      )}

      {/* Delete Confirmation Modal - Pass customerId as prop */}
      <DeleteConfirmationModal customerId={customerId} />

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

Beneficiaries.propTypes = {
  mode: PropTypes.oneOf(["list", "create", "edit"]),
};

Beneficiaries.defaultProps = {
  mode: "list",
};

export default Beneficiaries;