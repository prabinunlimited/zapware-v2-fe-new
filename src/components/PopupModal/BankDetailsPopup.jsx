import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RingLoader } from "react-spinners";
import {
  fetchBeneficiaryBanks,
  clearBeneficiaryBanks,
  clearError,
} from "../../page/Beneficiary/MyBeneficiaries/BeneficiariesSlice"; // Adjust the import path

function BankDetailsPopup({ beneficiaryId, beneficiaryName, onClose }) {
  const dispatch = useDispatch();

  // Use Redux selectors
  const bankDetails = useSelector(
    (state) => state.beneficiaries.beneficiaryBanks
  );
  const loading = useSelector((state) => state.beneficiaries.banksLoading);
  const error = useSelector((state) => state.beneficiaries.error);

  useEffect(() => {
    if (beneficiaryId) {
      // Clear any previous errors
      dispatch(clearError());
      // Dispatch the Redux action to fetch bank details
      dispatch(fetchBeneficiaryBanks(beneficiaryId));
    }

    // Cleanup: clear bank details when component unmounts
    return () => {
      dispatch(clearBeneficiaryBanks());
      dispatch(clearError());
    };
  }, [beneficiaryId, dispatch]);

  if (!beneficiaryId) return null;

  return (
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
              <span className="ml-3 text-gray-600">
                Loading bank details...
              </span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">
                Error loading bank details
              </div>
              <div className="text-sm text-gray-600">{error}</div>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          ) : !bankDetails || bankDetails.length === 0 ? (
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
          ) : (
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
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          bank.status === 1
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {bank.status === 1 ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {bank.created_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Created:{" "}
                        {new Date(bank.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bank Information */}
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

                    {/* Additional fields from your API response */}
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
                  </div>

                  {/* UUID Information */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-gray-500">Bank UUID:</label>
                        <p className="text-gray-700 font-mono truncate">
                          {bank.benef_banks_uuid}
                        </p>
                      </div>
                      <div>
                        <label className="text-gray-500">
                          Beneficiary UUID:
                        </label>
                        <p className="text-gray-700 font-mono truncate">
                          {bank.benef_uuid}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BankDetailsPopup;
