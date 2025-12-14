import React, { useEffect, useState, useRef } from "react";
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
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowLeft,
  FaChevronRight,
  FaChevronLeft,
  FaPhone,
} from "react-icons/fa";

const Beneficiaries = ({ mode = "list" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const params = useParams();

  // Add useRef to track mounted state
  const isMounted = useRef(true);

  // Get customerId from params or location state
  const customerId = params.customerId || location.state?.customerId || localStorage.getItem("currentCustomerId");

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

  // Local states
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [showDeleteModalLocal, setShowDeleteModalLocal] = useState(false);
  const [beneficiaryToDelete, setBeneficiaryToDelete] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState([]);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  // Cleanup function
  useEffect(() => {
    return () => {
      isMounted.current = false;
      dispatch(clearError());
      dispatch(clearSuccess());
    };
  }, [dispatch]);

  // Fetch beneficiaries on component mount
  useEffect(() => {
    if (customerId && isMounted.current) {
      console.log("🔍 Beneficiaries Component mounted with customerId:", customerId);
      dispatch(fetchBeneficiaries(customerId));
    }
  }, [dispatch, customerId]);

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

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    dispatch(setSearchQuery(value));
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchInput("");
    dispatch(setSearchQuery(""));
  };

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
      state: { customerId, beneficiaryData: beneficiary }
    });
  };

  // Show bank details popup
  const handleViewBankDetails = (beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setShowBankDetails(true);
  };

  // Handle delete confirmation
  const handleDeleteClick = (beneficiary) => {
    setBeneficiaryToDelete(beneficiary);
    setShowDeleteModalLocal(true);
    // Also dispatch to Redux modal state if needed
    dispatch(showDeleteModal(beneficiary));
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (beneficiaryToDelete && customerId) {
      setIsLoading(true);
      try {
        await dispatch(deleteBeneficiary({
          customerId,
          beneficiaryId: beneficiaryToDelete.id
        })).unwrap();
        
        toast.success("Beneficiary deleted successfully!");
        // Refresh the list
        dispatch(fetchBeneficiaries(customerId));
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

  // Toggle beneficiary visibility
  const handleToggleVisibility = async (beneficiaryId) => {
    if (customerId) {
      try {
        await dispatch(toggleBeneficiaryVisibility({
          customerId,
          beneficiaryId
        })).unwrap();
        
        // Refresh the list
        dispatch(fetchBeneficiaries(customerId));
      } catch (error) {
        toast.error(error.message || "Failed to toggle visibility");
      }
    }
  };

  // Handle beneficiary selection for bulk actions
  const handleBeneficiarySelect = (beneficiaryId) => {
    setSelectedBeneficiaries(prev => {
      if (prev.includes(beneficiaryId)) {
        return prev.filter(id => id !== beneficiaryId);
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
      setSelectedBeneficiaries(filteredBeneficiaries.map(b => b.id));
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
        // Delete each selected beneficiary
        for (const beneficiaryId of selectedBeneficiaries) {
          await dispatch(deleteBeneficiary({
            customerId,
            beneficiaryId
          })).unwrap();
        }
        
        toast.success(`${selectedBeneficiaries.length} beneficiary(ies) deleted successfully!`);
        
        // Clear selection and refresh list
        setSelectedBeneficiaries([]);
        dispatch(fetchBeneficiaries(customerId));
      } catch (error) {
        toast.error(error.message || "Failed to delete beneficiaries");
      } finally {
        setIsLoading(false);
        setShowBulkDelete(false);
      }
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
      day: "numeric"
    });
  };

  // Loading overlay
  if (loading) {
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Customer ID Missing</h2>
          <p className="text-gray-600 mb-6">Please navigate to this page through the proper route.</p>
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
      {/* Loading overlay */}
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
                    <p className="text-2xl font-bold text-gray-800">{beneficiariesCount}</p>
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

            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <FaSearch />
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={handleSearchChange}
                  placeholder="Search beneficiaries by name, phone, or email..."
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchInput && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
              
              <button
                onClick={handleToggleFilter}
                className={`px-6 py-3 rounded-xl flex items-center transition-all duration-300 ${
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
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300 flex items-center"
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
          {filteredBeneficiaries.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center">
                <FaUser className="text-gray-300 text-6xl mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No Beneficiaries Found
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
                            checked={selectedBeneficiaries.length === filteredBeneficiaries.length}
                            onChange={handleSelectAll}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="ml-3 text-sm font-semibold text-gray-700">Select</span>
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
                            checked={selectedBeneficiaries.includes(beneficiary.id)}
                            onChange={() => handleBeneficiarySelect(beneficiary.id)}
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
                            {beneficiary.country_id || "N/A"}
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
                              onClick={() => handleToggleVisibility(beneficiary.id)}
                              className={`p-2 rounded-full ${
                                beneficiary.status === 1 || beneficiary.active_status === 1
                                  ? "text-green-600 hover:bg-green-50"
                                  : "text-gray-400 hover:bg-gray-100"
                              }`}
                            >
                              {beneficiary.status === 1 || beneficiary.active_status === 1 ? (
                                <FaEye size={16} />
                              ) : (
                                <FaEyeSlash size={16} />
                              )}
                            </button>
                            <span className={`ml-2 px-3 py-1 text-xs font-semibold rounded-full ${
                              beneficiary.status === 1 || beneficiary.active_status === 1
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {beneficiary.status === 1 || beneficiary.active_status === 1 ? "Visible" : "Hidden"}
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
                    Showing {filteredBeneficiaries.length} of {beneficiariesCount} beneficiaries
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">Page 1 of 1</span>
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

      {/* Bank Details Popup */}
      {showBankDetails && selectedBeneficiary && (
        <BankDetailsPopup
          beneficiary={selectedBeneficiary}
          onClose={handleCloseBankDetails}
        />
      )}

      {/* Delete Confirmation Modal */}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center text-red-600 mb-4">
              <FaExclamationTriangle className="mr-3" size={24} />
              <h3 className="text-xl font-bold">Confirm Bulk Delete</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedBeneficiaries.length} selected beneficiary(ies)?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
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