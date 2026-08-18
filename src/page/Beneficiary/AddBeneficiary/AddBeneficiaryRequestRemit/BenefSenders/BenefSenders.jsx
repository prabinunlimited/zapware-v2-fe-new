import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  FaEye,
  FaSpinner,
  FaSearch,
  FaPiggyBank,
  FaArrowLeft,
  FaSave,
  FaExclamationTriangle,
  FaPlus,
  FaUser,
  FaTrash,
} from "react-icons/fa";
import {
  AiOutlineUser,
  AiOutlineMail,
  AiOutlinePhone,
  AiOutlineInfoCircle,
} from "react-icons/ai";
import { FiUsers, FiUserPlus } from "react-icons/fi";
import { HiOutlineUserGroup } from "react-icons/hi";
import { useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import { usePartnerConfig } from "../../../../../hooks/usePartnerConfig";

const API_URL = import.meta.env.VITE_API_URL;

// Custom Hooks
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const useApi = () => {
  const apiCall = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem("authtoken");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (response.redirected && response.url.includes("/login")) {
      throw new Error("Authentication failed: Redirected to login");
    }

    if (response.status === 302) {
      const location = response.headers.get("location");
      if (location && location.includes("/login")) {
        throw new Error("Authentication failed: Session expired");
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed: Please log in again");
      }
      const result = await response.json().catch(() => ({}));
      throw new Error(
        result.message ||
        result.error ||
        `Request failed with status ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  }, []);

  return { apiCall };
};

const SkeletonLoader = () => {
  return (
    <div className="bg-white shadow-2xs rounded-2xl border border-gray-200 py-16 px-4 flex flex-col items-center justify-center text-center">
      <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="text-sm font-semibold text-gray-800">Fetching senders...</p>
      <p className="text-xs text-gray-400 mt-0.5">Please wait a moment</p>
    </div>
  );
};

const DeleteConfirmationModal = ({
  show,
  onClose,
  onConfirm,
  message,
  isLoading,
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex justify-center items-center bg-gray-900/60 z-50 p-4 backdrop-blur-xs"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Confirm Action
            </h2>
            <p className="text-gray-600 text-center text-sm mb-6">
              {message ||
                "Do you really want to proceed? This action cannot be undone."}
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={onClose}
                className="w-full sm:flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold text-xs sm:text-sm cursor-pointer"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="w-full sm:flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold text-xs sm:text-sm flex items-center justify-center cursor-pointer shadow-2xs"
                disabled={isLoading}
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin mr-2 text-xs" />
                ) : null}
                {isLoading ? "Removing..." : "Yes, Remove"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Add Sender Modal Component
const AddSenderModal = ({ show, onClose, onAddSender, isLoading = false }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { apiCall } = useApi();

  // Reset state whenever modal is opened or closed
  useEffect(() => {
    if (!show) {
      setSearchQuery("");
      setSearchResults([]);
      setHasSearched(false);
      setSearchLoading(false);
    }
  }, [show]);

  // Handle typing: update query and reset previous search results immediately
  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    setSearchResults([]);
    setHasSearched(false);
  };

  // Search function - called when button is clicked or Enter is pressed
  const handleSearch = async () => {
    const query = searchQuery.trim();

    if (query.length < 3) {
      toast.warning("Please type at least 3 characters to search");
      return;
    }

    setSearchLoading(true);
    setHasSearched(true);

    let searchType = "name";
    if (query.includes("@")) {
      searchType = "email";
    } else if (/^[\+]?[0-9\s\-()]+$/.test(query)) {
      searchType = "mobile";
    }

    try {
      const result = await apiCall(`${API_URL}/beneficiaries/customer/search`, {
        method: "POST",
        body: JSON.stringify({
          customer_type: searchType,
          query: query,
        }),
      });

      if (result.customers_data && Array.isArray(result.customers_data)) {
        setSearchResults(result.customers_data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error(error.message || "Search failed");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleAddSender = (customer) => {
    onAddSender(customer);
  };

  const handleClear = () => {
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    setSearchLoading(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-900/60 z-50 p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Add Sender
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer p-1"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="mb-4 flex-shrink-0">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Search Customers
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  onClick={handleSearch}
                  disabled={searchLoading || searchQuery.trim().length < 3}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs flex-shrink-0"
                >
                  {searchLoading ? (
                    <FaSpinner className="animate-spin text-xs" />
                  ) : (
                    <FaSearch size={12} />
                  )}
                  <span>Search</span>
                </button>
              </div>
              {searchQuery && (
                <button
                  onClick={handleClear}
                  className="text-xs text-gray-400 hover:text-gray-600 mt-1 cursor-pointer"
                >
                  Clear
                </button>
              )}
              <p className="text-[11px] text-gray-400 mt-1">
                Type at least 3 characters, then click Search
              </p>
            </div>

            <div className="border border-gray-100 rounded-xl flex-1 overflow-y-auto min-h-[150px] divide-y divide-gray-100 bg-gray-50/40">
              {searchLoading ? (
                <div className="flex justify-center items-center py-8 text-gray-500 text-xs gap-2">
                  <FaSpinner className="animate-spin text-blue-600 text-sm" />
                  <span>Searching...</span>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-3 hover:bg-white transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                        {customer.first_name} {customer.last_name}
                      </h3>
                      <p className="text-[11px] text-gray-500 truncate">
                        {customer.email}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {customer.full_mobile_number}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddSender(customer)}
                      disabled={isLoading}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 cursor-pointer shadow-2xs"
                    >
                      {isLoading ? (
                        <FaSpinner className="animate-spin text-xs" />
                      ) : (
                        <FaPlus size={10} />
                      )}
                      <span>Add</span>
                    </button>
                  </div>
                ))
              ) : hasSearched ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No customers found
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs">
                  Type a name or email, then click Search
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 cursor-pointer"
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Main Component
const BeneficiarySenders = () => {
  const [authToken] = useState(localStorage.getItem("authtoken"));
  const [beneficiaries, setBeneficiaries] = useState([]);

  const { beneficiaryId, benefId: routeBenefId } = useParams();
  const benefId = routeBenefId || beneficiaryId;

  const customerId = localStorage.getItem("authcustomer_id");
  const [showModal, setShowModal] = useState(false);
  const [showAddSenderModal, setShowAddSenderModal] = useState(false);
  const [beneficiaryToDelete, setBeneficiaryToDelete] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addingSender, setAddingSender] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [saveLoadingId, setSaveLoadingId] = useState(null);

  const { apiCall } = useApi();
  const config = usePartnerConfig(authToken);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterVisibility, setFilterVisibility] = useState("all");

  const headerColor =
    config?.header_color || localStorage.getItem("header_color");
  const textColor = config?.text_color || localStorage.getItem("text_color");

  const beneficiariesPerPage = 10;

  const headerColorProps = useMemo(() => {
    if (headerColor && headerColor.startsWith("bg-")) {
      return { className: headerColor };
    } else if (headerColor && headerColor.startsWith("#")) {
      return { style: { backgroundColor: headerColor } };
    }
    return { className: "bg-blue-600" };
  }, [headerColor]);

  const textColorProps = useMemo(() => {
    if (textColor && textColor.startsWith("text-")) {
      return { className: textColor };
    } else if (textColor && textColor.startsWith("#")) {
      return { style: { color: textColor } };
    }
    return {};
  }, [textColor]);

  // Data fetching
  const fetchBeneficiaries = useCallback(async () => {
    if (!benefId) return;

    setLoading(true);

    try {
      const result = await apiCall(
        `${API_URL}/beneficiaries/senders/${benefId}`
      );

      if (
        result.getbenefsendersacctobeneficiaryid_data &&
        Array.isArray(result.getbenefsendersacctobeneficiaryid_data)
      ) {
        const filteredSenders =
          result.getbenefsendersacctobeneficiaryid_data.filter(
            (sender) => sender.beneficiary_id === parseInt(benefId)
          );

        const sendersWithVisibility = filteredSenders.map((sender) => ({
          id: sender.id,
          name: `${sender.customer?.first_name || ""} ${sender.customer?.middle_name || ""
            } ${sender.customer?.last_name || ""}`.trim(),
          email: sender.customer?.email,
          full_phone_number: sender.customer?.full_mobile_number,
          street:
            sender.customer?.street_address_1 ||
            sender.customer?.street_address_2 ||
            "Not Available",
          customer_id: sender.customer_id,
          beneficiary_id: sender.beneficiary_id,
          relationtobenef: "Sender",
          isVisible: true,
        }));

        setBeneficiaries(sendersWithVisibility);
      } else {
        setBeneficiaries([]);
      }
    } catch (error) {
      console.error("Error fetching senders:", error);
      toast.error(error.message || "Failed to load senders");
      setBeneficiaries([]);
    } finally {
      setLoading(false);
    }
  }, [benefId, apiCall]);

  useEffect(() => {
    const token = localStorage.getItem("authtoken");
    if (token && benefId) {
      fetchBeneficiaries();
    }
  }, [benefId, fetchBeneficiaries]);

  // Add Sender
  const handleAddSender = async (customer) => {
    setAddingSender(true);

    try {
      await apiCall(`${API_URL}/beneficiaries/create-benef-sender`, {
        method: "POST",
        body: JSON.stringify({
          customer_id: customer.id,
          beneficiary_id: benefId,
        }),
      });

      toast.success("Sender added successfully!");
      fetchBeneficiaries();
      setShowAddSenderModal(false);
    } catch (error) {
      console.error("Error adding sender:", error);
      if (
        error.message.includes("already exists") ||
        error.message.includes("duplicate")
      ) {
        toast.error("This sender is already associated with the beneficiary");
      } else {
        toast.error(error.message || "Failed to add sender");
      }
    } finally {
      setAddingSender(false);
    }
  };

  const displayedBeneficiaries = beneficiaries;

  const filteredBeneficiaries = useMemo(() => {
    if (!displayedBeneficiaries) return [];

    return displayedBeneficiaries.filter((beneficiary) => {
      // Visibility filter
      const matchesVisibilityFilter =
        filterVisibility === "all" ||
        (filterVisibility === "visible" && beneficiary.isVisible) ||
        (filterVisibility === "hidden" && !beneficiary.isVisible);

      // Client-side search filter
      const searchTerm = searchQuery.toLowerCase().trim().replace(/\s+/g, " ");
      if (!searchTerm) return matchesVisibilityFilter;

      const normalizedName = (beneficiary.name || "").toLowerCase().replace(/\s+/g, " ");
      const normalizedEmail = (beneficiary.email || "").toLowerCase();
      const normalizedPhone = (beneficiary.full_phone_number || "").toLowerCase();

      // Check if full string matches, OR all typed words match somewhere in the name
      const searchWords = searchTerm.split(" ");
      const nameMatchesAllWords = searchWords.every((word) =>
        normalizedName.includes(word)
      );

      const matchesSearch =
        normalizedName.includes(searchTerm) ||
        nameMatchesAllWords ||
        normalizedEmail.includes(searchTerm) ||
        normalizedPhone.includes(searchTerm);

      return matchesVisibilityFilter && matchesSearch;
    });
  }, [displayedBeneficiaries, filterVisibility, searchQuery]);

  const paginatedBeneficiaries = useMemo(() => {
    const indexOfLastBeneficiary = currentPage * beneficiariesPerPage;
    const indexOfFirstBeneficiary =
      indexOfLastBeneficiary - beneficiariesPerPage;
    return filteredBeneficiaries.slice(
      indexOfFirstBeneficiary,
      indexOfLastBeneficiary
    );
  }, [filteredBeneficiaries, currentPage, beneficiariesPerPage]);

  const totalPages = Math.ceil(
    filteredBeneficiaries.length / beneficiariesPerPage
  );

  const toggleVisibility = useCallback((id) => {
    setBeneficiaries((prev) =>
      prev.map((beneficiary) =>
        beneficiary.id === id
          ? { ...beneficiary, isVisible: !beneficiary.isVisible }
          : beneficiary
      )
    );
  }, []);

  const handleDeleteClick = (senderId) => {
    setBeneficiaryToDelete(senderId);
    setDeleteMessage("Do you really want to remove this sender from this beneficiary?");
    setShowModal(true);
  };

  const deleteBeneficiary = useCallback(
    async (id) => {
      setIsDeleting(true);

      try {
        await apiCall(`${API_URL}/delete-beneficiary/${id}`, {
          method: "DELETE",
          body: JSON.stringify({
            customer_id: customerId,
            current_date_time: new Date()
              .toISOString()
              .replace("T", " ")
              .split(".")[0],
          }),
        });

        setBeneficiaries((prev) => prev.filter((benef) => benef.id !== id));
        toast.success("Sender removed successfully!");
        setShowModal(false);
        setBeneficiaryToDelete(null);
        setDeleteMessage("");
      } catch (error) {
        console.error("Error deleting sender:", error);
        toast.error(error.message || "Failed to remove sender");
      } finally {
        setIsDeleting(false);
      }
    },
    [apiCall, customerId]
  );

  const closeModal = useCallback(() => {
    setShowModal(false);
    setBeneficiaryToDelete(null);
    setDeleteMessage("");
  }, []);

  const confirmDelete = useCallback(() => {
    if (beneficiaryToDelete) {  
      deleteBeneficiary(beneficiaryToDelete);
    }
  }, [beneficiaryToDelete, deleteBeneficiary]);

  const handleSave = useCallback(
    async (customerIdFromSender) => {
      setSaveLoadingId(customerIdFromSender);

      try {
        await apiCall(`${API_URL}/beneficiaries/create-benef-sender`, {
          method: "POST",
          body: JSON.stringify({
            customer_id: customerIdFromSender,
            beneficiary_id: benefId,
          }),
        });

        toast.success("Sender saved successfully!");
        fetchBeneficiaries();
      } catch (error) {
        console.error("Save error:", error);
        toast.error(error.message || "Failed to save sender");
      } finally {
        setSaveLoadingId(null);
      }
    },
    [apiCall, benefId, fetchBeneficiaries]
  );

  const navigation = {
    handleRoute: () => navigate(`/addbenefbank/${benefId}`),
    goBack: () => navigate(-1),
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Render Mobile Cards View (< 768px)
  const renderMobileView = () => (
    <div className="space-y-3 p-3">
      {paginatedBeneficiaries.map((sender) => (
        <div
          key={sender.id}
          className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3"
        >
          {/* Header Row */}
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                <FaUser size={12} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                  {sender.isVisible ? sender.name : "••••••••••••"}
                </h3>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full inline-block border border-blue-100 mt-0.5">
                  {sender.isVisible ? "Sender" : "Hidden"}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => toggleVisibility(sender.id)}
                className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                title={sender.isVisible ? "Hide details" : "Show details"}
              >
                <FaEye size={12} />
              </button>
              <button
                onClick={() => handleSave(sender.customer_id)}
                disabled={saveLoadingId === sender.customer_id}
                className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer disabled:opacity-50"
                title="Save Sender"
              >
                {saveLoadingId === sender.customer_id ? (
                  <FaSpinner className="animate-spin text-xs" />
                ) : (
                  <FaSave size={12} />
                )}
              </button>
              {/* <button
                onClick={() => handleDeleteClick(sender.id)}
                className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="Remove Sender"
              >
                <FaTrash size={12} />
              </button> */}
            </div>
          </div>

          {/* Details Box */}
          <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400 text-[11px]">Phone:</span>
              <span className="font-semibold text-gray-700 truncate max-w-[180px]">
                {sender.isVisible ? sender.full_phone_number : "••••••••••"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-[11px]">Email:</span>
              <span className="font-semibold text-gray-700 truncate max-w-[180px]">
                {sender.isVisible ? sender.email || "Not Available" : "••••••••••"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-[11px]">Address:</span>
              <span className="font-semibold text-gray-700 truncate max-w-[180px]">
                {sender.isVisible ? sender.street || "Not Available" : "••••••••••"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Render Desktop Table (>= 768px)
  const renderDesktopView = () => (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
          <tr>
            <th className="py-3.5 px-6 text-left">Sender Name</th>
            <th className="py-3.5 px-6 text-left">Phone</th>
            <th className="py-3.5 px-6 text-left">Email</th>
            <th className="py-3.5 px-6 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white text-xs sm:text-sm">
          {paginatedBeneficiaries.map((sender) => (
            <tr
              key={sender.id}
              className="hover:bg-gray-50/60 transition-colors"
            >
              <td className="py-3.5 px-6 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center mr-3 border border-blue-100 text-blue-600">
                    <AiOutlineUser size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 truncate">
                      {sender.isVisible ? sender.name : "••••••••••••"}
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full inline-block border border-blue-100 mt-0.5">
                      {sender.isVisible ? "Visible" : "Hidden"}
                    </span>
                  </div>
                </div>
              </td>
              <td className="py-3.5 px-6 whitespace-nowrap text-gray-600">
                {sender.isVisible ? sender.full_phone_number : "••••••••••"}
              </td>
              <td className="py-3.5 px-6 whitespace-nowrap text-gray-600">
                {sender.isVisible ? sender.email || "Not Available" : "••••••••••"}
              </td>
              <td className="py-3.5 px-6 whitespace-nowrap">
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => toggleVisibility(sender.id)}
                    className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                    title={sender.isVisible ? "Hide" : "Show"}
                  >
                    <FaEye size={12} />
                  </button>
                  <button
                    onClick={() => handleSave(sender.customer_id)}
                    disabled={saveLoadingId === sender.customer_id}
                    className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer disabled:opacity-50"
                    title="Save Sender"
                  >
                    {saveLoadingId === sender.customer_id ? (
                      <FaSpinner className="animate-spin text-xs" />
                    ) : (
                      <FaSave size={12} />
                    )}
                  </button>
                  {/* <button
                    onClick={() => handleDeleteClick(sender.id)}
                    className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remove Sender"
                  >
                    <FaTrash size={12} />
                  </button> */}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-2xl shadow-2xs border border-gray-200 text-center">
      <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mb-3 text-blue-600 border border-blue-100">
        <FiUsers size={24} />
      </div>
      <h3 className="text-sm font-bold text-gray-900 mb-1">No senders found</h3>
      <p className="text-xs text-gray-500 max-w-sm mb-4">
        No one has sent money to this beneficiary yet.
      </p>
      <button
        onClick={() => setShowAddSenderModal(true)}
        className="bg-blue-600 text-white py-2 px-4 rounded-xl shadow-2xs flex items-center gap-1.5 text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
      >
        <FiUserPlus size={13} />
        <span>Add Sender</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl text-white ${headerColorProps?.className ?? "bg-blue-600"
                }`}
              style={headerColorProps?.style}
            >
              <HiOutlineUserGroup size={22} />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                Senders
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Customers associated with this beneficiary
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowAddSenderModal(true)}
              className="w-full sm:w-auto text-white py-2.5 px-4 rounded-xl shadow-2xs flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <FiUserPlus size={14} />
              <span>Add Sender</span>
            </button>
            {/* <button
              onClick={navigation.handleRoute}
              className="w-full sm:w-auto text-blue-600 border border-blue-200 bg-white py-2.5 px-4 rounded-xl shadow-2xs flex items-center justify-center gap-2 hover:bg-blue-50 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <FaPiggyBank size={14} />
              <span>Add Bank</span>
            </button> */}
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl shadow-2xs border border-gray-200 p-3.5 sm:p-5">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Search Senders
          </label>

          <div className="flex flex-col md:flex-row gap-3 items-center">
            {/* Input Box */}
            <div className="relative flex-1 min-w-0 w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" size={13} />
              </div>
              <input
                type="text"
                placeholder="Search by name, email or phone..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                className="block w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            {/* Clear Button */}
            {(searchQuery || filterVisibility !== "all") && (
              <div className="w-full md:w-auto flex-shrink-0">
                <button
                  onClick={() => {
                    handleClearSearch();
                    setFilterVisibility("all");
                  }}
                  className="w-full md:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* Helper text placed below the entire row */}
          <p className="text-[11px] text-gray-400 mt-1.5">
            Type to filter the list below
          </p>
        </div>

        {/* Content View */}
        {loading ? (
          <SkeletonLoader />
        ) : filteredBeneficiaries.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="bg-white shadow-2xs rounded-2xl overflow-hidden border border-gray-200">
            {/* Responsive: Mobile Cards & Desktop Table */}
            <div className="block md:hidden">{renderMobileView()}</div>
            <div className="hidden md:block">{renderDesktopView()}</div>

            {/* Pagination Footer */}
            {filteredBeneficiaries.length > 0 && (
              <div
                className={`px-4 py-3 bg-gray-50/50 border-t border-gray-200 text-xs flex items-center justify-between ${textColorProps?.className ?? "text-gray-500"
                  }`}
              >
                <div className="flex items-center text-gray-500">
                  <AiOutlineInfoCircle className="mr-1.5 text-blue-600" size={14} />
                  <span>
                    Showing{" "}
                    {Math.min(
                      currentPage * beneficiariesPerPage,
                      filteredBeneficiaries.length
                    )}{" "}
                    of {filteredBeneficiaries.length} sender(s)
                  </span>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1 || loading || searchLoading}
                      className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
                      aria-label="Previous page"
                    >
                      <FaArrowLeft size={10} />
                    </button>
                    <span className="text-xs font-semibold text-gray-700 px-1">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={
                        currentPage === totalPages || loading || searchLoading
                      }
                      className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
                      aria-label="Next page"
                    >
                      <FaArrowLeft size={10} className="rotate-180" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Back to Dashboard Button */}
        <div className="flex justify-center items-center pt-2">
          <button
            onClick={navigation.goBack}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-xs sm:text-sm font-semibold shadow-2xs cursor-pointer"
          >
            <FaArrowLeft size={11} />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Modals */}
        <AddSenderModal
          show={showAddSenderModal}
          onClose={() => setShowAddSenderModal(false)}
          onAddSender={handleAddSender}
          isLoading={addingSender}
        />

        <DeleteConfirmationModal
          show={showModal}
          onClose={closeModal}
          onConfirm={confirmDelete}
          message={deleteMessage}
          isLoading={isDeleting}
        />

        <ToastContainer position="bottom-right" autoClose={4000} theme="light" />
      </div>
    </div>
  );
};

export default BeneficiarySenders;