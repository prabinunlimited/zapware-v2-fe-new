// src/page/CustomerSupport/CustomerSupport.jsx (Mobile Responsive - Company & Tickets Only)

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  Send,
  FileText,
  AlertCircle,
  Tag,
  HelpCircle,
  Clock,
  MessageCircle,
  CheckCircle,
  Award,
  Zap,
  Ticket,
  RefreshCw,
  Eye,
  Calendar,
  ChevronRight,
  Loader,
  X,
  Edit2,
  Trash2,
  Building2Icon
} from "lucide-react";
import RingLoader from "react-spinners/RingLoader";
import { motion } from "framer-motion";

// Import Redux actions and selectors
import {
  storeSupportTicket,
  fetchAllTickets,
  fetchTicketByUuid,
  updateTicket,
  deleteTicket,
  clearError,
  clearSuccess,
  clearCurrentTicket,
  fetchTicketCategories,
  fetchStatusList,
  updateTicketStatus,
  fetchStatusLogs,
  selectTicketCategories,
  selectFetchingCategories,
  selectStatusList,
  selectUpdatingStatus,
  selectStatusLogs,
  selectFetchingStatusLogs
} from "../CustomerSupport/CustomerSupportSlice";

const getCurrentUser = () => {
  const userType =
    localStorage.getItem("login_user_type") ||
    (localStorage.getItem("beneficaryLogin") === "Y" ? "beneficiary" : "customer");

  const isBeneficiary = userType.toLowerCase().includes("benef");

  const userUuid = isBeneficiary
    ? localStorage.getItem("beneficiary_uuid") || localStorage.getItem("beneficiaryUuid")
    : localStorage.getItem("customer_uuid") || localStorage.getItem("customerUuid") || localStorage.getItem("authcustomer_id");

  return {
    userType: isBeneficiary ? "beneficiary" : "customer",
    userUuid,
  };
};

