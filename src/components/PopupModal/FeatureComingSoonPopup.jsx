// src/components/FeatureComingSoonPopup.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaRegClock,
  FaTimes,
  FaRocket,
  FaEnvelope,
  FaCheckCircle,
} from "react-icons/fa";

const FeatureComingSoonPopup = ({ isOpen, onClose, featureName }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <FaRocket className="text-white text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Feature Coming Soon
                  </h2>
                  <p className="text-blue-100 text-sm">
                    Exciting updates on the way!
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-lg"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaRegClock className="text-blue-500 text-3xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {featureName || "This Feature"} is Coming Soon!
              </h3>
              <p className="text-gray-600">
                We're working hard to bring you this exciting feature. Stay
                tuned for updates!
              </p>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Development Progress</span>
                <span className="font-semibold">75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full"
                  style={{ width: "75%" }}
                ></div>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <FaCheckCircle className="text-green-500" />
                <span className="text-gray-700">
                  Advanced currency conversion
                </span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <FaCheckCircle className="text-green-500" />
                <span className="text-gray-700">Real-time exchange rates</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <FaCheckCircle className="text-green-500" />
                <span className="text-gray-700">Multi-currency support</span>
              </div>
            </div>

            {/* Alternative Action */}
            <button
              onClick={() => {
                alert("Feature request submitted!");
                onClose();
              }}
              className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <FaEnvelope className="mr-2" />
              Request Early Access
            </button>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <p className="text-center text-gray-500 text-sm">
              Estimated launch: Q2 2024 • Stay connected for updates
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FeatureComingSoonPopup;
