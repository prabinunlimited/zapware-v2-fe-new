// src/page/RecurringRemit/index.jsx - PREMIUM UI/UX VERSION (FIXED - WITH UUID FOR PAYLOADS)

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Repeat,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Edit2,
  Power,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Activity,
  Zap,
} from "lucide-react";
import { RingLoader } from "react-spinners";
import RecurringRemitEdit from "../../../components/PopupModal/RecurringRemitEdit";
import AddRecurringRemitPopup from "../../../components/PopupModal/AddRecurringRemit"

const RecurringRemit = () => {
  const { customerId: paramCustomerId } = useParams();
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remittanceList, setRemittanceList] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRecurringRemittanceId, setSelectedRecurringRemittanceId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("nextDate");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [processingStatus, setProcessingStatus] = useState({
    id: null,
    action: "",
  });
  const [hoveredCard, setHoveredCard] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalAmount: 0,
    nextPayment: null,
  });

  // Get IDs from localStorage
  const authCustomerId = localStorage.getItem("authcustomer_id");
  const customerUuid = localStorage.getItem("customer_uuid");
  const bearerToken = localStorage.getItem("bearertoken");
  const API_URL = import.meta.env.VITE_API_URL;

  // ✅ Use numeric ID from URL param or localStorage for API endpoints (GET requests)
  const numericCustomerId = paramCustomerId || authCustomerId;

  // ✅ Use UUID for payload data (POST/PUT requests)
  const uuidCustomerId = customerUuid;

  // Debug logging
  useEffect(() => {
    console.log("Debug - Customer IDs:", {
      paramCustomerId,
      authCustomerId,
      numericCustomerId,
      customerUuid,
      uuidCustomerId,
    });
  }, [paramCustomerId, authCustomerId, numericCustomerId, customerUuid, uuidCustomerId]);

  // Fetch remittance list - ✅ Use NUMERIC ID for GET request
  const fetchRemittanceList = useCallback(
    async (showLoading = true) => {
      if (!numericCustomerId || !bearerToken) {
        console.error("Missing required data:", { numericCustomerId, bearerToken: !!bearerToken });
        setError("Missing authentication information");
        setLoading(false);
        return;
      }

      try {
        if (showLoading) setLoading(true);
        const endpoint = `${API_URL}/recurring-remittance/list/${numericCustomerId}`;
        console.log("Fetching from endpoint:", endpoint);

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearerToken}`,
          },
        });

        const responseText = await response.text();
        let parsedData = JSON.parse(responseText);

        if (parsedData.status === "success") {
          setRemittanceList(parsedData);
          // Calculate stats
          const data = parsedData.data || [];
          const activeCount = data.filter(
            (item) => item.activeStatus === "Y",
          ).length;
          const totalAmount = data.reduce(
            (sum, item) => sum + (parseFloat(item.amount) || 0),
            0,
          );
          const nextPayment = data.find(
            (item) => item.nextDate && item.activeStatus === "Y",
          );

          setStats({
            total: data.length,
            active: activeCount,
            totalAmount: totalAmount,
            nextPayment: nextPayment?.nextDate || null,
          });
          setError(null);
        } else {
          throw new Error(parsedData.message || "Failed to fetch list");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || "Failed to fetch recurring remittance list");
      } finally {
        setLoading(false);
      }
    },
    [numericCustomerId, bearerToken, API_URL],
  );

  useEffect(() => {
    if (numericCustomerId) {
      fetchRemittanceList();
    } else {
      setLoading(false);
      setError("Unable to identify customer. Please log in again.");
    }
  }, [numericCustomerId, fetchRemittanceList]);

  // Filter and sort data with safe property access
  const filteredAndSortedData = React.useMemo(() => {
    if (!remittanceList?.data || !Array.isArray(remittanceList.data)) return [];

    let filtered = [...remittanceList.data];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        const id = item.recurringRemittanceId || item.recurringId || item.id || "";
        const amount = item.amount || item.source_amount || "";
        return id.toString().includes(searchTerm) || amount.toString().includes(searchTerm);
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) =>
        statusFilter === "active"
          ? item.activeStatus === "Y"
          : item.activeStatus === "N",
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case "amount":
          aVal = parseFloat(a.amount || a.source_amount || 0);
          bVal = parseFloat(b.amount || b.source_amount || 0);
          break;
        case "nextDate":
          aVal = new Date(a.nextDate || 0);
          bVal = new Date(b.nextDate || 0);
          break;
        default:
          aVal = a.recurringRemittanceId || a.recurringId || a.id || 0;
          bVal = b.recurringRemittanceId || b.recurringId || b.id || 0;
      }
      if (sortOrder === "asc") return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    return filtered;
  }, [remittanceList, searchTerm, statusFilter, sortBy, sortOrder]);

  // Handlers
  const handleOpenEditModal = (id) => {
    setSelectedRecurringRemittanceId(id);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedRecurringRemittanceId(null);
  };

  const handleOpenAddModal = () => {
    console.log("Opening add modal with customerId:", numericCustomerId);
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleAddRecurringRemit = (newData) => {
    if (remittanceList && remittanceList.data) {
      setRemittanceList({
        ...remittanceList,
        data: [...remittanceList.data, newData],
      });
    }
    showNotification("Recurring Remittance Added Successfully", "success");
    fetchRemittanceList(false);
  };

  const handleSaveEdit = (updatedData) => {
    if (remittanceList && remittanceList.data) {
      const updatedArray = remittanceList.data.map((item) => {
        const itemId = item.recurringRemittanceId || item.recurringId || item.id;
        if (itemId === updatedData.recurring_remittance_id) {
          return {
            ...item,
            amount: updatedData.source_amount,
            frequency: updatedData.recurring_frequency,
          };
        }
        return item;
      });
      setRemittanceList({ ...remittanceList, data: updatedArray });
    }
    showNotification("Recurring Remittance Updated Successfully", "success");
    fetchRemittanceList(false);
    handleCloseEditModal();
  };

  const handleViewDetails = (id) => {

    navigate(`/recurring-remit/${numericCustomerId}/${id}`);
  };

  const handleStatusUpdate = async (recurringRemittanceId, currentStatus) => {
    const newStatus = currentStatus === "Y" ? "N" : "Y";
    const action = newStatus === "Y" ? "Activated" : "Deactivated";
    const processingAction = newStatus === "Y" ? "Activating..." : "Deactivating...";

    setProcessingStatus({
      id: recurringRemittanceId,
      action: processingAction,
    });

    try {
      // ✅ IMPORTANT: Use UUID for customer_id and author_id in payload
      const payload = {
        recurring_remittance_id: recurringRemittanceId,
        recurring_active_status: newStatus,
        source: "zap",
        author_type: "customer",
        author_id: uuidCustomerId, // ✅ Use UUID
        customer_id: uuidCustomerId, // ✅ Use UUID
      };

      console.log("📤 Status update payload:", payload);

      const response = await fetch(`${API_URL}/recurring-remittance/update-status`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${bearerToken}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (responseData.status === "success") {
        if (remittanceList && remittanceList.data) {
          const updatedArray = remittanceList.data.map((item) => {
            const itemId = item.recurringRemittanceId || item.recurringId || item.id;
            if (itemId === recurringRemittanceId) {
              return { ...item, activeStatus: newStatus };
            }
            return item;
          });
          setRemittanceList({ ...remittanceList, data: updatedArray });
        }
        showNotification(`Recurring Remit Successfully ${action}`, "success");
      } else {
        throw new Error(responseData.message || `Failed to ${action.toLowerCase()} recurring remit`);
      }
    } catch (err) {
      console.error("Status update error:", err);
      showNotification(err.message || `Failed to ${action.toLowerCase()} recurring remit`, "error");
    } finally {
      setProcessingStatus({ id: null, action: "" });
    }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not scheduled";
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `In ${diffDays} days`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Helper function to safely get item ID
  const getItemId = (item) => {
    return item?.recurringRemittanceId || item?.recurringId || item?.id || item?.recurring_remittance_id;
  };

  // Helper function to safely get amount
  const getItemAmount = (item) => {
    return item?.amount || item?.source_amount || 0;
  };

  // Helper function to safely get currency
  const getItemCurrency = (item) => {
    return item?.source_currency || item?.currency || "USD";
  };

  // Helper function to safely get frequency
  const getItemFrequency = (item) => {
    return item?.frequency || item?.recurring_frequency || "Monthly";
  };

  // Helper function to safely get custom days
  const getItemCustomDays = (item) => {
    return item?.custom_days || item?.day_of_month;
  };

  // Helper function to safely get next date
  const getItemNextDate = (item) => {
    return item?.nextDate || item?.next_payment_date;
  };

  // Helper function to safely get active status
  const getItemActiveStatus = (item) => {
    return item?.activeStatus === "Y" ? "Y" : "N";
  };

  const showMissingCustomerWarning = !numericCustomerId && !loading;

  // Loading state
  if (loading && !remittanceList) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <RefreshCw size={48} className="text-blue-600" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-xl font-semibold text-gray-700"
          >
            Loading your recurring remittances...
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-2 text-gray-500"
          >
            Please wait while we fetch your data
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error && !remittanceList) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <AlertCircle size={40} className="text-red-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setError(null);
              fetchRemittanceList();
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -100, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -100, x: "-50%" }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div
              className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 ${notification.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                }`}
            >
              {notification.type === "success" ? <CheckCircle size={24} /> : <XCircle size={24} />}
              <span className="font-semibold">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Customer ID Warning */}
        <AnimatePresence>
          {showMissingCustomerWarning && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="text-yellow-600" size={24} />
                <div>
                  <h3 className="font-semibold text-yellow-800">Customer ID Missing</h3>
                  <p className="text-sm text-yellow-700">
                    Please ensure you're logged in properly. The "Create New" button will work once the customer ID is available.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center space-x-3 mb-2"
              >
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <Repeat className="text-white" size={24} />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Recurring Remittances
                </h1>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-600 ml-12"
              >
                Manage your automated recurring money transfers with ease
              </motion.p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              onClick={handleOpenAddModal}
              disabled={!numericCustomerId}
              className={`mt-4 lg:mt-0 flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 ${!numericCustomerId ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Recurring Remit
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {[
            { title: "Total Remittances", value: stats.total, icon: <Repeat className="text-blue-600" size={24} />, gradient: "from-blue-50 to-blue-100" },
            { title: "Active Remittances", value: stats.active, icon: <Activity className="text-green-600" size={24} />, gradient: "from-green-50 to-green-100" },
            { title: "Total Volume", value: `$${formatCurrency(stats.totalAmount)}`, icon: <DollarSign className="text-purple-600" size={24} />, gradient: "from-purple-50 to-purple-100" },
            { title: "Next Payment", value: stats.nextPayment ? formatDate(stats.nextPayment) : "No upcoming", icon: <Calendar className="text-orange-600" size={24} />, gradient: "from-orange-50 to-orange-100" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ y: -5 }}
              className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-white rounded-xl shadow-sm">{stat.icon}</div>
                <TrendingUp className="text-gray-400 opacity-50" size={20} />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Search and Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between lg:space-y-0 space-y-4">
            <div className="relative flex-1 lg:max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by ID or amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filters - maintain web spacing, wrap on mobile */}
            <div className="flex flex-wrap items-center gap-3 lg:gap-3 lg:flex-nowrap">
              <button onClick={() => setShowFilters(!showFilters)} className="flex items-center px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50">
                <Filter size={18} className="mr-2" />
                Filters {showFilters ? <ChevronUp size={18} className="ml-2" /> : <ChevronDown size={18} className="ml-2" />}
              </button>

              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl">
                <option value="id">Sort by ID</option>
                <option value="amount">Sort by Amount</option>
                <option value="nextDate">Sort by Next Date</option>
              </select>

              <button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50">
                {sortOrder === "asc" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Cards View */}
        <AnimatePresence>
          {filteredAndSortedData.length === 0 ? (
            <motion.div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <Zap size={64} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No recurring remittances found</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first recurring remittance</p>
              <button onClick={handleOpenAddModal} disabled={!numericCustomerId} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold">
                Create New Recurring Remit
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAndSortedData.map((item, index) => {
                const itemId = getItemId(item);
                const isProcessing = processingStatus.id === itemId;
                const isActive = getItemActiveStatus(item) === "Y";

                return (
                  <motion.div
                    key={itemId || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -8 }}
                    className={`relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border ${isActive ? "border-green-200" : "border-gray-200"
                      }`}
                  >
                    <div className={`absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-xs font-semibold ${isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                      }`}>
                      {isActive ? "Active" : "Inactive"}
                    </div>

                    <div className="relative bg-white rounded-2xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <div className={`p-2 rounded-xl ${isActive ? "bg-green-100" : "bg-gray-100"}`}>
                              <Repeat size={20} className={isActive ? "text-green-600" : "text-gray-600"} />
                            </div>
                            <span className="text-xs font-mono text-gray-500">
                              ID: {itemId ? itemId.toString().slice(0, 8) : "N/A"}...
                            </span>
                          </div>
                          <div className="flex items-baseline space-x-2">
                            <span className="text-3xl font-bold text-gray-900">
                              ${formatCurrency(getItemAmount(item))}
                            </span>
                            <span className="text-sm text-gray-500">{getItemCurrency(item)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-600">
                            <Calendar size={16} className="mr-2" />
                            <span>Next Payment</span>
                          </div>
                          <span className="font-semibold text-gray-900">{formatDate(getItemNextDate(item))}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-600">
                            <Clock size={16} className="mr-2" />
                            <span>Frequency</span>
                          </div>
                          <span className="font-semibold text-gray-900 capitalize">{getItemFrequency(item)}</span>
                        </div>

                        {getItemCustomDays(item) && (
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-gray-600">
                              <Calendar size={16} className="mr-2" />
                              <span>Day of Month</span>
                            </div>
                            <span className="font-semibold text-gray-900">Day {getItemCustomDays(item)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleViewDetails(itemId)}
                          className="px-3 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 flex items-center justify-center gap-1.5 transition-all text-sm"
                        >
                          <Eye size={15} />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(itemId)}
                          className="px-3 py-2.5 bg-gray-50 text-gray-600 rounded-xl font-medium hover:bg-gray-100 flex items-center justify-center gap-1.5 transition-all text-sm"
                        >
                          <Edit2 size={15} />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleStatusUpdate(itemId, getItemActiveStatus(item))}
                          disabled={isProcessing}
                          className={`px-3 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all text-sm ${isActive ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-green-50 text-green-600 hover:bg-green-100"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isProcessing ? (
                            <>
                              <RingLoader size={14} color={isActive ? "#dc2626" : "#16a34a"} />
                              <span className="text-xs whitespace-nowrap">{processingStatus.action}</span>
                            </>
                          ) : (
                            <>
                              <Power size={15} />
                              <span className="whitespace-nowrap">{isActive ? "Deactivate" : "Activate"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isEditModalOpen && numericCustomerId && (
          <RecurringRemitEdit
            isOpen={isEditModalOpen}
            onSave={handleSaveEdit}
            onClose={handleCloseEditModal}
            recurringRemittanceId={selectedRecurringRemittanceId}
            customerId={numericCustomerId}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddModalOpen && numericCustomerId && (
          <AddRecurringRemitPopup
            isOpen={isAddModalOpen}
            onClose={handleCloseAddModal}
            onSave={handleAddRecurringRemit}
            customerId={numericCustomerId}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default RecurringRemit;