function CustomerSupport() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state
  const submitting = useSelector((state) => state.customerSupport?.submitting || false);
  const error = useSelector((state) => state.customerSupport?.error);
  const success = useSelector((state) => state.customerSupport?.success);
  const tickets = useSelector((state) => state.customerSupport?.tickets || []);
  const fetchingTickets = useSelector((state) => state.customerSupport?.fetchingTickets || false);
  const currentTicket = useSelector((state) => state.customerSupport?.currentTicket);
  const fetchingTicketDetail = useSelector((state) => state.customerSupport?.fetchingTicketDetail || false);
  const updatingTicket = useSelector((state) => state.customerSupport?.updatingTicket || false);
  const deletingTicket = useSelector((state) => state.customerSupport?.deletingTicket || false);
  const categories = useSelector(selectTicketCategories);
  const fetchingCategories = useSelector(selectFetchingCategories);
  const statusList = useSelector(selectStatusList);
  const updatingStatus = useSelector(selectUpdatingStatus);
  const statusLogs = useSelector(selectStatusLogs);
  const fetchingStatusLogs = useSelector(selectFetchingStatusLogs);

  // Full-page initial loading state
  const [pageLoading, setPageLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Reusable Alert Modal state (replaces old successMessage/errorMessage/updateSuccessMessage)
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: "success", // "success" | "error"
    title: "",
    message: "",
  });

  const showAlert = (type, title, message) => {
    const formattedMsg =
      typeof message === "object" && message !== null
        ? Object.values(message).flat().join(" ")
        : String(message || "");
    setAlertModal({ isOpen: true, type, title, message: formattedMsg });
  };

  const closeAlert = () => {
    setAlertModal((prev) => ({ ...prev, isOpen: false }));
  };

  const [partnerInfo, setPartnerInfo] = useState({
    partner_name: "",
    support_email: "",
    support_phoneno: "",
    partner_address: ""
  });
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "medium",
    category: ""
  });
  const [errors, setErrors] = useState({});
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);

  // Status modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTicketForStatus, setSelectedTicketForStatus] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");

  // Edit and Delete states
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    subject: "",
    description: "",
    priority: "",
    category: ""
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusLogs, setShowStatusLogs] = useState(false);

  // Load partner info from localStorage
  useEffect(() => {
    const partnerName = localStorage.getItem('support_partner_name') || "Support Team";
    const supportEmail = localStorage.getItem('partner_support_email') || "support@unlimitedremit.com";
    const supportPhone = localStorage.getItem('partner_support_phone') || "Not provided";
    const partnerAddress = localStorage.getItem('partner_address') || "Global Support Center";

    setPartnerInfo({
      partner_name: partnerName,
      support_email: supportEmail,
      support_phoneno: supportPhone,
      partner_address: partnerAddress
    });
  }, []);

  // Fetch initial data with a full-page loader shown until everything settles
  useEffect(() => {
    const loadInitialData = async () => {
      dispatch(clearError());
      setPageLoading(true);
      try {
        await Promise.allSettled([
          dispatch(fetchAllTickets()),
          dispatch(fetchTicketCategories()),
          dispatch(fetchStatusList()),
        ]);
      } catch (err) {
        console.error("Failed loading initial support data:", err);
      } finally {
        setPageLoading(false);
      }
    };

    loadInitialData();
  }, [dispatch]);

  // Handle success via modal
  useEffect(() => {
    if (success) {
      showAlert(
        "success",
        "Success",
        "Your support ticket has been submitted successfully! We'll get back to you within 24 hours."
      );
      setFormData({
        subject: "",
        description: "",
        priority: "medium",
        category: ""
      });
      dispatch(fetchAllTickets());
      dispatch(clearSuccess());
    }
  }, [success, dispatch]);

  // Handle error via modal
  useEffect(() => {
    if (error) {
      showAlert("error", "Error", error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Show ticket details when fetched
  useEffect(() => {
    if (currentTicket) {
      setShowTicketModal(true);
      setIsLoadingTicket(false);
    }
  }, [currentTicket]);

  // Stable refresh tickets handler
  const handleRefreshTickets = async () => {
    if (isRefreshing || fetchingTickets) return;
    setIsRefreshing(true);
    try {
      await dispatch(fetchAllTickets()).unwrap();
    } catch (err) {
      showAlert("error", "Refresh Failed", err || "Unable to refresh tickets list.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = "Subject must be at least 5 characters";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 20) {
      newErrors.description = "Please provide more details (minimum 20 characters)";
    }
    if (!formData.category) {
      newErrors.category = "Please select a category";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const { userType, userUuid } = getCurrentUser();

    if (!userUuid) {
      showAlert("error", "Error", "User identifier not found. Please login again.");
      return;
    }

    const ticketData = {
      subject: formData.subject,
      description: formData.description,
      priority: formData.priority,
      category: formData.category,
      request_user_type: userType,
      ...(userType === "beneficiary"
        ? { beneficiary_uuid: userUuid }
        : { customer_uuid: userUuid, customer_id: userUuid }),
    };

    await dispatch(storeSupportTicket(ticketData));
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:${partnerInfo.support_email}?subject=Support Request - Customer ID: ${localStorage.getItem('customerUuid') || customerId}`;
  };

  const handlePhoneClick = () => {
    if (partnerInfo.support_phoneno && partnerInfo.support_phoneno !== "Not provided") {
      window.location.href = `tel:${partnerInfo.support_phoneno.replace(/\D/g, '')}`;
    }
  };

  const handleViewTicket = async (ticket) => {
    const ticketUuid = ticket.ticket_uuid || ticket.uuid || ticket.id || ticket.ticket_id;

    if (ticketUuid) {
      setIsLoadingTicket(true);
      setShowTicketModal(true);
      await dispatch(fetchTicketByUuid(ticketUuid));
    } else {
      showAlert("error", "Error", "Invalid ticket ID. Cannot fetch ticket details.");
    }
  };

  const handleCloseModal = () => {
    setShowTicketModal(false);
    setIsEditing(false);
    setShowDeleteConfirm(false);
    setIsLoadingTicket(false);
    dispatch(clearCurrentTicket());
  };

  // Edit ticket handlers
  const handleEditClick = () => {
    if (currentTicket) {
      setEditFormData({
        subject: currentTicket.subject || "",
        description: currentTicket.description || "",
        priority: currentTicket.priority || "medium",
        category: currentTicket.category || ""
      });
      setIsEditing(true);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateTicket = async () => {
    const ticketId = currentTicket.ticket_uuid || currentTicket.uuid || currentTicket.id || currentTicket.ticket_id;

    if (!ticketId) {
      showAlert("error", "Error", "Invalid ticket ID");
      return;
    }

    const result = await dispatch(updateTicket({
      ticketId: ticketId,
      ticketData: editFormData
    }));

    if (updateTicket.fulfilled.match(result)) {
      setIsEditing(false);
      showAlert("success", "Success", "Ticket updated successfully!");
      // Refresh the current ticket with updated data
      await dispatch(fetchTicketByUuid(ticketId));
      // Refresh tickets list in background
      dispatch(fetchAllTickets());
    }
  };

  // Delete ticket handlers
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    const ticketId =
      currentTicket.ticket_uuid ||
      currentTicket.uuid ||
      currentTicket.id ||
      currentTicket.ticket_id;
  
    if (!ticketId) {
      showAlert("error", "Error", "Invalid ticket ID");
      return;
    }
  
    const { userType, userUuid } = getCurrentUser();
  
    const result = await dispatch(
      deleteTicket({
        ticketId,
        requestData: {
          request_user_type: userType,
          ...(userType === "beneficiary"
            ? { beneficiary_uuid: userUuid }
            : { customer_uuid: userUuid }),
        },
      })
    );
  
    if (deleteTicket.fulfilled.match(result)) {
      setShowDeleteConfirm(false);
      setShowTicketModal(false);
      setIsEditing(false);
      showAlert("success", "Deleted", "Ticket deleted successfully!");
      dispatch(fetchAllTickets());
      dispatch(clearCurrentTicket());
    } else {
      console.log("❌ Delete did NOT match fulfilled:", result); // ADD
    }
  };
  
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleStatusUpdate = async () => {
    if (!selectedTicketForStatus || !selectedStatus) return;

    const selectedStatusObj = statusList.find((s) => s.name === selectedStatus);
    if (!selectedStatusObj) {
      showAlert("error", "Error", "Invalid status selected");
      return;
    }

    const ticketId =
      selectedTicketForStatus.ticket_uuid ||
      selectedTicketForStatus.uuid ||
      selectedTicketForStatus.id ||
      selectedTicketForStatus.ticket_id;

    const { userType, userUuid } = getCurrentUser();

    const result = await dispatch(
      updateTicketStatus({
        ticketUuid: ticketId,
        statusId: selectedStatusObj.id,
        requestData: {
          request_user_type: userType,
          ...(userType === "beneficiary"
            ? { beneficiary_uuid: userUuid }
            : { customer_uuid: userUuid }),
        },
      })
    );

    if (updateTicketStatus.fulfilled.match(result)) {
      setShowStatusModal(false);
      setSelectedTicketForStatus(null);
      setSelectedStatus("");
      showAlert("success", "Success", "Status updated successfully!");
      dispatch(fetchAllTickets());
      if (ticketId) {
        dispatch(fetchTicketByUuid(ticketId));
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'low':
        return 'bg-emerald-100 text-emerald-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case 'New':
        return 'bg-indigo-100 text-indigo-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Awaiting Customer':
        return 'bg-yellow-100 text-yellow-800';
      case 'Closed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'Reopened':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTicketUuidDisplay = (ticket) => {
    return ticket.ticket_uuid || ticket.uuid || ticket.id || ticket.ticket_id || 'N/A';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';

      return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "critical", label: "Critical" }
  ];

  const handleViewStatusLogs = async (ticketId) => {
    setShowStatusLogs(true);
    await dispatch(fetchStatusLogs(ticketId));
  };

  // Full page initial loading state — shown until tickets, categories and
  // the status list have all been fetched (or failed) once.
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-50 flex flex-col items-center justify-center p-4">
        <RingLoader color="#3b82f6" size={48} />
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mt-4 text-center">
          Loading Support Portal
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 text-center">
          Fetching your tickets and details...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-50">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-sky-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto py-4 sm:py-6 md:py-8 px-3 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleGoBack}
          className="flex items-center text-sm sm:text-base text-gray-600 hover:text-blue-600 mb-4 sm:mb-6 transition-all bg-white/80 backdrop-blur-sm px-3 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-sm hover:shadow-md border border-blue-100"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
          Back to Dashboard
        </motion.button>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          {/* Left Side - Support Form */}
          <div className="lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-5 sm:p-8">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-2xl font-bold text-white">Submit a Ticket</h1>
                    <p className="text-blue-100 text-xs sm:text-sm mt-0.5 sm:mt-1">We'll respond within 24 hours</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-5 sm:space-y-6 flex-1">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FileText className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="What's your issue about?"
                      className={`block w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 text-sm sm:text-base ${errors.subject ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
                        }`}
                    />
                  </div>
                  {errors.subject && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm mt-1">
                      {errors.subject}
                    </motion.p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute top-3 left-0 pl-4 pointer-events-none">
                      <HelpCircle className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="5"
                      placeholder="Please describe your issue in detail..."
                      className={`block w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 text-sm sm:text-base ${errors.description ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
                        }`}
                    />
                  </div>
                  {errors.description && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm mt-1">
                      {errors.description}
                    </motion.p>
                  )}
                  {formData.description && !errors.description && (
                    <p className="text-gray-400 text-xs mt-1">
                      {formData.description.length} characters (minimum 20)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <AlertCircle className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 bg-gray-50 hover:bg-white text-sm sm:text-base"
                    >
                      {priorityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Tag className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all bg-gray-50 hover:bg-white text-sm sm:text-base ${errors.category ? 'border-rose-500' : 'border-gray-200'
                        }`}
                      disabled={fetchingCategories}
                    >
                      <option value="">{fetchingCategories ? "Loading categories..." : "Select a category"}</option>
                      {categories.map((category) => (
                        <option key={category.id || category.name} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.category && (
                    <p className="text-rose-500 text-sm mt-1">{errors.category}</p>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 sm:py-3.5 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-semibold shadow-lg mt-auto text-sm sm:text-base"
                >
                  {submitting ? (
                    <>
                      <RingLoader color="#ffffff" size={18} />
                      <span>Submitting Ticket...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Submit Ticket</span>
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>

          {/* Right Side - Contact Information & Tickets */}
          <div className="lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Company Header */}
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
                <div className="relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

                  <div className="p-4 sm:p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="p-2.5 sm:p-3 bg-blue-100 rounded-xl sm:rounded-2xl">
                          <Building2Icon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                        </div>
                        <div>
                          <h2 className="text-lg sm:text-2xl font-bold text-gray-800 break-words">{partnerInfo.partner_name}</h2>
                          <div className="flex items-center mt-0.5 sm:mt-1">
                            <p className="text-gray-500 text-xs sm:text-sm">Premium Support</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 self-start sm:self-auto">
                        <div className="flex items-center space-x-1">
                          <Award className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                          <span className="text-xs text-blue-700 font-medium">Trusted</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-600 text-xs sm:text-base leading-relaxed">
                      We're committed to providing you with exceptional support.
                      Our dedicated team is available to assist you with any questions or concerns.
                    </p>
                  </div>

                  {/* Contact Information Cards */}
                  <div className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8">
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {/* Email Support Card */}
                      <motion.div
                        whileHover={{ scale: 1.02, x: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        onClick={handleEmailClick}
                        className="group relative overflow-hidden bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 cursor-pointer hover:bg-gray-100 transition-all duration-300 border border-gray-200"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-50/50 to-blue-50/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                            <div className="p-2 sm:p-2.5 bg-blue-100 rounded-lg sm:rounded-xl group-hover:bg-blue-200 transition-colors">
                              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-700 text-xs sm:text-sm font-medium mb-0.5">Email Support</p>
                              <p className="text-gray-500 text-xs font-mono break-all">{partnerInfo.support_email}</p>
                            </div>
                          </div>
                          <div className="text-gray-400 group-hover:text-blue-500 transition-colors ml-2 flex-shrink-0">
                            <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                          </div>
                        </div>
                      </motion.div>

                      {/* Phone Support Card */}
                      {partnerInfo.support_phoneno && partnerInfo.support_phoneno !== "Not provided" && (
                        <motion.div
                          whileHover={{ scale: 1.02, x: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          onClick={handlePhoneClick}
                          className="group relative overflow-hidden bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 cursor-pointer hover:bg-gray-100 transition-all duration-300 border border-gray-200"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-50/50 to-blue-50/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                              <div className="p-2 sm:p-2.5 bg-blue-100 rounded-lg sm:rounded-xl group-hover:bg-blue-200 transition-colors">
                                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-gray-700 text-xs sm:text-sm font-medium mb-0.5">Phone Support</p>
                                <p className="text-gray-500 text-xs">{partnerInfo.support_phoneno}</p>
                              </div>
                            </div>
                            <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                              <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Office Address Card */}
                      <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200">
                        <div className="flex items-start space-x-3 sm:space-x-4">
                          <div className="p-2 sm:p-2.5 bg-blue-100 rounded-lg sm:rounded-xl">
                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-700 text-xs sm:text-sm font-medium mb-0.5">Office Address</p>
                            <p className="text-gray-500 text-xs leading-relaxed break-words">{partnerInfo.partner_address}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket History Section */}
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 sm:p-5 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
                        <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-xl font-bold text-white">My Tickets</h3>
                        <p className="text-blue-100 text-xs sm:text-sm">Track your support requests</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRefreshTickets}
                      disabled={isRefreshing || fetchingTickets}
                      className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl hover:bg-white/30 transition-all disabled:opacity-50"
                      title="Refresh tickets"
                    >
                      <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 text-white ${isRefreshing || fetchingTickets ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-5 md:p-6">
                  {fetchingTickets && !isRefreshing ? (
                    <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                      <RingLoader color="#3b82f6" size={40} />
                      <p className="mt-3 sm:mt-4 text-gray-500 text-xs sm:text-sm">Loading your tickets...</p>
                    </div>
                  ) : tickets.length > 0 ? (
                    <div className="space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                      {tickets.map((ticket, index) => (
                        <motion.div
                          key={ticket.ticket_uuid || ticket.uuid || ticket.id || index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleViewTicket(ticket)}
                          className="p-3 sm:p-4 border border-blue-100 rounded-xl sm:rounded-2xl hover:bg-blue-50 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h4 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors text-sm sm:text-base break-words flex-1">
                              {ticket.subject}
                            </h4>
                            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                          </div>
                          <div className="flex flex-wrap items-center gap-2 justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 sm:px-2 sm:py-1 rounded-full ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority || 'Medium'}
                              </span>
                              <span className={`text-xs px-2 py-0.5 sm:px-2 sm:py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                                {ticket.status || 'Pending'}
                              </span>
                            </div>
                            <div className="flex items-center text-xs text-gray-400">
                              <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                              <span>{ticket.created_at ? formatDate(ticket.created_at) : 'Recent'}</span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-400 font-mono break-all">
                            Ticket ID: {getTicketUuidDisplay(ticket)}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <Ticket className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                      <p className="text-gray-500 font-medium text-sm sm:text-base">No tickets yet</p>
                      <p className="text-gray-400 text-xs sm:text-sm mt-1">Submit your first support ticket above</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Alert Notification Modal — shows every success/error message */}
      {alertModal.isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/40 z-[100] flex items-center justify-center p-4"
          onClick={closeAlert}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-sm w-full border border-gray-200 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-2.5">
              {alertModal.type === "success" ? (
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
              <h3 className="text-base font-bold text-gray-900">{alertModal.title}</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{alertModal.message}</p>
            <div className="pt-2">
              <button
                onClick={closeAlert}
                className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors"
              >
                Okay
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Ticket Detail Modal with Edit and Delete */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4" onClick={handleCloseModal}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[85vh] sm:max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 sm:p-6 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2 bg-white/20 rounded-xl flex-shrink-0">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-white truncate">
                    {isEditing ? "Edit Ticket" : "Ticket Details"}
                  </h3>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 bg-white/30 hover:bg-white/50 rounded-xl transition-all text-white flex-shrink-0"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {isLoadingTicket || fetchingTicketDetail ? (
              <div className="flex justify-center py-12">
                <Loader className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : currentTicket ? (
              <div className="p-4 sm:p-6 space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="text-sm font-semibold text-gray-500">Ticket ID</label>
                      <p className="text-gray-800 font-mono text-sm break-all">
                        {currentTicket.ticket_uuid || currentTicket.uuid || currentTicket.id || currentTicket.ticket_id || 'N/A'}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={editFormData.subject}
                        onChange={handleEditInputChange}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none text-sm sm:text-base"
                        placeholder="Enter subject"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="description"
                        value={editFormData.description}
                        onChange={handleEditInputChange}
                        rows="4"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none text-sm sm:text-base"
                        placeholder="Enter description"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Priority
                        </label>
                        <select
                          name="priority"
                          value={editFormData.priority}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none text-sm sm:text-base"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Category
                        </label>
                        <select
                          name="category"
                          value={editFormData.category}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm sm:text-base"
                          disabled={fetchingCategories}
                        >
                          <option value="">{fetchingCategories ? "Loading categories..." : "Select category"}</option>
                          {categories.map((category) => (
                            <option key={category.id || category.name} value={category.name}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <button
                        onClick={handleUpdateTicket}
                        disabled={updatingTicket}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2.5 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 text-sm sm:text-base"
                      >
                        {updatingTicket ? "Updating..." : "Update Ticket"}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl hover:bg-gray-300 transition-all text-sm sm:text-base"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-semibold text-gray-500">Ticket ID</label>
                      <p className="text-gray-800 font-mono text-sm break-all">
                        {currentTicket.ticket_uuid || currentTicket.uuid || currentTicket.id || currentTicket.ticket_id || 'N/A'}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-500">Subject</label>
                      <p className="text-gray-800 font-medium break-words">{currentTicket.subject}</p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-500">Description</label>
                      <p className="text-gray-700 whitespace-pre-wrap break-words">{currentTicket.description}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="text-sm font-semibold text-gray-500">Priority</label>
                        <div className="mt-2">
                          <p className={`inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${getPriorityColor(currentTicket.priority)}`}>
                            {currentTicket.priority || 'Medium'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-500">Status</label>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <p className={`inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(currentTicket.status)}`}>
                            {currentTicket.status}
                          </p>
                          <button
                            onClick={() => {
                              setSelectedTicketForStatus(currentTicket);
                              setSelectedStatus(currentTicket.status || 'Pending');
                              setShowStatusModal(true);
                            }}
                            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                            title="Change Status"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500">Category</label>
                      <p className="text-gray-700">{currentTicket.category || 'General'}</p>
                    </div>

                    {currentTicket.created_at && (
                      <div>
                        <label className="text-sm font-semibold text-gray-500">Created At</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <p className="text-gray-700 text-sm">{formatDate(currentTicket.created_at)}</p>
                        </div>
                      </div>
                    )}

                    {currentTicket.updated_at && (
                      <div>
                        <label className="text-sm font-semibold text-gray-500">Last Updated</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <p className="text-gray-700 text-sm">{formatDate(currentTicket.updated_at)}</p>
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        onClick={() => handleViewStatusLogs(currentTicket.id)}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Clock className="w-4 h-4" />
                        <span>View Status Logs</span>
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                      <button
                        onClick={handleEditClick}
                        disabled={updatingTicket}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50 text-sm sm:text-base"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={handleDeleteClick}
                        disabled={deletingTicket}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 text-sm sm:text-base"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="p-8 sm:p-12 text-center">
                <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm sm:text-base">Failed to load ticket details</p>
                <p className="text-gray-400 text-xs sm:text-sm mt-2">The ticket may not exist or you don't have permission to view it.</p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-3 sm:p-4" onClick={handleCancelDelete}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-5 sm:p-6 rounded-t-2xl sm:rounded-t-3xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-base sm:text-xl font-bold text-white">Delete Ticket</h3>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <p className="text-gray-700 mb-2 text-sm sm:text-base">Are you sure you want to delete this ticket?</p>
              <p className="text-gray-500 text-xs sm:text-sm mb-6">This action cannot be undone.</p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleConfirmDelete}
                  disabled={deletingTicket}
                  className="flex-1 bg-red-500 text-white py-2.5 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 text-sm sm:text-base"
                >
                  {deletingTicket ? "Deleting..." : "Yes, Delete"}
                </button>
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl hover:bg-gray-300 transition-all text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && selectedTicketForStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-3 sm:p-4" onClick={() => setShowStatusModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-5 sm:p-6 rounded-t-2xl sm:rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2 bg-white/20 rounded-xl flex-shrink-0">
                    <Tag className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-white">Update Status</h3>
                </div>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all flex-shrink-0"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-700 mb-2 block break-words">
                  Ticket: <span className="text-blue-600">{selectedTicketForStatus.subject}</span>
                </label>
              </div>

              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Select Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 text-sm sm:text-base"
                >
                  {statusList.map((status) => (
                    <option key={status.id} value={status.name}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4 p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-gray-600">
                  Current Status: <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${getStatusColor(selectedTicketForStatus.status)}`}>
                    {selectedTicketForStatus.status || 'Pending'}
                  </span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleStatusUpdate}
                  disabled={updatingStatus}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {updatingStatus ? (
                    <>
                      <RingLoader color="#ffffff" size={18} />
                      <span>Updating...</span>
                    </>
                  ) : (
                    "Update Status"
                  )}
                </button>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Status Logs Modal */}
      {showStatusLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4" onClick={() => setShowStatusLogs(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[70vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-white">Status History</h3>
                </div>
                <button
                  onClick={() => setShowStatusLogs(false)}
                  className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(70vh-100px)]">
              {fetchingStatusLogs ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="mt-3 text-gray-500 text-sm">Loading status history...</p>
                </div>
              ) : statusLogs.length > 0 ? (
                <div className="space-y-3">
                  {statusLogs.map((log, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                        <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(log.status_date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm sm:text-base">No status history available</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
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
}

export default CustomerSupport;