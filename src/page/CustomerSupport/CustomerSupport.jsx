// src/page/CustomerSupport/CustomerSupport.jsx (Complete updated version)

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
  Headphones,
  HelpCircle,
  Clock,
  MessageCircle,
  CheckCircle,
  Award,
  Shield,
  Zap,
  Ticket,
  RefreshCw,
  Eye,
  Calendar,
  ChevronRight,
  Loader,
  X,
  Edit2,
  Trash2, Globe
} from "lucide-react";
import RingLoader from "react-spinners/RingLoader";
import { motion, AnimatePresence } from "framer-motion";

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
  selectTicketCategories,
  selectFetchingCategories,
  selectStatusList,
  selectFetchingStatusList,
  selectUpdatingStatus
} from "../CustomerSupport/CustomerSupportSlice";

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
  const fetchingStatusList = useSelector(selectFetchingStatusList);
  const updatingStatus = useSelector(selectUpdatingStatus);

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
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);
  const [updateSuccessMessage, setUpdateSuccessMessage] = useState("");
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

  // Load partner info from localStorage
  useEffect(() => {
    const partnerName = localStorage.getItem('support_partner_name');
    const supportEmail = localStorage.getItem('partner_support_email');  // Changed from 'support_email'
    const supportPhone = localStorage.getItem('partner_support_phone');  // Changed from 'support_phoneno'
    const partnerAddress = localStorage.getItem('partner_address');

    setPartnerInfo({
      partner_name: partnerName,
      support_email: supportEmail,
      support_phoneno: supportPhone,
      partner_address: partnerAddress
    });

    console.log("Partner info loaded:", {
      partnerName,
      supportEmail,
      supportPhone,
      partnerAddress
    });
  }, []);

  // Handle success from Redux
  useEffect(() => {
    if (success) {
      setSuccessMessage("✨ Your support ticket has been submitted successfully! We'll get back to you within 24 hours.");
      setFormData({
        subject: "",
        description: "",
        priority: "medium",
        category: ""
      });
      // Refresh tickets after successful submission
      dispatch(fetchAllTickets());
      // Clear success after 3 seconds
      setTimeout(() => {
        dispatch(clearSuccess());
        setSuccessMessage("");
      }, 3000);
    }
  }, [success, dispatch]);

  // Handle error from Redux
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
      // Clear error after 5 seconds
      setTimeout(() => {
        dispatch(clearError());
        setErrorMessage("");
      }, 5000);
    }
  }, [error, dispatch]);

  // Handle current ticket from Redux
  useEffect(() => {
    if (currentTicket) {
      setShowTicketModal(true);
      setIsLoadingTicket(false);
      // Clear update success message after showing updated data
      setTimeout(() => {
        setUpdateSuccessMessage("");
      }, 3000);
    }
  }, [currentTicket]);


  // Fetch tickets and categories when component mounts
  useEffect(() => {
    // Fetch tickets
    dispatch(fetchAllTickets());

    // Fetch categories
    dispatch(fetchTicketCategories());
  }, [dispatch]);

  // Fetch status list when component mounts
  useEffect(() => {
    dispatch(fetchStatusList());
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    setSuccessMessage("");
    setErrorMessage("");
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

    const customerUuid = localStorage.getItem('customerUuid');

    if (!customerUuid) {
      setErrorMessage("Customer ID not found. Please login again.");
      return;
    }

    const ticketData = {
      subject: formData.subject,
      description: formData.description,
      priority: formData.priority,
      category: formData.category,
      customer_id: customerUuid
    };

    console.log("Submitting ticket:", ticketData);
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

    console.log("Viewing ticket:", ticket);
    console.log("Ticket UUID to fetch:", ticketUuid);

    if (ticketUuid) {
      setIsLoadingTicket(true);
      setShowTicketModal(true);
      setUpdateSuccessMessage("");
      await dispatch(fetchTicketByUuid(ticketUuid));
    } else {
      setErrorMessage("Invalid ticket ID. Cannot fetch ticket details.");
    }
  };

  const handleCloseModal = () => {
    setShowTicketModal(false);
    setIsEditing(false);
    setShowDeleteConfirm(false);
    setIsLoadingTicket(false);
    setUpdateSuccessMessage("");
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
      setUpdateSuccessMessage("");
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateTicket = async () => {
    const ticketId = currentTicket.ticket_uuid || currentTicket.uuid || currentTicket.id || currentTicket.ticket_id;

    if (!ticketId) {
      setErrorMessage("Invalid ticket ID");
      return;
    }

    const result = await dispatch(updateTicket({
      ticketId: ticketId,
      ticketData: editFormData
    }));

    if (updateTicket.fulfilled.match(result)) {
      setIsEditing(false);
      setUpdateSuccessMessage("✅ Ticket updated successfully!");
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
    const ticketId = currentTicket.ticket_uuid || currentTicket.uuid || currentTicket.id || currentTicket.ticket_id;

    if (!ticketId) {
      setErrorMessage("Invalid ticket ID");
      return;
    }

    const result = await dispatch(deleteTicket(ticketId));

    if (deleteTicket.fulfilled.match(result)) {
      setShowDeleteConfirm(false);
      setShowTicketModal(false);
      setIsEditing(false);
      setSuccessMessage("Ticket deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      // Refresh tickets list
      dispatch(fetchAllTickets());
      dispatch(clearCurrentTicket());
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Status modal handlers
  const handleOpenStatusModal = (ticket, e) => {
    e.stopPropagation();
    setSelectedTicketForStatus(ticket);
    setSelectedStatus(ticket.status || 'Pending');
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedTicketForStatus || !selectedStatus) return;

    const selectedStatusObj = statusList.find(s => s.name === selectedStatus);

    if (!selectedStatusObj) {
      setErrorMessage("Invalid status selected");
      return;
    }

    const result = await dispatch(updateTicketStatus({
      ticketUuid: selectedTicketForStatus.id,  // Use 'id' not 'ticket_uuid'
      statusId: selectedStatusObj.id
    }));

    if (updateTicketStatus.fulfilled.match(result)) {
      setShowStatusModal(false);
      setSelectedTicketForStatus(null);
      setSelectedStatus("");
      setUpdateSuccessMessage("✅ Status updated successfully!");
      setTimeout(() => setUpdateSuccessMessage(""), 3000);
      dispatch(fetchAllTickets());
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'low':
        return 'bg-emerald-100 text-emerald-800';    // Emerald green - softer
      case 'medium':
        return 'bg-amber-100 text-amber-800';        // Amber yellow - warmer
      case 'high':
        return 'bg-orange-100 text-orange-800';      // Orange - good
      case 'critical':
        return 'bg-rose-100 text-rose-800';          // Rose red - more vibrant
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case 'New':
        return 'bg-indigo-100 text-indigo-800';  // Indigo for new/unread
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';      // Blue for ongoing work
      case 'Awaiting Customer':
        return 'bg-yellow-100 text-yellow-800';  // Yellow for waiting (caution)
      case 'Closed':
        return 'bg-green-100 text-green-800';    // Green for completed/success
      case 'Cancelled':
        return 'bg-red-100 text-red-800';        // Red for cancelled/void
      case 'Reopened':
        return 'bg-orange-100 text-orange-800';  // Orange for reopened (different from cancelled)
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

      // Format to local timezone with proper conversion
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-50">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-sky-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleGoBack}
          className="flex items-center text-gray-600 hover:text-blue-600 mb-6 transition-all bg-white/80 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-sm hover:shadow-md border border-blue-100"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Dashboard
        </motion.button>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side - Support Form */}
          <div className="lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Submit a Ticket</h1>
                    <p className="text-blue-100 text-sm mt-1">We'll respond within 24 hours</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 flex-1 ">
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
                      className={`block w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 ${errors.subject ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
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
                      className={`block w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 ${errors.description ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
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
                      className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 bg-gray-50 hover:bg-white"
                    >
                      {priorityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.icon} {option.label}
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
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all bg-gray-50 hover:bg-white ${errors.category ? 'border-rose-500' : 'border-gray-200'
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
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3.5 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-semibold shadow-lg mt-auto"
                >
                  {submitting ? (
                    <>
                      <RingLoader color="#ffffff" size={20} />
                      <span>Submitting Ticket...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
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
              className="space-y-6"
            >
              {/* Company Header - Fixed with white background */}
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="relative">
                  {/* Decorative top bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-100 rounded-2xl">
                          <Headphones className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800">{partnerInfo.partner_name}</h2>
                          <div className="flex items-center mt-1">
                            <p className="text-gray-500 text-sm"> Premium Support</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-full px-3 py-1.5">
                        <div className="flex items-center space-x-1">
                          <Award className="w-4 h-4 text-blue-600" />
                          <span className="text-xs text-blue-700 font-medium">Trusted</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-600 leading-relaxed">
                      We're committed to providing you with exceptional support.
                      Our dedicated team is available to assist you with any questions or concerns.
                    </p>
                  </div>

                  {/* Contact Information Cards */}
                  <div className="px-8 pb-8">
                    <div className="grid grid-cols-1 gap-4">
                      {/* Email Support Card */}
                      <motion.div
                        whileHover={{ scale: 1.02, x: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        onClick={handleEmailClick}
                        className="group relative overflow-hidden bg-gray-50 rounded-2xl p-4 cursor-pointer hover:bg-gray-100 transition-all duration-300 border border-gray-200"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-50/50 to-blue-50/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center space-x-4">
                            <div className="p-2.5 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                              <Mail className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-gray-700 text-sm font-medium mb-0.5">Email Support</p>
                              <p className="text-gray-500 text-xs font-mono">{partnerInfo.support_email}</p>
                            </div>
                          </div>
                          <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                            <Send className="w-4 h-4" />
                          </div>
                        </div>
                      </motion.div>

                      {/* Phone Support Card */}
                      {partnerInfo.support_phoneno && partnerInfo.support_phoneno !== "Not provided" && (
                        <motion.div
                          whileHover={{ scale: 1.02, x: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          onClick={handlePhoneClick}
                          className="group relative overflow-hidden bg-gray-50 rounded-2xl p-4 cursor-pointer hover:bg-gray-100 transition-all duration-300 border border-gray-200"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-50/50 to-blue-50/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center space-x-4">
                              <div className="p-2.5 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                                <Phone className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-gray-700 text-sm font-medium mb-0.5">Phone Support</p>
                                <p className="text-gray-500 text-xs">{partnerInfo.support_phoneno}</p>
                              </div>
                            </div>
                            <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                              <Zap className="w-4 h-4" />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Office Address Card */}
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                        <div className="flex items-start space-x-4">
                          <div className="p-2.5 bg-blue-100 rounded-xl">
                            <MapPin className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-700 text-sm font-medium mb-0.5">Office Address</p>
                            <p className="text-gray-500 text-xs leading-relaxed">{partnerInfo.partner_address}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket History Section */}
              {/* Ticket History Section */}
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <Ticket className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">My Tickets</h3>
                        <p className="text-blue-100 text-sm">Track your support requests</p>
                      </div>
                    </div>
                    <button
                      onClick={() => dispatch(fetchAllTickets())}
                      disabled={fetchingTickets}
                      className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all"
                    >
                      <RefreshCw className={`w-4 h-4 text-white ${fetchingTickets ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {fetchingTickets ? (
                    // Loading State
                    <div className="flex flex-col items-center justify-center py-12">
                      <RingLoader color="#3b82f6" size={50} />
                      <p className="mt-4 text-gray-500 text-sm">Loading your tickets...</p>
                    </div>
                  ) : tickets.length > 0 ? (
                    // Tickets List
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {tickets.map((ticket, index) => (
                        <motion.div
                          key={ticket.ticket_uuid || ticket.uuid || ticket.id || index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleViewTicket(ticket)}
                          className="p-4 border border-blue-100 rounded-2xl hover:bg-blue-50 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                              {ticket.subject}
                            </h4>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority || 'Medium'}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                                {ticket.status || 'Pending'}
                              </span>
                            </div>
                            <div className="flex items-center text-xs text-gray-400">
                              <Calendar className="w-3 h-3 mr-1" />
                              {ticket.created_at ? formatDate(ticket.created_at) : 'Recent'}
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-400 font-mono">
                            Ticket ID: {getTicketUuidDisplay(ticket)}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    // Empty State
                    <div className="text-center py-12">
                      <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No tickets yet</p>
                      <p className="text-gray-400 text-sm mt-1">Submit your first support ticket above</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Ticket Detail Modal with Edit and Delete */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 sticky top-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {isEditing ? "Edit Ticket" : "Ticket Details"}
                  </h3>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 bg-white/30 hover:bg-white/50 rounded-xl transition-all text-white"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Update Success Message */}
            {updateSuccessMessage && (
              <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <p className="text-green-700">{updateSuccessMessage}</p>
                </div>
              </div>
            )}

            {isLoadingTicket || fetchingTicketDetail ? (
              <div className="flex justify-center py-12">
                <Loader className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : currentTicket ? (
              <div className="p-6 space-y-4">
                {isEditing ? (
                  // Edit Form
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
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
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
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                        placeholder="Enter description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Priority
                        </label>
                        <select
                          name="priority"
                          value={editFormData.priority}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                        >
                          <option value="low"> Low</option>
                          <option value="medium"> Medium</option>
                          <option value="high"> High</option>
                          <option value="critical"> Critical</option>
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
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
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

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleUpdateTicket}
                        disabled={updatingTicket}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50"
                      >
                        {updatingTicket ? "Updating..." : "Update Ticket"}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl hover:bg-gray-300 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  // View Mode
                  <>
                    <div>
                      <label className="text-sm font-semibold text-gray-500">Ticket ID</label>
                      <p className="text-gray-800 font-mono text-sm break-all">
                        {currentTicket.ticket_uuid || currentTicket.uuid || currentTicket.id || currentTicket.ticket_id || 'N/A'}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-500">Subject</label>
                      <p className="text-gray-800 font-medium">{currentTicket.subject}</p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-500">Description</label>
                      <p className="text-gray-700 whitespace-pre-wrap">{currentTicket.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-semibold text-gray-500">Priority</label>
                        <div className="mt-2">
                          <p className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getPriorityColor(currentTicket.priority)}`}>
                            {currentTicket.priority || 'Medium'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-500">Status</label>
                        <div className="mt-2">
                          <p className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(currentTicket.status)}`}>
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
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <p className="text-gray-700">{formatDate(currentTicket.created_at)}</p>
                        </div>
                      </div>
                    )}

                    {currentTicket.updated_at && (
                      <div>
                        <label className="text-sm font-semibold text-gray-500">Last Updated</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <p className="text-gray-700">{formatDate(currentTicket.updated_at)}</p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons at bottom right */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                      <button
                        onClick={handleEditClick}
                        disabled={updatingTicket}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={handleDeleteClick}
                        disabled={deletingTicket}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-gray-500">Failed to load ticket details</p>
                <p className="text-gray-400 text-sm mt-2">The ticket may not exist or you don't have permission to view it.</p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4" onClick={handleCancelDelete}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-3xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-3xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Delete Ticket</h3>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-2">Are you sure you want to delete this ticket?</p>
              <p className="text-gray-500 text-sm mb-6">This action cannot be undone.</p>

              <div className="flex gap-3">
                <button
                  onClick={handleConfirmDelete}
                  disabled={deletingTicket}
                  className="flex-1 bg-red-500 text-white py-2 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {deletingTicket ? "Deleting..." : "Yes, Delete"}
                </button>
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl hover:bg-gray-300 transition-all"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowStatusModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-3xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Tag className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Update Status</h3>
                </div>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50"
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

              <div className="flex gap-3">
                <button
                  onClick={handleStatusUpdate}
                  disabled={updatingStatus}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50"
                >
                  {updatingStatus ? (
                    <>
                      <RingLoader color="#ffffff" size={18} />
                      <span className="ml-2">Updating...</span>
                    </>
                  ) : (
                    "Update Status"
                  )}
                </button>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
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