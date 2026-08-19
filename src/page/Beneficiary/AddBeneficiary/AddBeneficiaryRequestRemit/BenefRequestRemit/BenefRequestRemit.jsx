// /src/page/Beneficiary/AddBeneficiary/AddBeneficiaryRequestRemit/BenefRequestRemit/BenefRequestRemit.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    FaHandHoldingUsd,
    FaCopy,
    FaExternalLinkAlt,
    FaHistory,
    FaTrash,
    FaTimes,
    FaCheckCircle,
    FaExclamationCircle,
    FaEdit,
    FaEnvelope,
    FaCheck,
} from "react-icons/fa";
import { ClipLoader } from "react-spinners";

const API_URL = import.meta.env.VITE_API_URL;

function BenefRequestRemit() {
    const { beneficiaryId } = useParams();
    const authtoken = localStorage.getItem("authtoken");
    const loginUserType = localStorage.getItem("login_user_type");

    // Core data
    const [beneficiaryData, setBeneficiaryData] = useState(null);
    const [requestRemits, setRequestRemits] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [senders, setSenders] = useState([]);

    // Loading flags
    const [pageLoading, setPageLoading] = useState(true);
    const [listLoading, setListLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // Create form
    const [formData, setFormData] = useState({
        beneficiary_bank_id: "",
        amount: "",
        currency: "USD",
        senders: [],
    });
    const [errors, setErrors] = useState({});

    // Created link popup modal
    const [createdLinkModal, setCreatedLinkModal] = useState({
        isOpen: false,
        link: "",
        message: "",
    });
    const [isCopied, setIsCopied] = useState(false);

    // Edit modal state
    const [editModalRequest, setEditModalRequest] = useState(null);
    const [editFormData, setEditFormData] = useState({
        beneficiary_bank_id: "",
        amount: "",
        currency: "USD",
        status_lists_id: "",
    });
    const [editErrors, setEditErrors] = useState({});

    // General Feedback Modal (Success / Error)
    const [feedbackModal, setFeedbackModal] = useState({
        isOpen: false,
        type: "success",
        title: "",
        message: "",
        data: null,
    });

    // Status log modal
    const [historyModalRequest, setHistoryModalRequest] = useState(null);
    const [historyLogs, setHistoryLogs] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [statusModalRequest, setStatusModalRequest] = useState(null);
    const [selectedStatusId, setSelectedStatusId] = useState("");
    const [statusRemarks, setStatusRemarks] = useState("");
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Delete confirm
    const [deleteTarget, setDeleteTarget] = useState(null);

    const authHeaders = {
        Authorization: `Bearer ${authtoken}`,
        "Content-Type": "application/json",
    };

    // ---------- Fetchers ----------

    const fetchBeneficiaryData = useCallback(async () => {
        if (!beneficiaryId) return;
        try {
            const response = await fetch(
                `${API_URL}/beneficiaries/fetch-merchant-benef/${beneficiaryId}`,
                { headers: authHeaders }
            );
            const data = await response.json();
            if (data.data) {
                setBeneficiaryData(data.data);
                if (data.data.benef_banks?.length > 0 && !formData.beneficiary_bank_id) {
                    setFormData((prev) => ({
                        ...prev,
                        beneficiary_bank_id: data.data.benef_banks[0].id.toString(),
                        currency: data.data.benef_banks[0].currency_code || "USD",
                    }));
                }
            }
        } catch (error) {
            console.error("Error fetching beneficiary data:", error);
        }
    }, [beneficiaryId]);

    const fetchCurrencies = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/payout-currencies`, {
                headers: authHeaders,
            });
            const data = await response.json();
            const list = Array.isArray(data)
                ? data
                : data.currencies || data.data || [];
            setCurrencies(list);
        } catch (error) {
            console.error("Error fetching currencies:", error);
            setCurrencies([]);
        }
    }, []);

    const fetchStatuses = useCallback(async () => {
        try {
            const response = await fetch(
                `${API_URL}/beneficiaries/request-remit-status-view`,
                { headers: authHeaders }
            );
            const data = await response.json();
            const list = Array.isArray(data.data)
                ? data.data
                : Array.isArray(data)
                    ? data
                    : [];
            setStatuses(list);
        } catch (error) {
            console.error("Error fetching statuses:", error);
            setStatuses([]);
        }
    }, []);

    const fetchSenders = useCallback(async () => {
        if (!beneficiaryId) return;
        try {
            const response = await fetch(
                `${API_URL}/beneficiaries/senders/${beneficiaryId}`,
                { headers: authHeaders }
            );
            const data = await response.json();
            const list = data.getbenefsendersacctobeneficiaryid_data || [];
            setSenders(
                list.map((item) => ({
                    id: item.customer_id,
                    name: `${item.customer?.first_name || ""} ${item.customer?.last_name || ""
                        }`.trim(),
                    email: item.customer?.email || "",
                }))
            );
        } catch (error) {
            console.error("Error fetching senders:", error);
        }
    }, [beneficiaryId]);

    const fetchRequestRemits = useCallback(async () => {
        if (!beneficiaryId) return;
        try {
            setListLoading(true);
            const response = await fetch(
                `${API_URL}/beneficiaries/request-remits/${beneficiaryId}`,
                { headers: authHeaders }
            );
            const data = await response.json();
            const list = Array.isArray(data.data) ? data.data : [];
            setRequestRemits(list);
        } catch (error) {
            console.error("Error fetching request remits:", error);
            toast.error("Failed to load request remits");
        } finally {
            setListLoading(false);
        }
    }, [beneficiaryId]);

    useEffect(() => {
        const loadAll = async () => {
            setPageLoading(true);
            await Promise.all([
                fetchBeneficiaryData(),
                fetchCurrencies(),
                fetchStatuses(),
                fetchSenders(),
                fetchRequestRemits(),
            ]);
            setPageLoading(false);
        };
        loadAll();
    }, [beneficiaryId]);

    // ---------- Create request remit ----------

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleSenderToggle = (senderId) => {
        setFormData((prev) => {
            const isSelected = prev.senders.includes(senderId);
            return {
                ...prev,
                senders: isSelected
                    ? prev.senders.filter((id) => id !== senderId)
                    : [...prev.senders, senderId],
            };
        });
    };

    const handleSelectAllSenders = () => {
        setFormData((prev) => ({ ...prev, senders: senders.map((s) => s.id) }));
    };

    const handleClearAllSenders = () => {
        setFormData((prev) => ({ ...prev, senders: [] }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = "Valid amount is required";
        }
        if (!formData.currency) newErrors.currency = "Currency is required";
        if (!formData.beneficiary_bank_id) {
            newErrors.beneficiary_bank_id = "Bank account is required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreateRequestRemit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setCreating(true);
        try {
            const response = await fetch(`${API_URL}/transactions/request-remit`, {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify({
                    beneficiary_id: beneficiaryId,
                    beneficiary_bank_id: formData.beneficiary_bank_id,
                    amount: formData.amount,
                    currency: formData.currency,
                    senders: formData.senders,
                    author_source: "zap",
                    author_type: loginUserType,
                    author_id: localStorage.getItem("beneficiary_uuid"),
                }),
            });

            const result = await response.json();

            if (response.ok && (result.status === "success" || response.status === 200 || response.status === 201)) {
                setFormData((prev) => ({ ...prev, amount: "", senders: [] }));
                fetchRequestRemits();

                const generatedLink = result.data?.requestRemitLink || "";
                setCreatedLinkModal({
                    isOpen: true,
                    link: generatedLink,
                    message: result.message || "Request Remit Processed successfully",
                });
            } else {
                setFeedbackModal({
                    isOpen: true,
                    type: "error",
                    title: "Creation Failed",
                    message: result.message || "Failed to create request remit.",
                    data: null,
                });
            }
        } catch (error) {
            console.error("Error creating request remit:", error);
            setFeedbackModal({
                isOpen: true,
                type: "error",
                title: "Network Error",
                message: "An unexpected network error occurred. Please try again.",
                data: null,
            });
        } finally {
            setCreating(false);
        }
    };

    // ---------- Gmail & Copy Helpers ----------

    const handleSendViaGmail = (link, amount, currency) => {
        if (!link) {
            toast.error("No remittance link available to share.");
            return;
        }
        const subject = encodeURIComponent(
            amount && currency
                ? `Remittance Payment Request: ${amount} ${currency}`
                : "Remittance Payment Request"
        );
        const body = encodeURIComponent(
            `Hello,\n\nPlease use the following secure link to complete the requested remittance transfer${amount && currency ? ` of ${amount} ${currency}` : ""
            }:\n\n${link}\n\nThank you!`
        );
        window.open(
            `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`,
            "_blank"
        );
    };

    const handleCopyGeneratedLink = async () => {
        if (!createdLinkModal.link) return;
        try {
            await navigator.clipboard.writeText(createdLinkModal.link);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (error) {
            toast.error("Failed to copy link");
        }
    };

    // ---------- Edit request remit ----------

    const openEditModal = (request) => {
        setEditModalRequest(request);
        setEditFormData({
            beneficiary_bank_id: request.beneficiary_bank_id?.toString() || "",
            amount: request.amount || "",
            currency: request.currency || "USD",
            status_lists_id: request.status_lists_id?.toString() || request.status_id?.toString() || "",
        });
        setEditErrors({});
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData((prev) => ({ ...prev, [name]: value }));
        if (editErrors[name]) setEditErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validateEditForm = () => {
        const newErrors = {};
        if (!editFormData.amount || parseFloat(editFormData.amount) <= 0) {
            newErrors.amount = "Valid amount is required";
        }
        setEditErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleUpdateRequestRemit = async (e) => {
        e.preventDefault();
        if (!validateEditForm() || !editModalRequest) return;

        setUpdating(true);
        try {
            const response = await fetch(`${API_URL}/beneficiaries/request-remit-updatedlog-store`, {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify({
                    request_remit_id: editModalRequest.id?.toString(),
                    status_lists_id: editFormData.status_lists_id?.toString() || undefined,
                    amount: editFormData.amount?.toString(),
                    user_type: loginUserType,
                    user_id: Number(beneficiaryId),
                }),
            });

            const result = await response.json();

            // Check if the HTTP status is in the 2xx success range (200, 201, etc.)
            if (response.ok) {
                setEditModalRequest(null);
                fetchRequestRemits();
                setFeedbackModal({
                    isOpen: true,
                    type: "success",
                    title: "Request Updated Successfully!",
                    message: result.message || "Your remittance request details have been updated.",
                    data: null,
                });
            } else {
                setFeedbackModal({
                    isOpen: true,
                    type: "error",
                    title: "Update Failed",
                    message: result.message || "Unable to update the request remit.",
                    data: null,
                });
            }
        } catch (error) {
            console.error("Error updating request remit:", error);
            setFeedbackModal({
                isOpen: true,
                type: "error",
                title: "Network Error",
                message: "An error occurred while updating the remittance request.",
                data: null,
            });
        } finally {
            setUpdating(false);
        }
    };

    // ---------- Copy link (Table button) ----------

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success("Link copied to clipboard!");
        } catch (error) {
            toast.error("Failed to copy link");
        }
    };

    // ---------- Status log history ----------

    const openHistoryModal = async (request) => {
        setHistoryModalRequest(request);
        setHistoryLogs([]);
        setHistoryLoading(true);
        try {
            const response = await fetch(
                `${API_URL}/beneficiaries/request-remit-statuslog-view?request_remit_id=${request.id}`,
                { headers: authHeaders }
            );
            const result = await response.json();
            const logs = Array.isArray(result.data)
                ? result.data
                : Array.isArray(result)
                    ? result
                    : [];
            setHistoryLogs(logs);
        } catch (error) {
            console.error("Error fetching status log:", error);
            toast.error("Failed to load history");
        } finally {
            setHistoryLoading(false);
        }
    };

    const openStatusModal = (request) => {
        setStatusModalRequest(request);
        setSelectedStatusId(request.status_lists_id?.toString() || request.status_id?.toString() || "");
        setStatusRemarks("");
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        if (!selectedStatusId || !statusModalRequest) {
            toast.error("Please select a status");
            return;
        }

        setUpdatingStatus(true);
        try {
            const response = await fetch(`${API_URL}/beneficiaries/request-remit-statuslog-store`, {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify({
                    request_remit_id: statusModalRequest.request_remit_uuid || statusModalRequest.id?.toString(),
                    status_lists_id: selectedStatusId.toString(),
                    remarks: statusRemarks.trim() || undefined,
                    author_source: "zap",
                    author_type: loginUserType,
                    author_id: localStorage.getItem("beneficiary_uuid"),
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setStatusModalRequest(null);
                fetchRequestRemits();
                setFeedbackModal({
                    isOpen: true,
                    type: "success",
                    title: "Status Updated",
                    message: result.message || "Request remit status updated successfully!",
                    data: null,
                });
            } else {
                setFeedbackModal({
                    isOpen: true,
                    type: "error",
                    title: "Update Failed",
                    message: result.message || "Failed to update status.",
                    data: null,
                });
            }
        } catch (error) {
            console.error("Error updating status log:", error);
            setFeedbackModal({
                isOpen: true,
                type: "error",
                title: "Network Error",
                message: "An error occurred while updating the status.",
                data: null,
            });
        } finally {
            setUpdatingStatus(false);
        }
    };
    // ---------- Delete request remit ----------

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setDeletingId(deleteTarget.id);
        try {
            const response = await fetch(
                `${API_URL}/beneficiaries/delete-request-remit/${deleteTarget.request_remit_uuid}`,
                {
                    method: "POST",
                    headers: authHeaders,
                    body: JSON.stringify({
                        deleted_source: "zap",
                        deleted_author_type: loginUserType,
                        deleted_by_uuid: localStorage.getItem("beneficiary_uuid"),
                    }),
                }
            );
            const result = await response.json();

            if (response.ok && (result.status === "success" || response.status === 200)) {
                await fetchRequestRemits();
                setDeleteTarget(null);
                setFeedbackModal({
                    isOpen: true,
                    type: "success",
                    title: "Request Deleted",
                    message: result.message || "The request remit has been successfully deleted.",
                    data: null,
                });
            } else {
                setDeleteTarget(null);
                setFeedbackModal({
                    isOpen: true,
                    type: "error",
                    title: "Deletion Failed",
                    message: result.message || "Failed to delete request remit.",
                    data: null,
                });
            }
        } catch (error) {
            console.error("Error deleting request remit:", error);
            setDeleteTarget(null);
            setFeedbackModal({
                isOpen: true,
                type: "error",
                title: "Network Error",
                message: "An error occurred while deleting the request.",
                data: null,
            });
        } finally {
            setDeletingId(null);
        }
    };

    // ---------- Helpers ----------

    const getBankDisplayText = (bank) => {
        if (!bank) return "Unknown Bank";
        const name = bank.bank_name || bank.name || "Unknown Bank";
        const acc = bank.bank_acc_no || bank.account_number;
        return acc ? `${name} - ****${acc.slice(-4)}` : name;
    };

    if (pageLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <ClipLoader size={36} color="#111827" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <ToastContainer position="top-right" autoClose={4000} theme="light" />

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                    <FaHandHoldingUsd className="text-amber-600" />
                </div>
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">Request Remit</h1>
                    <p className="text-sm text-gray-500">
                        Create and manage remittance requests for this beneficiary
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-900 tracking-wide uppercase">
                                New Request
                            </h3>
                        </div>
                        <form onSubmit={handleCreateRequestRemit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Destination Account
                                </label>
                                <select
                                    name="beneficiary_bank_id"
                                    value={formData.beneficiary_bank_id}
                                    onChange={handleChange}
                                    className={`w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm ${errors.beneficiary_bank_id
                                        ? "border-red-300 focus:ring-1 focus:ring-red-500"
                                        : "border-gray-200 focus:ring-1 focus:ring-gray-900"
                                        } focus:outline-none`}
                                >
                                    <option value="">Select bank account</option>
                                    {beneficiaryData?.benef_banks?.map((bank) => (
                                        <option key={bank.id} value={bank.id}>
                                            {getBankDisplayText(bank)}
                                        </option>
                                    ))}
                                </select>
                                {errors.beneficiary_bank_id && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.beneficiary_bank_id}
                                    </p>
                                )}
                            </div>

                            {senders.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Senders
                                        </label>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={handleSelectAllSenders}
                                                className="text-xs text-gray-900 hover:text-gray-600 font-medium"
                                            >
                                                Select All
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleClearAllSenders}
                                                className="text-xs text-gray-400 hover:text-gray-600 font-medium"
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                                        {senders.map((sender) => (
                                            <div
                                                key={sender.id}
                                                onClick={() => handleSenderToggle(sender.id)}
                                                className={`flex items-center p-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${formData.senders.includes(sender.id)
                                                    ? "bg-gray-50"
                                                    : "hover:bg-gray-50"
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.senders.includes(sender.id)}
                                                    onChange={() => handleSenderToggle(sender.id)}
                                                    className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                                                />
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {sender.name || "Unnamed"}
                                                    </p>
                                                    <p className="text-xs text-gray-400">{sender.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {formData.senders.length > 0 && (
                                        <p className="text-xs text-gray-500 mt-1.5">
                                            {formData.senders.length} sender(s) selected
                                        </p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Amount
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    min="1"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    placeholder=""
                                    className={`w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm ${errors.amount
                                        ? "border-red-300 focus:ring-1 focus:ring-red-500"
                                        : "border-gray-200 focus:ring-1 focus:ring-gray-900"
                                        } focus:outline-none`}
                                />
                                {errors.amount && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.amount}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Currency
                                </label>
                                <select
                                    name="currency"
                                    value={formData.currency}
                                    onChange={handleChange}
                                    className={`w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm ${errors.currency
                                        ? "border-red-300 focus:ring-1 focus:ring-red-500"
                                        : "border-gray-200 focus:ring-1 focus:ring-gray-900"
                                        } focus:outline-none`}
                                >
                                    <option value="">Select currency</option>
                                    {currencies.map((c, i) => {
                                        const code = typeof c === "string" ? c : c.currency_code;
                                        const label =
                                            typeof c === "string"
                                                ? c
                                                : c.icon
                                                    ? `${c.icon} ${c.currency_code}`
                                                    : c.currency_code;
                                        return (
                                            <option key={code || i} value={code}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                                {errors.currency && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.currency}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={creating}
                                className={`w-full py-3 rounded-lg font-medium text-white text-sm transition-colors ${creating
                                    ? "bg-gray-300 cursor-not-allowed"
                                    : "bg-gray-900 hover:bg-gray-800"
                                    }`}
                            >
                                {creating ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <ClipLoader size={16} color="#ffffff" />
                                        Creating...
                                    </span>
                                ) : (
                                    "Create Request"
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Request remit list */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900 tracking-wide uppercase">
                                Request History
                            </h3>
                            <button
                                onClick={fetchRequestRemits}
                                className="text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors"
                            >
                                Refresh
                            </button>
                        </div>

                        <div className="p-5">
                            {listLoading ? (
                                <div className="text-center py-8">
                                    <ClipLoader size={24} color="#111827" />
                                </div>
                            ) : requestRemits.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-gray-500 text-sm">No request remits yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {requestRemits.map((request) => (
                                        <div
                                            key={request.id}
                                            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">
                                                        {request.amount} {request.currency}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {request.created_at
                                                            ? new Date(request.created_at).toLocaleDateString(
                                                                "en-US",
                                                                { month: "short", day: "numeric", year: "numeric" }
                                                            )
                                                            : "N/A"}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {request.request_remit_link && (
                                                        <>
                                                            <button
                                                                onClick={() => copyToClipboard(request.request_remit_link)}
                                                                className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                                                                title="Copy link"
                                                            >
                                                                <FaCopy size={13} />
                                                            </button>
                                                            <a
                                                                href={request.request_remit_link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                                                                title="Open link"
                                                            >
                                                                <FaExternalLinkAlt size={13} />
                                                            </a>
                                                        </>
                                                    )}

                                                    {/* Send in Gmail */}
                                                    <button
                                                        onClick={() =>
                                                            handleSendViaGmail(
                                                                request.request_remit_link,
                                                                request.amount,
                                                                request.currency
                                                            )
                                                        }
                                                        className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-red-500 hover:bg-red-50 transition-colors"
                                                        title="Send via Gmail"
                                                    >
                                                        <FaEnvelope size={13} />
                                                    </button>

                                                    <button
                                                        onClick={() => openStatusModal(request)}
                                                        className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 transition-colors"
                                                        title="Update status"
                                                    >
                                                        <FaCheckCircle size={13} />
                                                    </button>

                                                    <button
                                                        onClick={() => openEditModal(request)}
                                                        className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                                                        title="Edit request"
                                                    >
                                                        <FaEdit size={13} />
                                                    </button>

                                                    <button
                                                        onClick={() => openHistoryModal(request)}
                                                        className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                                                        title="View history"
                                                    >
                                                        <FaHistory size={13} />
                                                    </button>

                                                    <button
                                                        onClick={() => setDeleteTarget(request)}
                                                        className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <FaTrash size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Link Share Popup Modal */}
            {createdLinkModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in duration-150">
                        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-4">
                            <FaCheckCircle size={28} />
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            Remittance Link Ready!
                        </h3>
                        <p className="text-sm text-gray-500 mb-5">
                            {createdLinkModal.message}
                        </p>

                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 mb-5 text-left">
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                                Shareable Remittance Link
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={createdLinkModal.link}
                                    className="bg-transparent text-xs text-gray-700 font-mono w-full focus:outline-none select-all truncate"
                                />
                                <button
                                    onClick={handleCopyGeneratedLink}
                                    className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-700 text-xs font-medium flex items-center gap-1.5 transition-colors flex-shrink-0"
                                >
                                    {isCopied ? (
                                        <>
                                            <FaCheck className="text-emerald-600" size={11} />
                                            <span className="text-emerald-600">Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaCopy size={11} />
                                            <span>Copy</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleSendViaGmail(createdLinkModal.link)}
                                className="w-full py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                            >
                                <FaEnvelope className="text-red-500 text-sm" />
                                <span>Send in Gmail</span>
                            </button>

                            <button
                                onClick={() => setCreatedLinkModal({ isOpen: false, link: "", message: "" })}
                                className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Request Modal */}
            {editModalRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-150">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <FaEdit className="text-amber-600" /> Edit Remit Request
                            </h3>
                            <button
                                onClick={() => setEditModalRequest(null)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateRequestRemit} className="p-5 space-y-4">
                            {/* Destination Bank (Disabled) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1.5">
                                    Destination Account (Locked)
                                </label>
                                <select
                                    disabled
                                    name="beneficiary_bank_id"
                                    value={editFormData.beneficiary_bank_id}
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 text-sm cursor-not-allowed focus:outline-none"
                                >
                                    <option value="">Select bank account</option>
                                    {beneficiaryData?.benef_banks?.map((bank) => (
                                        <option key={bank.id} value={bank.id}>
                                            {getBankDisplayText(bank)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Amount (Editable) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Amount
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    min="1"
                                    step="0.01"
                                    value={editFormData.amount}
                                    onChange={handleEditChange}
                                    placeholder="0.00"
                                    className={`w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm ${editErrors.amount
                                        ? "border-red-300 focus:ring-1 focus:ring-red-500"
                                        : "border-gray-200 focus:ring-1 focus:ring-gray-900"
                                        } focus:outline-none`}
                                />
                                {editErrors.amount && (
                                    <p className="mt-1.5 text-sm text-red-600">{editErrors.amount}</p>
                                )}
                            </div>

                            {/* Currency (Disabled) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1.5">
                                    Currency (Locked)
                                </label>
                                <select
                                    disabled
                                    name="currency"
                                    value={editFormData.currency}
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 text-sm cursor-not-allowed focus:outline-none"
                                >
                                    <option value="">Select currency</option>
                                    {currencies.map((c, i) => {
                                        const code = typeof c === "string" ? c : c.currency_code;
                                        const label =
                                            typeof c === "string"
                                                ? c
                                                : c.icon
                                                    ? `${c.icon} ${c.currency_code}`
                                                    : c.currency_code;
                                        return (
                                            <option key={code || i} value={code}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Status Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Status
                                </label>
                                <select
                                    name="status_lists_id"
                                    value={editFormData.status_lists_id}
                                    onChange={handleEditChange}
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:ring-1 focus:ring-gray-900 focus:outline-none"
                                >
                                    <option value="">Select status</option>
                                    {statuses.map((st, i) => {
                                        const id = st.id || st.status_lists_id || st.status_id;
                                        const label = st.name || st.status || st.label || `Status ${id}`;
                                        return (
                                            <option key={id || i} value={id}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditModalRequest(null)}
                                    className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors ${updating
                                        ? "bg-gray-300 cursor-not-allowed"
                                        : "bg-gray-900 hover:bg-gray-800"
                                        }`}
                                >
                                    {updating ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <ClipLoader size={16} color="#ffffff" />
                                            Saving...
                                        </span>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* General Feedback Modal (Success / Error) */}
            {feedbackModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in duration-150">
                        <div
                            className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4 ${feedbackModal.type === "success"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-rose-50 text-rose-600"
                                }`}
                        >
                            {feedbackModal.type === "success" ? (
                                <FaCheckCircle size={28} />
                            ) : (
                                <FaExclamationCircle size={28} />
                            )}
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {feedbackModal.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                            {feedbackModal.message}
                        </p>

                        <button
                            onClick={() => setFeedbackModal((prev) => ({ ...prev, isOpen: false }))}
                            className={`w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors ${feedbackModal.type === "success"
                                ? "bg-gray-900 hover:bg-gray-800"
                                : "bg-rose-600 hover:bg-rose-700"
                                }`}
                        >
                            {feedbackModal.type === "success" ? "Done" : "Dismiss"}
                        </button>
                    </div>
                </div>
            )}

            {/* Standalone Update Status Modal */}
            {statusModalRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-150">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <FaCheckCircle className="text-amber-600" /> Update Status
                            </h3>
                            <button
                                onClick={() => setStatusModalRequest(null)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateStatus} className="p-5 space-y-4">
                            {/* Status Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Select Status
                                </label>
                                <select
                                    value={selectedStatusId}
                                    onChange={(e) => setSelectedStatusId(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:ring-1 focus:ring-gray-900 focus:outline-none"
                                >
                                    <option value="">Choose a status</option>
                                    {statuses.map((st, i) => {
                                        const id = st.id || st.status_lists_id || st.status_id;
                                        const label = st.name || st.status || st.label || `Status ${id}`;
                                        return (
                                            <option key={id || i} value={id}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Remarks Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Remarks 
                                </label>
                                <textarea
                                    rows={3}
                                    value={statusRemarks}
                                    onChange={(e) => setStatusRemarks(e.target.value)}
                                    placeholder="Add any notes or remarks..."
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:ring-1 focus:ring-gray-900 focus:outline-none resize-none"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStatusModalRequest(null)}
                                    className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updatingStatus || !selectedStatusId}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors ${updatingStatus || !selectedStatusId
                                            ? "bg-gray-300 cursor-not-allowed"
                                            : "bg-gray-900 hover:bg-gray-800"
                                        }`}
                                >
                                    {updatingStatus ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <ClipLoader size={16} color="#ffffff" />
                                            Updating...
                                        </span>
                                    ) : (
                                        "Update Status"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History modal */}
            {historyModalRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-150">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900">
                                Status History
                            </h3>
                            <button
                                onClick={() => setHistoryModalRequest(null)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto">
                            {historyLoading ? (
                                <div className="text-center py-8">
                                    <ClipLoader size={24} color="#111827" />
                                </div>
                            ) : historyLogs.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-6">
                                    No history found for this request.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {historyLogs.map((log, idx) => {
                                        const dateObj = log.updated_at || log.created_at ? new Date(log.updated_at || log.created_at) : null;
                                        const formattedDate = dateObj
                                            ? dateObj.toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })
                                            : "N/A";
                                        const formattedTime = dateObj
                                            ? dateObj.toLocaleTimeString("en-US", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                second: "2-digit",
                                                hour12: true,
                                            })
                                            : "";

                                        return (
                                            <div
                                                key={log.id || idx}
                                                className="flex items-start gap-3 pb-3.5 border-b border-gray-100 last:border-b-0 last:pb-0"
                                            >
                                                <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <FaCheckCircle size={13} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-sm font-semibold text-gray-900 ">
                                                            {log.status_name}
                                                        </p>
                                                        <span className="text-xs text-gray-400 font-mono">
                                                            {formattedTime}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {formattedDate}
                                                    </p>
                                                    {log.remarks && (
                                                        <p className="text-xs text-gray-400 mt-1 bg-gray-50 p-1.5 rounded border border-gray-100">
                                                            {log.remarks}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirm modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-sm w-full p-6 text-center">
                        <h3 className="text-base font-semibold text-gray-900 mb-2">
                            Delete this request?
                        </h3>
                        <p className="text-sm text-gray-500 mb-5">
                            This will permanently delete the request for {deleteTarget.amount}{" "}
                            {deleteTarget.currency}. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deletingId === deleteTarget.id}
                                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {deletingId === deleteTarget.id ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BenefRequestRemit;