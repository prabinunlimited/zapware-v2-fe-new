// src/page/RecurringRemit/index.jsx - PREMIUM UI/UX VERSION

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
  Wallet,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Bell,
  Shield,
  Zap,
  Star,
  Users,
  Globe,
  CreditCard,
  Activity,
  BarChart3,
  Settings,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";
import { RingLoader } from "react-spinners";
import RecurringRemitEdit from "../../../components/PopupModal/RecurringRemitEdit";
import AddRecurringRemitPopup from "../../../components/PopupModal/AddRecurringRemit";

const RecurringRemit = () => {
  const { customerId: paramCustomerId } = useParams();
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remittanceList, setRemittanceList] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRecurringRemittanceId, setSelectedRecurringRemittanceId] =
    useState(null);
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

  // Get customer IDs from localStorage
  const customerUuid = localStorage.getItem("customerUuid");
  const authCustomerId = localStorage.getItem("authcustomer_id");
  const currentCustomerId = localStorage.getItem("currentCustomerId");
  const bearerToken = localStorage.getItem("bearertoken");
  const API_URL = import.meta.env.VITE_API_URL;

  // Customer ID resolution
  const getEffectiveCustomerId = useCallback(() => {
    if (paramCustomerId && paramCustomerId === authCustomerId && customerUuid) {
      return customerUuid;
    }
    const id =
      customerUuid || paramCustomerId || authCustomerId || currentCustomerId;
    if (!id || id === "null" || id === "undefined" || id.trim() === "") {
      return null;
    }
    return id;
  }, [paramCustomerId, customerUuid, authCustomerId, currentCustomerId]);

  const effectiveCustomerId = getEffectiveCustomerId();

  // Fetch remittance list
  const fetchRemittanceList = useCallback(
    async (showLoading = true) => {
      if (!effectiveCustomerId || !bearerToken) {
        setError("Missing authentication information");
        setLoading(false);
        return;
      }

      try {
        if (showLoading) setLoading(true);
        const endpoint = `${API_URL}/recurring-remittance/list/${effectiveCustomerId}`;
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
    [effectiveCustomerId, bearerToken, API_URL],
  );

  useEffect(() => {
    if (effectiveCustomerId) {
      fetchRemittanceList();
    } else {
      setLoading(false);
      setError("Unable to identify customer. Please log in again.");
    }
  }, [effectiveCustomerId, fetchRemittanceList]);

  // Filter and sort data
  const filteredAndSortedData = React.useMemo(() => {
    if (!remittanceList?.data) return [];

    let filtered = [...remittanceList.data];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        const id = (
          item.recurringRemittanceId ||
          item.recurringId ||
          ""
        ).toString();
        const amount = (item.amount || item.source_amount || "").toString();
        return id.includes(searchTerm) || amount.includes(searchTerm);
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
          aVal = a.recurringRemittanceId || a.recurringId || 0;
          bVal = b.recurringRemittanceId || b.recurringId || 0;
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
        const itemId = item.recurringRemittanceId || item.recurringId;
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
    const navCustomerId = customerUuid || effectiveCustomerId;
    navigate(`/recurring-remit/${navCustomerId}/${id}`);
  };

  const handleStatusUpdate = async (recurringRemittanceId, currentStatus) => {
    const newStatus = currentStatus === "Y" ? "N" : "Y";
    const action = newStatus === "Y" ? "Activated" : "Deactivated";
    const processingAction =
      newStatus === "Y" ? "Activating..." : "Deactivating...";

    setProcessingStatus({
      id: recurringRemittanceId,
      action: processingAction,
    });

    try {
      const payload = {
        recurring_remittance_id: recurringRemittanceId,
        recurring_active_status: newStatus,
        source: "zap",
        author_type: "customer",
        author_id: effectiveCustomerId,
      };

      const response = await fetch(
        `${API_URL}/recurring-remittance/update-status`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearerToken}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const responseData = await response.json();

      if (responseData.status === "success") {
        if (remittanceList && remittanceList.data) {
          const updatedArray = remittanceList.data.map((item) => {
            if (
              (item.recurringRemittanceId || item.recurringId) ===
              recurringRemittanceId
            ) {
              return { ...item, activeStatus: newStatus };
            }
            return item;
          });
          setRemittanceList({ ...remittanceList, data: updatedArray });
        }
        showNotification(`Recurring Remit Successfully ${action}`, "success");
      } else {
        throw new Error(
          responseData.message ||
            `Failed to ${action.toLowerCase()} recurring remit`,
        );
      }
    } catch (err) {
      showNotification(
        err.message || `Failed to ${action.toLowerCase()} recurring remit`,
        "error",
      );
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

  // Loading state with animation
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

  // Error state with animation
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h2>
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
              className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 ${
                notification.type === "success"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {notification.type === "success" ? (
                <CheckCircle size={24} />
              ) : (
                <XCircle size={24} />
              )}
              <span className="font-semibold">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section with Animation */}
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
              className="mt-4 lg:mt-0 flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
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
            {
              title: "Total Remittances",
              value: stats.total,
              icon: <Repeat className="text-blue-600" size={24} />,
              gradient: "from-blue-50 to-blue-100",
              color: "blue",
            },
            {
              title: "Active Remittances",
              value: stats.active,
              icon: <Activity className="text-green-600" size={24} />,
              gradient: "from-green-50 to-green-100",
              color: "green",
            },
            {
              title: "Total Volume",
              value: `$${formatCurrency(stats.totalAmount)}`,
              icon: <DollarSign className="text-purple-600" size={24} />,
              gradient: "from-purple-50 to-purple-100",
              color: "purple",
            },
            {
              title: "Next Payment",
              value: stats.nextPayment
                ? formatDate(stats.nextPayment)
                : "No upcoming",
              icon: <Calendar className="text-orange-600" size={24} />,
              gradient: "from-orange-50 to-orange-100",
              color: "orange",
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 bg-white rounded-xl shadow-sm`}>
                  {stat.icon}
                </div>
                <motion.div
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <TrendingUp
                    className={`text-${stat.color}-400 opacity-50`}
                    size={20}
                  />
                </motion.div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                {stat.title}
              </h3>
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
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="relative flex-1 lg:max-w-md">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by ID or amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Filter size={18} className="mr-2" />
                Filters
                {showFilters ? (
                  <ChevronUp size={18} className="ml-2" />
                ) : (
                  <ChevronDown size={18} className="ml-2" />
                )}
              </motion.button>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="id">Sort by ID</option>
                <option value="amount">Sort by Amount</option>
                <option value="nextDate">Sort by Next Date</option>
              </select>

              <motion.button
                whileHover={{ rotate: 180 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {sortOrder === "asc" ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </motion.button>
            </div>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 pt-4 border-t border-gray-100"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Range
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount Range
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequency
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-200 rounded-xl">
                      <option>All</option>
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Monthly</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Main Content - Cards View */}
        <AnimatePresence>
          {filteredAndSortedData.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-sm p-12 text-center"
            >
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                className="inline-block"
              >
                <Zap size={64} className="text-gray-300 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No recurring remittances found
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first recurring remittance
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleOpenAddModal}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Create New Recurring Remit
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAndSortedData.map((item, index) => {
                const itemId = item.recurringRemittanceId || item.recurringId;
                const isProcessing = processingStatus.id === itemId;
                const isActive = item.activeStatus === "Y";

                return (
                  <motion.div
                    key={itemId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    onHoverStart={() => setHoveredCard(itemId)}
                    onHoverEnd={() => setHoveredCard(null)}
                    className={`relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border ${
                      isActive ? "border-green-200" : "border-gray-200"
                    }`}
                  >
                    {/* Status Badge */}
                    <div
                      className={`absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-xs font-semibold ${
                        isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </div>

                    {/* Animated gradient border on hover */}
                    {hoveredCard === itemId && (
                      <motion.div
                        layoutId="cardBorder"
                        className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl -z-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ padding: 2 }}
                      />
                    )}

                    <div className="relative bg-white rounded-2xl p-6 z-10">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <div
                              className={`p-2 rounded-xl ${
                                isActive ? "bg-green-100" : "bg-gray-100"
                              }`}
                            >
                              <Repeat
                                size={20}
                                className={
                                  isActive ? "text-green-600" : "text-gray-600"
                                }
                              />
                            </div>
                            <span className="text-xs font-mono text-gray-500">
                              ID: {itemId.toString().slice(0, 8)}...
                            </span>
                          </div>
                          <div className="flex items-baseline space-x-2">
                            <span className="text-3xl font-bold text-gray-900">
                              $
                              {formatCurrency(
                                item.amount || item.source_amount,
                              )}
                            </span>
                            <span className="text-sm text-gray-500">
                              {item.source_currency || "USD"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-600">
                            <Calendar size={16} className="mr-2" />
                            <span>Next Payment</span>
                          </div>
                          <span className="font-semibold text-gray-900">
                            {formatDate(item.nextDate)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-600">
                            <Clock size={16} className="mr-2" />
                            <span>Frequency</span>
                          </div>
                          <span className="font-semibold text-gray-900 capitalize">
                            {item.frequency ||
                              item.recurring_frequency ||
                              "Monthly"}
                          </span>
                        </div>

                        {item.custom_days && (
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-gray-600">
                              <Calendar size={16} className="mr-2" />
                              <span>Day of Month</span>
                            </div>
                            <span className="font-semibold text-gray-900">
                              Day {item.custom_days}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleViewDetails(itemId)}
                          className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Eye size={16} />
                          <span>View</span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleOpenEditModal(itemId)}
                          className="flex-1 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Edit2 size={16} />
                          <span>Edit</span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            handleStatusUpdate(itemId, item.activeStatus)
                          }
                          disabled={isProcessing}
                          className={`flex-1 px-4 py-2 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all ${
                            isActive
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-green-50 text-green-600 hover:bg-green-100"
                          } disabled:opacity-50`}
                        >
                          {isProcessing ? (
                            <>
                              <RingLoader
                                size={16}
                                color={isActive ? "#dc2626" : "#16a34a"}
                              />
                              <span>{processingStatus.action}</span>
                            </>
                          ) : (
                            <>
                              <Power size={16} />
                              <span>
                                {isActive ? "Deactivate" : "Activate"}
                              </span>
                            </>
                          )}
                        </motion.button>
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
        {isEditModalOpen && customerUuid && (
          <RecurringRemitEdit
            isOpen={isEditModalOpen}
            onSave={handleSaveEdit}
            onClose={handleCloseEditModal}
            recurringRemittanceId={selectedRecurringRemittanceId}
            customerId={customerUuid}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddModalOpen && customerUuid && (
          <AddRecurringRemitPopup
            isOpen={isAddModalOpen}
            onClose={handleCloseAddModal}
            onSave={handleAddRecurringRemit}
            customerId={customerUuid}
          />
        )}
      </AnimatePresence>

      {/* Add custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default RecurringRemit;
