// src/page/Deposit/components/BankDetailItem.jsx - COMPLETE FIXED VERSION
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCopy, FaCheck } from "react-icons/fa";

const BankDetailItem = ({
  label,
  value,
  onCopy,
  copiedField,
  fieldName,
  showTooltip,
  onTooltipShow,
  onTooltipHide,
}) => {
  const isCopied = copiedField === fieldName;

  const handleCopy = () => {
    if (value && onCopy) {
      onCopy(value, fieldName);
    }
  };

  if (!value) {
    return null;
  }

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium text-gray-600 font-sans">
        {label}
      </label>
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
        <span className="text-gray-800 font-medium font-sans break-all">
          {value}
        </span>
        
        <motion.button
          type="button"
          onClick={handleCopy}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="ml-3 p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200 rounded-lg hover:bg-blue-50 flex-shrink-0"
          onMouseEnter={() => onTooltipShow && onTooltipShow(`Copy ${label}`)}
          onMouseLeave={onTooltipHide}
        >
          <AnimatePresence mode="wait">
            {isCopied ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                className="text-green-500"
              >
                <FaCheck size={16} />
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="text-current"
              >
                <FaCopy size={16} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
};

export default BankDetailItem;