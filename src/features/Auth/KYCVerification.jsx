import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RingLoader } from 'react-spinners';

function KYCVerification() {
  const location = useLocation();
  const navigate = useNavigate();
  const { plaidUrl } = location.state || {};

  useEffect(() => {
    if (plaidUrl) {
      // Redirect to Plaid URL after a short delay
      const timer = setTimeout(() => {
        window.location.href = plaidUrl;
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      // No Plaid URL, redirect to login after 2 seconds
      const timer = setTimeout(() => {
        navigate('/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [plaidUrl, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Loading Spinner */}
        <div className="flex justify-center mb-6">
          <RingLoader color="#3b82f6" size={60} />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Redirecting to KYC Verification
        </h2>
        
        <p className="text-gray-600">
          Please wait while we redirect you to the secure kyc verification page...
        </p>
      </div>
    </div>
  );
}

export default KYCVerification;