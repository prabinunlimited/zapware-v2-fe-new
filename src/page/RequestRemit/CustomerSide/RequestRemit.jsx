// src/components/RequestRemit/RequestRemit.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchRequestRemitDetails,
  approveRequestRemit,
  updateRequestRemit,
  clearError,
  clearApproveStatus,
  clearUpdateStatus,
  selectRequestRemitRequests,
  selectRequestRemitLoading,
  selectRequestRemitError,
  selectRequestRemitApproveLoading,
  selectRequestRemitUpdateLoading,
} from "./RequestRemitSlice";
import { IoIosArrowBack } from "react-icons/io";
import { FaExternalLinkAlt, FaCheckCircle, FaEdit } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import RingLoader from "react-spinners/RingLoader";
import ErrorBoundary from "../../../components/ErrorBoundary/ErrorBoundary";

const ApprovePopup = ({ isOpen, onClose, onApprove, beneficiaryName, approveLoading }) => {
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!remarks.trim()) {
      setError("Please enter remarks");
      return;
    }
    onApprove(remarks);
  };

  const handleClose = () => {
    setRemarks("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <MdClose className="w-5 h-5" />
          </button>
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <FaCheckCircle className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Approve Request
              </h3>
            </div>
            <p className="text-sm text-gray-500">
              Approving request for{" "}
              <span className="font-medium text-gray-700">
                {beneficiaryName}
              </span>
            </p>
          </div>
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
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={approveLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={approveLoading}
                className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {approveLoading ? "Approving..." : "Approve"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const EditPopup = ({ isOpen, onClose, onUpdate, currentAmount, updateLoading }) => {
  const [amount, setAmount] = useState(currentAmount || "");
  const [error, setError] = useState("");

  useEffect(() => {
    setAmount(currentAmount || "");
  }, [currentAmount]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    onUpdate(amount);
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <MdClose className="w-5 h-5" />
          </button>
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <FaEdit className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Amount
              </h3>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError("");
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={updateLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateLoading}
                className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {updateLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

function RequestRemitContent() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const requests = useSelector(selectRequestRemitRequests);
  const loading = useSelector(selectRequestRemitLoading);
  const error = useSelector(selectRequestRemitError);
  const approveLoading = useSelector(selectRequestRemitApproveLoading);
  const updateLoading = useSelector(selectRequestRemitUpdateLoading);

  const [approvePopup, setApprovePopup] = useState({
    isOpen: false,
    requestId: null,
    beneficiaryName: null,
  });

  const [editPopup, setEditPopup] = useState({
    isOpen: false,
    requestId: null,
    currentAmount: null,
  });

  useEffect(() => {
    dispatch(fetchRequestRemitDetails());
  }, [dispatch]);

  const handleRetry = () => {
    dispatch(clearError());
    dispatch(fetchRequestRemitDetails());
  };

  const handleApproveClick = (request) => {
    setApprovePopup({
      isOpen: true,
      requestId: request.id,
      beneficiaryName: request.beneficiary_name,
    });
  };

  const handleApprove = async (remarks) => {
    const result = await dispatch(
      approveRequestRemit({ requestId: approvePopup.requestId, remarks }),
    );
    dispatch(clearApproveStatus());

    if (approveRequestRemit.fulfilled.match(result)) {
      await dispatch(fetchRequestRemitDetails());
    }

    setApprovePopup({ isOpen: false, requestId: null, beneficiaryName: null });
  };

  const handleEditClick = (request) => {
    setEditPopup({
      isOpen: true,
      requestId: request.id,
      currentAmount: request.destination_amount,
    });
  };

  const handleUpdate = async (amount) => {
    console.log("handleUpdate called with:", { requestId: editPopup.requestId, amount });
    try {
      const result = await dispatch(
        updateRequestRemit({ requestId: editPopup.requestId, amount }),
      );
      console.log("updateRequestRemit result:", result);
      dispatch(clearUpdateStatus());

      if (updateRequestRemit.fulfilled.match(result)) {
        console.log("update fulfilled, refetching list");
        await dispatch(fetchRequestRemitDetails());
      } else {
        console.log("update NOT fulfilled, payload:", result.payload);
      }
    } catch (err) {
      console.error("handleUpdate threw:", err);
    } finally {
      setEditPopup({ isOpen: false, requestId: null, currentAmount: null });
    }
  };

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

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <RingLoader color="#3B82F6" size={60} />
        <p className="mt-4 text-gray-600">Loading your remittance requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
          <p className="font-semibold text-lg text-red-600 mb-2">
            Error Loading Requests
          </p>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No remittance requests found
            </h3>
            <p className="text-gray-500">
              You haven't created any remittance requests yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <div
                  className={`h-1 ${request.approved === "Y" ? "bg-green-500" : "bg-yellow-500"
                    }`}
                />
                <div className="p-5">
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
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${request.approved === "Y"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                        }`}
                    >
                      {request.approved === "Y" ? "Approved" : "Pending"}
                    </span>
                  </div>

                  <div className="flex gap-2 mb-4">
                    {request.approved === "N" && (
                      <button
                        onClick={() => handleApproveClick(request)}
                        disabled={approveLoading}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleEditClick(request)}
                      disabled={updateLoading}
                      className={`inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 disabled:opacity-50 ${
                        request.approved === "N" ? "" : "flex-1"
                      }`}
                    >
                      <FaEdit className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                  </div>
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

                  <div className="pt-3 border-t border-gray-100">
                    <a
                      href={request.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline"
                    >
                      <FaExternalLinkAlt className="w-3.5 h-3.5 mr-2" />
                      Open Link
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ApprovePopup
        isOpen={approvePopup.isOpen}
        onClose={() =>
          setApprovePopup({ isOpen: false, requestId: null, beneficiaryName: null })
        }
        onApprove={handleApprove}
        beneficiaryName={approvePopup.beneficiaryName}
        approveLoading={approveLoading}
      />

      <EditPopup
        isOpen={editPopup.isOpen}
        onClose={() =>
          setEditPopup({ isOpen: false, requestId: null, currentAmount: null })
        }
        onUpdate={handleUpdate}
        currentAmount={editPopup.currentAmount}
        updateLoading={updateLoading}
      />
    </div>
  );
}

export default function RequestRemit() {
  return (
    <ErrorBoundary>
      <RequestRemitContent />
    </ErrorBoundary>
  );
}