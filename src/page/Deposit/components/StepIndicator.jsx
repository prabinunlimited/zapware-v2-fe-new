// StepIndicator.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaDollarSign, FaCreditCard, FaFileAlt } from 'react-icons/fa';

const StepIndicator = ({ activeStep, headerColorProps }) => {
  const steps = [
    { number: 1, label: 'Currency', icon: FaDollarSign },
    { number: 2, label: 'Payment Method', icon: FaCreditCard },
    { number: 3, label: 'Details', icon: FaFileAlt },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress bar background */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2"></div>
        
        {/* Progress bar fill */}
        <motion.div
          className={`absolute top-1/2 left-0 h-1 -translate-y-1/2 ${
            headerColorProps.className || 'bg-blue-600'
          }`}
          initial={{ width: '0%' }}
          animate={{ 
            width: `${((activeStep - 1) / (steps.length - 1)) * 100}%` 
          }}
          transition={{ duration: 0.5 }}
          style={headerColorProps.style}
        ></motion.div>

        {steps.map((step, index) => {
          const isCompleted = step.number < activeStep;
          const isActive = step.number === activeStep;
          const StepIcon = step.icon;

          return (
            <div key={step.number} className="flex flex-col items-center relative z-10">
              <motion.div
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 font-semibold text-sm transition-all duration-300 ${
                  isCompleted
                    ? 'text-white border-blue-600 bg-blue-600'
                    : isActive
                    ? 'text-blue-600 border-blue-600 bg-white shadow-lg'
                    : 'text-gray-400 border-gray-300 bg-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isCompleted ? (
                  <FaCheck className="text-white text-lg" />
                ) : (
                  <StepIcon className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                )}
              </motion.div>
              
              <span
                className={`mt-2 text-sm font-medium ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
              
              {/* Connection line for mobile */}
              {index < steps.length - 1 && (
                <div className="hidden sm:block absolute top-6 left-12 w-16 h-0.5 bg-gray-200 -translate-y-1/2"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;