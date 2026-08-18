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

// Loader Components
const FullPageLoader = ({ show, message = "Loading..." }) => {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white/90 flex flex-col items-center justify-center z-50 backdrop-blur-xs"
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-700 font-medium text-sm">{message}</p>
      </div>
    </motion.div>
  );
};

const SkeletonLoader = () => {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-200 h-20 animate-pulse"
        />
      ))}
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
              {message &&
                message !== "Do you really want to delete this beneficiary?"
                ? "Notification"
                : "Confirm Deletion"}
            </h2>
            <p className="text-gray-600 text-center text-sm mb-6">
              {message ||
                "Do you really want to delete this beneficiary? This action cannot be undone."}
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              {message ? (
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2.5 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-colors font-semibold text-xs sm:text-sm cursor-pointer"
                  disabled={isLoading}
                >
                  Close
                </button>
              ) : (
                <>
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
                    {isLoading ? "Deleting..." : "Yes, Delete"}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Search Hook
const useSearch = (apiCall) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const performSearch = useCallback(
    async (query) => {
      if (!query.trim()) {
        setSearchResults(null);
        setHasSearched(false);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setSearchLoading(true);
      setError(null);
      setHasSearched(true);

      let searchType = "email";
      let formattedQuery = query;

      const mobileRegex = /^[\+]?[0-9\s\-\(\)]+$/;
      if (mobileRegex.test(query.replace(/\s/g, ""))) {
        searchType = "mobile";
        formattedQuery = query.replace(/[^\d\+\s]/g, "");

        if (formattedQuery.includes("+") && !formattedQuery.includes(" ")) {
          const plusIndex = formattedQuery.indexOf("+");
          if (plusIndex === 0 && formattedQuery.length > 3) {
            const countryCode = formattedQuery.substring(0, 3);
            const number = formattedQuery.substring(3);
            formattedQuery = `${countryCode} ${number}`;
          }
        }
      }

      try {
        const result = await apiCall(
          `${API_URL}/beneficiaries/customer/search`,
          {
            method: "POST",
            body: JSON.stringify({
              customer_type: searchType,
              query: formattedQuery,
            }),
            signal: abortControllerRef.current.signal,
          }
        );

        if (result.customers_data && Array.isArray(result.customers_data)) {
          const beneficiariesWithVisibility = result.customers_data.map(
            (customer) => ({
              id: customer.id,
              name: `${customer.first_name || ""} ${customer.middle_name || ""
                } ${customer.last_name || ""}`.trim(),
              email: customer.email,
              full_phone_number: customer.full_mobile_number,
              relationtobenef: "Customer",
              street: customer.street_address_1 || "Not Available",
              isVisible: true,
              isSearchResult: true,
            })
          );
          setSearchResults(beneficiariesWithVisibility);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Search error:", error);
          setError(error.message || "Search failed");
          setSearchResults([]);
        }
      } finally {
        setSearchLoading(false);
      }
    },
    [apiCall]
  );

  useEffect(() => {
    if (debouncedSearchQuery.trim().length >= 3) {
      performSearch(debouncedSearchQuery);
    } else if (debouncedSearchQuery.trim().length === 0 && hasSearched) {
      setSearchResults(null);
      setHasSearched(false);
    }
  }, [debouncedSearchQuery, performSearch, hasSearched]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults(null);
    setHasSearched(false);
    setError(null);
    setSearchLoading(false);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    hasSearched,
    error,
    clearSearch,
    performSearch,
  };
};

// Add Sender Modal Component
const AddSenderModal = ({ show, onClose, onAddSender, isLoading = false }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const { apiCall } = useApi();

  const handleSearch = async (query) => {
    if (query.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const result = await apiCall(`${API_URL}/beneficiaries/customer/search`, {
        method: "POST",
        body: JSON.stringify({
          customer_type: "email",
          query: query.trim(),
        }),
      });

      if (result.customers_data && Array.isArray(result.customers_data)) {
        setSearchResults(result.customers_data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddSender = (customer) => {
    onAddSender(customer);
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
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Type at least 3 characters to search
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
              ) : searchQuery.trim().length >= 3 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No customers found
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs">
                  Start typing to search for customers
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
  const [filterVisibility, setFilterVisibility] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [saveLoadingId, setSaveLoadingId] = useState(null);

  const { apiCall } = useApi();
  const config = usePartnerConfig(authToken);
  const navigate = useNavigate();

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    hasSearched,
    error: searchError,
    clearSearch,
    performSearch,
  } = useSearch(apiCall);

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

  const displayedBeneficiaries = hasSearched ? searchResults : beneficiaries;

  const filteredBeneficiaries = useMemo(() => {
    if (!displayedBeneficiaries) return [];

    return displayedBeneficiaries.filter((beneficiary) => {
      const matchesVisibilityFilter =
        filterVisibility === "all" ||
        (filterVisibility === "visible" && beneficiary.isVisible) ||
        (filterVisibility === "hidden" && !beneficiary.isVisible);

      return matchesVisibilityFilter;
    });
  }, [displayedBeneficiaries, filterVisibility]);

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
        setDeleteMessage("Beneficiary deleted successfully!");
        toast.success("Beneficiary deleted successfully!");
        setShowModal(false);
        setBeneficiaryToDelete(null);
      } catch (error) {
        console.error("Error deleting beneficiary:", error);
        setDeleteMessage(error.message);
        toast.error(error.message);
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
    clearSearch();
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
        <FullPageLoader show={loading && !hasSearched} />

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
            <button
              onClick={navigation.handleRoute}
              className="w-full sm:w-auto text-blue-600 border border-blue-200 bg-white py-2.5 px-4 rounded-xl shadow-2xs flex items-center justify-center gap-2 hover:bg-blue-50 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <FaPiggyBank size={14} />
              <span>Add Bank</span>
            </button>
          </div>
        </div>
        
        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl shadow-2xs border border-gray-200 p-3.5 sm:p-5">
          <div className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1 min-w-0 w-full">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Search Senders
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" size={13} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, email or phone..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    className="block w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-gray-400"
                    disabled={loading}
                  />
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
                      disabled={loading}
                      title="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
                <button
                  className="py-2.5 px-5 rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm disabled:opacity-50 cursor-pointer flex-shrink-0 shadow-2xs"
                  disabled={loading || searchLoading}
                  onClick={() =>
                    searchQuery.trim() && performSearch(searchQuery)
                  }
                >
                  {searchLoading ? (
                    <FaSpinner className="animate-spin text-xs" />
                  ) : null}
                  <span>Search</span>
                </button>
              </div>
            </div>

            {(searchQuery || filterVisibility !== "all") && (
              <div className="w-full md:w-auto flex-shrink-0">
                <button
                  onClick={() => {
                    handleClearSearch();
                    setFilterVisibility("all");
                  }}
                  className="w-full md:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                  disabled={loading}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content View */}
        {loading && !hasSearched ? (
          <SkeletonLoader />
        ) : searchError && hasSearched ? (
          <div className="flex flex-col items-center justify-center py-10 bg-white rounded-2xl shadow-2xs border border-gray-200 text-center p-6">
            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mb-3 text-red-500 border border-red-100">
              <FaExclamationTriangle size={20} />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">
              Search Failed
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mb-4">{searchError}</p>
            <button
              onClick={handleClearSearch}
              className="bg-blue-600 text-white py-2 px-4 rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Clear Search
            </button>
          </div>
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