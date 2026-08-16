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
  import { usePartnerConfig } from "../../../../../hooks/usePartnerConfig"
  
  const API_URL = import.meta.env.VITE_API_URL ;
  
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
  
  const useResponsive = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };
  
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);
  
    return isMobile;
  };
  
  // Loader Components
  const FullPageLoader = ({ show, message = "Loading..." }) => {
    if (!show) return null;
  
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-50 backdrop-blur-sm"
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <motion.p
            className="text-gray-700 font-medium text-lg"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            {message}
          </motion.p>
        </div>
      </motion.div>
    );
  };
  
  const SkeletonLoader = ({ isMobile = false }) => {
    if (isMobile) {
      return (
        <div className="space-y-4 p-4">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-4 rounded-lg shadow-md border border-gray-100"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
              <div className="flex gap-2 mt-3">
                {[...Array(4)].map((_, j) => (
                  <div
                    key={j}
                    className="h-8 bg-gray-200 rounded flex-1 animate-pulse"
                  ></div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      );
    }
  
    return (
      <div className="p-6 space-y-4">
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex space-x-4"
          >
            {[...Array(5)].map((_, j) => (
              <div
                key={j}
                className="h-16 bg-gray-100 rounded flex-1 animate-pulse"
              ></div>
            ))}
          </motion.div>
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
            className="fixed inset-0 flex justify-center items-center bg-gray-800 bg-opacity-60 z-50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-lg"
            >
              <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">
                {message &&
                message !== "Do you really want to delete this beneficiary?"
                  ? "Success"
                  : "Confirm Deletion"}
              </h2>
              <p className="text-gray-600 text-center text-lg mb-6">
                {message ||
                  "Do you really want to delete this beneficiary? This action cannot be undone."}
              </p>
              <div className="flex flex-col md:flex-row gap-4">
                {message ? (
                  <button
                    onClick={onClose}
                    className="w-full px-4 py-3 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-all duration-200 font-medium"
                    disabled={isLoading}
                  >
                    Close
                  </button>
                ) : (
                  <>
                    <button
                      onClick={onClose}
                      className="w-full px-4 py-3 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-all duration-200 font-medium"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onConfirm}
                      className="w-full px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-200 font-medium flex items-center justify-center"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <FaSpinner className="animate-spin mr-2" />
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
  const useSearch = (apiCall, initialData) => {
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
                name: `${customer.first_name} ${customer.middle_name || ""} ${
                  customer.last_name
                }`.trim(),
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex justify-center items-center bg-gray-800 bg-opacity-60 z-50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Add Sender
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
  
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Customers
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search by email or name..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Type at least 3 characters to search
                </p>
              </div>
  
              <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                {searchLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <FaSpinner className="animate-spin text-blue-500 text-xl mr-2" />
                    <span>Searching...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="divide-y">
                    {searchResults.map((customer) => (
                      <div
                        key={customer.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleAddSender(customer)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {customer.first_name} {customer.last_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {customer.email}
                            </p>
                            <p className="text-sm text-gray-600">
                              {customer.full_mobile_number}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddSender(customer);
                            }}
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                          >
                            {isLoading ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaPlus />
                            )}
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery.trim().length >= 3 ? (
                  <div className="text-center py-8 text-gray-500">
                    No customers found
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    Start typing to search for customers
                  </div>
                )}
              </div>
  
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };
  
  // Main Component
  const BeneficiarySenders = () => {
    const [authToken] = useState(localStorage.getItem("authtoken"));
    const [beneficiaries, setBeneficiaries] = useState([]);
    
    // Extract beneficiary ID from route (supporting both params naming)
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
    const [, setIsInitialized] = useState(false);
    const [saveLoadingId, setSaveLoadingId] = useState(null);
  
    const isMobile = useResponsive();
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
    } = useSearch(apiCall, beneficiaries);
  
    const headerColor =
      config?.header_color || localStorage.getItem("header_color");
    const textColor = config?.text_color || localStorage.getItem("text_color");
  
    const beneficiariesPerPage = 10;
  
    // Style calculations
    const textColorProps = useMemo(() => {
      if (textColor && textColor.startsWith("text-")) {
        return { className: textColor };
      } else if (textColor && textColor.startsWith("#")) {
        return { style: { color: textColor } };
      }
      return {};
    }, [textColor]);
  
    const headerColorProps = useMemo(() => {
      if (headerColor && headerColor.startsWith("bg-")) {
        return { className: headerColor };
      } else if (headerColor && headerColor.startsWith("#")) {
        return { style: { backgroundColor: headerColor } };
      }
      return { className: "bg-blue-600" };
    }, [headerColor]);
  
    // Data fetching
    const fetchBeneficiaries = useCallback(async () => {
      if (!benefId) {
        console.log("No benefId found");
        return;
      }
  
      setLoading(true);
      setIsInitialized(false);
  
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
            name: `${sender.customer?.first_name || ""} ${
              sender.customer?.middle_name || ""
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
        setIsInitialized(true);
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
        await apiCall(
          `${API_URL}/beneficiaries/create-benef-sender`,
          {
            method: "POST",
            body: JSON.stringify({
              customer_id: customer.id,
              beneficiary_id: benefId,
            }),
          }
        );
  
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
  
    // Filtered & Paginated List
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
  
    // Actions
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
          closeModal();
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
  
    // Navigation
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
  
    // Render Mobile View
    const renderMobileView = () => (
      <div className="space-y-4 p-4">
        {paginatedBeneficiaries.map((sender) => (
          <motion.div
            key={sender.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 rounded-lg shadow-md border border-gray-100"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-gray-900 text-lg">
                  {sender.isVisible ? sender.name : "*****"}
                </h3>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {sender.isVisible ? "Sender" : "*****"}
                </span>
              </div>
  
              <div className="text-sm text-gray-600 space-y-1">
                <p className="flex items-center">
                  <span className="font-medium w-24">Phone:</span>
                  {sender.isVisible ? sender.full_phone_number : "••••••••••"}
                </p>
                <p className="flex items-center">
                  <span className="font-medium w-24">Email:</span>
                  {sender.isVisible
                    ? sender.email || "Not Available"
                    : "••••••••••"}
                </p>
                <p className="flex items-start">
                  <span className="font-medium w-24">Address:</span>
                  {sender.isVisible
                    ? sender.street || "Not Available"
                    : "••••••••••"}
                </p>
              </div>
  
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => toggleVisibility(sender.id)}
                  className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  <FaEye className="mr-1" />
                  {sender.isVisible ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  
    // Render Desktop Table
    const renderDesktopView = () => (
      <div className="overflow-x-auto w-full">
        <table className="w-full">
          <thead
            className={`text-white ${headerColorProps?.className ?? ""}`}
            style={headerColorProps?.style}
          >
            <tr>
              <th className="py-4 px-6 text-left text-sm font-medium uppercase tracking-wider w-1/4">
                <div className="flex items-center">
                  <AiOutlineUser className="mr-2 text-blue-200" />
                  <span>Sender Name</span>
                </div>
              </th>
              <th className="py-4 px-6 text-left text-sm font-medium uppercase tracking-wider w-1/4">
                <div className="flex items-center">
                  <AiOutlinePhone className="mr-2 text-blue-200" />
                  <span>Phone</span>
                </div>
              </th>
              <th className="py-4 px-6 text-left text-sm font-medium uppercase tracking-wider w-1/4">
                <div className="flex items-center">
                  <AiOutlineMail className="mr-2 text-blue-200" />
                  <span>Email</span>
                </div>
              </th>
              <th className="py-4 px-6 text-center text-sm font-medium uppercase tracking-wider w-1/4">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <AnimatePresence>
              {paginatedBeneficiaries.map((sender) => (
                <motion.tr
                  key={sender.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="hover:bg-blue-50/30 transition-colors"
                  layout
                >
                  <td className="py-4 px-6 whitespace-nowrap w-1/4">
                    <div className="flex items-center">
                      <motion.div
                        className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3"
                        whileHover={{ scale: 1.1 }}
                      >
                        <AiOutlineUser className="text-blue-600" />
                      </motion.div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">
                          {sender.isVisible ? sender.name : "*****"}
                        </div>
                        <motion.div
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full mt-1 inline-block"
                          whileHover={{ scale: 1.05 }}
                        >
                          {sender.isVisible ? "Visible" : "Hidden"}
                        </motion.div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap w-1/4">
                    <div className="flex items-center text-gray-700">
                      <AiOutlinePhone className="mr-2 text-blue-400 flex-shrink-0" />
                      <span className="truncate">
                        {sender.isVisible
                          ? sender.full_phone_number
                          : "••••••••••"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap w-1/4">
                    <div className="flex items-center text-gray-700">
                      <AiOutlineMail className="mr-2 text-blue-400 flex-shrink-0" />
                      <span className="truncate">
                        {sender.isVisible
                          ? sender.email || "Not Available"
                          : "••••••••••"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap w-1/4">
                    <div className="flex items-center justify-center space-x-2">
                      <motion.button
                        onClick={() => toggleVisibility(sender.id)}
                        className="text-blue-600 hover:text-blue-800 p-1.5 rounded-full hover:bg-blue-50"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title={sender.isVisible ? "Hide" : "Show"}
                      >
                        <FaEye className="text-lg" />
                      </motion.button>
                      <motion.button
                        onClick={() =>
                          handleSave(sender.customer_id, sender.beneficiary_id)
                        }
                        disabled={saveLoadingId === sender.customer_id}
                        className="text-teal-600 hover:text-teal-800 p-1.5 rounded-full hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Save Sender"
                      >
                        {saveLoadingId === sender.customer_id ? (
                          <FaSpinner className="text-lg animate-spin" />
                        ) : (
                          <FaSave className="text-lg" />
                        )}
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    );
  
    const renderEmptyState = () => (
      <motion.div
        className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-200 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center mb-6"
          animate={{
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <FiUsers className="text-blue-500 text-4xl" />
        </motion.div>
        <h3 className="text-2xl font-semibold text-gray-800 mb-3">
          No senders found
        </h3>
        <p className="text-gray-600 max-w-md mb-6">
          No one has sent money to this beneficiary yet.
        </p>
        <motion.button
          onClick={() => setShowAddSenderModal(true)}
          className="bg-blue-600 text-white py-2.5 px-6 rounded-lg shadow-md flex items-center space-x-2 hover:bg-blue-700 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
        >
          <FiUserPlus className="text-xl" />
          <span>Add Sender</span>
        </motion.button>
      </motion.div>
    );
  
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <FullPageLoader show={loading && !hasSearched} />
  
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-3"
          >
            <div
              className={`p-3 rounded-xl ${
                headerColorProps?.className ?? "bg-blue-600"
              }`}
              style={headerColorProps?.style}
            >
              <HiOutlineUserGroup className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Senders to This Beneficiary
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                View customers who have sent money to this beneficiary
              </p>
            </div>
          </motion.div>
  
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <motion.button
              onClick={() => setShowAddSenderModal(true)}
              className={`text-white py-2.5 px-5 rounded-lg shadow-md flex items-center justify-center space-x-2 ${headerColorProps.className}`}
              style={headerColorProps?.style}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <FiUserPlus className="text-xl" />
              <span className="font-medium">Add Sender</span>
            </motion.button>
            <motion.button
              onClick={navigation.handleRoute}
              className="text-blue-600 border border-blue-600 py-2.5 px-5 rounded-lg shadow-md flex items-center space-x-2 hover:bg-blue-50 transition-colors w-full sm:w-auto justify-center"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <FaPiggyBank className="text-xl" />
              <span className="font-medium">Add Bank</span>
            </motion.button>
          </div>
        </div>
  
        {/* Search and Filter Section */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 min-w-0 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Senders
              </label>
              <div className="flex rounded-lg shadow-sm">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, email or phone number..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                    disabled={loading}
                  />
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={loading}
                      title="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
                <button
                  className={`py-3 px-6 rounded-r-lg font-medium transition-all duration-200 flex items-center justify-center border border-l-0 ${
                    headerColorProps.className || "bg-blue-600"
                  } text-white border-transparent hover:shadow-md text-sm disabled:opacity-50`}
                  style={headerColorProps?.style}
                  disabled={loading || searchLoading}
                  onClick={() =>
                    searchQuery.trim() && performSearch(searchQuery)
                  }
                >
                  {searchLoading ? (
                    <FaSpinner className="animate-spin mr-2" />
                  ) : (
                    <FaSearch className="mr-2" />
                  )}
                  {searchLoading ? "Searching..." : "Search"}
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
                  className="w-full md:w-auto px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={loading}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </motion.div>
  
        {/* Main Table / Mobile Content */}
        {loading && !hasSearched ? (
          <SkeletonLoader isMobile={isMobile} />
        ) : searchError && hasSearched ? (
          <motion.div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-200 text-center">
            <div className="h-24 w-24 rounded-full bg-red-50 flex items-center justify-center mb-6">
              <FaExclamationTriangle className="text-red-500 text-4xl" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">
              Search Failed
            </h3>
            <p className="text-gray-600 max-w-md mb-6">{searchError}</p>
            <button
              onClick={handleClearSearch}
              className="bg-blue-600 text-white py-2.5 px-6 rounded-lg shadow-md"
            >
              Clear Search
            </button>
          </motion.div>
        ) : filteredBeneficiaries.length === 0 ? (
          renderEmptyState()
        ) : (
          <motion.div
            className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {isMobile ? renderMobileView() : renderDesktopView()}
  
            {/* Pagination Footer */}
            {filteredBeneficiaries.length > 0 && (
              <div
                className={`px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm flex items-center justify-between ${
                  textColorProps?.className ?? "text-gray-500"
                }`}
              >
                <div className="flex items-center">
                  <AiOutlineInfoCircle className="mr-2 text-blue-500" />
                  Showing{" "}
                  {Math.min(
                    currentPage * beneficiariesPerPage,
                    filteredBeneficiaries.length
                  )}{" "}
                  of {filteredBeneficiaries.length} sender
                  {filteredBeneficiaries.length !== 1 ? "s" : ""}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1 || loading || searchLoading}
                      className="p-1 rounded disabled:opacity-50"
                    >
                      <FaArrowLeft className="text-blue-600" />
                    </button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, totalPages)
                        )
                      }
                      disabled={
                        currentPage === totalPages || loading || searchLoading
                      }
                      className="p-1 rounded disabled:opacity-50"
                    >
                      <FaArrowLeft className="text-blue-600 rotate-180" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
  
        {/* Back Button */}
        <div className="flex justify-center items-center mt-8">
          <button
            onClick={navigation.goBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-blue-600 border border-blue-600 hover:bg-blue-50 transition-colors duration-200 text-sm font-medium"
          >
            <FaArrowLeft className="text-blue-600" />
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
    );
  };
  
  export default BeneficiarySenders;