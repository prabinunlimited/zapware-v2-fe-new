// features/Beneficiaries/components/Beneficiaries.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    FaEye,
    FaEdit,
    FaTrashAlt,
    FaUniversity,
    FaSpinner,
    FaSearch,
    FaFilter,
    FaPlus,
    FaLandmark,
    FaArrowLeft,
    FaArrowRight,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import { usePartnerConfig } from "../../../hooks/usePartnerConfig";

// Redux imports
import {
    fetchBeneficiaries,
    deleteBeneficiary,
    toggleVisibilityLocal,
    setSearchQuery,
    setFilterVisibility,
    setCurrentPage,
    clearError,
    selectFilteredBeneficiaries,
    selectPaginatedBeneficiaries,
    selectTotalPages,
    selectBeneficiariesLoading,
    selectBeneficiariesError,
    selectSearchQuery,
    selectFilterVisibility,
    selectCurrentPage,
    selectDeleteLoading,
} from "./BeneficiariesSlice";

import {
    showDeleteModal,
    hideDeleteModal,
    setDeleteModalMessage,
    setDeleteModalLoading,
    selectDeleteModal,
} from "./ModalSlice";

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
                                        Yes, Delete
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

const Beneficiaries = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { customerId } = useParams();

    // Redux selectors
    const beneficiaries = useSelector(selectPaginatedBeneficiaries);
    const filteredBeneficiaries = useSelector(selectFilteredBeneficiaries);
    const totalPages = useSelector(selectTotalPages);
    const isLoading = useSelector(selectBeneficiariesLoading);
    const error = useSelector(selectBeneficiariesError);
    const searchQuery = useSelector(selectSearchQuery);
    const filterVisibility = useSelector(selectFilterVisibility);
    const currentPage = useSelector(selectCurrentPage);
    const isDeleting = useSelector(selectDeleteLoading);

    // Modal state from Redux
    const deleteModal = useSelector(selectDeleteModal);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Get auth token and partner config
    const authToken = localStorage.getItem("authtoken");
    const config = usePartnerConfig(authToken);
    const headerColor =
        config?.header_color || localStorage.getItem("header_color");
    const textColor = config?.text_color || localStorage.getItem("text_color");

    const getTextColorStyle = () => {
        if (textColor && textColor.startsWith("text-")) {
            return { className: textColor };
        } else if (textColor && textColor.startsWith("#")) {
            return { style: { color: textColor } };
        }
        return {};
    };

    const getHeaderColorStyle = () => {
        if (headerColor && headerColor.startsWith("bg-")) {
            return { className: headerColor };
        } else if (headerColor && headerColor.startsWith("#")) {
            return { style: { backgroundColor: headerColor } };
        }
        return { className: "bg-blue-600" };
    };

    const textColorProps = getTextColorStyle();
    const headerColorProps = getHeaderColorStyle();

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Fetch beneficiaries on component mount
    useEffect(() => {
        if (customerId) {
            dispatch(fetchBeneficiaries(customerId));
        }
    }, [dispatch, customerId]);

    // Handle search query change
    const handleSearchChange = (query) => {
        dispatch(setSearchQuery(query));
    };

    // Handle filter change
    const handleFilterChange = (filter) => {
        dispatch(setFilterVisibility(filter));
    };

    // Handle page change
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            dispatch(setCurrentPage(page));
        }
    };

    // Handle visibility toggle
    const handleToggleVisibility = (id) => {
        dispatch(toggleVisibilityLocal(id));
    };

    // Handle delete beneficiary
    const handleDelete = (id) => {
        dispatch(showDeleteModal(id));
    };

    const handleConfirmDelete = async () => {
        if (deleteModal.beneficiaryToDelete) {
            dispatch(setDeleteModalLoading(true));

            try {
                const result = await dispatch(
                    deleteBeneficiary({
                        id: deleteModal.beneficiaryToDelete,
                        customerId,
                    })
                ).unwrap();

                toast.success(result.message || "Beneficiary deleted successfully!");
                dispatch(hideDeleteModal());
            } catch (error) {
                dispatch(setDeleteModalMessage(error.message));
                toast.error(error.message);
            } finally {
                dispatch(setDeleteModalLoading(false));
            }
        }
    };

    const handleCloseModal = () => {
        dispatch(hideDeleteModal());
        dispatch(clearError());
    };

    const editBeneficiary = (benefId) => {
        navigate(`/editbeneficiary/${benefId}`);
    };

    const handleRoute = () => {
        navigate(`/addbeneficiary/${customerId}`);
    };

    const handleBankRoute = () => {
        navigate(`/addbeneficiarybank/${customerId}`);
    };

    const handleBeneficiaryBank = (benefId) => {
        navigate(`/bankdetails/${customerId}/${benefId}`);
    };

    // Render mobile view
    const renderMobileView = () => (
        <div className="space-y-4 p-4">
            {beneficiaries.length > 0 ? (
                beneficiaries.map((beneficiary) => (
                    <motion.div
                        key={beneficiary.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-4 rounded-lg shadow-md border border-gray-100"
                    >
                        <div className="space-y-3">
                            <div className="flex justify-between items-start">
                                <h3 className="font-medium text-gray-900 text-lg">
                                    {beneficiary.isVisible ? beneficiary.name : "*****"}
                                </h3>
                                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {beneficiary.isVisible
                                        ? beneficiary.relationtobenef
                                        : "*****"}
                                </span>
                            </div>

                            <div className="text-sm text-gray-600 space-y-1">
                                <p className="flex items-center">
                                    <span className="font-medium w-24">Phone:</span>
                                    {beneficiary.isVisible
                                        ? beneficiary.full_phone_number
                                        : "••••••••••"}
                                </p>
                                <p className="flex items-start">
                                    <span className="font-medium w-24">Address:</span>
                                    {beneficiary.isVisible
                                        ? beneficiary.street || "Not Available"
                                        : "••••••••••"}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                <button
                                    onClick={() => handleToggleVisibility(beneficiary.id)}
                                    className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                                >
                                    <FaEye className="mr-1" />
                                    {beneficiary.isVisible ? "Hide" : "Show"}
                                </button>
                                <button
                                    onClick={() => editBeneficiary(beneficiary.id)}
                                    className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                                >
                                    <FaEdit className="mr-1" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleBeneficiaryBank(beneficiary.id)}
                                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                                >
                                    <FaUniversity className="mr-1" />
                                    Bank
                                </button>
                                <button
                                    onClick={() => handleDelete(beneficiary.id)}
                                    className="flex-1 flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                                >
                                    <FaTrashAlt className="mr-1" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))
            ) : (
                <div className="text-center py-8 text-gray-500">
                    No beneficiaries found. Try adjusting your search or filters.
                </div>
            )}
        </div>
    );

    // Render desktop view
    const renderDesktopView = () => (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textColorProps.className ?? "text-gray-500"}`}>
                            Name
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textColorProps.className ?? "text-gray-500"}`}>
                            Phone
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textColorProps.className ?? "text-gray-500"}`}>
                            Relation
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textColorProps.className ?? "text-gray-500"}`}>
                            Address
                        </th>
                        <th className={`px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider ${textColorProps.className ?? "text-gray-500"}`}>
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {beneficiaries.length > 0 ? (
                        beneficiaries.map((beneficiary) => (
                            <motion.tr
                                key={beneficiary.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="hover:bg-gray-50 transition-colors"
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {beneficiary.isVisible ? beneficiary.name : "Hidden"}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">
                                        {beneficiary.isVisible
                                            ? beneficiary.full_phone_number
                                            : "••••••••••"}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">
                                        {beneficiary.isVisible
                                            ? beneficiary.relationtobenef
                                            : "••••••"}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">
                                        {beneficiary.isVisible
                                            ? beneficiary.street || "Not Available"
                                            : "••••••••••"}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2">
                                        <button
                                            onClick={() => handleToggleVisibility(beneficiary.id)}
                                            className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            <FaEye className="mr-1" />
                                            {beneficiary.isVisible ? "Hide" : "Show"}
                                        </button>
                                        <button
                                            onClick={() => editBeneficiary(beneficiary.id)}
                                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm rounded-md text-white bg-green-600 hover:bg-green-700"
                                        >
                                            <FaEdit className="mr-1" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleBeneficiaryBank(beneficiary.id)}
                                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            <FaUniversity className="mr-1" />
                                            Bank
                                        </button>
                                        <button
                                            onClick={() => handleDelete(beneficiary.id)}
                                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm rounded-md text-white bg-red-600 hover:bg-red-700"
                                        >
                                            <FaTrashAlt className="mr-1" />
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                No beneficiaries found. Try adjusting your search or filters.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    // Render skeleton loader
    const renderSkeletonLoader = () => (
        <div className="p-4">
            {isMobile ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="bg-gray-100 p-4 rounded-lg animate-pulse h-32"
                        ></div>
                    ))}
                </div>
            ) : (
                <div className="animate-pulse space-y-4">
                    <div className="h-12 bg-gray-100 rounded"></div>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded"></div>
                    ))}
                </div>
            )}
        </div>
    );

    // Calculate pagination display values
    const indexOfFirstBeneficiary = (currentPage - 1) * 10 + 1;
    const indexOfLastBeneficiary = Math.min(currentPage * 10, filteredBeneficiaries.length);

    return (
        <div className="min-h-screen bg-gray-50">
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
                theme="colored"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    {/* Header Section */}
                    <div
                        className={`px-6 py-6 sm:px-8 ${headerColorProps.className}`}
                        style={headerColorProps.style}
                    >
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white">
                                    My Beneficiaries
                                </h1>
                                <p className="text-blue-100 mt-1" {...textColorProps}>
                                    Manage your beneficiary details
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                <button
                                    onClick={handleRoute}
                                    className={`text-sky-800 font-semibold py-3 px-6 rounded-lg hover:bg-blue-50 transition duration-300 flex items-center justify-center gap-2 bg-white`}
                                    style={headerColorProps.style}
                                >
                                    <FaPlus />
                                    <span>Add Beneficiary</span>
                                </button>
                                <button
                                    onClick={handleBankRoute}
                                    className={`text-sky-800 bg-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-50 transition duration-300 flex items-center justify-center gap-2`}
                                >
                                    <FaLandmark />
                                    <span>Add Bank</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filter Section */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-grow">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaSearch className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by name, phone, or relation..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="relative w-full md:w-48">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaFilter className="text-gray-400" />
                                </div>
                                <select
                                    value={filterVisibility}
                                    onChange={(e) => handleFilterChange(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                                >
                                    <option value="all">Show All</option>
                                    <option value="visible">Visible Only</option>
                                    <option value="hidden">Hidden Only</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Section */}
                    {isLoading ? (
                        renderSkeletonLoader()
                    ) : error ? (
                        <div className="p-6 text-center">
                            <div className="text-red-500 font-medium">{error}</div>
                            <button
                                onClick={() => dispatch(fetchBeneficiaries(customerId))}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <>
                            {isMobile ? renderMobileView() : renderDesktopView()}

                            {/* Pagination Section */}
                            {filteredBeneficiaries.length > 0 && (
                                <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className={`text-sm ${textColorProps.className ?? "text-gray-500"}`}>
                                        Showing{" "}
                                        <span className="font-medium">
                                            {indexOfFirstBeneficiary}
                                        </span>{" "}
                                        to{" "}
                                        <span className="font-medium">
                                            {indexOfLastBeneficiary}
                                        </span>{" "}
                                        of{" "}
                                        <span className="font-medium">
                                            {filteredBeneficiaries.length}
                                        </span>{" "}
                                        results
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {/* Previous Page Button */}
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className={`p-2 rounded-md ${currentPage === 1
                                                    ? `${textColorProps.className ?? "text-gray-400"} cursor-not-allowed`
                                                    : `hover:bg-gray-200 ${textColorProps.className ?? "text-gray-700"}`
                                                }`}
                                            aria-label="Previous page"
                                        >
                                            <FaArrowLeft />
                                        </button>

                                        {/* Page Number Buttons */}
                                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`w-10 h-10 rounded-md ${currentPage === pageNum
                                                            ? "bg-blue-600 text-white"
                                                            : `hover:bg-gray-200 ${textColorProps.className ?? "text-gray-700"}`
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}

                                        {/* Ellipsis for many pages */}
                                        {totalPages > 5 && <span className="px-2">...</span>}

                                        {/* Next Page Button */}
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className={`p-2 rounded-md ${currentPage === totalPages
                                                    ? `${textColorProps.className ?? "text-gray-400"} cursor-not-allowed`
                                                    : `hover:bg-gray-200 ${textColorProps.className ?? "text-gray-700"}`
                                                }`}
                                            aria-label="Next page"
                                        >
                                            <FaArrowRight />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Back to Dashboard Button */}
                <div className="flex justify-center items-center mt-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-blue-600 border border-blue-600 hover:bg-blue-50 transition-colors duration-200"
                    >
                        <FaArrowLeft className="text-blue-600" />
                        <span>Back to Dashboard</span>
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                show={deleteModal.show}
                onClose={handleCloseModal}
                onConfirm={handleConfirmDelete}
                message={deleteModal.message}
                isLoading={deleteModal.isLoading}
            />
        </div>
    );
};

export default Beneficiaries;