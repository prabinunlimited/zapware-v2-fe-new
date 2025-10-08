import React from 'react';

const SuccessModal = ({ message, onClose, showSpinner = false }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
      <div className="flex flex-col gap-4">
        <div className="flex justify-center">
          <svg className="w-16 h-16 text-green-500" viewBox="0 0 24 24" fill="none">
            <path 
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" 
              fill="currentColor" 
            />
          </svg>
        </div>
        
        <p className="text-center text-lg font-medium text-gray-700">
          {message}
        </p>
        
        {showSpinner && (
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {onClose && (
          <div className="flex justify-center mt-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default SuccessModal;
