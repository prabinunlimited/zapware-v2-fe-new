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
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Need help? Contact support</p>
          <div className="mt-1 text-sm text-gray-700">
            {localStorage.getItem("partner_support_phone") && (
              <span>{localStorage.getItem("partner_support_phone")}</span>
            )}
            {localStorage.getItem("partner_support_phone") && localStorage.getItem("partner_support_email") && (
              <span className="mx-2">|</span>
            )}
            {localStorage.getItem("partner_support_email") && (
              <span>{localStorage.getItem("partner_support_email")}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegistrationLayout;