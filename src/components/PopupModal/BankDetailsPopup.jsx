import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RingLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import {
  fetchBeneficiaryBanks,
  clearBeneficiaryBanks,
  clearError,
} from "../../page/Beneficiary/MyBeneficiaries/BeneficiariesSlice";
import { deleteBeneficiaryBank } from "../../page/Beneficiary/AddBeneficiary/addBeneficiarySlice";
import { toast } from "react-toastify";

function BankDetailsPopup({ beneficiaryId, beneficiaryName, onClose, customerId }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bankToDelete, setBankToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const bankDetails = useSelector(
    (state) => state.beneficiaries.beneficiaryBanks
  );
  const loading = useSelector((state) => state.beneficiaries.banksLoading);
  const error = useSelector((state) => state.beneficiaries.error);

  useEffect(() => {
    if (beneficiaryId) {
      dispatch(clearError());
      dispatch(fetchBeneficiaryBanks(beneficiaryId));
    }

    return () => {
      dispatch(clearBeneficiaryBanks());
      dispatch(clearError());
    };
  }, [beneficiaryId, dispatch]);

  const handleEditSpecificBank = (bankId) => {
    const currentCustomerId = customerId || localStorage.getItem("currentCustomerId");

    // Find the specific bank to pass its data
    const bankToEdit = bankDetails.find(bank => bank.id === bankId);

    navigate(`/editbeneficiary/${beneficiaryId}`, {
      state: {
        customerId: currentCustomerId,
        editBankOnly: true,
        beneficiaryName: beneficiaryName,
        bankId: bankId,
        bankData: bankToEdit // Pass the specific bank data
      }
    });

    onClose();
  };

  const handleAddNewBank = () => {
    const currentCustomerId = customerId || localStorage.getItem("currentCustomerId");

    // Navigate to create beneficiary with pre-filled beneficiary data
    navigate(`/addbeneficiary/${customerId}`, {
      state: {
        is_payout: "n",
        addBankOnly: true,
        existingBeneficiaryId: beneficiaryId,
        beneficiaryName: beneficiaryName,
        prefillData: {
          // Pass the beneficiary data to pre-fill the form
          name: beneficiaryName,
          // Add any other beneficiary data you have
        }
      }
    });

    onClose();
  };

  const handleDeleteBank = (bankId) => {
    setBankToDelete(bankId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!bankToDelete) return;

    setIsDeleting(true);
    try {
      await dispatch(deleteBeneficiaryBank({
        beneficiaryId: beneficiaryId,
        bankId: bankToDelete,
        customerId: customerId
      })).unwrap();

      dispatch(fetchBeneficiaryBanks(beneficiaryId));
      toast.success("Bank account deleted successfully!");
    } catch (error) {
      console.error("Failed to delete bank account:", error);
      toast.error(error.message || "Failed to delete bank account");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setBankToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setBankToDelete(null);
  };

  // Delete Confirmation Modal Component
  const DeleteConfirmationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-red-100 rounded-full p-3">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
          Delete Bank Account
        </h3>

        <p className="text-gray-600 text-center mb-6">
          Are you sure you want to delete this bank account for <span className="font-semibold">{beneficiaryName}</span>?
          <br />
          <span className="text-sm text-red-500">This action cannot be undone.</span>
        </p>

        <div className="flex gap-3">
          <button
            onClick={cancelDelete}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <RingLoader color="#ffffff" size={16} />
                Deleting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
  if (!beneficiaryId) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Bank Details for {beneficiaryName}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <RingLoader color="#3B82F6" loading={true} size={40} />
                <span className="ml-3 text-gray-600">Loading bank details...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-500 mb-2">Error loading bank details</div>
                <div className="text-sm text-gray-600">{error}</div>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : !bankDetails || bankDetails.length === 0 ? (
              <div>
                <div className="text-center py-8">
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    No bank accounts found
                  </h3>
                  <p className="mt-1 text-gray-500">
                    This beneficiary doesn't have any bank accounts registered.
                  </p>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={handleAddNewBank}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Bank
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {bankDetails.map((bank, index) => (
                    <div
                      key={bank.id || index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="mb-3 pb-3 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                          <h3 className="text-md font-semibold text-gray-800">
                            Bank Account #{index + 1}
                          </h3>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${bank.status === 1
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                              }`}
                          >
                            {bank.status === 1 ? "Active" : "Inactive"}
                          </span>
                        </div>
                        {bank.created_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            Created: {new Date(bank.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Bank Name
                        </label>
                        <p className="text-gray-900 font-medium">
                          {bank.bank_name || "N/A"}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Account Number
                        </label>
                        <p className="text-gray-900 font-medium">
                          {bank.bank_acc_no || bank.account_number || "N/A"}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Account Holder
                        </label>
                        <p className="text-gray-900">
                          {bank.nameInBankAc || "N/A"}
                        </p>
                      </div>

                      {bank.benef_iban && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            IBAN
                          </label>
                          <p className="text-gray-900 font-mono">
                            {bank.benef_iban}
                          </p>
                        </div>
                      )}

                      {bank.currency_code && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Currency
                          </label>
                          <p className="text-gray-900">{bank.currency_code}</p>
                        </div>
                      )}

                      {bank.payment_method && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Payment Method
                          </label>
                          <p className="text-gray-900 capitalize">
                            {bank.payment_method}
                          </p>
                        </div>
                      )}

                      {bank.rails && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Rails
                          </label>
                          <p className="text-gray-900">{bank.rails}</p>
                        </div>
                      )}

                      {bank.swift && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            SWIFT Code
                          </label>
                          <p className="text-gray-900 font-mono">{bank.swift}</p>
                        </div>
                      )}

                      {bank.routing_number && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Routing Number
                          </label>
                          <p className="text-gray-900 font-mono">
                            {bank.routing_number}
                          </p>
                        </div>
                      )}

                      {bank.sort_code && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Sort Code
                          </label>
                          <p className="text-gray-900 font-mono">
                            {bank.sort_code}
                          </p>
                        </div>
                      )}

                      {bank.ifsc && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            IFSC Code
                          </label>
                          <p className="text-gray-900 font-mono">{bank.ifsc}</p>
                        </div>
                      )}

                      {bank.bic_code && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            BIC Code
                          </label>
                          <p className="text-gray-900 font-mono">
                            {bank.bic_code}
                          </p>
                        </div>
                      )}

                      {bank.account_type && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Account Type
                          </label>
                          <p className="text-gray-900">{bank.account_type}</p>
                        </div>
                      )}

                      {bank.bank_branch && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Bank Branch
                          </label>
                          <p className="text-gray-900">{bank.bank_branch}</p>
                        </div>
                      )}

                      {bank.bank_city && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Bank City
                          </label>
                          <p className="text-gray-900">{bank.bank_city}</p>
                        </div>
                      )}

                      {bank.bank_state && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Bank State
                          </label>
                          <p className="text-gray-900">{bank.bank_state}</p>
                        </div>
                      )}

                      {bank.bank_country && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Bank Country
                          </label>
                          <p className="text-gray-900">{bank.bank_country}</p>
                        </div>
                      )}

                      {bank.description && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-gray-500">
                            Description
                          </label>
                          <p className="text-gray-900">{bank.description}</p>
                        </div>
                      )}

                      {bank.remarks && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-gray-500">
                            Remarks
                          </label>
                          <p className="text-gray-900">{bank.remarks}</p>
                        </div>
                      )}
                    </div> */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Bank Name */}
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Bank Name
                          </label>

                          <p className="text-gray-900 font-medium">
                            {["AED", "DKK", "EUR", "GBP", "USD"].includes(
                              bank.currency_code
                            )
                              ? "N/A"
                              : bank.bank_name || "N/A"}
                          </p>
                        </div>

                        {/* Currency */}
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Currency
                          </label>

                          <p className="text-gray-900">
                            {bank.currency_code || "N/A"}
                          </p>
                        </div>

                        {/* Account Number - Hide for AED */}
                        {bank.currency_code !== "AED" && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Account Number
                            </label>

                            <p className="text-gray-900 font-medium">
                              {bank.bank_acc_no ||
                                bank.account_number ||
                                "N/A"}
                            </p>
                          </div>
                        )}

                        {/* IBAN - Show only for AED */}
                        {bank.currency_code === "AED" && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              IBAN
                            </label>

                            <p className="text-gray-900 font-mono">
                              {bank.benef_iban || "N/A"}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-gray-500">Bank UUID:</label>
                            <p className="text-gray-700 font-mono truncate">
                              {bank.benef_banks_uuid}
                            </p>
                          </div>
                          <div>
                            <label className="text-gray-500">Beneficiary UUID:</label>
                            <p className="text-gray-700 font-mono truncate">
                              {bank.benef_uuid}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3 justify-end">
                          {/* Delete Button - Hidden if only one bank account */}
                          {bankDetails.length > 1 && (
                            <button
                              onClick={() => handleDeleteBank(bank.id)}
                              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          )}

                          {/* Edit Button */}
                          <button
                            onClick={() => handleEditSpecificBank(bank.id)}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit bank account
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={handleAddNewBank}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Bank
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteModal && <DeleteConfirmationModal />}
    </>
  );
}

export default BankDetailsPopup;