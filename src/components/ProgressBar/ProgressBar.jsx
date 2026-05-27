// components/ProgressBar.jsx
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faCheckCircle, 
  faChevronRight, 
  faInfoCircle,
  faLock,
  faLockOpen
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const ProgressBar = ({ currentStep = 1 }) => {
  const [isTooltipVisible, setTooltipVisible] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const navigate = useNavigate();
  
  const steps = [
    { id: 1, name: "Account Type", path: "/selectaccount" },
    { id: 2, name: "Currency", path: "/currencyselectaccount" },
    { id: 3, name: "Registration", path: "/registerindividual" },
    { id: 4, name: "Verification", path: "/verifyphone" },
    { id: 5, name: "Complete", path: "/dashboard" }
  ];

  // Smooth animation for progress bar
  useEffect(() => {
    const targetPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;
    const timer = setTimeout(() => {
      setProgressPercentage(targetPercentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentStep, steps.length]);

  // Handle step click navigation
  const handleStepClick = (step) => {
    // Only allow navigation to completed steps or the current step
    if (step.id <= currentStep) {
      navigate(step.path);
    }
  };

  return (
    <div className="w-full mb-8 px-2 sm:px-4">
      {/* Header with progress info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div className="flex items-center">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Registration Progress</h2>
          <button 
            className="ml-2 text-gray-400 hover:text-sky-700 focus:outline-none"
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
            onClick={() => setTooltipVisible(!isTooltipVisible)}
            aria-label="Progress information"
          >
            <FontAwesomeIcon icon={faInfoCircle} />
          </button>
        </div>
        
        <div className="flex items-center">
          <span className="text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 py-1 px-2 sm:px-3 rounded-full whitespace-nowrap">
            Step {currentStep} of {steps.length}
            <span className="ml-1 sm:ml-2 font-bold text-sky-800">{Math.round(progressPercentage)}% Complete</span>
          </span>
        </div>
      </div>
      
      {/* Tooltip */}
      {isTooltipVisible && (
        <div className="bg-sky-50 text-sky-700 p-3 rounded-lg mb-4 text-sm border border-sky-100">
          You're progressing through the account setup process. Complete each step to finish your registration.
          Click on completed steps to navigate back to them.
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 sm:h-3 mb-6 overflow-hidden shadow-inner">
        <div 
          className="bg-gradient-to-r from-sky-600 to-sky-800 h-3 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progressPercentage}%` }}
          role="progressbar"
          aria-valuenow={progressPercentage}
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
      
      {/* Step Indicators */}
      <div className="relative">
        {/* Connector line */}
        <div className="absolute top-4 left-4 right-4 h-1 bg-gray-200 -z-10 hidden sm:block"></div>
        
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {steps.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const isUpcoming = step.id > currentStep;
            
            return (
              <div key={step.id} className="flex flex-col items-center min-w-0">
                <div 
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center relative transition-all duration-300 ${
                    isCompleted 
                      ? "bg-gradient-to-br from-sky-700 to-sky-900 text-white shadow cursor-pointer hover:scale-110" 
                      : isCurrent 
                      ? "bg-white border-2 border-sky-700 text-sky-800 shadow-lg scale-110 cursor-pointer" 
                      : "bg-gray-100 text-gray-400 border border-gray-300"
                  }`}
                  aria-current={isCurrent ? "step" : "false"}
                  onClick={() => handleStepClick(step)}
                  title={isCompleted ? `Go to ${step.name}` : isCurrent ? "Current step" : "Step locked"}
                >
                  {isCompleted ? (
                    <FontAwesomeIcon icon={faCheckCircle} className="text-[10px] sm:text-xs" />
                  ) : isUpcoming ? (
                    <FontAwesomeIcon icon={faLock} className="text-[10px] sm:text-xs" />
                  ) : (
                    <FontAwesomeIcon icon={faLockOpen} className="text-[10px] sm:text-xs" />
                  )}
                  
                  {/* Current step indicator pulse */}
                  {isCurrent && (
                    <span className="absolute -inset-1.5 bg-sky-100 rounded-full -z-10 animate-pulse"></span>
                  )}
                </div>
                
                <span 
                  className={`text-[9px] sm:text-xs mt-2 text-center font-medium leading-tight cursor-pointer hover:underline underline-offset-1 break-words ${
                    isCompleted 
                      ? "text-sky-800 font-semibold cursor-pointer hover:underline" 
                      : isCurrent 
                      ? "text-sky-800 font-semibold" 
                      : "text-gray-500"
                  }`}
                  onClick={() => isCompleted && handleStepClick(step)}
                  title={isCompleted ? `Go to ${step.name}` : ""}
                >
                  {step.name}
                </span>
                
                {/* Step connector arrows - hidden on mobile */}
                {step.id < steps.length && (
                  <div className="hidden lg:block absolute top-4 right-0 translate-x-1/2 text-gray-300">
                    <FontAwesomeIcon icon={faChevronRight} size="xs" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;