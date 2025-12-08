import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaCheck, 
  FaDollarSign, 
  FaCreditCard, 
  FaFileAlt 
} from 'react-icons/fa';

const StepIndicator = ({ activeStep, headerColorProps }) => {
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
          relative flex items-center justify-center w-12 h-12 rounded-full border-2 
          font-semibold transition-all duration-300
          ${status === 'completed' ? 'bg-green-500 border-green-500 text-white' : ''}
          ${status === 'active' ? 'bg-blue-500 border-blue-500 text-white shadow-lg scale-110' : ''}
          ${status === 'upcoming' ? 'bg-white border-gray-300 text-gray-400' : ''}
        `}
        whileHover={{ scale: status === 'upcoming' ? 1.1 : 1 }}
      >
        {status === 'completed' ? (
          <FaCheck className="text-white text-sm" />
        ) : (
          <StepIcon className="text-sm" />
        )}
      </motion.div>
    );
  };

  const StepConnector = ({ isActive }) => (
    <div className="flex-1 h-1 mx-4 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-blue-500 rounded-full"
        initial={{ width: '0%' }}
        animate={{ width: isActive ? '100%' : '0%' }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
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
                <motion.span 
                  className={`
                    text-sm mt-3 font-medium transition-colors
                    ${status === 'completed' ? 'text-green-600' : ''}
                    ${status === 'active' ? 'text-blue-600 font-semibold' : ''}
                    ${status === 'upcoming' ? 'text-gray-400' : ''}
                  `}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {step.label}
                </motion.span>
              </div>
              
              {index < steps.length - 1 && (
                <StepConnector isActive={step.number < activeStep} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile Progress */}
      <div className="sm:hidden space-y-4">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700">
            Step {activeStep} of {steps.length}
          </span>
          <span className="text-blue-600 font-semibold">
            {steps[activeStep - 1]?.label}
          </span>
        </div>
        
        <div className="flex space-x-1">
          {steps.map((step) => {
            const status = getStepStatus(step.number);
            return (
              <motion.div
                key={step.number}
                className={`
                  flex-1 h-2 rounded-full transition-all duration-300
                  ${status === 'completed' ? 'bg-green-500' : ''}
                  ${status === 'active' ? 'bg-blue-500' : ''}
                  ${status === 'upcoming' ? 'bg-gray-200' : ''}
                `}
                whileHover={{ scale: 1.05 }}
              />
            );
          })}
        </div>
      </div>

      {/* Current Step Helper */}
      <motion.div 
        className="text-center mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-sm text-blue-700 font-medium">
          {activeStep === 1 && "💱 Select the currency you want to deposit"}
          {activeStep === 2 && "💳 Choose your preferred payment method"}
          {activeStep === 3 && "📋 Review and confirm your deposit details"}
        </p>
      </motion.div>
    </div>
  );
};

export default StepIndicator;