// Beneficiaries.jsx - UPDATED WITH CACHE-AWARE FETCHING

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { RingLoader } from "react-spinners";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import PropTypes from "prop-types";

// Import from BeneficiariesSlice with caching
import {
  // Async Thunks
  createAndAddBeneficiary,
  fetchBeneficiaries,
  deleteBeneficiary,
  toggleBeneficiaryVisibility,

  // Actions
  clearError,
  clearSuccess,
  clearCreateState,
  setSearchQuery,
  setFilterVisibility,
  invalidateBeneficiariesCache,
  clearCache,

  // Core Selectors
  selectBeneficiaries,
  selectBeneficiariesLoading,
  selectBeneficiariesError,
  selectBeneficiariesSuccess,
  selectHasFetched,
  selectLastFetched,

  // Create State Selectors (individual selectors only - selectCreateState does NOT exist)
  selectCreateLoading,
  selectCreateError,
  selectCreateSuccess,
  selectLastCreatedId,

  // Search/Filter Selectors
  selectSearchQuery,
  selectFilterVisibility,
  selectFilteredBeneficiaries,

  // Utility Selectors
  selectVisibleBeneficiaries,
  selectBeneficiariesCount,
} from "../MyBeneficiaries/BeneficiariesSlice";

// Import ModalSlice actions
import { showDeleteModal, showBulkDeleteModal } from "./ModalSlice";

import BeneficiaryDetailsPopup from "../../../components/PopupModal/BeneficiaryDetailsPopup";

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
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowLeft,
  FaPhone,
  FaEnvelope,
  FaUserCircle,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaIdCard,
  FaGlobe,
  FaWhatsapp,
  FaTelegram,
  FaCopy,
  FaChevronLeft,
  FaChevronRight,
  FaDatabase,
  FaSync,
} from "react-icons/fa";

