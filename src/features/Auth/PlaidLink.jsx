import React, { useEffect } from 'react';
import { usePlaid } from './PlaidProvider';

const PlaidLink = () => {
  const { linkUrl, mode, loading, error, resetPlaid } = usePlaid();

  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (mode === 'iframe') {
        resetPlaid();
      }
    };
  }, [mode, resetPlaid]);

  const handleMessage = (event) => {
    // Verify the origin for security
    if (!event.origin.includes('plaid.com')) return;

    switch (event.data.plaidEvent) {
      case 'EXIT':
        resetPlaid();
        break;
      case 'SUCCESS':
        handlePlaidSuccess(event.data.publicToken);
        break;
      case 'ERROR':
        
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (mode === 'iframe' && linkUrl) {
      window.addEventListener('message', handleMessage);
    }
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [linkUrl, mode]);

  if (mode !== 'iframe' || !linkUrl) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl h-[80vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Connect Your Bank</h2>
          <button
            onClick={resetPlaid}
            className="text-gray-500 hover:text-gray-700"
          >
            <AiOutlineClose size={24} />
          </button>
        </div>
        <div className="h-full">
          <iframe
            src={linkUrl}
            title="Plaid Bank Connection"
            className="w-full h-full border-0"
            allow="clipboard-write"
            sandbox="allow-same-origin allow-forms allow-scripts allow-popups allow-top-navigation-by-user-activation"
          />
        </div>
      </div>
    </div>
  );
};

export default PlaidLink;