// RegistrationLayout.jsx
import React from "react";
import RegistrationProgressBar from "./ProgressBar";
import useRegistrationProgress from "./useCurrentStep";

function RegistrationLayout({ children }) {
  const currentStep = useRegistrationProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Create Your Account</h1>
          <p className="text-gray-600 mt-2">Follow these steps to set up your new account</p>
        </div>
        
        <RegistrationProgressBar currentStep={currentStep} />
        
        <div className="bg-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl">
          {children}
        </div>
        
        {/* Help section */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Need help? <a href="#" className="text-sky-700 hover:text-sky-900 font-medium">Contact support</a>
        </div>
      </div>
    </div>
  );
}

export default RegistrationLayout;