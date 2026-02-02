import React from 'react';

const SuccessModal = ({ response, onClose, onContinue, isProcessing = false }) => {
  // Extract message from response object
  const getMessage = () => {
    if (typeof response === 'string') return response;
    
    if (response?.message) {
      return response.message;
    }
    
    if (response?.data?.message) return response.data.message;
    
    return 'Operation completed successfully!';
  };

  // Check if we have linked accounts to display
  const hasLinkedAccounts = response?.success_accounts?.length > 0;

  return (
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
          
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Success!
            </h3>
            
            <p className="text-lg font-medium text-gray-700 mb-4">
              {getMessage()}
            </p>
            
            {/* Show linked accounts if available */}
            {hasLinkedAccounts && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-800 mb-3">Successfully Linked Accounts:</p>
                <ul className="text-sm text-green-700 space-y-2">
                  {response.success_accounts.map((account, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 mr-2 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <span className="font-medium">{account.account_name}</span>
                        {account.account_id && (
                          <div className="text-xs text-green-600 mt-1">
                            ID: {account.account_id.slice(0, 8)}...
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Show failed accounts if any */}
            {response?.failed_accounts?.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm font-medium text-yellow-800 mb-3">Failed to Link:</p>
                <ul className="text-sm text-yellow-700 space-y-2">
                  {response.failed_accounts.map((account, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 mr-2 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <span className="font-medium">{account.account_name}</span>
                        {account.message && (
                          <div className="text-xs text-yellow-600 mt-1">
                            Reason: {account.message}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {isProcessing ? (
            <div className="flex flex-col items-center gap-3 mt-4">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-600">Updating account list...</p>
            </div>
          ) : (
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={onContinue}
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Continue & Refresh Accounts
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;