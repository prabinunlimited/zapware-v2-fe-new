// src/features/BankAccounts/components/Pagination.jsx - COMPLETE
import React from "react";
import { motion } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center space-x-2 mt-6"
    >
      {/* Previous Button */}
      <motion.button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
        whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
        className={`p-2 rounded-lg ${
          currentPage === 1
            ? "text-gray-400 cursor-not-allowed"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        <FaChevronLeft className="text-sm" />
      </motion.button>

      {/* Page Numbers */}
      {pages.map((page) => (
        <motion.button
          key={page}
          onClick={() => onPageChange(page)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-3 py-1 rounded-lg text-sm font-medium ${
            currentPage === page
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {page}
        </motion.button>
      ))}

      {/* Next Button */}
      <motion.button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
        whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
        className={`p-2 rounded-lg ${
          currentPage === totalPages
            ? "text-gray-400 cursor-not-allowed"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        <FaChevronRight className="text-sm" />
      </motion.button>
    </motion.div>
  );
};

export default Pagination;