import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL;

const ViewFundingAccountsModal = ({ isOpen, onClose }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const bearertoken = localStorage.getItem("bearertoken");
  const customerUuid =
    localStorage.getItem("customerUuid") ||
    localStorage.getItem("customer_uuid") ||
    localStorage.getItem("authcustomer_id");

  useEffect(() => {
    if (!isOpen) return;

    const fetchFundingAccounts = async () => {
      if (!customerUuid) {
        setError("Customer UUID not found in session storage.");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `${API_URL}/get-funding-accounts/${customerUuid}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${bearertoken}`,
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to fetch funding accounts");
        }

        // Support array directly or inside data key
        const list = Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result)
          ? result
          : [];

        setAccounts(list);
      } catch (err) {
        console.error("Failed to load funding accounts:", err);
        setError(err.message || "Unable to load funding accounts.");
      } finally {
        setLoading(false);
      }
    };

    fetchFundingAccounts();
  }, [isOpen, customerUuid, bearertoken]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop (Does not close on outside click) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 z-10 max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-800">
              Funding Accounts
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Content Body */}
          <div className="py-4 overflow-y-auto flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm">Loading funding accounts...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl text-center">
                {error}
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-sm">No funding accounts found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((acc, index) => (
                  <div
                    key={acc.id || index}
                    className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100/70 transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm"
                  >
                    <div>
                      <div className="font-semibold text-gray-800 text-base">
                        {acc.bank_name || "Unknown Bank"}
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        {acc.account_name} &bull; {acc.account_number}
                      </div>
                      <div className="flex gap-2 mt-2">
                        {acc.currency && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            {acc.currency}
                          </span>
                        )}
                        {acc.account_type && (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs capitalize">
                            {acc.account_type}
                          </span>
                        )}
                        {acc.holder_type && (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs capitalize">
                            {acc.holder_type}
                          </span>
                        )}
                      </div>
                    </div>
                    {acc.routing_number && (
                      <div className="text-right text-xs text-gray-500">
                        <span className="font-medium text-gray-700">BSB/Routing:</span>{" "}
                        {acc.routing_number}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ViewFundingAccountsModal;