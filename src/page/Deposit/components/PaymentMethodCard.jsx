import React from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaInfoCircle, FaClock, FaLock } from 'react-icons/fa';

const PaymentMethodCard = ({
  method,
  isSelected,
  onSelect,
  showTooltip,
  onTooltipShow,
  onTooltipHide,
  textColorProps
}) => {
  const {
    id,
    name,
    icon: Icon,
    description,
    processing_time,
    fee,
    limits,
    availability,
    features = []
  } = method;

  const isAvailable = availability !== false;

  const getProcessingTimeColor = (time) => {
    if (time.includes('Instant') || time.includes('immediate')) return 'text-green-600';
    if (time.includes('1-2') || time.includes('minutes')) return 'text-blue-600';
    if (time.includes('1-3') || time.includes('days')) return 'text-orange-600';
    return 'text-gray-600';
  };

  const getFeeColor = (feeText) => {
    if (feeText.includes('Free') || feeText.includes('0%')) return 'text-green-600';
    if (feeText.includes('1%') || feeText.includes('2%')) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <motion.div
      whileHover={{ scale: isAvailable ? 1.02 : 1 }}
      whileTap={{ scale: isAvailable ? 0.98 : 1 }}
      className={`relative p-4 border-2 rounded-xl transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : isAvailable
          ? 'border-gray-200 bg-white hover:border-gray-300'
          : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
      }`}
      onClick={() => isAvailable && onSelect(id)}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
        >
          <FaCheck className="text-white text-xs" />
        </motion.div>
      )}

      {/* Main Content */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
            isSelected 
              ? 'bg-blue-500 text-white' 
              : isAvailable
              ? 'bg-gray-100 text-gray-600'
              : 'bg-gray-50 text-gray-400'
          }`}>
            <Icon className="text-lg" />
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className={`font-semibold text-gray-900 truncate ${
                !isAvailable && 'text-gray-500'
              }`}>
                {name}
              </h3>
              
              {/* Info Tooltip */}
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onMouseEnter={() => onTooltipShow(id)}
                  onMouseLeave={() => onTooltipHide(id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={!isAvailable}
                >
                  <FaInfoCircle className="text-sm" />
                </button>
                
                {showTooltip[id] && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-10"
                  >
                    <p className="font-medium mb-1">{name}</p>
                    <p className="text-gray-300 text-xs">{description}</p>
                    <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900"></div>
                  </motion.div>
                )}
              </div>
            </div>
            
            <p className={`text-sm mt-1 ${!isAvailable ? 'text-gray-400' : 'text-gray-600'}`} {...textColorProps}>
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* Features and Details */}
      {isAvailable && (
        <div className="space-y-2 mt-3">
          {/* Processing Time */}
          {processing_time && (
            <div className="flex items-center text-xs">
              <FaClock className={`mr-1 ${getProcessingTimeColor(processing_time)}`} />
              <span className={getProcessingTimeColor(processing_time)}>
                {processing_time}
              </span>
            </div>
          )}

          {/* Fee Information */}
          {fee && (
            <div className="flex items-center text-xs">
              <span className={`font-medium ${getFeeColor(fee)}`}>
                {fee}
              </span>
            </div>
          )}

          {/* Limits */}
          {limits && (
            <div className="text-xs text-gray-500">
              Limits: {limits}
            </div>
          )}

          {/* Security Badge */}
          <div className="flex items-center text-xs text-green-600">
            <FaLock className="mr-1" />
            <span>Secure & Encrypted</span>
          </div>

          {/* Additional Features */}
          {features.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {features.map((feature, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                >
                  {feature}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Unavailable Message */}
      {!isAvailable && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-xs text-center">
            Currently unavailable for your account
          </p>
        </div>
      )}

      {/* Recommended Badge */}
      {method.recommended && isAvailable && (
        <div className="absolute -top-2 left-4">
          <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-2 py-1 rounded-full font-medium">
            Recommended
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default PaymentMethodCard;