import React, { useState, useEffect, useCallback } from "react";
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
  Ticket,
  RefreshCw,
  Eye,
  Calendar,
  ChevronRight,
  Loader,
  X,
  Edit2,
  Trash2,
  Zap,
  Building2Icon,
} from "lucide-react";
import RingLoader from "react-spinners/RingLoader";

// Import Redux actions and selectors from CustomerSupportSlice
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
  selectFetchingStatusLogs,
} from "../../../../CustomerSupport/CustomerSupportSlice";

function BenefSupport() {
  const { beneficiaryId } = useParams();
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

  // Page loading & refresh state
  const [pageLoading, setPageLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Reusable Alert Modal state
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
    partner_address: "",
  });

  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "medium",
    category: "",
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
    category: "",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusLogs, setShowStatusLogs] = useState(false);

  // Load partner contact info
  useEffect(() => {
    const partnerName = localStorage.getItem("support_partner_name") || "Support Team";
    const supportEmail = localStorage.getItem("partner_support_email") || localStorage.getItem("support_email") || "support@unlimitedremit.com";
    const supportPhone = localStorage.getItem("partner_support_phone") || localStorage.getItem("support_phoneno") || "Not provided";
    const partnerAddress = localStorage.getItem("partner_address") || localStorage.getItem("support_partner_address") || "Global Support Center";

    setPartnerInfo({
      partner_name: partnerName,
      support_email: supportEmail,
      support_phoneno: supportPhone,
      partner_address: partnerAddress,
    });
  }, []);

  // Fetch initial data with full page loader
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

  useEffect(() => {
    if (error && !pageLoading) {
      showAlert("error", "Error", error);
      dispatch(clearError());
    }
  }, [error, pageLoading, dispatch]);

  // Handle Redux success via modal
  useEffect(() => {
    if (success) {
      showAlert("success", "Success", "Your support ticket has been submitted successfully! We'll get back to you within 24 hours.");
      setFormData({
        subject: "",
        description: "",
        priority: "medium",
        category: "",
      });
      dispatch(fetchAllTickets());
      dispatch(clearSuccess());
    }
  }, [success, dispatch]);

  // Handle Redux error via modal
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
  const handleRefreshTickets = useCallback(async () => {
    if (isRefreshing || fetchingTickets) return;
    setIsRefreshing(true);
    try {
      await dispatch(fetchAllTickets()).unwrap();
    } catch (err) {
      showAlert("error", "Refresh Failed", err || "Unable to refresh tickets list.");
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch, isRefreshing, fetchingTickets]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
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

    const benefUuid =
      localStorage.getItem("beneficiary_uuid") ||
      localStorage.getItem("beneficiaryUuid") ||
      localStorage.getItem("beneficaryId");

    if (!benefUuid) {
      showAlert("error", "Error", "Beneficiary identifier not found. Please log in again.");
      return;
    }

    const ticketData = {
      subject: formData.subject,
      description: formData.description,
      priority: formData.priority,
      category: formData.category,
      request_user_type: "beneficiary",
      beneficiary_uuid: benefUuid,
    };

    await dispatch(storeSupportTicket(ticketData));
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:${partnerInfo.support_email}?subject=Support Request - Beneficiary ID: ${beneficiaryId}`;
  };

  const handlePhoneClick = () => {
    if (partnerInfo.support_phoneno && partnerInfo.support_phoneno !== "Not provided") {
      window.location.href = `tel:${partnerInfo.support_phoneno.replace(/\D/g, "")}`;
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

  const handleEditClick = () => {
    if (currentTicket) {
      setEditFormData({
        subject: currentTicket.subject || "",
        description: currentTicket.description || "",
        priority: currentTicket.priority || "medium",
        category: currentTicket.category || "",
      });
      setIsEditing(true);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateTicket = async () => {
    const ticketId = currentTicket.ticket_uuid || currentTicket.uuid || currentTicket.id || currentTicket.ticket_id;
    if (!ticketId) {
      showAlert("error", "Error", "Invalid ticket ID");
      return;
    }

    const result = await dispatch(
      updateTicket({
        ticketId,
        ticketData: editFormData,
      })
    );

    if (updateTicket.fulfilled.match(result)) {
      setIsEditing(false);
      showAlert("success", "Success", "Ticket updated successfully!");
      await dispatch(fetchTicketByUuid(ticketId));
      dispatch(fetchAllTickets());
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    const ticketId =
      currentTicket?.ticket_uuid ||
      currentTicket?.uuid ||
      currentTicket?.id ||
      currentTicket?.ticket_id;

    if (!ticketId) {
      showAlert("error", "Error", "Invalid ticket ID");
      return;
    }

    const actualBenefUuid =
      localStorage.getItem("beneficiary_uuid") ||
      localStorage.getItem("beneficiaryUuid") ||
      beneficiaryId;

    const result = await dispatch(
      deleteTicket({
        ticketId,
        requestData: {
          request_user_type: "beneficiary",
          beneficiary_uuid: actualBenefUuid,
        },
      })
    );

    if (deleteTicket.fulfilled.match(result)) {
      setShowDeleteConfirm(false);
      setShowTicketModal(false);
      setIsEditing(false);
      showAlert("success", "Deleted", result.payload?.message || "Ticket deleted successfully!");
      dispatch(fetchAllTickets());
      dispatch(clearCurrentTicket());
    } else {
      setShowDeleteConfirm(false);
      showAlert("error", "Failed", result.payload || "Failed to delete ticket");
    }
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

    const actualBenefUuid =
      localStorage.getItem("beneficiary_uuid") ||
      localStorage.getItem("beneficiaryUuid") ||
      beneficiaryId;

    const result = await dispatch(
      updateTicketStatus({
        ticketUuid: ticketId,
        statusId: selectedStatusObj.id,
        requestData: {
          request_user_type: "beneficiary",
          beneficiary_uuid: actualBenefUuid,
        },
      })
    );

    if (updateTicketStatus.fulfilled.match(result)) {
      setShowStatusModal(false);
      setSelectedTicketForStatus(null);
      setSelectedStatus("");
      showAlert("success", "Success", "Status updated successfully!");

      if (ticketId) {
        await dispatch(fetchTicketByUuid(ticketId));
      }
      dispatch(fetchAllTickets());
    }
  };

  const handleViewStatusLogs = async (ticketId) => {
    setShowStatusLogs(true);
    await dispatch(fetchStatusLogs(ticketId));
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "low":
        return "bg-emerald-100 text-emerald-800";
      case "medium":
        return "bg-amber-100 text-amber-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "critical":
        return "bg-rose-100 text-rose-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "New":
        return "bg-indigo-100 text-indigo-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Awaiting Customer":
        return "bg-yellow-100 text-yellow-800";
      case "Closed":
        return "bg-emerald-100 text-emerald-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      case "Reopened":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "Invalid Date";
    }
  };

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "critical", label: "Critical" },
  ];

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <RingLoader color="#111827" size={44} />
        <h3 className="text-sm font-semibold text-gray-800 mt-4">Loading Support Portal</h3>
        <p className="text-xs text-gray-500 mt-1">Fetching your tickets and details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Back Button */}
        <div>
          <button
            onClick={handleGoBack}
            className="inline-flex items-center text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-900 bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-2xs transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </button>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-8">
          {/* Support Ticket Submission Form */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 sm:p-6 text-white">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/20 rounded-xl flex-shrink-0">
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold">Submit a Support Ticket</h1>
                  <p className="text-orange-100 text-xs mt-0.5">We respond within 24 hours</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="What is your issue regarding?"
                      className={`w-full pl-9 pr-3.5 py-2 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 ${
                        errors.subject ? "border-red-500 bg-red-50/50" : "border-gray-200 bg-white"
                      }`}
                    />
                  </div>
                  {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <HelpCircle className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Describe your issue with relevant details..."
                      className={`w-full pl-9 pr-3.5 py-2 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 ${
                        errors.description ? "border-red-500 bg-red-50/50" : "border-gray-200 bg-white"
                      }`}
                    />
                  </div>
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <AlertCircle className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 capitalize"
                      >
                        {priorityOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Tag className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        disabled={fetchingCategories}
                        className={`w-full pl-9 pr-3 py-2 border rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 ${
                          errors.category ? "border-red-500" : "border-gray-200"
                        }`}
                      >
                        <option value="">{fetchingCategories ? "Loading..." : "Select category"}</option>
                        {categories.map((cat) => (
                          <option key={cat.id || cat.name} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 sm:py-3 rounded-xl transition-colors flex items-center justify-center space-x-2 text-xs sm:text-sm shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RingLoader color="#ffffff" size={16} />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Ticket</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Contact Details & Ticket History */}
          <div className="lg:col-span-6 space-y-5 sm:space-y-6">
            {/* Contact Details */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-4 sm:p-6">
              <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 mb-3.5">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2 sm:p-2.5 bg-orange-50 text-orange-600 rounded-xl border border-orange-100 flex-shrink-0">
                    <Building2Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-bold text-gray-900 truncate">{partnerInfo.partner_name}</h2>
                    <p className="text-[11px] sm:text-xs text-gray-500">Official Beneficiary Support</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex-shrink-0">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  Verified
                </span>
              </div>

              <div className="space-y-2.5">
                <div
                  onClick={handleEmailClick}
                  className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl border border-gray-100 hover:bg-gray-100/70 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-700 flex-shrink-0">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-500 font-medium">Email Support</p>
                      <p className="text-xs font-mono text-gray-800 truncate">{partnerInfo.support_email}</p>
                    </div>
                  </div>
                  <Send className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 ml-2" />
                </div>

                {partnerInfo.support_phoneno && partnerInfo.support_phoneno !== "Not provided" && (
                  <div
                    onClick={handlePhoneClick}
                    className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl border border-gray-100 hover:bg-gray-100/70 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-700 flex-shrink-0">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-gray-500 font-medium">Phone Support</p>
                        <p className="text-xs text-gray-800 truncate">{partnerInfo.support_phoneno}</p>
                      </div>
                    </div>
                    <Zap className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                )}

                <div className="flex items-start space-x-2.5 p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                  <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-700 flex-shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-500 font-medium">Office Address</p>
                    <p className="text-xs text-gray-800 leading-relaxed break-words">{partnerInfo.partner_address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket History */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Ticket className="w-4 h-4 text-gray-700" />
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">Your Tickets</h3>
                </div>
                <button
                  onClick={handleRefreshTickets}
                  disabled={isRefreshing || fetchingTickets}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Refresh tickets"
                  aria-label="Refresh tickets"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || fetchingTickets ? "animate-spin" : ""}`} />
                </button>
              </div>

              <div className="p-3.5 sm:p-5">
                {fetchingTickets && !isRefreshing ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <RingLoader color="#111827" size={28} />
                    <p className="text-xs text-gray-400 mt-2">Loading tickets...</p>
                  </div>
                ) : tickets.length > 0 ? (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto">
                    {tickets.map((ticket, index) => (
                      <div
                        key={ticket.ticket_uuid || ticket.uuid || ticket.id || index}
                        onClick={() => handleViewTicket(ticket)}
                        className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50/80 cursor-pointer transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-gray-900 truncate flex-1">{ticket.subject}</h4>
                          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority || "Medium"}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStatusColor(ticket.status)}`}>
                              {ticket.status || "Pending"}
                            </span>
                          </div>
                          <div className="flex items-center text-[11px] text-gray-400">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(ticket.created_at)}
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono break-all pt-0.5">
                          Ticket ID: {ticket.ticket_uuid || ticket.uuid || ticket.id || ticket.ticket_id || "N/A"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Ticket className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-gray-600">No support tickets found</p>
                    <p className="text-[11px] mt-0.5">Submit your first ticket using the form.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Notification Modal */}
      {alertModal.isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-[100] flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs"
          onClick={closeAlert}
        >
          <div
            className="bg-white rounded-2xl p-5 sm:p-6 max-w-sm w-full border border-gray-100 shadow-2xl space-y-3 animate-in fade-in zoom-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-2.5">
              {alertModal.type === "success" ? (
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
              <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">{alertModal.title}</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{alertModal.message}</p>
            <div className="pt-2">
              <button
                onClick={closeAlert}
                className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details & Edit Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs" onClick={handleCloseModal}>
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[88vh] overflow-y-auto shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-gray-700" />
                <h3 className="text-sm sm:text-base font-bold text-gray-900">
                  {isEditing ? "Edit Ticket" : "Ticket Details"}
                </h3>
              </div>
              <button onClick={handleCloseModal} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLoadingTicket || fetchingTicketDetail ? (
              <div className="flex justify-center py-10">
                <Loader className="w-6 h-6 animate-spin text-gray-900" />
              </div>
            ) : currentTicket ? (
              <div className="p-4 sm:p-6 space-y-3.5 text-xs sm:text-sm">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Subject</label>
                      <input
                        type="text"
                        name="subject"
                        value={editFormData.subject}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                      <textarea
                        name="description"
                        value={editFormData.description}
                        onChange={handleEditInputChange}
                        rows="4"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
                        <select
                          name="priority"
                          value={editFormData.priority}
                          onChange={handleEditInputChange}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                        <select
                          name="category"
                          value={editFormData.category}
                          onChange={handleEditInputChange}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                        >
                          {categories.map((c) => (
                            <option key={c.id || c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-3">
                      <button
                        onClick={handleUpdateTicket}
                        disabled={updatingTicket}
                        className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 text-xs font-semibold cursor-pointer"
                      >
                        {updatingTicket ? "Updating..." : "Save Changes"}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs flex justify-between items-center">
                      <span className="text-gray-400 font-medium">Ticket ID:</span>
                      <span className="font-mono font-semibold text-gray-700 break-all select-all">
                        {currentTicket.ticket_uuid || currentTicket.uuid || currentTicket.id || currentTicket.ticket_id || "N/A"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-400 block mb-0.5">Subject</span>
                      <p className="font-bold text-gray-900 text-sm">{currentTicket.subject}</p>
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-400 block mb-0.5">Description</span>
                      <p className="text-gray-700 bg-gray-50/80 p-3 rounded-xl border border-gray-100 leading-relaxed whitespace-pre-wrap text-xs">
                        {currentTicket.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] text-gray-400 block mb-1">Priority</span>
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${getPriorityColor(currentTicket.priority)}`}>
                          {currentTicket.priority || "Medium"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-gray-400 block mb-1">Status</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStatusColor(
                              currentTicket.status
                            )}`}
                          >
                            {currentTicket.status}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedTicketForStatus(currentTicket);
                              setSelectedStatus(currentTicket.status || "Pending");
                              setShowStatusModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            title="Change Status"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-400 block mb-0.5">Category</span>
                      <p className="font-semibold text-gray-800 text-xs">{currentTicket.category || "General"}</p>
                    </div>

                    {currentTicket.created_at && (
                      <div className="text-xs text-gray-500 flex items-center gap-1 pt-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>Created: {formatDate(currentTicket.created_at)}</span>
                      </div>
                    )}

                    {currentTicket.updated_at && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>Last Updated: {formatDate(currentTicket.updated_at)}</span>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        onClick={() => handleViewStatusLogs(currentTicket.id)}
                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 underline gap-1 cursor-pointer"
                      >
                        <Clock className="w-3 h-3" />
                        View status history logs
                      </button>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={handleEditClick}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={handleDeleteClick}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-sm w-full border border-gray-100 shadow-2xl space-y-3.5 animate-in fade-in zoom-in duration-150">
            <h3 className="text-sm sm:text-base font-bold text-gray-900">Delete Support Ticket?</h3>
            <p className="text-xs text-gray-500">This action cannot be undone and will remove the ticket from our records.</p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmDelete}
                disabled={deletingTicket}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {deletingTicket ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status History Logs Modal */}
      {showStatusLogs && (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs" onClick={() => setShowStatusLogs(false)}>
          <div
            className="bg-white rounded-2xl max-w-md w-full max-h-[70vh] overflow-hidden border border-gray-100 shadow-2xl animate-in fade-in zoom-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-600" />
                Status History
              </h3>
              <button onClick={() => setShowStatusLogs(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[50vh] space-y-2">
              {fetchingStatusLogs ? (
                <div className="py-8 text-center text-xs text-gray-400">Loading history...</div>
              ) : statusLogs.length > 0 ? (
                statusLogs.map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs border border-gray-100">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                    <span className="text-gray-400 text-[11px]">{formatDate(log.status_date)}</span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-gray-400">No status logs recorded yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && selectedTicketForStatus && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-[60] flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs"
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full border border-gray-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-gray-700" />
                <h3 className="text-xs sm:text-sm font-bold text-gray-900">Update Status</h3>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5">
              <div>
                <label className="text-[11px] font-medium text-gray-500 block mb-0.5">
                  Ticket Subject
                </label>
                <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                  {selectedTicketForStatus.subject}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1">
                  Select New Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  {statusList.map((status) => (
                    <option key={status.id} value={status.name}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleStatusUpdate}
                  disabled={updatingStatus}
                  className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer shadow-2xs"
                >
                  {updatingStatus ? (
                    <>
                      <RingLoader color="#ffffff" size={14} />
                      <span>Updating...</span>
                    </>
                  ) : (
                    "Update Status"
                  )}
                </button>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BenefSupport;