const Beneficiaries = ({ mode = "list" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const params = useParams();

  // Add useRef to track mounted state
  const isMounted = useRef(true);
  const isInitialMount = useRef(true);

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
  const hasFetched = useSelector(selectHasFetched);
  const lastFetched = useSelector(selectLastFetched);
  const createLoading = useSelector(selectCreateLoading);
  const createError = useSelector(selectCreateError);
  const createSuccess = useSelector(selectCreateSuccess);
  const lastCreatedId = useSelector(selectLastCreatedId);

  // Local states
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModalLocal, setShowDeleteModalLocal] = useState(false);
  const [beneficiaryToDelete, setBeneficiaryToDelete] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState([]);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const [selectedBeneficiaryDetails, setSelectedBeneficiaryDetails] =
    useState(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search timeout ref
  const searchTimeoutRef = useRef(null);

  // Format last fetched time
  const getLastFetchedDisplay = useCallback(() => {
    if (!lastFetched) return "Never";
    const diff = Date.now() - new Date(lastFetched).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }, [lastFetched]);

  // Combined cleanup function for component unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;

      // Clear any pending timeouts
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      setIsSearching(false);

      // Don't clear error/success on unmount to maintain state across navigations
      // dispatch(clearError());
      // dispatch(clearSuccess());
    };
  }, [dispatch]);

  // Fetch beneficiaries on component mount with cache awareness
  useEffect(() => {
    if (!customerId || !isMounted.current) return;

    const loadBeneficiaries = async () => {
      try {
        // Check if we have valid cached data
        const hasValidCache =
          hasFetched &&
          lastFetched &&
          Date.now() - new Date(lastFetched).getTime() < 5 * 60 * 1000;

        if (hasValidCache && beneficiaries.length > 0) {
          console.log("📦 Using cached beneficiaries data");
          return;
        }

        console.log("🌐 Fetching beneficiaries from API");
        await dispatch(
          fetchBeneficiaries({ customerId, forceRefresh: false }),
        ).unwrap();
      } catch (error) {
        if (isMounted.current) {
          toast.error("Failed to load beneficiaries");
        }
      }
    };

    loadBeneficiaries();
  }, [dispatch, customerId, hasFetched, lastFetched, beneficiaries.length]);

  // Handle create success from navigation
  useEffect(() => {
    if (createSuccess && lastCreatedId && isMounted.current) {
      toast.success("Beneficiary created successfully!");
      dispatch(fetchBeneficiaries({ customerId, forceRefresh: true }));
      dispatch(clearCreateState());
    }
  }, [createSuccess, lastCreatedId, customerId, dispatch]);

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    if (!customerId) return;

    setIsRefreshing(true);
    try {
      await dispatch(
        fetchBeneficiaries({ customerId, forceRefresh: true }),
      ).unwrap();
      toast.success("Beneficiaries refreshed successfully!");
    } catch (error) {
      toast.error("Failed to refresh beneficiaries");
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch, customerId]);

  // Handle clear cache
  const handleClearCache = useCallback(() => {
    dispatch(clearCache());
    toast.info("Cache cleared. Data will be reloaded on next visit.");
  }, [dispatch]);

  // Sync search input with Redux search query
  useEffect(() => {
    setSearchInput(searchQuery || "");
    setIsSearching(false);
  }, [searchQuery]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
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

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBeneficiaries.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredBeneficiaries.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    document.getElementById("beneficiaries-list")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleViewDetails = (beneficiary) => {
    setSelectedBeneficiaryDetails(beneficiary);
    setShowDetailsPopup(true);
  };

  const handleCloseDetailsPopup = () => {
    setShowDetailsPopup(false);
    setSelectedBeneficiaryDetails(null);
  };

  // Handle search input changes with debounce
  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchInput(value);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (value.trim()) {
        setIsSearching(true);
      } else {
        setIsSearching(false);
      }

      searchTimeoutRef.current = setTimeout(() => {
        dispatch(setSearchQuery(value));
        setIsSearching(false);
      }, 300);
    },
    [dispatch],
  );

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    dispatch(setSearchQuery(""));
    setIsSearching(false);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  }, [dispatch]);

  // Toggle filter visibility
  const handleToggleFilter = () => {
    if (window.innerWidth < 768) {
      setIsMobileFilterOpen(!isMobileFilterOpen);
    } else {
      dispatch(setFilterVisibility(!filterVisibility));
    }
  };

  const handleCloseMobileFilter = () => {
    setIsMobileFilterOpen(false);
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

  // Handle delete confirmation
  const handleDeleteClick = (beneficiary) => {
    setBeneficiaryToDelete(beneficiary);
    setShowDeleteModalLocal(true);
    dispatch(showDeleteModal(beneficiary));
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (beneficiaryToDelete && customerId) {
      setIsLoading(true);
      try {
        await dispatch(
          deleteBeneficiary({
            customerId,
            beneficiaryId: beneficiaryToDelete.id,
          }),
        ).unwrap();

        toast.success("Beneficiary deleted successfully!");
        // Refresh with cache invalidation
        await dispatch(fetchBeneficiaries({ customerId, forceRefresh: true }));
      } catch (error) {
        toast.error(error.message || "Failed to delete beneficiary");
      } finally {
        setIsLoading(false);
        setShowDeleteModalLocal(false);
        setBeneficiaryToDelete(null);
      }
    }
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setShowDeleteModalLocal(false);
    setBeneficiaryToDelete(null);
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

  // Handle select all for current page
  const handleSelectAll = () => {
    const currentPageIds = currentItems.map((b) => b.id);
    const allSelected = currentPageIds.every((id) =>
      selectedBeneficiaries.includes(id),
    );

    if (allSelected) {
      setSelectedBeneficiaries((prev) =>
        prev.filter((id) => !currentPageIds.includes(id)),
      );
    } else {
      setSelectedBeneficiaries((prev) => [
        ...new Set([...prev, ...currentPageIds]),
      ]);
    }
  };

  // Handle bulk delete
  const handleBulkDeleteClick = () => {
    if (selectedBeneficiaries.length > 0) {
      setShowBulkDelete(true);
      dispatch(showBulkDeleteModal(selectedBeneficiaries.length));
    } else {
      toast.warning("Please select at least one beneficiary to delete");
    }
  };

  // Confirm bulk delete
  const handleConfirmBulkDelete = async () => {
    if (selectedBeneficiaries.length > 0 && customerId) {
      setIsLoading(true);
      try {
        for (const beneficiaryId of selectedBeneficiaries) {
          await dispatch(
            deleteBeneficiary({
              customerId,
              beneficiaryId,
            }),
          ).unwrap();
        }

        toast.success(
          `${selectedBeneficiaries.length} beneficiary(ies) deleted successfully!`,
        );

        setSelectedBeneficiaries([]);
        // Refresh with cache invalidation
        await dispatch(fetchBeneficiaries({ customerId, forceRefresh: true }));
      } catch (error) {
        toast.error(error.message || "Failed to delete beneficiaries");
      } finally {
        setIsLoading(false);
        setShowBulkDelete(false);
      }
    }
  };

  // Navigate back
  const handleGoBack = () => {
    navigate(-1);
  };

  // Format date helper
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
    loading && !hasFetched && beneficiaries.length === 0;

  // Loading overlay for initial load
  if (showInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center p-6">
          <RingLoader size={60} color="#3B82F6" />
          <p className="mt-4 text-gray-600 font-medium">
            Loading beneficiaries...
          </p>
        </div>
      </div>
    );
  }

  // Check if customerId exists
  if (!customerId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center p-6 bg-white rounded-2xl shadow-xl max-w-md w-full">
          <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
            Customer ID Missing
          </h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            Please navigate to this page through the proper route.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
      {/* Loading overlay for actions */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center mx-4">
            <RingLoader size={50} color="#3B82F6" />
            <p className="mt-4 text-gray-700 font-medium">Processing...</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto" id="beneficiaries-list">
        {/* Header */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden mb-4 sm:mb-6 md:mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="p-2 sm:p-3 bg-white/20 rounded-xl mr-3 sm:mr-4">
                    <FaMoneyBillWave className="text-white text-xl sm:text-2xl" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                      My Beneficiaries
                    </h1>
                    <p className="text-blue-100 text-xs sm:text-sm mt-1">
                      Manage your beneficiaries for sending money
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {/* Cache Status Indicator */}
                <div className="hidden md:flex items-center bg-blue-500/20 rounded-lg px-3 py-2 text-white text-xs">
                  <FaDatabase className="mr-1" size={12} />
                  <span>Cache: {getLastFetchedDisplay()}</span>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center text-white hover:text-blue-100 transition-colors duration-200 bg-blue-500 hover:bg-blue-600 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base disabled:opacity-50"
                >
                  <FaSync
                    className={`mr-2 text-sm sm:text-base ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>

                <button
                  onClick={handleGoBack}
                  className="flex items-center text-white hover:text-blue-100 transition-colors duration-200 bg-blue-500 hover:bg-blue-600 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base w-full sm:w-auto justify-center"
                >
                  <FaArrowLeft className="mr-2 text-sm sm:text-base" />
                  Back
                </button>
              </div>
            </div>
          </div>

          {/* Stats and Actions */}
          <div className="p-4 sm:p-6 bg-white">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
              <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border border-blue-200">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 text-blue-600 mr-2 sm:mr-3">
                    <FaUser size={16} className="sm:text-xl" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Total</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-800">
                      {beneficiariesCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-3 sm:p-4 rounded-xl border border-green-200">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 text-green-600 mr-2 sm:mr-3">
                    <FaCheckCircle size={16} className="sm:text-xl" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Active</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-800">
                      {visibleBeneficiaries.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-3 sm:p-4 rounded-xl border border-purple-200">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-100 text-purple-600 mr-2 sm:mr-3">
                    <FaDatabase size={16} className="sm:text-xl" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Cache Status
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {hasFetched ? "Cached" : "Not Cached"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-span-2 lg:col-span-1">
                <button
                  onClick={handleAddBeneficiary}
                  className="w-full h-full flex items-center justify-center p-3 sm:p-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white transition-all duration-300 shadow-md hover:shadow-lg text-sm sm:text-base"
                >
                  <FaPlus className="mr-2 sm:text-xl" size={16} />
                  <span className="font-semibold whitespace-nowrap">
                    Add New Beneficiary
                  </span>
                </button>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-1 relative">
                <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  {isSearching ? (
                    <RingLoader size={16} color="#3B82F6" />
                  ) : (
                    <FaSearch size={14} className="sm:text-base" />
                  )}
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={handleSearchChange}
                  placeholder="Search by name, phone, or email..."
                  className="w-full pl-9 sm:pl-12 pr-9 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading && !hasFetched}
                />
                {searchInput && !isSearching && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    type="button"
                  >
                    <FaTimes size={14} className="sm:text-base" />
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                {selectedBeneficiaries.length > 0 && (
                  <button
                    onClick={handleBulkDeleteClick}
                    disabled={isLoading}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300 flex items-center justify-center text-sm sm:text-base disabled:opacity-50"
                  >
                    <FaTrash className="mr-2 text-sm sm:text-base" />
                    <span className="hidden xs:inline">Delete </span>(
                    {selectedBeneficiaries.length})
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Filter Panel */}
            {filterVisibility && !isMobileFilterOpen && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-4 sm:mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      Beneficiary Type
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">All Types</option>
                      <option value="individual">Individual</option>
                      <option value="institution">Institution</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Filter Drawer */}
            {isMobileFilterOpen && (
              <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end justify-center">
                <div className="bg-white rounded-t-2xl w-full max-w-md animate-slide-up">
                  <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">
                      Filter Beneficiaries
                    </h3>
                    <button
                      onClick={handleCloseMobileFilter}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  <div className="p-4 space-y-4">
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
                        Beneficiary Type
                      </label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">All Types</option>
                        <option value="individual">Individual</option>
                        <option value="institution">Institution</option>
                      </select>
                    </div>
                    <button
                      onClick={handleCloseMobileFilter}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Beneficiaries List */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden">
          {loading && !hasFetched ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="flex flex-col items-center">
                <RingLoader size={40} color="#3B82F6" />
                <p className="mt-4 text-gray-600">Loading beneficiaries...</p>
              </div>
            </div>
          ) : filteredBeneficiaries.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FaUser className="text-gray-300 text-4xl sm:text-5xl" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
                  {searchQuery ? "No Results Found" : "No Beneficiaries Found"}
                </h3>
                <p className="text-gray-500 mb-6 text-sm sm:text-base text-center max-w-md">
                  {searchQuery
                    ? `No beneficiaries found matching "${searchQuery}"`
                    : "You haven't added any beneficiaries yet."}
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleAddBeneficiary}
                    className="px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg text-sm sm:text-base"
                  >
                    <FaPlus className="inline mr-2" />
                    Add Your First Beneficiary
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-4 px-6">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={
                              currentItems.length > 0 &&
                              currentItems.every((b) =>
                                selectedBeneficiaries.includes(b.id),
                              )
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
                        Beneficiary
                      </th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                        Contact
                      </th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                        Added On
                      </th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentItems.map((beneficiary) => (
                      <tr
                        key={beneficiary.id}
                        className="hover:bg-gray-50 transition-colors duration-150 group"
                      >
                        <td className="py-4 px-6">
                          <input
                            type="checkbox"
                            checked={selectedBeneficiaries.includes(
                              beneficiary.id,
                            )}
                            onChange={() =>
                              handleBeneficiarySelect(beneficiary.id)
                            }
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {beneficiary.name?.charAt(0) || "?"}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {beneficiary.name || "N/A"}
                              </div>
                              <div className="text-xs text-gray-500 capitalize">
                                {beneficiary.relationtobenef || "No relation"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-900 flex items-center">
                            <FaPhone className="mr-2 text-gray-400 text-xs" />
                            {beneficiary.phone_number || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <FaEnvelope className="mr-2 text-gray-400 text-xs" />
                            {beneficiary.email || "N/A"}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-900 flex items-center">
                            <FaCalendarAlt className="mr-2 text-gray-400 text-xs" />
                            {formatDate(beneficiary.created_at)}
                          </div>
                          <div className="text-xs text-gray-500 capitalize mt-1">
                            {beneficiary.beneftype || "Individual"}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewDetails(beneficiary)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                              title="View Full Details"
                            >
                              <FaInfoCircle size={16} />
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

              {/* Mobile Cards */}
              <div className="md:hidden">
                {currentItems.map((beneficiary) => (
                  <div
                    key={beneficiary.id}
                    className="border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedBeneficiaries.includes(
                            beneficiary.id,
                          )}
                          onChange={() =>
                            handleBeneficiarySelect(beneficiary.id)
                          }
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mt-1"
                        />
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {beneficiary.name?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {beneficiary.name || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {beneficiary.relationtobenef || "No relation"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3 ml-8 space-y-2">
                      <div className="flex items-center text-sm">
                        <FaPhone
                          className="text-gray-400 mr-2 flex-shrink-0"
                          size={12}
                        />
                        <span className="text-gray-600 break-all">
                          {beneficiary.phone_number || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <FaEnvelope
                          className="text-gray-400 mr-2 flex-shrink-0"
                          size={12}
                        />
                        <span className="text-gray-600 break-all">
                          {beneficiary.email || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <FaCalendarAlt
                          className="text-gray-400 mr-2 flex-shrink-0"
                          size={12}
                        />
                        <span className="text-gray-600">
                          Added: {formatDate(beneficiary.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <FaUserCircle
                          className="text-gray-400 mr-2 flex-shrink-0"
                          size={12}
                        />
                        <span className="text-gray-600 capitalize">
                          Type: {beneficiary.beneftype || "Individual"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100 ml-8">
                      <button
                        onClick={() => handleViewDetails(beneficiary)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                        title="View Full Details"
                      >
                        <FaInfoCircle size={16} />
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
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                      Showing {indexOfFirstItem + 1} to{" "}
                      {Math.min(indexOfLastItem, filteredBeneficiaries.length)}{" "}
                      of {filteredBeneficiaries.length} beneficiaries
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <FaChevronLeft size={12} />
                      </button>
                      {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = idx + 1;
                        } else if (currentPage <= 3) {
                          pageNum = idx + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + idx;
                        } else {
                          pageNum = currentPage - 2 + idx;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              currentPage === pageNum
                                ? "bg-blue-600 text-white"
                                : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <FaChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals and Popups */}
      {showDetailsPopup && selectedBeneficiaryDetails && (
        <BeneficiaryDetailsPopup
          beneficiary={selectedBeneficiaryDetails}
          onClose={handleCloseDetailsPopup}
        />
      )}

      {showDeleteModalLocal && beneficiaryToDelete && (
        <DeleteConfirmationModal
          isOpen={showDeleteModalLocal}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          beneficiaryName={beneficiaryToDelete.name}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center text-red-600 mb-4">
              <FaExclamationTriangle className="mr-3" size={24} />
              <h3 className="text-lg sm:text-xl font-bold">
                Confirm Bulk Delete
              </h3>
            </div>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              Are you sure you want to delete {selectedBeneficiaries.length}{" "}
              selected beneficiary(ies)? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => setShowBulkDelete(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        position="bottom-right"
        autoClose={1000}
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