import React from 'react';

const ErrorModal = ({ message, errors, onClose, onConfirm }) => {
  // Handle the specific error message structure from /customers/sign-up
  const getErrorContent = () => {
    // If there's a direct message from the API response
    if (message) {
      return <p className="text-red-600">{message}</p>;
    }
    
    // Handle cases where errors might be undefined, null, or not an object
    if (!errors) {
      return <p className="text-red-600">An unknown error occurred.</p>;
    }
    
    if (typeof errors === 'string') {
      return <p className="text-red-600">{errors}</p>;
    }
    
    if (typeof errors === 'object') {
      const entries = Object.entries(errors);
      
      if (entries.length === 0) {
        return <p className="text-red-600">An unknown error occurred.</p>;
      }
      
      return (
        <ul className="list-disc pl-5 space-y-2">
          {entries.map(([field, message]) => (
            <li key={field} className="text-red-600">
              <strong className="capitalize">{field}:</strong> {message}
            </li>
          ))}
        </ul>
      );
    }
    
    return <p className="text-red-600">An unknown error occurred.</p>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-red-600">Registration Error</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          {getErrorContent()}
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
          {onConfirm && (
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Go to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;