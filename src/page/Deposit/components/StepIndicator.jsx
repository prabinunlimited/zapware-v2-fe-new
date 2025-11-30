// StepIndicator.jsx - Minimalistic Enhanced Version
import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaCheck, 
  FaDollarSign, 
  FaCreditCard, 
  FaFileAlt 
} from 'react-icons/fa';

const StepIndicator = ({ activeStep }) => {
  const steps = [
    { 
      number: 1, 
      label: 'Currency', 
      icon: FaDollarSign,
    },
    { 
      number: 2, 
      label: 'Payment', 
      icon: FaCreditCard,
    },
    { 
      number: 3, 
      label: 'Confirm', 
      icon: FaFileAlt,
    },
  ];

  const getStepStatus = (stepNumber) => {
    if (stepNumber < activeStep) return 'completed';
    if (stepNumber === activeStep) return 'active';
    return 'upcoming';
  };

  const StepCircle = ({ step, status }) => {
    const StepIcon = step.icon;
    
    return (
      <motion.div
        className={`
          relative flex items-center justify-center w-10 h-10 rounded-full border-2 
          font-semibold transition-all duration-300
          ${status === 'completed' ? 'bg-green-500 border-green-500' : ''}
          ${status === 'active' ? 'bg-blue-500 border-blue-500 shadow-lg scale-105' : ''}
          ${status === 'upcoming' ? 'bg-white border-gray-300' : ''}
        `}
        whileHover={{ scale: 1.05 }}
      >
        {status === 'completed' ? (
          <FaCheck className="text-white text-sm" />
        ) : (
          <StepIcon className={`
            text-sm
            ${status === 'active' ? 'text-white' : 'text-gray-400'}
          `} />
        )}
      </motion.div>
    );
  };

  const StepConnector = ({ isActive }) => (
    <div className="flex-1 h-1 mx-2 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-blue-500 rounded-full"
        initial={{ width: '0%' }}
        animate={{ width: isActive ? '100%' : '0%' }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );

  return (
    <div className="mb-8">
      {/* Desktop Steps */}
      <div className="hidden sm:flex items-center justify-center">
        {steps.map((step, index) => {
          const status = getStepStatus(step.number);
          
          return (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center">
                <StepCircle step={step} status={status} />
                <span className={`
                  text-xs mt-2 font-medium transition-colors
                  ${status === 'completed' ? 'text-green-600' : ''}
                  ${status === 'active' ? 'text-blue-600' : ''}
                  ${status === 'upcoming' ? 'text-gray-400' : ''}
                `}>
                  {step.label}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <StepConnector isActive={step.number < activeStep} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile Progress */}
      <div className="sm:hidden space-y-3">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700">
            Step {activeStep} of {steps.length}
          </span>
          <span className="text-blue-600 font-medium">
            {steps[activeStep - 1]?.label}
          </span>
        </div>
        
        <div className="flex space-x-1">
          {steps.map((step) => {
            const status = getStepStatus(step.number);
            return (
              <div
                key={step.number}
                className={`
                  flex-1 h-1 rounded-full transition-all duration-300
                  ${status === 'completed' ? 'bg-green-500' : ''}
                  ${status === 'active' ? 'bg-blue-500' : ''}
                  ${status === 'upcoming' ? 'bg-gray-200' : ''}
                `}
              />
            );
          })}
        </div>
      </div>

      {/* Current Step Helper */}
      <motion.div 
        className="text-center mt-4 p-3 bg-blue-50 rounded-lg"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-sm text-blue-700">
          {activeStep === 1 && "Select deposit currency"}
          {activeStep === 2 && "Choose payment method"}
          {activeStep === 3 && "Review and confirm details"}
        </p>
      </motion.div>
    </div>
  );
};

export default StepIndicator;