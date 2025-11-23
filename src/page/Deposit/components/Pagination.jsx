import React from 'react';
import { motion } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center space-x-2 mt-6">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        <FaChevronLeft className="text-gray-600" />
      </motion.button>

      {pages.map((page) => (
        <motion.button
          key={page}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentPage === page
              ? 'bg-blue-600 text-white'
              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {page}
        </motion.button>
      ))}

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        <FaChevronRight className="text-gray-600" />
      </motion.button>
    </div>
  );
};

export default Pagination;