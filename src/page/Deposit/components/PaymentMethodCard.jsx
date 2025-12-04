import React from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaInfoCircle, FaClock, FaDollarSign, FaLock } from 'react-icons/fa';

const PaymentMethodCard = ({
  method,
  isSelected,
  onClick,
  onTooltipShow,
  onTooltipHide,
  showTooltip,
  currency
}) => {
  const getMethodDetails = (methodValue) => {
    const details = {
      card_deposit: {
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        features: ['Instant processing', 'Secure encryption', '24/7 availability'],
        time: 'Instant',
        fee: '0.5%'
      },
      manual_deposit: {
        color: 'from-orange-500 to-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        features: ['1-3 business days', 'Bank transfer', 'No fees'],
        time: '1-3 days',
        fee: 'Free'
      },
      bank_transfer: {
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        features: ['Instant transfer', 'Open Banking', 'Secure'],
        time: 'Instant',
        fee: 'Free'
      },
      bank_deposit: {
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        features: ['Plaid secure', 'US banks only', 'Quick setup'],
        time: '1-2 days',
        fee: 'Free'
      }
    };
    
    return details[methodValue] || details.manual_deposit;
  };

  const methodDetails = getMethodDetails(method.value);

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`relative p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
        isSelected
          ? `${methodDetails.borderColor} ${methodDetails.bgColor} shadow-lg`
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
      }`}
      onClick={onClick}
    >
      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r ${methodDetails.color} flex items-center justify-center shadow-lg`}
        >
          <FaCheck className="text-white text-xs" />
        </motion.div>
      )}

      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${methodDetails.color} text-white flex-shrink-0`}>
          {method.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {method.label}
              </h3>
              <p className="text-gray-600 mt-1 text-sm">
                {method.description}
              </p>
            </div>
            
            {/* Info button */}
            <button
              type="button"
              onMouseEnter={(e) => {
                e.stopPropagation();
                onTooltipShow(method.value);
              }}
              onMouseLeave={() => onTooltipHide(method.value)}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
            >
              <FaInfoCircle className="text-lg" />
            </button>
          </div>

          {/* Features and details */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center space-x-4 text-sm">
              <span className="flex items-center text-gray-600">
                <FaClock className="mr-1" />
                {methodDetails.time}
              </span>
              <span className="flex items-center text-gray-600">
                <FaDollarSign className="mr-1" />
                {methodDetails.fee}
              </span>
            </div>

            {/* Features tags */}
            <div className="flex flex-wrap gap-1">
              {methodDetails.features.map((feature, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip === method.value && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-0 right-0 top-full mt-2 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-10"
        >
          <p className="font-medium">{method.help}</p>
          <div className="absolute -top-1 left-6 w-3 h-3 bg-gray-900 transform rotate-45"></div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PaymentMethodCard;