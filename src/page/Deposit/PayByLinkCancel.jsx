import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaTimesCircle, FaSignInAlt } from "react-icons/fa";

const PayByLinkCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50 px-4 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center"
      >
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaTimesCircle className="text-red-500 text-4xl" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Transaction Cancelled
        </h1>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full inline-flex items-center justify-center px-6 py-3.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-sm"
        >
          <FaSignInAlt className="mr-2" />
          Go to Login
        </button>
      </motion.div>
    </div>
  );
};

export default PayByLinkCancel;