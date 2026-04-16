// src/components/RequestRemit/RequestRemit.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchRequestRemitDetails,
  approveRequestRemit,
  copyRemitLink,
  clearCopyStatus,
  clearApproveStatus,
  clearError,
  selectRequestRemitRequests,
  selectRequestRemitLoading,
  selectRequestRemitError,
  selectRequestRemitCopySuccess,
  selectRequestRemitCopyMessage,
  selectRequestRemitApproveLoading,
  selectRequestRemitApproveSuccess,
  selectRequestRemitApproveError,
} from "./RequestRemitSlice";
import {
  IoIosArrowBack,
  IoIosCopy,
  IoIosCheckmarkCircle,
} from "react-icons/io";
import { FaExternalLinkAlt, FaCheckCircle } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import RingLoader from "react-spinners/RingLoader";
import ErrorBoundary from "../../../components/ErrorBoundary/ErrorBoundary";

// Approve Popup Component
const ApprovePopup = ({
  isOpen,
  onClose,
  onApprove,
  requestId,
  requestAmount,
  beneficiaryName,
}) => {
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!remarks.trim()) {
      setError("Please enter remarks");
      return;
    }

    onApprove(requestId, remarks);
  };

  const handleClose = () => {
    setRemarks("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Popup */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MdClose className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <FaCheckCircle className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Approve Request
              </h3>
            </div>
            <p className="text-sm text-gray-500">
              You are approving a remittance request for{" "}
              <span className="font-medium text-gray-700">
                {beneficiaryName}
              </span>
              with amount{" "}
              <span className="font-medium text-gray-700">{requestAmount}</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="remarks"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                id="remarks"
                rows="4"
                value={remarks}
                onChange={(e) => {
                  setRemarks(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter your approval remarks..."
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  error ? "border-red-500" : "border-gray-300"
                }`}
              />
              {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Approve
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

function RequestRemitContent() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state
  const requests = useSelector(selectRequestRemitRequests);
  const loading = useSelector(selectRequestRemitLoading);
  const error = useSelector(selectRequestRemitError);
  const copySuccess = useSelector(selectRequestRemitCopySuccess);
  const copyMessage = useSelector(selectRequestRemitCopyMessage);
  const approveLoading = useSelector(selectRequestRemitApproveLoading);
  const approveSuccess = useSelector(selectRequestRemitApproveSuccess);
  const approveError = useSelector(selectRequestRemitApproveError);

  // Local state
  const [copiedId, setCopiedId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [approvePopup, setApprovePopup] = useState({
    isOpen: false,
    requestId: null,
    requestAmount: null,
    beneficiaryName: null,
  });
  const [approveSuccessMessage, setApproveSuccessMessage] = useState("");

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchRequestRemitDetails());
  }, [dispatch]);

  // Clear copy status after 3 seconds
  useEffect(() => {
    if (copySuccess || copyMessage) {
      const timer = setTimeout(() => {
        dispatch(clearCopyStatus());
        setCopiedId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess, copyMessage, dispatch]);

  // Handle approve success
  useEffect(() => {
    if (approveSuccess) {
      setApproveSuccessMessage("Request approved successfully!");
      setApprovePopup({
        isOpen: false,
        requestId: null,
        requestAmount: null,
        beneficiaryName: null,
      });

      // Clear success message after 3 seconds
      const timer = setTimeout(() => {
        setApproveSuccessMessage("");
        dispatch(clearApproveStatus());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [approveSuccess, dispatch]);

  // Handle approve error
  useEffect(() => {
    if (approveError) {
      // Show error in popup or as toast
      console.error("Approve error:", approveError);
    }
  }, [approveError]);

  // Handle copy link
  const handleCopyLink = async (requestId, link) => {
    const result = await dispatch(copyRemitLink(link));
    if (result.payload?.success) {
      setCopiedId(requestId);
    }
  };

  // Handle approve click
  const handleApproveClick = (request) => {
    setApprovePopup({
      isOpen: true,
      requestId: request.id,
      requestAmount: `${request.destination_currency} ${request.destination_amount}`,
      beneficiaryName: request.beneficiary_name,
    });
  };

  // Handle approve submit
  const handleApprove = async (requestId, remarks) => {
    await dispatch(approveRequestRemit({ requestId, remarks }));
  };

  // Handle retry
  const handleRetry = () => {
    dispatch(clearError());
    dispatch(fetchRequestRemitDetails());
  };

  // Handle back navigation
  const handleGoBack = () => {
    navigate(-1);
  };

  // Filter requests based on approval status
  const filteredRequests = requests.filter((request) => {
    if (filter === "pending") return request.approved === "N";
    if (filter === "approved") return request.approved === "Y";
    return true;
  });

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format currency
  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <RingLoader color="#3B82F6" size={60} />
        <p className="mt-4 text-gray-600">
          Loading your remittance requests...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="font-semibold text-lg mt-2">Error Loading Requests</p>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={handleRetry}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleGoBack}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Toast */}
      {approveSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg animate-slide-in">
          <div className="flex items-center">
            <FaCheckCircle className="w-5 h-5 mr-2" />
            <span>{approveSuccessMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleGoBack}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors mr-4"
                aria-label="Go back"
              >
                <IoIosArrowBack className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Request Remit
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Total: {requests.length} request{requests.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filter Tabs */}
        {requests.length > 0 && (
          <div className="mb-6 flex space-x-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              All ({requests.length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "pending"
                  ? "bg-yellow-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Pending ({requests.filter((r) => r.approved === "N").length})
            </button>
            <button
              onClick={() => setFilter("approved")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "approved"
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Approved ({requests.filter((r) => r.approved === "Y").length})
            </button>
          </div>
        )}

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-gray-400 mb-3">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No remittance requests found
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === "all"
                ? "You haven't created any remittance requests yet."
                : filter === "pending"
                  ? "No pending remittance requests."
                  : "No approved remittance requests."}
            </p>
            <button
              onClick={() => navigate(`/request-remit/create/${customerId}`)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              Create New Request
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden"
              >
                {/* Status Indicator */}
                <div
                  className={`h-1 ${
                    request.approved === "Y" ? "bg-green-500" : "bg-yellow-500"
                  }`}
                />

                <div className="p-5">
                  {/* Header with Amount and Status */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Amount</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(
                          request.destination_amount,
                          request.destination_currency,
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.approved === "Y"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {request.approved === "Y" ? "Approved" : "Pending"}
                      </span>

                      {/* Approve Button - Only show for pending requests */}
                      {request.approved === "N" && (
                        <button
                          onClick={() => handleApproveClick(request)}
                          disabled={approveLoading}
                          className="inline-flex items-center px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Approve request"
                        >
                          {approveLoading ? (
                            <RingLoader color="#ffffff" size={12} />
                          ) : (
                            <>
                              <FaCheckCircle className="w-3 h-3 mr-1" />
                              Approve
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Beneficiary Details */}
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Beneficiary</p>
                      <p className="text-sm font-medium text-gray-900">
                        {request.beneficiary_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Bank Account</p>
                      <p className="text-sm font-medium text-gray-900 font-mono">
                        {request.beneficiary_bank_account_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Created</p>
                      <p className="text-sm text-gray-700">
                        {formatDate(request.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
                    {/* Copy Link Button */}
                    <button
                      onClick={() => handleCopyLink(request.id, request.link)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      title="Copy link to clipboard"
                    >
                      {copiedId === request.id ? (
                        <>
                          <IoIosCheckmarkCircle className="w-4 h-4 mr-2 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <IoIosCopy className="w-4 h-4 mr-2" />
                          Copy Link
                        </>
                      )}
                    </button>

                    {/* Open Link Button */}
                    <a
                      href={request.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center p-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      title="Open in new tab"
                    >
                      <FaExternalLinkAlt className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create New Request Button */}
        {filteredRequests.length > 0 && (
          <div className="mt-6 flex justify-center lg:justify-end">
            <button
              onClick={() => navigate(`/request-remit/create/${customerId}`)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create New Request
            </button>
          </div>
        )}
      </div>

      {/* Approve Popup */}
      <ApprovePopup
        isOpen={approvePopup.isOpen}
        onClose={() =>
          setApprovePopup({
            isOpen: false,
            requestId: null,
            requestAmount: null,
            beneficiaryName: null,
          })
        }
        onApprove={handleApprove}
        requestId={approvePopup.requestId}
        requestAmount={approvePopup.requestAmount}
        beneficiaryName={approvePopup.beneficiaryName}
      />
    </div>
  );
}

// Main component wrapped with Error Boundary
export default function RequestRemit() {
  return (
    <ErrorBoundary>
      <RequestRemitContent />
    </ErrorBoundary>
  );
}
