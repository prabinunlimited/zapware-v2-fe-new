import React from 'react';
import { usePlaid } from './PlaidProvider';
import PlaidLink from './PlaidLink';
import { DotLoader } from 'react-spinners';

const KYCVerification = () => {
  const { initiatePlaid, loading, error } = usePlaid();

  return (
    <div className="kyc-verification-container">
      <h2>Bank Verification</h2>
      <p>Connect your bank account to complete verification</p>
      
      <button
        onClick={() => initiatePlaid('customer-id-here')}
        disabled={loading}
        className="verify-button"
      >
        {loading ? (
          <DotLoader size={20} color="#ffffff" />
        ) : (
          'Connect Bank Account'
        )}
      </button>
      
      {error && <div className="error-message">{error}</div>}
      
      <PlaidLink />
    </div>
  );
};

export default KYCVerification;