// components/Modals/DeleteConfirmationModal.jsx
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";
import {
  hideDeleteModal,
  setDeleteModalLoading,
  setDeleteModalSuccess,
  setDeleteModalError,
} from "../../Beneficiary/MyBeneficiaries/ModalSlice";
import {
  deleteBeneficiary,
  bulkDeleteBeneficiaries,
} from "../../Beneficiary/MyBeneficiaries/BeneficiariesSlice";
import {
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimes,
} from "react-icons/fa";

const DeleteConfirmationModal = () => {
  const dispatch = useDispatch();
  const deleteModal = useSelector((state) => state.modal.deleteModal);
  const { customerId } = useParams();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (deleteModal.show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [deleteModal.show]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && deleteModal.show) {
        handleClose();
      }
    };

    if (deleteModal.show) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [deleteModal.show]);

  if (!deleteModal.show) return null;

  const handleConfirmDelete = async () => {
    dispatch(setDeleteModalLoading(true));

    try {
      if (deleteModal.type === "single") {
        // Single deletion with correct payload structure
        await dispatch(
          deleteBeneficiary({
            customerId,
            beneficiaryId: deleteModal.beneficiaryToDelete,
          })
        ).unwrap();

        dispatch(
          setDeleteModalSuccess({
            message: `Beneficiary "${deleteModal.beneficiaryName}" deleted successfully!`,
            show: true,
          })
        );

        toast.success(`Beneficiary deleted successfully!`);

        // Close modal after successful deletion
        setTimeout(() => {
          dispatch(hideDeleteModal());
        }, 1500);
      } else {
        // Bulk deletion
        await dispatch(
          bulkDeleteBeneficiaries({
            customerId,
            beneficiaryIds: deleteModal.bulkIds,
          })
        ).unwrap();

        dispatch(
          setDeleteModalSuccess({
            message: `${deleteModal.bulkCount} beneficiaries deleted successfully!`,
            show: true,
          })
        );

        toast.success(`${deleteModal.bulkCount} beneficiaries deleted!`);

        // Close modal after successful deletion
        setTimeout(() => {
          dispatch(hideDeleteModal());
        }, 1500);
      }
    } catch (error) {
      console.error("Delete error:", error);
      dispatch(
        setDeleteModalError(error.message || "Failed to delete beneficiary")
      );
      toast.error(error.message || "Failed to delete beneficiary");
    }
  };

  const handleClose = () => {
    dispatch(hideDeleteModal());
  };

  // Handle clicking on overlay (outside modal)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const getModalContent = () => {
    // Success state
    if (deleteModal.showSuccess) {
      return (
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <FaCheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Success!</h3>
          <p className="text-sm text-gray-500">{deleteModal.successMessage}</p>
        </div>
      );
    }

    // Error state
    if (deleteModal.errorMessage) {
      return (
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <FaExclamationTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-sm text-gray-500">{deleteModal.errorMessage}</p>
        </div>
      );
    }

    // Confirmation state
    return (
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <FaExclamationTriangle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {deleteModal.type === "bulk"
            ? `Delete ${deleteModal.bulkCount} Beneficiaries`
            : `Delete Beneficiary`}
        </h3>
        <p className="text-sm text-gray-500">
          {deleteModal.type === "bulk"
            ? `Are you sure you want to delete ${deleteModal.bulkCount} selected beneficiaries? This action cannot be undone.`
            : `Are you sure you want to delete beneficiary "${deleteModal.beneficiaryName}"? This action cannot be undone.`}
        </p>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {deleteModal.show && (
        <>
          {/* High z-index backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 z-[9999]"
            onClick={handleOverlayClick}
          />

          {/* Modal container - FIXED z-index issue */}
          <div className="fixed inset-0 z-[10000] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
              >
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close modal"
                  disabled={deleteModal.isLoading}
                >
                  <FaTimes className="h-5 w-5" />
                </button>

                <div className="p-6">
                  {getModalContent()}

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    {deleteModal.showSuccess || deleteModal.errorMessage ? (
                      <button
                        type="button"
                        onClick={handleClose}
                        className="w-full px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Close
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleClose}
                          disabled={deleteModal.isLoading}
                          className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmDelete}
                          disabled={deleteModal.isLoading}
                          className="w-full px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {deleteModal.isLoading ? (
                            <>
                              <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                              Deleting...
                            </>
                          ) : deleteModal.type === "bulk" ? (
                            `Delete ${deleteModal.bulkCount} Beneficiaries`
                          ) : (
                            "Delete Beneficiary"
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmationModal;
