// src/components/PopupModal/AddSenderModal.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSpinner, FaPlus } from "react-icons/fa";
import RingLoader from "react-spinners/RingLoader";

const AddSenderModal = ({
  show,
  onClose,
  onAddSender, // This should handle the add logic
  isLoading = false,
  searchQuery,
  setSearchQuery,
  searchResults,
  loading,
  benefId,
}) => {
  // Debug log
  console.log("🔍 DEBUG: AddSenderModal received benefId =", benefId);

  // Create a simple handler that calls the parent's onAddSender
  const handleAddSenderClick = (customer) => {
    console.log("🔍 DEBUG: Add button clicked with:", {
      customer,
      benefId,
      hasOnAddSender: !!onAddSender,
    });

    if (onAddSender && !isLoading && benefId) {
      onAddSender(customer);
    } else if (!benefId) {
      console.error("🚨 ERROR: benefId is undefined in modal!");
      alert("Error: Missing beneficiary ID. Please refresh the page.");
    }
  };

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
            className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Add Sender
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
                disabled={isLoading}
              >
                ×
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Customers
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Type at least 3 characters to search
              </p>
            </div>

            <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <RingLoader
                    color="#3b82f6"
                    size={50}
                    speedMultiplier={1}
                    cssOverride={{
                      display: "block",
                      margin: "0 auto",
                    }}
                  />
                  <p className="mt-4 text-gray-600">Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="divide-y">
                  {searchResults.map((customer) => (
                    <div
                      key={customer.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleAddSenderClick(customer)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {customer.first_name} {customer.last_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {customer.email}
                          </p>
                          <p className="text-sm text-gray-600">
                            {customer.full_mobile_number}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddSenderClick(customer);
                          }}
                          disabled={isLoading || !benefId}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isLoading ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaPlus />
                          )}
                          {!benefId ? "Missing ID" : "Add"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery.trim().length >= 3 ? (
                <div className="text-center py-8 text-gray-500">
                  No customers found
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  Start typing to search for customers
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddSenderModal;
