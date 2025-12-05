import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { RingLoader } from "react-spinners";
import BankDetailsPopup from "../../../components/PopupModal/BankDetailsPopup";

import {
  fetchBeneficiaries,
  deleteBeneficiary,
  toggleBeneficiaryVisibility,
  // ✅ FIXED: Use the actual filter actions that exist in your slice
  setSearchQuery, // This is the actual search filter action
  setFilterVisibility, // This is the actual status filter action
  setSelectedBeneficiary,
  clearError,
  clearSuccess,
  selectFilteredBeneficiaries,
  selectBeneficiariesLoading,
  selectBeneficiariesError,
  selectBeneficiariesSuccess,
  selectSearchQuery,
  selectFilterVisibility,
  fetchBeneficiaryBanks,
  selectBeneficiaryBanks,
  selectBanksLoading,
} from "./BeneficiariesSlice";

const Beneficiaries = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Selectors - using the actual exported selector names
  const beneficiaries = useSelector(selectFilteredBeneficiaries);
  const loading = useSelector(selectBeneficiariesLoading);
  const error = useSelector(selectBeneficiariesError);
  const operationSuccess = useSelector(selectBeneficiariesSuccess);
  const searchQuery = useSelector(selectSearchQuery);
  const filterVisibility = useSelector(selectFilterVisibility);

  // Use the same loading state for both initial load and operations
  const operationLoading = loading;

  // Local state for filters - map to your actual filter structure
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [statusFilter, setStatusFilter] = useState(filterVisibility);
  const [typeFilter, setTypeFilter] = useState("all");
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [selectedBeneficiaryForBank, setSelectedBeneficiaryForBank] =
    useState(null);

  // Fetch beneficiaries on component mount
  useEffect(() => {
    if (customerId) {
      dispatch(fetchBeneficiaries(customerId));
    }
  }, [customerId, dispatch]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setSearchQuery(localSearch));
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, dispatch]);

  // Handle status filter changes
  useEffect(() => {
    dispatch(setFilterVisibility(statusFilter));
  }, [statusFilter, dispatch]);

  // Handle type filter changes - you'll need to add this functionality to your slice
  useEffect(() => {
    // If you need type filtering, add it to your slice
    // For now, we'll just ignore this since it's not in your slice
  }, [typeFilter, dispatch]);

  // Handle errors and success messages
  useEffect(() => {
    if (error) {
      toast.error(`Error: ${error}`);
      dispatch(clearError());
    }

    if (operationSuccess) {
      toast.success("Operation completed successfully!");
      dispatch(clearSuccess());
    }
  }, [error, operationSuccess, dispatch]);

  const handleAddBeneficiary = () => {
    navigate(`/addbeneficiary/${customerId}`);
  };

  const handleEditBeneficiary = (beneficiaryId) => {
    navigate(`/edit-beneficiary/${customerId}/${beneficiaryId}`);
  };

  const handleViewBeneficiary = (beneficiaryId) => {
    navigate(`/beneficiary/${customerId}/${beneficiaryId}`);
  };

  const handleDeleteBeneficiary = (beneficiaryId, beneficiaryName) => {
    if (
      window.confirm(
        `Are you sure you want to delete beneficiary "${beneficiaryName}"? This action cannot be undone.`
      )
    ) {
      dispatch(deleteBeneficiary({ customerId, beneficiaryId }));
    }
  };

  const handleToggleVisibility = (
    beneficiaryId,
    beneficiaryName,
    currentStatus
  ) => {
    const newStatus = !currentStatus;
    const action = newStatus ? "activate" : "deactivate";

    if (
      window.confirm(
        `Are you sure you want to ${action} beneficiary "${beneficiaryName}"?`
      )
    ) {
      dispatch(
        toggleBeneficiaryVisibility({
          customerId,
          beneficiaryId,
          isVisible: newStatus,
        })
      );
    }
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    // Clear the actual filters in the slice
    dispatch(setSearchQuery(""));
    dispatch(setFilterVisibility("all"));
  };

  const handleExportBeneficiaries = () => {
    // Simple export functionality - could be enhanced with CSV export
    const beneficiariesData = JSON.stringify(beneficiaries, null, 2);
    const blob = new Blob([beneficiariesData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `beneficiaries-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.info("Beneficiaries data exported successfully!");
  };

  // Calculate statistics
  const stats = {
    total: beneficiaries.length,
    active: beneficiaries.filter((b) => b.status === 1).length,
    inactive: beneficiaries.filter((b) => b.status === 0).length,
    individuals: beneficiaries.filter((b) => b.beneftype === "individual")
      .length,
    institutions: beneficiaries.filter((b) => b.beneftype === "institution")
      .length,
  };

  if (loading && beneficiaries.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <RingLoader
            color="#3B82F6"
            loading={true}
            size={60}
            speedMultiplier={1}
          />
          <p className="mt-4 text-gray-600">Loading beneficiaries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Beneficiaries
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your beneficiaries and their bank accounts
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleExportBeneficiaries}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                disabled={beneficiaries.length === 0}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export
              </button>
              <button
                onClick={handleAddBeneficiary}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Beneficiary
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Total Beneficiaries
                </h3>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Active</h3>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.active}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Inactive</h3>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.inactive}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Individuals
                </h3>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.individuals}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-lg">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Institutions
                </h3>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.institutions}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section - Updated to match your actual filter structure */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search Beneficiaries
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by name, email, or phone..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="w-full lg:w-48">
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="visible">Active</option>
                <option value="hidden">Inactive</option>
              </select>
            </div>

            {/* Remove type filter for now since it's not in your slice */}
            {/* <div className="w-full lg:w-48">
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Type
              </label>
              <select
                id="type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="individual">Individual</option>
                <option value="institution">Institution</option>
              </select>
            </div> */}

            <button
              onClick={handleClearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Beneficiaries Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {beneficiaries.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No beneficiaries found
              </h3>
              <p className="mt-2 text-gray-500">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters to see more results."
                  : "Get started by adding your first beneficiary."}
              </p>
              <div className="mt-6">
                <button
                  onClick={handleAddBeneficiary}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Beneficiary
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Beneficiary
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Contact
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Created
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {beneficiaries.map((beneficiary) => (
                    <tr key={beneficiary.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {beneficiary.name?.charAt(0).toUpperCase() || "B"}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {beneficiary.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {beneficiary.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            beneficiary.beneftype === "individual"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {beneficiary.beneftype === "individual"
                            ? "Individual"
                            : "Institution"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {beneficiary.phone_number || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            beneficiary.status === 1
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {beneficiary.status === 1 ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {beneficiary.created_at
                          ? new Date(
                              beneficiary.created_at
                            ).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedBeneficiaryForBank({
                                id: beneficiary.id,
                                name: beneficiary.name,
                              });
                              setShowBankDetails(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors relative group"
                            title="View Bank Details"
                          >
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center hover:bg-indigo-200 transition-colors">
                              <svg
                                className="w-4 h-4 text-indigo-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                <path
                                  fillRule="evenodd"
                                  d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              View Bank Details
                            </div>
                          </button>
                          <button
                            onClick={() =>
                              handleViewBeneficiary(beneficiary.id)
                            }
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="View Details"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              handleEditBeneficiary(beneficiary.id)
                            }
                            className="text-green-600 hover:text-green-900 transition-colors"
                            title="Edit"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              handleToggleVisibility(
                                beneficiary.id,
                                beneficiary.name,
                                beneficiary.status === 1
                              )
                            }
                            className={`${
                              beneficiary.status === 1
                                ? "text-yellow-600 hover:text-yellow-900"
                                : "text-green-600 hover:text-green-900"
                            } transition-colors`}
                            title={
                              beneficiary.status === 1
                                ? "Deactivate"
                                : "Activate"
                            }
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              {beneficiary.status === 1 ? (
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                />
                              ) : (
                                <>
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </>
                              )}
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteBeneficiary(
                                beneficiary.id,
                                beneficiary.name
                              )
                            }
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Delete"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Loading overlay for operations */}
        {operationLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center gap-3">
              <RingLoader
                color="#3B82F6"
                loading={true}
                size={30}
                speedMultiplier={1}
              />
              <p className="text-gray-700">Processing...</p>
            </div>
          </div>
        )}
      </div>

      {/* Bank Details Popup */}
      {showBankDetails && selectedBeneficiaryForBank && (
        <BankDetailsPopup
          beneficiaryId={selectedBeneficiaryForBank.id}
          beneficiaryName={selectedBeneficiaryForBank.name}
          onClose={() => {
            setShowBankDetails(false);
            setSelectedBeneficiaryForBank(null);
          }}
        />
      )}

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default Beneficiaries;
